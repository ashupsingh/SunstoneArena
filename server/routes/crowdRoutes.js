const express = require('express');
const router = express.Router();
const { updateCrowdStatus, getCrowdStatus, getSuggestion } = require('../controllers/crowdController');
const { protect, superAdminOnly } = require('../middleware/authMiddleware');

router.post('/update', protect, superAdminOnly, updateCrowdStatus);
router.get('/status', getCrowdStatus);
router.get('/suggestion', getSuggestion);

module.exports = router;
