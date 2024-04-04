const Util = require('../utils/utils'); // Import Util model
const Retailer = require('../models/retailer'); // Import Retailer model
const CircproUsers = require('../models/CircproUsers'); // Import the CircproUsers model
const CircProAddress = require('../models/CircProAddresses'); // Import the CircProAddress model
const AspNetUsers = require('../models/AspNetUsers');
const AspNetUserRoles = require('../models/AspNetUserRoles');
const sequelize = require('../config/db').sequelize;
const ac = require('../controllers/accountController'); // Import the CircProAddress model

// Define a function to validate email addresses using regex
function isValidEmail(emailAddress) {
    // Regular expression for email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailAddress);
}

async function loadNewRetailers(id) {
    try {
        // Define the URL of the ASP page
        const url = process.env.CIRC_PRO_API_NEW_USER; // Assuming you have environment variables set up
        console.log('url', url);
        // Define your form data as key-value pairs
        const formData = {
            distribution_id: id
        };

        // Send the POST request
        const result = await Util.postRequest(url, formData);
        console.log('result', result);

        // Process the response
        for (const item of result) {
            const isValidEmail = isValidEmail(item.EMAIL);
            if (isValidEmail) {
                const isExist = ac.isEmailExist(item.EMAIL);
                if (!isExist) {
                    const FullName = (item.FIRST_NAME === "null" ? null : item.FIRST_NAME) + " " + (item.LAST_NAME === "null" ? null : item.LAST_NAME) || (item.COMPANY === "null" ? null : item.COMPANY);

                    // Hash the password
                    const password = "Password-01!";
                    const hashedPassword = await bcrypt.hash(password, 10);

                    // Create application user
                    const newAccount = await AspNetUsers.create({
                        UserName: item.EMAIL,
                        FullName: FullName,
                        Email: item.EMAIL,
                        PasswordHash: hashedPassword // Assuming you have a field named PasswordHash in your model
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
        return true;
    } catch (error) {
        console.error('Error loading new retailers:', error);
        return false;
    }
}


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
            return res.json({ succcess: loadNewRetailers(req.body)});
        } catch (error) {
            console.error(error);
            // Handle errors
            res.json({ success: false });
        }
    }
};
