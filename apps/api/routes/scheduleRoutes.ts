import { Router } from 'express';
import {
	getSchedules,
	getMySchedule,
	createSchedule,
	updateSchedule,
	rescheduleClass,
	cancelClass,
	deleteSchedule,
	rescheduleSchema,
	createScheduleSchema,
	startAttendanceSession,
	getActiveAttendanceSession,
	markAttendanceViaBluetooth,
	manualMarkAttendance,
	closeAttendanceSession,
	getAttendanceReport,
	getAttendanceHistory,
	manualAttendanceSchema,
	markAttendanceSchema,
} from '../controllers/scheduleController';
import { protect, teacherOnly } from '../middleware/authMiddleware';
import { mobileOnly } from '../middleware/mobileOnly';
import validate from '../middleware/validate';

const router = Router();

router.get('/', protect, getSchedules);
router.get('/mine', protect, teacherOnly, getMySchedule);
router.post('/', protect, teacherOnly, validate(createScheduleSchema), createSchedule);
router.put('/:id', protect, teacherOnly, updateSchedule);
router.put('/:id/reschedule', protect, teacherOnly, validate(rescheduleSchema), rescheduleClass);
router.put('/:id/cancel', protect, teacherOnly, cancelClass);
router.delete('/:id', protect, teacherOnly, deleteSchedule);

router.post('/:id/attendance/session/start', protect, mobileOnly, teacherOnly, startAttendanceSession);
router.post('/:id/attendance/session/close', protect, mobileOnly, teacherOnly, closeAttendanceSession);
router.get('/:id/attendance/session/active', protect, mobileOnly, getActiveAttendanceSession);
router.post('/:id/attendance/mark', protect, mobileOnly, validate(markAttendanceSchema), markAttendanceViaBluetooth);
router.put('/:id/attendance/manual', protect, mobileOnly, teacherOnly, validate(manualAttendanceSchema), manualMarkAttendance);
router.get('/:id/attendance/report', protect, mobileOnly, getAttendanceReport);
router.get('/attendance/history', protect, mobileOnly, getAttendanceHistory);

export default router;
