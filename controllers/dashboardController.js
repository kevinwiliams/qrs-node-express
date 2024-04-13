const { QueryTypes } = require('sequelize');
const sequelize = require('../config/db').sequelize;
const QRSActivityLog = require('../models/QRSActivityLogs'); 
const AspNetUsers = require('../models/AspNetUsers');
const CircproUsers = require('../models/CircproUsers'); 
const CircProAddresses = require('../models/CircProAddresses'); 
const bcrypt = require('bcrypt');


class TransactionData {
    constructor(periodNumber, totalDistributionAmount, totalReturnAmount, totalConfirmedAmount, periodText) {
        this.PeriodNumber = periodNumber;
        this.TotalDistributionAmount = totalDistributionAmount;
        this.TotalReturnAmount = totalReturnAmount;
        this.TotalConfirmedAmount = totalConfirmedAmount;
        this.PeriodText = periodText;
    }
}

class TransactionDataViewModel {
    constructor() {
        this.WeeklyData = [];
        this.MonthlyData = [];
        this.DailyData = [];
        this.ActivityLogs = [];
    }
}

async function indexHandler(req, res) {
    try {

        if (req.session.isAuthenticated) {
            const userData = {
                UserRole: req.session.user.role,
                UserName: req.session.user.FullName,
                Email: req.session.user.Email,
                AccountId: req.session.user.accountId,
                UserId: req.session.user.userId
            };

            req.session.userData = userData;
            const isAuthenticated = req.session.isAuthenticated;
            if (userData.UserRole === "Circulation" || userData.UserRole === "Admin") {
                const activityLogs = await getRecentActivities();
                res.render('dashboard/index', { userData, activityLogs, layout: 'layout', title: 'Dashboard' });
            } else if (userData.UserRole === "Supervisor") {
                res.redirect('/retailer');
            } else if (userData.UserRole === "Retailer") {
                const accountId = req.session.user.accountId;
                if (accountId) {
                    res.redirect(`/distribution/account/${accountId}`);
                }
            }
        } else {
            console.log('fail');
            res.render('auth/login', {
                layout: 'blank'});
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
}

async function profileHandler(req, res) {
    try {
        if(!req.session.isAuthenticated){
            res.redirect('/auth/login');
        }
        
        const userData = req.session.userData;
        const accountId = (userData) ? userData.AccountId : null;
        const profile = await getProfile(accountId);
        if (!profile) {
            res.render('dashboard', {layout:'layout'});
            return;
        }

        res.render('dashboard/profile', { profile, userData: userData, title: 'Profile' , layout:'layout'});
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
}

async function updateProfileHandler(req, res) {
    try {
        const userInfo = req.body;
        const userEntry = await CircproUsers.findOne({
            where: { AccountID: userInfo.AccountID }
          });

        if (userEntry) {
            userEntry.FirstName = userInfo.FirstName;
            userEntry.LastName = userInfo.LastName;
            userEntry.Company = userInfo.Company;
            userEntry.PhoneNumber = userInfo.PhoneNumber;
            userEntry.CellNumber = userInfo.CellNumber;
            userEntry.NotifyEmail = (userInfo.NotifyEmail) ? userInfo.NotifyEmail : false;
            await userEntry.save();
        }

        const userAddress = await CircProAddresses.findOne({
            where: { AccountID: userInfo.AccountID }
        });

        if (userAddress) {
            userAddress.AddressLine1 = userInfo.AddressLine1;
            userAddress.AddressLine2 = userInfo.AddressLine2;
            userAddress.CityTown = userInfo.CityTown;
            userAddress.StateParish = userInfo.StateParish;
            userAddress.save();
        }

        res.redirect('/dashboard/profile');
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
}

async function getRecentActivities() {
    try {
        const activityLogs = await QRSActivityLog.findAll({
            limit: 9,
            order: [['CreatedAt', 'DESC']]
        });
        // console.log('activityLogs', activityLogs);

        return activityLogs.map(log => ({
            ...log.dataValues,
            LogInformation: formatRelativeDate(log.CreatedAt)
        }));
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}

async function getProfile(accountId) {
    try {
        const sql =`SELECT DISTINCT
            U.AccountID, 
            U.DistributionID,
            U.FirstName, U.LastName,
            CONCAT(U.FirstName, ' ', U.LastName) AS RetailerName,
            U.EmailAddress,
            U.Company,
            A.AddressLine1,
            A.AddressLine2,
            A.CityTown, A.StateParish,
            NULLIF(
                COALESCE(LTRIM(RTRIM(A.AddressLine1)) + ', ', '') + 
                COALESCE(LTRIM(RTRIM(A.AddressLine2)) + ', ', '') + 
                COALESCE(LTRIM(RTRIM(A.CityTown)) + ', ', '') + 
                COALESCE(LTRIM(RTRIM(A.StateParish)), ''), 
                ''
            ) AS RetailerAddress,
            U.PhoneNumber,
            U.CellNumber, U.NotifyEmail
        FROM [dbo].[CircproUsers] U
        JOIN [dbo].[CircProAddresses] A ON U.UserID = A.UserID where U.AccountID = :accountId`;

        const result = await sequelize.query(sql, { 
            type: QueryTypes.SELECT,
            replacements: { accountId: accountId } 
        });

        const profile = result[0];
        console.log('profile', profile);

        // const profiled = await CircproUsers.findOne({
        //     where: { AccountID: accountId },
        //     include: [{
        //         model: CircProAddresses, 
        //         as: 'RetailerAddress'
        //     }]
        // });
        // console.log('profiled', profiled);
        return profile;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

function formatRelativeDate(date) {
    // Implement your relative date formatting logic here
    // Similar to the FormatRelativeDate function in C#
}

async function getChartDataQuery(aggregationType) {
    try {
        const currentDate = new Date().toISOString().split('T')[0];
        const currentYear = new Date().getFullYear();
        const startDate = new Date(currentYear, 0, 1).toISOString().split('T')[0]; // Start of the current year

        let query;

        switch (aggregationType.toLowerCase()) {
            case 'monthly':
                query = `
                    SELECT 
                        MONTH(publicationDate) AS periodNumber,
                        SUM(distributionAmount) AS totalDistributionAmount,
                        SUM(returnAmount) AS totalReturnAmount,
                        SUM(confirmedAmount) AS totalConfirmedAmount
                    FROM [dbo].[CircProTransactions]
                    WHERE YEAR(publicationDate) = :year
                    AND publicationDate >= :startDate
                    GROUP BY MONTH(publicationDate)
                    ORDER BY MONTH(publicationDate)
                `;
                break;
            case 'weekly':
                query = `
                    SELECT 
                    DATEPART(week, publicationDate) AS periodNumber,
                        SUM(distributionAmount) AS totalDistributionAmount,
                        SUM(returnAmount) AS totalReturnAmount,
                        SUM(confirmedAmount) AS totalConfirmedAmount
                    FROM [dbo].[CircProTransactions]
                    WHERE YEAR(publicationDate) = :year
                    AND publicationDate >= :startDate
                    GROUP BY DATEPART(week, publicationDate)
                    ORDER BY DATEPART(week, publicationDate)
                `;
                break;
            case 'daily':
                query = `
                    SELECT 
                    DATEPART(day, publicationDate) AS periodNumber,
                        SUM(distributionAmount) AS totalDistributionAmount,
                        SUM(returnAmount) AS totalReturnAmount,
                        SUM(confirmedAmount) AS totalConfirmedAmount
                    FROM [dbo].[CircProTransactions]
                    WHERE YEAR(publicationDate) = :year
                    AND MONTH(publicationDate) = :month
                    AND publicationDate >= :startDate
                    GROUP BY DATEPART(day, publicationDate)
                    ORDER BY DATEPART(day, publicationDate)
                `;
                break;
            default:
                throw new Error('Invalid aggregation type');
        }

        return await sequelize.query(query, {
            replacements: { year: currentYear, month: new Date().getMonth() + 1, startDate },
            type: QueryTypes.SELECT,
        });
    } catch (error) {
        throw error;
    }
}
// Handler for getting chart data
async function getChartData(req, res) {
    try {
        const aggregationType = req.body.aggregationType.toLowerCase(); // Assuming aggregationType is sent in the request body
        const data = await getChartDataQuery(aggregationType);

        // Create a TransactionDataViewModel instance
        const viewModel = new TransactionDataViewModel();

        // Populate the appropriate data based on the aggregationType
        switch (aggregationType.toLowerCase()) {
            case 'monthly':
                viewModel.MonthlyData = data.map(entry => new TransactionData(
                    entry.periodNumber,
                    entry.totalDistributionAmount,
                    entry.totalReturnAmount,
                    entry.totalConfirmedAmount,
                    `Month ${entry.periodNumber}`
                ));
                break;
            case 'weekly':
                viewModel.WeeklyData = data.map(entry => new TransactionData(
                    entry.periodNumber,
                    entry.totalDistributionAmount,
                    entry.totalReturnAmount,
                    entry.totalConfirmedAmount,
                    `Week ${entry.periodNumber}`
                ));
                break;
            case 'daily':
                viewModel.DailyData = data.map(entry => new TransactionData(
                    entry.periodNumber,
                    entry.totalDistributionAmount,
                    entry.totalReturnAmount,
                    entry.totalConfirmedAmount,
                    `${entry.periodNumber}`
                ));
                break;
            default:
                throw new Error('Invalid aggregation type');
        }

        return res.json({ success: true, data: viewModel });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

async function getChangePassword(req, res){

    if(!req.session.isAuthenticated){
        res.redirect('/auth/login');
    }
    const userData = req.session.userData;
    // Render the reset password form with the code parameter
    res.render('dashboard/changepassword', { userData: userData, layout: 'layout', title: 'Change Password'});
};

async function postChangePassword(req, res){
    try {

        if(!req.session.isAuthenticated){
            res.redirect('/auth/login');
        }

        const { oldPassword, newPassword } = req.body;

        const user = await AspNetUsers.findOne({ where: { Email: req.session.userData.Email } });
        const hashedPassword = await bcrypt.hash(oldPassword, 10);
        const isMatch = await bcrypt.compare(hashedPassword, user.PasswordHash);

        if(isMatch){
            const result = await changePasswordDB(user.UserId, newPassword);

            if (result.success) {
                return res.redirect('/dashboard/changepassword?Message=ChangePasswordSuccess');
            } else {
                res.locals.errors = result.errors;
                return res.render('dashboard/changepassword', { model: req.body });
            }
        } else{
            
            return res.render('dashboard/changepassword', { model: req.body });
        }
        
    } catch (error) {
        console.error('Error changing password:', error);
        return res.status(500).send('Internal Server Error'); 
    }
};

async function changePasswordDB(userId, newPassword) {
    try {
        // Find the user by userId
        const user = await AspNetUsers.findByPk(userId);
        if (!user) {
            return { success: false, errors: ['User not found'] };
        }

        // Update the user's password hash
        user.PasswordHash = await bcrypt.hash(newPassword, 10);

        // Save the updated user
        await user.save();

        return { success: true };
    } catch (error) {
        console.error('Error changing password:', error);
        return { success: false, errors: ['Internal Server Error'] };
    }
}

module.exports = {
    indexHandler,
    profileHandler,
    updateProfileHandler,
    getRecentActivities,
    getProfile,
    getChartData,
    getChangePassword,
    postChangePassword
    
};
