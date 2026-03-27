import { Router } from 'express';
import { getMyStudents, sendAnnouncement, announceSchema, flagStudent, flagStudentSchema } from '../controllers/teacherController';
import { protect, teacherOnly } from '../middleware/authMiddleware';
import validate from '../middleware/validate';

const router = Router();

router.get('/students', protect, teacherOnly, getMyStudents);
router.post('/announce', protect, teacherOnly, validate(announceSchema), sendAnnouncement);
router.post('/students/:id/flag', protect, teacherOnly, validate(flagStudentSchema), flagStudent);

export default router;
