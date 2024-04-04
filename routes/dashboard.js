const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/supervisor', dashboardController.getIndex);
router.post('/supervisor', dashboardController.getLogs);
router.get('/transactions', dashboardController.getHistory);
router.post('/transactions', dashboardController.getLastEntry);

module.exports = router;
