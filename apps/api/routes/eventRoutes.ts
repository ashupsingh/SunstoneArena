import { Router } from 'express';
import multer from 'multer';
import { approveGlobalVisibility, createEvent, createEventSchema, deleteEvent, getEvents, getMyRegisteredEvents, promotionRequestSchema, registerEvent, requestEventPromotion, requestGlobalVisibility, unregisterEvent, updateEvent, updateEventSchema, uploadEventFlyer } from '../controllers/eventController';
import { protect, superAdminOnly, teacherOnly } from '../middleware/authMiddleware';
import validate from '../middleware/validate';

const router = Router();
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 8 * 1024 * 1024 },
	fileFilter: (_req, file, cb) => {
		if (file.mimetype.startsWith('image/')) cb(null, true);
		else cb(new Error('Only image files are allowed'));
	},
});

router.get('/', protect, getEvents);
router.get('/registered/mine', protect, getMyRegisteredEvents);
router.post('/', protect, teacherOnly, validate(createEventSchema), createEvent);
router.post('/flyer-upload', protect, teacherOnly, upload.single('image'), uploadEventFlyer);
router.post('/:id/register', protect, registerEvent);
router.delete('/:id/register', protect, unregisterEvent);
router.put('/:id', protect, teacherOnly, validate(updateEventSchema), updateEvent);
router.delete('/:id', protect, teacherOnly, deleteEvent);
router.post('/:id/request-global', protect, teacherOnly, requestGlobalVisibility);
router.put('/:id/approve-global', protect, superAdminOnly, approveGlobalVisibility);
router.post('/promotion-request', protect, validate(promotionRequestSchema), requestEventPromotion);

export default router;
