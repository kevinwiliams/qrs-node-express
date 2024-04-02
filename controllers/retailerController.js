const Retailer = require('../models/retailer'); // Import Retailer model
const { CircproUsers } = require('../models/CircproUsers'); // Assuming you have defined the Sequelize model
const sequelize = require('../config/db').sequelize;

module.exports = {
    index: async (req, res) => {
        try {
            // Retrieve user data from the session
            // const { error, userRole, userName } = req.session.userData;
    
            // Use Sequelize to fetch retailer data
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
                        U.CellNumber
                    FROM CircproUsers U
                    JOIN CircProAddresses A ON U.UserID = A.UserID`;

        const result = await sequelize.query(sql, { type: sequelize.QueryTypes.SELECT });

    
            // Calculate retailer count and max distribution ID
            const retailerCnt = result.length;
            const maxDistributionId = result.reduce((max, { DistributionID }) => Math.max(max, DistributionID), -Infinity);
    
            // Render the view with the retrieved data
            res.render('retailer/index', {
                layout: 'layout', // Specify the layout template
                pageTitle: 'Retailers / Agents', // Pass additional data to the layout
                retailers: result,
                circproUsers: retailerCnt,
                maxDistId: maxDistributionId,
                // error,
                // userRole,
                // userName
            });



        } catch (error) {
            // Handle any errors
            console.error('Error fetching retailer data:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    getNewUsers: async (req, res) => {
        try {
            // Your logic for fetching new users
        } catch (error) {
            console.error(error);
            // Handle errors
            res.json({ success: false });
        }
    },

    details: async (req, res) => {
        try {
            // Your logic for fetching and rendering retailer details
        } catch (error) {
            console.error(error);
            // Handle errors
        }
    },

    create: async (req, res) => {
        try {
            // Render the create form
        } catch (error) {
            console.error(error);
            // Handle errors
        }
    },

    createRetailer: async (req, res) => {
        try {
            // Logic for creating a new retailer
        } catch (error) {
            console.error(error);
            // Handle errors
        }
    },

    edit: async (req, res) => {
        try {
            // Logic for fetching retailer details for editing
        } catch (error) {
            console.error(error);
            // Handle errors
        }
    },

    updateRetailer: async (req, res) => {
        try {
            // Logic for updating retailer details
        } catch (error) {
            console.error(error);
            // Handle errors
        }
    },

    delete: async (req, res) => {
        try {
            // Logic for fetching retailer details for deletion
        } catch (error) {
            console.error(error);
            // Handle errors
        }
    },

    deleteRetailer: async (req, res) => {
        try {
            // Logic for deleting a retailer
        } catch (error) {
            console.error(error);
            // Handle errors
        }
    }
};
