const sequelize = require('../config/db').sequelize;
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');

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
    const { email, password } = req.body;
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
        }
        // console.log('req.session.user', req.session.user);

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
    res.render('register', { layout: 'layout', title: 'Register'});
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
    const { email } = req.body;
    try {
        // Implement your forgot password logic here
        // Extract email from request body
        const { email } = req.body;

        // Check if email is valid
        if (!email) {
            return res.status(400).send('Email is required');
        }

       // Generate callback URL
        const callbackUrl = `${req.protocol}://${req.get('host')}/auth/resetpassword`;

        const subject = `Reset Password`;
        const body = await Util.renderViewToString('./views/emails/passwordreset.hbs', dataToRender);
        //const emailSent = await Util.sendMail(email, subject, body);
  
        res.render('forgotpasswordconfirmation', { layout: 'layout' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

// GET: /Account/ResetPassword
const getResetPassword = (req, res) => {
    const { code } = req.params;
    // Render the reset password form with the code parameter
    res.render('resetpassword', { code,  layout: 'layout', title: 'Reset Password'});
};

// POST: /Account/ResetPassword
const postResetPassword = async (req, res) => {
    const { email, code, password } = req.body;
    try {
        // Implement your reset password logic here
        // Example: Reset user's password in the database
        res.render('resetpasswordconfirmation', { layout: 'layout' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

// GET: /Account/ResetPasswordConfirmation
const getResetPasswordConfirmation = (req, res) => {
    // Render the reset password confirmation page
    res.render('resetpasswordconfirmation', { layout: 'layout', title: 'Reset Password Confirmation'});
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
