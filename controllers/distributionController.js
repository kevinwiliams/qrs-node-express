const sequelize = require('../config/db').sequelize;
const axios = require('axios');
const moment = require('moment');
const CircproUsers = require('../models/CircproUsers'); // Assuming you have defined the Sequelize models
const CircProTranx = require('../models/CircProTransactions'); // Assuming you have defined the Sequelize models
const QRSActivityLog = require('../models/QRSActivityLogs'); // Assuming you have defined the Sequelize models
const Util = require('../helpers/utils');


async function index(req, res) {
    try {
        const sql = `SELECT 
                        [AccountID],
                        [DistributionTypeID],
                        [PublicationDate],
                        [DistributionAmount],
                        [ReturnDate],
                        [ReturnAmount],
                        [ConfirmDate],
                        [ConfirmedAmount],
                        [ConfirmReturn],
                        [Status]
                    FROM [dbo].[CircProTransactions]`;

        const result = await sequelize.query(sql, { type: QueryTypes.SELECT });

        res.render('distribution/index', { distributions: result });
    } catch (error) {
        console.error('Error fetching distribution data:', error);
        res.status(500).send('Internal Server Error');
    }
}

async function account(req, res) {
    try {

        if(!req.session.isAuthenticated){
            res.redirect('/auth/login');
        }

        const { id } = req.params;

        const isLoaded = await isInitLoad(id);

        if (!isLoaded) {
            const startDate = '2024-01-01';
            const endDate = new Date().toISOString().split('T')[0];
            await loadTransactions(id, startDate, endDate);
        }

        const sql = `SELECT 
                        T.[AccountID],
                        T.[DistributionTypeID],
                        T.[PublicationDate],
                        T.[DistributionAmount],
                        T.[ReturnDate],
                        T.[ReturnAmount],
                        T.[ConfirmDate],
                        T.[ConfirmedAmount],
                        T.[ConfirmReturn],
                        T.[Status],
                        CONCAT(U.FirstName, ' ', U.LastName) AS RetailerName,
                        U.EmailAddress,
                        U.Company,
                        NULLIF(
                            COALESCE(LTRIM(RTRIM(A.AddressLine1)) + ', ', '') + 
                            COALESCE(LTRIM(RTRIM(A.AddressLine2)) + ', ', '') + 
                            COALESCE(LTRIM(RTRIM(A.CityTown)), ''), 
                            ''
                        ) AS RetailerAddress,
                        U.PhoneNumber,
                        U.CellNumber,
                        T.IsDisputed
                    FROM [dbo].[CircProTransactions] T
                    JOIN [dbo].[CircproUsers] U ON U.AccountID = T.AccountID
                    JOIN [dbo].[CircProAddresses] A ON U.UserID = A.UserID
                    WHERE T.[AccountID] = :accountId
                    ORDER BY T.[PublicationDate] DESC`;

        const result = await sequelize.query(sql, {
            type: sequelize.QueryTypes.SELECT,
            replacements: { accountId: id }
        });

        if (result.length > 0) {
            const {
                AccountID,
                Company,
                RetailerAddress,
                RetailerName,
                EmailAddress,
                PhoneNumber,
                CellNumber
            } = result[0];

            res.render('distribution/account', {
                layout: 'layout', // Specify the layout template
                distributions: result,
                AccountID: id,
                Company,
                RetailerAddress,
                RetailerName,
                EmailAddress,
                PhoneNumber,
                CellNumber,
                userData: req.session.userData,
                title: 'Account'

            });
        } else {
            res.render('distribution/account', {  layout: 'layout', userData: req.session.userData,
            distributions: [] });
        }
    } catch (error) {
        console.error('Error fetching account data:', error);
        res.status(500).send('Internal Server Error');
    }
}

async function updateReturns(req, res) {
    try {
        const { accountId, returnAmount, drawAmount, confirmAmount, publicationDate, loggedEmail } = req.body;
        const UserData = req.session.userData;
        const userRole = req.session.userData.UserRole;
        // Split the date string by "/"
        const parts = publicationDate.split('/');

        // Rearrange the parts into "YYYY-MM-DD" format
        const splitDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        // Parse publication date
        const parsedPublicationDate = moment(splitDate).format('YYYY-MM-DD');
        
        // Update return amount in the database
        const pubEntry = await CircProTranx.findOne({
            where: { AccountID: accountId, PublicationDate: parsedPublicationDate },
            order: [['UpdatedAt', 'DESC']]
          });
        
        if (pubEntry) {
            let retStatus = 'Open';
            let returnCount = parseInt(returnAmount, 10);
            
            if(userRole == 'Retailer'){
                pubEntry.ReturnAmount = returnCount;
                pubEntry.Status = retStatus;
                pubEntry.ReturnDate = moment().format('YYYY-MM-DD HH:mm:ss');
                pubEntry.UpdatedAt = moment().format('YYYY-MM-DD HH:mm:ss');
                await pubEntry.save();

                const userProfile = await getUserData(accountId);
                
                if(userProfile[0].NotifyEmail){
                    // Combine user profile data with pubEntry data
                    const dataToRender = {
                        ...pubEntry.dataValues,
                        userProfile: userProfile[0]
                    };

                    const subject = `QRS Returns Notification - ${accountId}`;
                    const body = await Util.renderViewToString('./views/emails/confirmreturns_retailer.hbs', dataToRender);
                    //const emailSent = await Util.sendMail('williamskt@jamaicabserver.com', subject, body);
                }
                
            }

            if (userRole !== 'Retailer') {
                retStatus = 'Closed';
                returnCount = parseInt(confirmAmount, 10);
                
                pubEntry.ConfirmedAmount = returnCount;
                pubEntry.ConfirmDate = moment().format('YYYY-MM-DD HH:mm:ss');
                pubEntry.Status = retStatus;
                pubEntry.ConfirmReturn = true;

                // Save changes to the database
                await pubEntry.save();
                // Send email notification
                const userProfile = await getUserData(pubEntry.AccountID);
                // Combine user profile data with pubEntry data
                const dataToRender = {
                    ...pubEntry.dataValues,
                    userProfile: userProfile[0]
                };

                const subject = `QRS Returns Closed Notification - ${pubEntry.AccountID}`;
                const body = await Util.renderViewToString('./views/emails/confirmreturn.hbs', dataToRender);
                //const emailSent = await Util.sendMail('williamskt@jamaicabserver.com', subject, body);
            }
            
            // Update activity logs
            const qRSActivityLog = new QRSActivityLog({
                AccountID: accountId,
                LogInformation: '',
                UserName: UserData.UserName, // Assuming the user's email is used as the username
                EmailAddress: UserData.Email,
                PublicationDate: parsedPublicationDate,
                DistributionAmount: parseInt(drawAmount, 10),
                ReturnAmount: returnCount,
                Status: retStatus,
                CreatedAt: moment().format('YYYY-MM-DD HH:mm:ss'),
                SystemInformation: Util.getOSName(req.headers['user-agent']) + ' - ' + Util.getBrowserName(req),
                IPAddress: Util.getIPAddress(req)
            });
            await qRSActivityLog.save();

            return res.status(200).json({ success: true });
        } else {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }
    } catch (error) {
        console.error('Error updating returns:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

async function submitDispute(req, res) {
    try {
        const { accountId, returnAmount, drawAmount, disputeAmount, publicationDate, loggedEmail, userRole, retailerNote } = req.body;

        // Find the transaction entry based on accountId and publicationDate
        const transaction = await CircProTranx.findOne({ 
            where: { 
                AccountID: accountId, 
                PublicationDate: publicationDate 
            } 
        });

        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }

        // Update IsDisputed flag
        transaction.IsDisputed = true;

        // Save changes to the database
        await transaction.save();

        // Send appropriate response
        res.status(200).json({ success: true, message: 'Dispute submitted successfully' });
    } catch (error) {
        console.error('Error submitting dispute:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

async function getLatest(req, res) {
    try {
        const { id } = req.body;

        // Fetch the latest transactions for the given accountId
        const lastDate = await getLastDistDate(id);
        const startDate = lastDate.toISOString().split('T')[0];
        const endDate = new Date().toISOString().split('T')[0];
        const loadCircTranx = await loadTransactions(id, startDate, endDate, req.session.userData.UserId, req.session.userData.Email);

        // Send the retrieved data as a response
        res.status(200).json({ success: loadCircTranx });
    } catch (error) {
        console.error('Error getting latest:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

async function getLatestDraw(req, res) {
    try {
        const { id } = req.body;

        // Fetch the latest draw transactions for the given accountId within the last 60 days
        const startDate = new Date(new Date() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 60 days ago
        const endDate = new Date().toISOString().split('T')[0];
        const drawTransactions = await updateDistributions(id, startDate, endDate);
        // Send the retrieved data as a response
        res.status(200).json({ success: drawTransactions });
    } catch (error) {
        console.error('Error getting latest draw:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

function isInitLoad(accountID) {
    try {
        return CircProTranx.findOne({ where: { AccountID: accountID } })
            .then(result => !!result);
    } catch (error) {
        console.error('Error checking if init load:', error);
        throw error;
    }
}

async function getUserData(accountID) {
    try {
        const sql = `SELECT DISTINCT
                U.AccountID, 
                U.DistributionID,
                CONCAT(U.FirstName, ' ', U.LastName) AS RetailerName,
                U.EmailAddress,
                U.Company,
                NULLIF(
                    COALESCE(LTRIM(RTRIM(A.AddressLine1)) + ', ', '') + 
                    COALESCE(LTRIM(RTRIM(A.AddressLine2)) + ', ', '') + 
                    COALESCE(LTRIM(RTRIM(A.CityTown)), ''), 
                    ''
                ) AS RetailerAddress,
                U.PhoneNumber,
                U.CellNumber, U.NotifyEmail
            FROM CircproUsers U
            JOIN CircProAddresses A ON U.UserID = A.UserID
            WHERE U.AccountID = '${accountID}'`;

        return await sequelize.query(sql, { type: sequelize.QueryTypes.SELECT });

    } catch (error) {
        console.error('Error getting user data:', error);
        throw error;
    }
}

async function loadTransactions(accountID, startDate, endDate, userId, emailAddress) {
    try {
        // Define the URL of the API endpoint
        const url = process.env.CIRC_PRO_API_LOAD_TRANX;

        // Define the form data
        const formData = {
            account_id: accountID,
            startDate: startDate,
            endDate: endDate
        };

        // Send the POST request using axios
        const response = await Util.postRequest(url, formData);
        // Check if the request was successful
        if (response.status === 200) {
            const resultTrans = response.data;

            const userEntry = await CircproUsers.findOne({
                where: { AccountID: accountID }
              });

            for (const item of resultTrans) {
                // Assuming circUser is retrieved successfully using DistributionID
                const circProTransactions = new CircProTranx({
                    UserID: userEntry.UserID,
                    AccountID: item.DIST_ACCTNBR,
                    PublicationDate: item.PUBLISH,
                    ConfirmDate: item.PUBLISH,
                    ConfirmedAmount: item.RETTOT,
                    ConfirmReturn: (item.PUBLISH < Date.now() - 30 * 24 * 60 * 60 * 1000) ? true : false,
                    CreatedAt: item.PUBLISH,
                    UpdatedAt: new Date(),
                    Status: (item.PUBLISH < Date.now() - 30 * 24 * 60 * 60 * 1000) ? "Closed" : "Open",
                    EmailAddress: userEntry.EmailAddress,
                    ReturnAmount: item.RETTOT,
                    ReturnDate: item.PUBLISH,
                    DistributionAmount: item.DRAWTOT,
                    DistributionTypeID: item.DISTRIBUTION_TYPE_ID
                });

                await circProTransactions.save();
            }
        return true;

        }else{
            return false;
        }

    } catch (error) {
        console.error('Error loading transactions:', error);
        throw new Error('Internal Server Error');
    }
}

async function updateDistributions(accountID, startDate, endDate) {
    try {
        // Define the URL of the API endpoint
        const url = process.env.CIRC_PRO_API_LOAD_TRANX;

        // Define the form data
        const formData = {
            account_id: accountID,
            startDate: startDate,
            endDate: endDate
        };

        // Send the POST request using axios
        const response = await Util.postRequest(url, formData);
        // Check if the request was successful
        if (response.status === 200) {
            const resultTrans = response.data;

            for (const item of resultTrans) {
                // Assuming circUser is retrieved successfully using DistributionID
                const circProTransactions = await CircProTranx.findOne({
                    where: {
                        AccountID: accountID,
                        PublicationDate: item.PUBLISH
                    }
                });

                if (circProTransactions) {
                    circProTransactions.DistributionAmount = item.DRAWTOT;
                    await circProTransactions.save();
                }
            }
            
            return true;
        }else{
            return false;
        }

    } catch (error) {
        console.error('Error updating distributions:', error);
        throw new Error('Internal Server Error');
    }
}

async function getLastDistDate(accountID) {
    try {
        // Find the most recent publication date for the given accountID
        const result = await CircProTranx.findOne({
            where: { AccountID: accountID },
            order: [['PublicationDate', 'DESC']],
            attributes: ['PublicationDate']
        });

        if (result) {
            const res = JSON.parse(JSON.stringify(result));
            // If a result is found, add one day to the publication date
            const lastDistDate = new Date(res.PublicationDate);
            lastDistDate.setDate(lastDistDate.getDate() + 1);
            return lastDistDate;
        } else {
            // If no result is found, return null or throw an error based on your requirement
            return null;
        }
    } catch (error) {
        console.error('Error getting last distribution date:', error);
        throw new Error('Internal Server Error');
    }
}

module.exports = {
    index,
    account,
    updateReturns,
    submitDispute,
    getLatest,
    getLatestDraw
};

