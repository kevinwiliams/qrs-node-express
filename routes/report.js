const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/supervisor', reportController.getSupervisorReport);
router.post('/supervisor', reportController.filterSupervisorReport);
router.get('/transactions', reportController.getTransactionsReport);
router.post('/transactions', reportController.filterTransactionsReport);

module.exports = router;
