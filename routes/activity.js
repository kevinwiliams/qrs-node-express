const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');

router.get('/', activityController.getIndex);
router.get('/logs', activityController.getLogs);
router.get('/history', activityController.getHistory);
router.post('/getlastentry', activityController.getLastEntry);

module.exports = router;
