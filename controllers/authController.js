const sequelize = require('../config/db').sequelize;
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const AspNetUsers = require('../models/AspNetUsers');
const Distro = require('../controllers/distributionController');
const CircproUsers = require('../models/CircproUsers');
const Util = require('../helpers/utils');

// GET: /Account/Login
const getLogin = (req, res) => {
    console.log('isAuthenticated', req.session.isAuthenticated);
    if (req.session.isAuthenticated) {
        res.redirect('/dashboard');
    }
    const { returnUrl } = req.query;
    res.render('auth/login', {  layout: 'blank', returnUrl, title: 'Login'});
};

// POST: /Account/Login
const postLogin = async (req, res) => {
    const { email, password, rememberMe} = req.body;
    try {
        // Query the database to find the user by username
        const result = await sequelize.query(`SELECT * FROM [dbo].[AspNetUsers] WHERE [UserName] = '${email}'`, { type: sequelize.QueryTypes.SELECT });
        // console.log('result', result);
        const user = result[0];
        if (!user) {
            res.render('auth/login', { error: 'Invalid username or password', layout: 'blank' });
            return;
        }
        // Compare the password hash
        const isMatch = await bcrypt.compare(password, user.PasswordHash);
        if (!isMatch) {
            res.render('auth/login', { error: 'Incorrect username/password' ,  layout: 'blank'});
            return;
        }

        const userInfo = await sequelize.query(`SELECT r.[Name] as Role, 
            cu.AccountID, 
            u.Email, cu.UserID
            FROM [dbo].[AspNetUsers] u 
            LEFT JOIN [dbo].[CircproUsers] cu ON u.Id = cu.UserID
            JOIN [dbo].[AspNetUserRoles] ur on u.Id = ur.UserId
            JOIN [dbo].[AspNetRoles] r on ur.RoleId = r.Id 
            WHERE u.Email = '${email}'`, { type: sequelize.QueryTypes.SELECT });
        const userData = userInfo[0];

        // Set user session
        req.session.user = user; // Example: Storing user data in session
        if (userData) {
            req.session.user.role = userData.Role;
            req.session.user.accountId = userData.AccountID;
            req.session.user.userId = userData.UserID;
        } else{
            res.render('auth/login', { error: 'User not found' ,  layout: 'blank'});
            return;
        }

         // Create JWT token
         const token = jwt.sign({ userId: userData.Id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Set remember me cookie if selected
        if (rememberMe) {
            res.cookie('remember_me', token, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
        }

        req.session.isAuthenticated = true;
        res.redirect('/dashboard'); // Redirect to home page
        // res.redirect(returnUrl || '/dashboard'); // Redirect to home page
        // res.render('dashboard/index', {layout: 'layout'}); // Redirect to home page
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).send('Internal Server Error');
    }
};

// GET: /Account/Register
const getRegister = (req, res) => {
    // Render the registration form
    res.render('auth/register', { layout: 'layout', title: 'Register'});
};

// POST: /Account/Register
const postRegister = async (req, res) => {
    const { email, password, fullName, roleName } = req.body;
    try {
        // Implement your user registration logic here
        // Example: Create user in the database
        const newUser = { id: users.length + 1, email, password, fullName, roleName };
        users.push(newUser);
        req.session.user = newUser; // Example: Set user session after registration
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

// GET: /Account/ForgotPassword
const getForgotPassword = (req, res) => {
    // Render the forgot password form
    res.render('auth/forgotpassword', { layout: 'layout' , title: 'Forgot Password'});
};

// POST: /Account/ForgotPassword
const postForgotPassword = async (req, res) => {
    try {
        // Implement your forgot password logic here
        // Extract email from request body
        const { email } = req.body;
        // Check if email is valid
        if (!email) {
            return res.status(400).send('Email is required');
        }

        const user = await AspNetUsers.findOne({ where: { Email: email } });
        console.log('user', user);
        if (user) {
            // Generate callback URL
            const code = user.SecurityStamp;
            const callbackUrl = `${req.protocol}://${req.get('host')}/auth/resetpassword?code=${code}`;
            const dataToRender = {
                CallBackUrl: callbackUrl
            };
            const subject = `Reset Password`;
            const body = await Util.renderViewToString('./views/emails/passwordreset.hbs', dataToRender);
            const emailSent = await Util.sendMail(email, subject, body);
  
            res.render('auth/forgotpasswordconfirmation', { layout: 'layout' });
        }else{
            res.render('auth/forgotpassword', { layout: 'layout' });
        }

       
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

// GET: /Account/ResetPassword
const getResetPassword = (req, res) => {
    const { code } = req.query;
    // Render the reset password form with the code parameter
    res.render('auth/resetpassword', { code,  layout: 'layout', title: 'Reset Password'});
};

// POST: /Account/ResetPassword
const postResetPassword = async (req, res) => {
    const { email, code, password, confirmPassword } = req.body;
    try {

        if (password === confirmPassword) {

            const user = await AspNetUsers.findOne({ where: { Email: email, SecurityStamp: code } });
            if (user) {
                const isMatch = await bcrypt.compare(password, user.PasswordHash);

                if(isMatch){
                    const result = await changePasswordDB(user.Id, password);

                    if (result.success) {
                        return res.render('auth/resetpassword', {Message: 'ChangePasswordSuccess', layout: 'layout'});
                    } else {
                        res.locals.errors = result.errors;
                        return res.render('auth/resetpassword', { ...req.body, layout: 'layout', Message: result.errors});
                    }
                } else{
                    
                    return res.render('auth/resetpassword', { ...req.body, layout: 'layout', Message: 'Old password does not match!'});
                }
            }
            
        } else{
            return res.render('auth/resetpassword', { ...req.body, layout: 'layout', Message: 'Passwords do not match!'});
        }

        // Implement your reset password logic here
        // Example: Reset user's password in the database
        res.render('auth/resetpassword', { layout: 'layout' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

// GET: /Account/ResetPasswordConfirmation
const getResetPasswordConfirmation = (req, res) => {
    // Render the reset password confirmation page
    res.render('auth/resetpasswordconfirmation', { layout: 'layout', title: 'Reset Password Confirmation'});
};

// POST: /Account/LogOff
const postLogout = (req, res) => {
    try {
        delete req.session.user; // Example: Clear user session on logout
        delete req.session.userData; // Example: Clear user session on logout
        delete req.session.isAuthenticated; // Example: Clear user session on logout
        res.redirect('/auth/login');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
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
};

const updateAllPasswords = async () => {
    try {
        // Query all users from the database
        const users = await sequelize.query('SELECT * FROM [dbo].[AspNetUsers]', { type: sequelize.QueryTypes.SELECT });
        
        // Hash the new password "Password-01"
        const hashedPassword = await bcrypt.hash('Password-01', 10); // 10 is the salt round
        
        // Update each user's password
        for (const user of users) {
            await sequelize.query(`UPDATE [dbo].[AspNetUsers] SET PasswordHash = '${hashedPassword}' WHERE Id = '${user.Id}'`);
        }
        
        console.log('All passwords updated successfully.');
    } catch (error) {
        console.error('Error updating passwords:', error);
    }
};

module.exports = {
    getLogin,
    postLogin,
    getRegister,
    postRegister,
    getForgotPassword,
    postForgotPassword,
    getResetPassword,
    postResetPassword,
    getResetPasswordConfirmation,
    postLogout,
    // updateAllPasswords
};
