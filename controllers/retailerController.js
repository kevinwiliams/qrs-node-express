const Util = require('../helpers/utils'); // Import Util model
const Retailer = require('../models/retailer'); // Import Retailer model
const CircproUsers = require('../models/CircproUsers'); // Import the CircproUsers model
const CircProAddress = require('../models/CircProAddresses'); // Import the CircProAddress model
const AspNetUsers = require('../models/AspNetUsers');
const AspNetUserRoles = require('../models/AspNetUserRoles');
const sequelize = require('../config/db').sequelize;
const ac = require('../controllers/accountController'); // Import the CircProAddress model
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

function generateUUID() {
    return uuidv4();
}

// Define a function to validate email addresses using regex
async function isValidEmail(emailAddress) {
    // Regular expression for email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailAddress);
}

async function loadNewRetailers(id) {
    try {
        // Define the URL of the ASP page
        const url = process.env.CIRC_PRO_API_NEW_USER; // Assuming you have environment variables set up
        // Define your form data as key-value pairs
        const formData = {
            distribution_id: id
        };

        // Send the POST request
        const response = await Util.postRequest(url, formData);
        if (response.status === 200){
            const result = response.data;

            // Process the response
            for (const item of result) {
                // console.log(item.EMAIL);
                const isValid = isValidEmail(item.EMAIL);
                console.log('isValid', isValid);
                if (isValid) {
                    const isExist = await ac.isEmailExist(item.EMAIL);
                    console.log('isExist', isExist);
                    if (!isExist) {
                        const FullName = (item.FIRST_NAME === "null" ? null : item.FIRST_NAME) + " " + (item.LAST_NAME === "null" ? null : item.LAST_NAME) || (item.COMPANY === "null" ? null : item.COMPANY);
                        console.log('FullName', FullName);
                        // Hash the password
                        const password = "Password-01!";
                        const hashedPassword = await bcrypt.hash(password, 10);
                        const uuid = generateUUID();

                        // Create application user
                        const newAccount = await AspNetUsers.create({
                            Id: uuid,
                            UserName: item.EMAIL,
                            FullName: FullName,
                            Email: item.EMAIL,
                            PasswordHash: hashedPassword,// Assuming you have a field named PasswordHash in your model
                            EmailConfirmed: false,
                            PhoneNumberConfirmed: false,
                            TwoFactorEnabled: false,
                            LockoutEnabled: false,
                            AccessFailedCount: 0,

                        });
                
                        // Assign user role based on email domain
                        const userRole = (item.EMAIL.toLowerCase().includes("jamaicaobserver.com")) ? "Circulation" : "Retailer";
                        
                        await AspNetUserRoles.create({
                            UserId: newAccount.Id,
                            Role: userRole
                        });

                        // Create CircproUsers object
                        const circProUsers = new CircproUsers({
                            UserID : newAccount.Id,
                            AccountID: item.ACCOUNT,
                            CellNumber: item.CELL_NUMBER === "null" ? null : item.CELL_NUMBER,
                            Company: item.COMPANY === "null" ? null : item.COMPANY,
                            DistributionID: item.DISTRIBUTION_ID,
                            EmailAddress: item.EMAIL,
                            FirstName: item.FIRST_NAME === "null" ? null : item.FIRST_NAME,
                            LastName: item.LAST_NAME === "null" ? null : item.LAST_NAME,
                            PhoneNumber: item.PHONE_NUMBER === "null" ? null : item.PHONE_NUMBER,
                            CreatedAt: item.DATE_TIME_STAMP,
                            IsActive: true
                        });

                        // Create CircProAddress object
                        const circProAddress = new CircProAddress({
                            UserID : newAccount.Id,
                            AccountID: item.ACCOUNT,
                            EmailAddress: item.EMAIL,
                            AddressLine1: item.ADDRESS_LINE1 === "null" ? null : item.ADDRESS_LINE1,
                            AddressLine2: item.ADDRESS_LINE2 === "null" ? null : item.ADDRESS_LINE2,
                            CityTown: item.ADDRESS_LINE3 === "null" ? null : item.ADDRESS_LINE3,
                            CreatedAt: item.DATE_TIME_STAMP
                        });

                        // Save CircproUsers and CircProAddress to the database
                        const [user, address] = await Promise.all([
                            circProUsers.save(),
                            circProAddress.save()
                        ]);

                        // Update CircproUsers with AddressID
                        user.AddressID = address.id;
                        await user.save();
                    }
                }
            }

        }
        
        return true;
    } catch (error) {
        console.error('Error loading new retailers:', error);
        return false;
    }
}


module.exports = {
    index: async (req, res) => {
        try {
                if(!req.session.isAuthenticated){
                    res.redirect('/auth/login');
                }
    
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
                userData: req.session.userData,
                
            });



        } catch (error) {
            // Handle any errors
            console.error('Error fetching retailer data:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    getNewUsers: async (req, res) => {
        try {
            return res.json({ succcess: loadNewRetailers(req.body)});
        } catch (error) {
            console.error(error);
            // Handle errors
            res.json({ success: false });
        }
    }
};
