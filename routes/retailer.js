const express = require('express');
const router = express.Router();
const retailerController = require('../controllers/retailerController');

// Define routes
router.get('/', retailerController.index);
router.post('/getNewUsers', retailerController.getNewUsers);
router.get('/details/:id', retailerController.details);
router.get('/create', retailerController.create);
router.post('/create', retailerController.createRetailer);
router.get('/edit/:id', retailerController.edit);
router.post('/edit/:id', retailerController.updateRetailer);
router.get('/delete/:id', retailerController.delete);
router.post('/delete/:id', retailerController.deleteRetailer);

module.exports = router;
