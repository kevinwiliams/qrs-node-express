const sequelize = require('../config/db').sequelize;
const express = require('express');
const bcrypt = require('bcrypt');

// GET: /Account/Login
const getLogin = (req, res) => {
    const { returnUrl } = req.query;
    res.render('auth/login', {  layout: 'blank', returnUrl });
};

// POST: /Account/Login
const postLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        // Query the database to find the user by username
        const result = await sequelize.query(`SELECT * FROM [dbo].[AspNetUsers] WHERE [UserName] = '${email}'`, { type: sequelize.QueryTypes.SELECT });
        console.log('result', result);
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
        // Set user session
        req.session.user = user; // Example: Storing user data in session
        req.session.req.isAuthenticated = true;
        // res.redirect(returnUrl || '/dashboard'); // Redirect to home page
        res.redirect('/dashboard'); // Redirect to home page
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).send('Internal Server Error');
    }
};

// GET: /Account/Register
const getRegister = (req, res) => {
    // Render the registration form
    res.render('register', { layout: 'layout'});
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
    res.render('forgotpassword', { layout: 'layout' });
};

// POST: /Account/ForgotPassword
const postForgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        // Implement your forgot password logic here
        // Example: Send password reset email to the user
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
    res.render('resetpassword', { code,  layout: 'layout' });
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
    res.render('resetpasswordconfirmation', { layout: 'layout' });
};

// POST: /Account/LogOff
const postLogout = (req, res) => {
    try {
        // Implement your logout logic here (e.g., clearing session/cookie)
        delete req.session.user; // Example: Clear user session on logout
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
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
    postLogout
};
