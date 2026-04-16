import { Response, NextFunction } from 'express';
import { z } from 'zod';
import User, { PASSWORD_REGEX } from '../models/User';
import Otp from '../models/Otp';
import Department from '../models/Department';
import jwt from 'jsonwebtoken';
import { sendOtpEmail } from '../config/emailService';
import { isCloudinaryConfigured, uploadProfileImage } from '../config/cloudinary';
import { AuthRequest } from '../middleware/authMiddleware';

const MAX_OTP_ATTEMPTS = 5;

const normalizeEmail = (email: string): string => email.trim().toLowerCase();
const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const findUserByEmail = async (email: string) => {
    const normalizedEmail = normalizeEmail(email);
    return await User.findOne({
        email: { $regex: `^${escapeRegex(normalizedEmail)}$`, $options: 'i' },
    });
};

const validateUserPassword = async (user: any, password: string): Promise<boolean> => {
    if (!user) return false;

    if (await user.matchPassword(password)) {
        return true;
    }

    if (typeof user.password === 'string' && user.password === password) {
        user.password = password;
        await user.save();
        return true;
    }

    return false;
};

const generateToken = (id: string): string => {
    return jwt.sign({ id }, process.env.JWT_SECRET as string, { expiresIn: '1d' });
};

const buildAuthResponse = (user: any) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    isApproved: user.isApproved,
    profilePicture: user.profilePicture,
    enrollmentNumber: user.enrollmentNumber,
    token: generateToken(String(user._id)),
});

// Zod schemas
export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export const requestLoginOtpSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export const verifyLoginOtpSchema = z.object({
    email: z.string().email('Invalid email address'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const sendOtpSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(1, 'Name is required'),
    departmentName: z.string().min(1, 'Department is required'),
    role: z.enum(['student', 'teacher']).optional(),
    phoneNumber: z.string().optional(),
    enrollmentNumber: z.string().optional(),
    profilePicture: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export const updateProfileSchema = z.object({
    phoneNumber: z.string().optional(),
    profilePicture: z.string().optional(),
    enrollmentNumber: z.string().optional(),
});

// Step 1: Send OTP
export const sendOtp = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { password, name, departmentName, role, phoneNumber, enrollmentNumber, profilePicture } = req.body;
        const email = normalizeEmail(req.body.email);

        if (!PASSWORD_REGEX.test(password)) {
            res.status(400).json({
                message: 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character',
            });
            return;
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400).json({ message: 'User already exists with this email' });
            return;
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await Otp.deleteMany({ email });

        // Only store whitelisted fields — no mass assignment
        const safeUserData: Record<string, any> = {
            name,
            email,
            // Store raw password in short-lived OTP record. User model hashes on final save.
            password,
            departmentName,
            role: role || 'student',
            phoneNumber,
        };

        if (profilePicture) {
            safeUserData.profilePicture = profilePicture;
        }

        // Whitelist optional fields based on role
        if (role === 'teacher') {
            safeUserData.isApproved = false; // Teachers require admin approval
            if (req.body.employeeId) safeUserData.employeeId = req.body.employeeId;
            if (req.body.designation) safeUserData.designation = req.body.designation;
            if (req.body.specialization) safeUserData.specialization = req.body.specialization;
        } else {
            safeUserData.isApproved = true; // Students are auto-approved
            if (req.body.enrollmentNumber) safeUserData.enrollmentNumber = req.body.enrollmentNumber;
            if (req.body.rollNumber) safeUserData.rollNumber = req.body.rollNumber;
            if (req.body.branchName) safeUserData.branchName = req.body.branchName;
            if (req.body.courseName) safeUserData.courseName = req.body.courseName;
        }

        await Otp.create({ email, otp, userData: safeUserData });

        const emailResult = await sendOtpEmail(email, otp);

        if (!emailResult.delivered) {
            if (process.env.NODE_ENV !== 'production') {
                res.json({
                    message: 'OTP generated. Email delivery is not configured in this environment.',
                    devOtp: otp,
                });
                return;
            }

            res.status(503).json({ message: 'Unable to send OTP email right now. Please try again later.' });
            return;
        }

        res.json({ message: 'OTP sent to your email address' });
    } catch (error) {
        next(error);
    }
};

// Step 2: Verify OTP and create user
export const verifyOtpAndRegister = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const email = normalizeEmail(req.body.email);
        const { otp } = req.body;

        const otpRecord = await Otp.findOne({ email });
        if (!otpRecord) {
            res.status(400).json({ message: 'OTP expired or not found. Please request a new one.' });
            return;
        }

        // Check attempt limit
        if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
            await Otp.deleteMany({ email });
            res.status(429).json({ message: 'Too many OTP attempts. Please request a new code.' });
            return;
        }

        const isMatch = await otpRecord.matchOtp(otp);
        if (!isMatch) {
            otpRecord.attempts += 1;
            await otpRecord.save();
            res.status(400).json({ message: `Invalid OTP. ${MAX_OTP_ATTEMPTS - otpRecord.attempts} attempts remaining.` });
            return;
        }

        const userData = otpRecord.userData;

        // Link to department
        let departmentId: any = null;
        if (userData.departmentName) {
            const dept = await Department.findOne({
                $or: [
                    { name: { $regex: userData.departmentName, $options: 'i' } },
                    { code: { $regex: userData.departmentName, $options: 'i' } },
                ],
            });
            if (dept) departmentId = dept._id;
        }

        const user = await User.create({
            ...userData,
            department: departmentId || undefined,
        }) as any;
        await Otp.deleteMany({ email });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                isApproved: user.isApproved,
                profilePicture: user.profilePicture,
                enrollmentNumber: user.enrollmentNumber,
                token: generateToken(String(user._id)),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        next(error);
    }
};

export const loginUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const email = normalizeEmail(req.body.email);
        const { password } = req.body;
        const user = await findUserByEmail(email);

        if (user && (await validateUserPassword(user, password))) {
            if (user.role === 'teacher' && user.isApproved === false) {
                res.status(403).json({ message: 'Teacher account is pending admin approval.' });
                return;
            }
            res.json(buildAuthResponse(user));
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        next(error);
    }
};

export const requestLoginOtp = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const email = normalizeEmail(req.body.email);
        const { password } = req.body;
        const user = await findUserByEmail(email);

        if (!user || !(await validateUserPassword(user, password))) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }

        if (user.role === 'teacher' && user.isApproved === false) {
            res.status(403).json({ message: 'Teacher account is pending admin approval.' });
            return;
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await Otp.deleteMany({ email });
        await Otp.create({
            email,
            otp,
            userData: {
                loginOtp: true,
                userId: String(user._id),
            },
        });

        const emailResult = await sendOtpEmail(email, otp);

        if (!emailResult.delivered) {
            if (process.env.NODE_ENV !== 'production') {
                res.json({
                    message: 'Login OTP generated. Email delivery is not configured in this environment.',
                    devOtp: otp,
                });
                return;
            }

            // Gracefully fallback to password login if OTP transport is down in production.
            await Otp.deleteMany({ email });
            res.json({
                ...buildAuthResponse(user),
                message: 'OTP delivery is currently unavailable. Signed in with password verification.',
                loginFallback: true,
            });
            return;
        }

        res.json({ message: 'A login OTP has been sent to your email address.' });
    } catch (error) {
        next(error);
    }
};

export const verifyLoginOtp = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const email = normalizeEmail(req.body.email);
        const { otp } = req.body;
        const otpRecord = await Otp.findOne({ email });

        if (!otpRecord || !otpRecord.userData?.loginOtp) {
            res.status(400).json({ message: 'OTP expired or not found. Please request a new login code.' });
            return;
        }

        if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
            await Otp.deleteMany({ email });
            res.status(429).json({ message: 'Too many OTP attempts. Please request a new login code.' });
            return;
        }

        const isMatch = await otpRecord.matchOtp(otp);
        if (!isMatch) {
            otpRecord.attempts += 1;
            await otpRecord.save();
            res.status(400).json({ message: `Invalid OTP. ${MAX_OTP_ATTEMPTS - otpRecord.attempts} attempts remaining.` });
            return;
        }

        const user = await User.findById(otpRecord.userData.userId);
        if (!user) {
            await Otp.deleteMany({ email });
            res.status(404).json({ message: 'User not found.' });
            return;
        }

        if (user.role === 'teacher' && user.isApproved === false) {
            await Otp.deleteMany({ email });
            res.status(403).json({ message: 'Teacher account is pending admin approval.' });
            return;
        }

        await Otp.deleteMany({ email });

        res.json(buildAuthResponse(user));
    } catch (error) {
        next(error);
    }
};

export const getUserProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = await User.findById(req.user!._id).populate('department', 'name code');

        if (user) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                isApproved: user.isApproved,
                isFlagged: user.isFlagged,
                phoneNumber: user.phoneNumber,
                profilePicture: user.profilePicture,
                rollNumber: user.rollNumber,
                enrollmentNumber: user.enrollmentNumber,
                departmentName: user.departmentName,
                branchName: user.branchName,
                courseName: user.courseName,
                employeeId: user.employeeId,
                designation: user.designation,
                specialization: user.specialization,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        next(error);
    }
};

// Forgot Password
export const forgotPassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const email = normalizeEmail(req.body.email);
        const user = await User.findOne({ email });
        if (!user) {
            res.json({ message: 'If an account exists, a reset OTP has been sent.' });
            return;
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await Otp.deleteMany({ email });
        await Otp.create({ email, otp, userData: { resetPassword: true } });
        const emailResult = await sendOtpEmail(email, otp);

        if (!emailResult.delivered) {
            if (process.env.NODE_ENV !== 'production') {
                res.json({
                    message: 'Reset OTP generated. Email delivery is not configured in this environment.',
                    devOtp: otp,
                });
                return;
            }

            res.status(503).json({ message: 'Unable to send reset OTP right now. Please try again later.' });
            return;
        }

        res.json({ message: 'If an account exists, a reset OTP has been sent.' });
    } catch (error) {
        next(error);
    }
};

// Reset Password with OTP
export const resetPassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const email = normalizeEmail(req.body.email);
        const { otp, newPassword } = req.body;

        if (!PASSWORD_REGEX.test(newPassword)) {
            res.status(400).json({
                message: 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character',
            });
            return;
        }

        const otpRecord = await Otp.findOne({ email });
        if (!otpRecord) {
            res.status(400).json({ message: 'OTP expired or not found.' });
            return;
        }

        // Check attempt limit
        if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
            await Otp.deleteMany({ email });
            res.status(429).json({ message: 'Too many OTP attempts. Please request a new code.' });
            return;
        }

        const isMatch = await otpRecord.matchOtp(otp);
        if (!isMatch) {
            otpRecord.attempts += 1;
            await otpRecord.save();
            res.status(400).json({ message: `Invalid OTP. ${MAX_OTP_ATTEMPTS - otpRecord.attempts} attempts remaining.` });
            return;
        }

        const user = await User.findOne({ email });
        if (!user) {
            res.status(404).json({ message: 'User not found.' });
            return;
        }

        user.password = newPassword;
        await user.save();
        await Otp.deleteMany({ email });

        res.json({ message: 'Password reset successfully. You can now log in.' });
    } catch (error) {
        next(error);
    }
};

// Update Profile
export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = await User.findById(req.user!._id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const { phoneNumber, profilePicture, enrollmentNumber } = updateProfileSchema.parse(req.body);

        if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
        if (profilePicture !== undefined) user.profilePicture = profilePicture;
        if (enrollmentNumber !== undefined && user.role === 'student') user.enrollmentNumber = enrollmentNumber;

        await user.save();

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isApproved: user.isApproved,
            isFlagged: user.isFlagged,
            phoneNumber: user.phoneNumber,
            profilePicture: user.profilePicture,
            enrollmentNumber: user.enrollmentNumber,
        });
    } catch (error) {
        next(error);
    }
};

export const uploadProfilePhoto = async (req: AuthRequest & { file?: Express.Multer.File }, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'Please select an image to upload.' });
            return;
        }

        if (!isCloudinaryConfigured()) {
            res.status(503).json({ message: 'Profile image upload is not configured on server.' });
            return;
        }

        const user = await User.findById(req.user!._id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const imageUrl = await uploadProfileImage(req.file.buffer, String(user._id), req.file.mimetype);
        user.profilePicture = imageUrl;
        await user.save();

        res.json({
            message: 'Profile photo uploaded successfully',
            profilePicture: imageUrl,
        });
    } catch (error) {
        next(error);
    }
};
