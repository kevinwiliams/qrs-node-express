const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/', dashboardController.indexHandler);
router.get('/profile', dashboardController.profileHandler);
router.post('/profile', dashboardController.updateProfileHandler);
router.post('/getchartdata', dashboardController.getChartData); 

module.exports = router;
