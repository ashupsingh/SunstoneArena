import { Router } from 'express';
import { getAllUsers, updateUserRole, deleteUser, getDashboardStats, broadcastNotification, broadcastSchema, getPendingTeachers, approveTeacher, getFlaggedStudents, getPendingGlobalEvents } from '../controllers/adminController';
import { protect, superAdminOnly } from '../middleware/authMiddleware';
import validate from '../middleware/validate';

const router = Router();

router.get('/users', protect, superAdminOnly, getAllUsers);
router.put('/users/:id/role', protect, superAdminOnly, updateUserRole);
router.delete('/users/:id', protect, superAdminOnly, deleteUser);
router.get('/stats', protect, superAdminOnly, getDashboardStats);
router.post('/broadcast', protect, superAdminOnly, validate(broadcastSchema), broadcastNotification);
router.get('/teachers/pending', protect, superAdminOnly, getPendingTeachers);
router.put('/teachers/:id/approve', protect, superAdminOnly, approveTeacher);
router.get('/students/flagged', protect, superAdminOnly, getFlaggedStudents);
router.get('/events/pending-global', protect, superAdminOnly, getPendingGlobalEvents);

export default router;
