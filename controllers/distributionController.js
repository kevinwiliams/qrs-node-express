const sequelize = require('../config/db').sequelize;
const CircProTranx = require('../models/CircProTransactions'); // Assuming you have defined the Sequelize models

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
                CellNumber
            });
        } else {
            res.render('distribution/account', {  layout: 'layout', // Specify the layout template
            distributions: [] });
        }
    } catch (error) {
        console.error('Error fetching account data:', error);
        res.status(500).send('Internal Server Error');
    }
}

async function updateReturns(req, res) {
    try {
        const { accountId, returnAmount, drawAmount, confirmAmount, publicationDate, loggedEmail, userRole } = req.body;
        
        // Add your validation logic here if necessary
        
        // Parse publication date
        const parsedPublicationDate = new Date(publicationDate);
        
        // Update return amount in the database
        const pubEntry = await CircProTranx.findOne({ where: { AccountID: accountId, PublicationDate: parsedPublicationDate } });
        
        if (pubEntry) {
            let retStatus = 'Open';
            let returnCount = parseInt(returnAmount, 10);
            
            pubEntry.ReturnAmount = returnCount;
            pubEntry.Status = retStatus;
            pubEntry.ReturnDate = new Date();
            pubEntry.UpdatedAt = new Date();
            
            // Determine if the confirm amount should be updated based on the user role
            if (userRole !== 'Retailer') {
                retStatus = 'Closed';
                returnCount = parseInt(confirmAmount, 10);
                
                pubEntry.ConfirmedAmount = returnCount;
                pubEntry.ConfirmDate = new Date();
                pubEntry.Status = retStatus;
                pubEntry.ConfirmReturn = true;
            }
            
            // Save changes to the database
            await pubEntry.save();
            
            // Send email notification
            const subject = `QRS Returns Notification - ${accountId}`;
            const body = await renderViewToString(req, res, 'Emails/ConfirmReturnRetailer', { distributionData: pubEntry });
            const emailSent = await Util.sendMail(loggedEmail, subject, body);
            
            // Update activity logs
            const qRSActivityLog = new QRSActivityLog({
                AccountID: accountId,
                LogInformation: '',
                UserName: loggedEmail, // Assuming the user's email is used as the username
                EmailAddress: loggedEmail,
                PublicationDate: parsedPublicationDate,
                DistributionAmount: parseInt(drawAmount, 10),
                ReturnAmount: returnCount,
                Status: retStatus
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
        const transactions = await CircProTranx.findAll({ 
            where: { 
                AccountID: id 
            },
            order: [['PublicationDate', 'DESC']],
            limit: 1
        });

        // Send the retrieved data as a response
        res.status(200).json({ success: true, transactions });
    } catch (error) {
        console.error('Error getting latest:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

async function getLatestDraw(req, res) {
    try {
        const { id } = req.body;

        // Fetch the latest draw transactions for the given accountId within the last 60 days
        const startDate = new Date(new Date() - 60 * 24 * 60 * 60 * 1000); // 60 days ago
        const endDate = new Date();

        const drawTransactions = await CircProTranx.findAll({ 
            where: { 
                AccountID: id,
                PublicationDate: { 
                    [sequelize.Op.between]: [startDate, endDate] 
                },
                DistributionTypeID: 1 // Assuming DistributionTypeID 1 represents draw transactions
            },
            order: [['PublicationDate', 'DESC']]
        });

        // Send the retrieved data as a response
        res.status(200).json({ success: true, drawTransactions });
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

function getLatestDistDate(accountID) {
    try {
        return CircProTranx.findOne({
            where: { AccountID: accountID },
            order: [['PublicationDate',
            'DESC']],
        })
        .then(result => {
            if (result) {
                return result.PublicationDate ? new Date(result.PublicationDate).toISOString().split('T')[0] : null;
            }
            return null;
        });
    } catch (error) {
        console.error('Error getting last distribution date:', error);
        throw error;
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

