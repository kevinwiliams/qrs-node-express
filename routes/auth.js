const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);
router.post('/logoff', authController.postLogout);
router.get('/register', authController.getRegister); 
router.post('/register', authController.postRegister); 
router.get('/forgotpassword', authController.getForgotPassword); 
router.post('/forgotpassword', authController.postForgotPassword); 
router.get('/resetpassword', authController.getResetPassword); 
router.post('/resetpassword', authController.postResetPassword); 

module.exports = router;
