const express = require('express');
const router = express.Router();
const { getSchedules, getMySchedule, createSchedule, updateSchedule, rescheduleClass, cancelClass, deleteSchedule } = require('../controllers/scheduleController');
const { protect, teacherOnly, superAdminOnly } = require('../middleware/authMiddleware');

router.get('/', protect, getSchedules);
router.get('/mine', protect, teacherOnly, getMySchedule);
router.post('/', protect, teacherOnly, createSchedule);
router.put('/:id', protect, teacherOnly, updateSchedule);
router.put('/:id/reschedule', protect, teacherOnly, rescheduleClass);
router.put('/:id/cancel', protect, teacherOnly, cancelClass);
router.delete('/:id', protect, superAdminOnly, deleteSchedule);

module.exports = router;
