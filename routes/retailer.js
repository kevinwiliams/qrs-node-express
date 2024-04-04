const express = require('express');
const router = express.Router();
const retailerController = require('../controllers/retailerController');

// Define routes
router.get('/', retailerController.index);
router.post('/getnewusers', retailerController.getNewUsers);


module.exports = router;
