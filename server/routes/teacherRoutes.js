const express = require('express');
const router = express.Router();
const { getMyStudents, sendAnnouncement } = require('../controllers/teacherController');
const { protect, teacherOnly } = require('../middleware/authMiddleware');

router.get('/students', protect, teacherOnly, getMyStudents);
router.post('/announce', protect, teacherOnly, sendAnnouncement);

module.exports = router;
