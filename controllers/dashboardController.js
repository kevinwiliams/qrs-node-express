const { QueryTypes } = require('sequelize');
const sequelize = require('../config/db').sequelize;
const QRSActivityLog = require('../models/QRSActivityLogs'); 
const CircproUsers = require('../models/CircproUsers'); 
const CircProAddress = require('../models/CircProAddresses'); 
const CircProTranx = require('../models/CircProTransactions'); 

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
        const accountId = req.session.accountId;
        const profile = await getProfile(accountId);

        if (!profile) {
            res.render('index');
            return;
        }

        res.render('profile', { profile, userData: req.session.userData, title: 'Profile'  });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
}

async function updateProfileHandler(req, res) {
    try {
        // Handle updating profile logic
        res.redirect('/profile');
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
        const profile = await CircproUsers.findOne({
            where: { AccountID: accountId },
            include: [{
                model: CircProAddress,
                as: 'RetailerAddress'
            }]
        });

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

module.exports = {
    indexHandler,
    profileHandler,
    updateProfileHandler,
    getRecentActivities,
    getProfile,
    getChartData
};
