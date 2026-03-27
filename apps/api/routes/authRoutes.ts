import { Router } from 'express';
import multer from 'multer';
import { sendOtp, verifyOtpAndRegister, loginUser, getUserProfile, updateProfile, forgotPassword, resetPassword, loginSchema, sendOtpSchema, forgotPasswordSchema, resetPasswordSchema, updateProfileSchema, uploadProfilePhoto } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';
import validate from '../middleware/validate';

const router = Router();
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 5 * 1024 * 1024 },
	fileFilter: (_req, file, cb) => {
		if (file.mimetype.startsWith('image/')) cb(null, true);
		else cb(new Error('Only image files are allowed'));
	},
});

router.post('/send-otp', validate(sendOtpSchema), sendOtp);
router.post('/signup', verifyOtpAndRegister);
router.post('/login', validate(loginSchema), loginUser);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.route('/profile').get(protect, getUserProfile).put(protect, validate(updateProfileSchema), updateProfile);
router.post('/profile-photo', protect, upload.single('image'), uploadProfilePhoto);

export default router;
