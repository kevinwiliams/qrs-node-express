const moment = require('moment');
const QRSActivityLogs = require('../models/QRSActivityLogs');

async function getIndex(req, res) {
    res.render('activity/index', {
        layout: 'layout'
    }); // Render the index view
}

async function getLogs(req, res) {
    try {
        const userData = getUserData(req);
        const qRSActivityLogs = await QRSActivityLogs.findAll({
            order: [['CreatedAt', 'DESC']]
        });
        res.render('activity/logs', { 
            layout: 'layout', // Specify the layout template
            qRSActivityLogs: JSON.parse(JSON.stringify(qRSActivityLogs)), 
            title: 'History Logs',
            userData : userData 
        });

    } catch (error) {
        console.error('Error fetching activity logs:', error);
        res.status(500).send('Internal Server Error');
    }
}

async function getHistory(req, res) {
    try {
        // console.log('Params:', req.query);
        const userData = getUserData(req);
        const parsedPubDate = moment(req.query.pd).format('YYYY-MM-DD');
        const qRSActivityLogs = await QRSActivityLogs.findAll({
            where: {
                AccountID: req.query.id,
                PublicationDate: parsedPubDate
            },
            order: [['CreatedAt', 'DESC']]
        });
        // console.log('qRSActivityLogs', qRSActivityLogs);
        res.render('activity/history', {
            layout: 'layout', // Specify the layout template
            qRSActivityLogs : JSON.parse(JSON.stringify(qRSActivityLogs)), 
            publicationDate: parsedPubDate, 
            title: 'Account History',
            userData: userData });
    } catch (error) {
        console.error('Error fetching activity history:', error);
        res.status(500).send('Internal Server Error');
    }
}

async function getLastEntry(req, res) {
    try {
        const { accountId, publicationDate } = req.body;
        const publicationDateParts = publicationDate.split('/'); // Split the date string by '/'
        const day = publicationDateParts[0]; // Extract day
        const month = publicationDateParts[1]; // Extract month
        const year = publicationDateParts[2]; // Extract year

        // Create a new Date object with the extracted parts in the correct order (year, month - 1, day)
        const parsedPublicationDate = new Date(year, month - 1, day).toISOString().split('T')[0];
        console.error(parsedPublicationDate);
        const result = await QRSActivityLogs.findOne({
            where: {
                AccountID: accountId,
                PublicationDate: parsedPublicationDate
            },
            order: [['CreatedAt', 'DESC']]
        });
        if (result) {
            res.json({
                LASTUPDATED: result.CreatedAt.toISOString(),
                RETAMT: result.ReturnAmount,
                USER: result.UserName
            });
        } else {
            res.json({});
        }
    } catch (error) {
        console.error('Error fetching last entry:', error);
        res.status(500).json({ error: error });
    }
}


function getUserData(req) {
    const userData = {
        UserRole: req.session.userData ? req.session.userData.UserRole : '',
        UserName: req.session.userData ? req.session.userData.UserName : ''
    };
    return userData;
}

module.exports = {
    getIndex,
    getLogs,
    getHistory,
    getLastEntry
};
