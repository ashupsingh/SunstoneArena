const express = require('express');
const router = express.Router();
const { getMyNotifications, getUnreadCount, markAsRead, markAllRead, createNotification } = require('../controllers/notificationController');
const { protect, teacherOnly } = require('../middleware/authMiddleware');

router.get('/', protect, getMyNotifications);
router.get('/unread-count', protect, getUnreadCount);
router.put('/:id/read', protect, markAsRead);
router.put('/read-all', protect, markAllRead);
router.post('/', protect, teacherOnly, createNotification);

module.exports = router;
