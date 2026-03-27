import { Router } from 'express';
import { getMyNotifications, getUnreadCount, markAsRead, markAllRead, createNotification, createNotificationSchema, reactToNotification, reactNotificationSchema, registerPushToken, unregisterPushToken, pushTokenSchema } from '../controllers/notificationController';
import { protect, teacherOnly } from '../middleware/authMiddleware';
import validate from '../middleware/validate';

const router = Router();

router.get('/', protect, getMyNotifications);
router.get('/unread-count', protect, getUnreadCount);
router.post('/push-token', protect, validate(pushTokenSchema), registerPushToken);
router.delete('/push-token', protect, validate(pushTokenSchema), unregisterPushToken);
router.put('/:id/read', protect, markAsRead);
router.post('/:id/react', protect, validate(reactNotificationSchema), reactToNotification);
router.put('/read-all', protect, markAllRead);
router.post('/', protect, teacherOnly, validate(createNotificationSchema), createNotification);

export default router;
