const express = require('express');
const router = express.Router();
const distributionController = require('../controllers/distributionController');

// Define routes
router.get('/', distributionController.index);
router.post('/getlatest', distributionController.getLatest);
router.post('/getlatestdraw', distributionController.getLatestDraw);
router.get('/account/:id', distributionController.account);
router.post('/submitdispute', distributionController.submitDispute);

module.exports = router;
