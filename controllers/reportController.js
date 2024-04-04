const { QueryTypes } = require('sequelize');
const sequelize = require('../config/db').sequelize;
const { CircProTranx } = require('../models/CircProTransactions'); // Import your Sequelize CircProTranx model
const { Op } = require('sequelize');

// Function to fetch supervisor report
async function getSupervisorReport(req, res) {
    try {
        // Define the SQL query
        const sql = `
            SELECT UserName, EmailAddress, AccountID, RetailerName, Company, RetailerAddress, PublicationDate, TotalReturnAmount, TotalDistributionAmount, CreatedAt
            FROM dbo.View_Supervisor_Report
        `;

        // Execute the query
        const result = await sequelize.query(sql, { type: QueryTypes.SELECT });
         // Filter out null email addresses and group by email address
         const supervisorNames = result
         .filter(u => u.UserName !== null && u.EmailAddress !== null)
         .reduce((acc, curr) => {
             if (!acc[curr.EmailAddress]) {
                 acc[curr.EmailAddress] = curr.UserName;
             }
             return acc;
         }, {});

     // Convert the grouped supervisors to an array of objects
     const supervisorList = Object.entries(supervisorNames).map(([key, value]) => ({
         Text: value,
         Value: key
     }));

        // Send the result as JSON response
        //res.json(result);
        // Render the filtered data to the report/supervisor page
        res.render('report/supervisor', { supervisorReport: result, supervisors: supervisorList,
            layout: 'layout', // Specify the layout template
        });
    } catch (error) {
        // Handle errors
        console.error('Error fetching supervisor report:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

// Function to filter supervisor report
async function filterSupervisorReport(req, res) {
    try {
        const { supervisors, startDate, endDate } = req.body;

        // Define the SQL query
        let sql = `
            SELECT UserName, EmailAddress, AccountID, RetailerName, Company, RetailerAddress, PublicationDate, TotalReturnAmount, TotalDistributionAmount, CreatedAt
            FROM dbo.View_Supervisor_Report
        `;

        // Construct the WHERE clause based on provided parameters
        const whereClause = [];
        const queryParams = {};

        if (supervisors) {
            whereClause.push(`UserName LIKE '%' + :supervisor + '%'`);
            queryParams.supervisor = supervisors;
        }
        if (startDate) {
            whereClause.push(`PublicationDate >= :startDate`);
            queryParams.startDate = startDate;
        }
        if (endDate) {
            whereClause.push(`PublicationDate <= :endDate`);
            queryParams.endDate = endDate;
        }

        if (whereClause.length > 0) {
            sql += ' WHERE ' + whereClause.join(' AND ');
        }

        // Execute the query with parameters
        const result = await sequelize.query(sql, { type: QueryTypes.SELECT, replacements: queryParams });
        // Filter out null email addresses and group by email address
        const supervisorNames = result
        .filter(u => u.UserName !== null && u.EmailAddress !== null)
        .reduce((acc, curr) => {
            if (!acc[curr.EmailAddress]) {
                acc[curr.EmailAddress] = curr.UserName;
            }
            return acc;
        }, {});

        // Convert the grouped supervisors to an array of objects
        const supervisorList = Object.entries(supervisorNames).map(([key, value]) => ({
            Text: value,
            Value: key
        }));

        // Send the result as JSON response
        //res.json(result);
        // Render the filtered data to the report/supervisor page
        res.render('report/supervisor', { supervisorReport: result, supervisors: supervisorList,
            layout: 'layout', // Specify the layout template
        });
    } catch (error) {
        // Handle errors
        console.error('Error fetching supervisor report:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

// Function to fetch transactions report
async function getTransactionsReport(req, res) {
    try {
        // Define the SQL query
        const sql = `
            SELECT TOP 30 AccountID, RetailerName, Company, RetailerAddress, PublicationDate, TotalReturnAmount, TotalConfirmedAmount, TotalDistributionAmount, CreatedAt, Status
            FROM dbo.View_Transactions_Report
        `;

        // Execute the query
        const result = await sequelize.query(sql, { type: QueryTypes.SELECT });

        // Send the result as JSON response
        res.json(result);
    } catch (error) {
        // Handle errors
        console.error('Error fetching transactions report:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

// Function to filter transactions report
async function filterTransactionsReport(req, res) {
    try {
        const { pubStatus, startDate, endDate } = req.body;

        // Define the SQL query
        let sql = `
            SELECT AccountID, RetailerName, Company, RetailerAddress, PublicationDate, TotalReturnAmount, TotalConfirmedAmount, TotalDistributionAmount, CreatedAt, Status
            FROM dbo.View_Transactions_Report
        `;

        // Construct the WHERE clause based on provided parameters
        const whereClause = [];
        const queryParams = {};

        if (pubStatus) {
            whereClause.push(`Status = :status`);
            queryParams.status = pubStatus;
        }
        if (startDate) {
            whereClause.push(`PublicationDate >= :startDate`);
            queryParams.startDate = startDate;
        }
        if (endDate) {
            whereClause.push(`PublicationDate <= :endDate`);
            queryParams.endDate = endDate;
        }

        if (whereClause.length > 0) {
            sql += ' WHERE ' + whereClause.join(' AND ');
        }

        // Execute the query with parameters
        const result = await sequelize.query(sql, { type: QueryTypes.SELECT, replacements: queryParams });

        // Send the result as JSON response
        res.json(result);
    } catch (error) {
        // Handle errors
        console.error('Error fetching transactions report:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

// Export the functions
module.exports = {
    getSupervisorReport,
    filterSupervisorReport,
    getTransactionsReport,
    filterTransactionsReport,
};
