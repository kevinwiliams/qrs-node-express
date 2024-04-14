// Middleware to check remember me token
const jwt = require('jsonwebtoken');
const AspNetUsers = require('../models/AspNetUsers');

const checkRememberMe = async (req, res, next) => {
    const token = req.cookies.remember_me;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await AspNetUsers.findById(decoded.userId);

            if (user) {
                req.user = user;
            }
        } catch (error) {
            console.error(error);
        }
    }

    next();
};

module.exports = checkRememberMe;
