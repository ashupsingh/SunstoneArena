const User = require('../models/User');
const Otp = require('../models/Otp');
const Department = require('../models/Department');
const jwt = require('jsonwebtoken');
const { sendOtpEmail } = require('../config/emailService');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Password strength regex: min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=])[A-Za-z\d@$!%*?&#^()_\-+=]{8,}$/;

// Step 1: Send OTP (works for both student and teacher signup)
const sendOtp = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // Validate password strength
        if (!PASSWORD_REGEX.test(password)) {
            return res.status(400).json({
                message: 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character (@$!%*?&#^()_-+=)'
            });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await Otp.deleteMany({ email });

        // Store all form data with the OTP record
        await Otp.create({
            email,
            otp,
            userData: req.body
        });

        await sendOtpEmail(email, otp);
        res.json({ message: 'OTP sent to your email address' });
    } catch (error) {
        console.error('Send OTP Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Step 2: Verify OTP and create user
const verifyOtpAndRegister = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const otpRecord = await Otp.findOne({ email });
        if (!otpRecord) {
            return res.status(400).json({ message: 'OTP expired or not found. Please request a new one.' });
        }

        const isMatch = await otpRecord.matchOtp(otp);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
        }

        const userData = otpRecord.userData;

        // Try to link to department
        let departmentId = null;
        if (userData.departmentName) {
            const dept = await Department.findOne({
                $or: [
                    { name: { $regex: userData.departmentName, $options: 'i' } },
                    { code: { $regex: userData.departmentName, $options: 'i' } }
                ]
            });
            if (dept) departmentId = dept._id;
        }

        const userPayload = {
            name: userData.name,
            email: userData.email,
            password: userData.password,
            role: userData.role || 'student',
            departmentName: userData.departmentName,
            department: departmentId,
        };

        // Student fields
        if (userData.role !== 'teacher') {
            userPayload.rollNumber = userData.rollNumber;
            userPayload.branchName = userData.branchName;
            userPayload.courseName = userData.courseName;
        }

        // Teacher fields
        if (userData.role === 'teacher') {
            userPayload.employeeId = userData.employeeId;
            userPayload.designation = userData.designation;
            userPayload.specialization = userData.specialization;
        }

        const user = await User.create(userPayload);
        await Otp.deleteMany({ email });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('Verify OTP Error:', error);
        res.status(500).json({ message: error.message });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id).populate('department', 'name code');

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            rollNumber: user.rollNumber,
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
};

// Forgot Password — send OTP
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            // Don't reveal if email exists or not
            return res.json({ message: 'If an account exists, a reset OTP has been sent.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await Otp.deleteMany({ email });
        await Otp.create({ email, otp, userData: { resetPassword: true } });
        await sendOtpEmail(email, otp);
        res.json({ message: 'If an account exists, a reset OTP has been sent.' });
    } catch (error) {
        console.error('Forgot Password Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Reset Password with OTP
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!PASSWORD_REGEX.test(newPassword)) {
            return res.status(400).json({
                message: 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character'
            });
        }

        const otpRecord = await Otp.findOne({ email });
        if (!otpRecord) {
            return res.status(400).json({ message: 'OTP expired or not found.' });
        }

        const isMatch = await otpRecord.matchOtp(otp);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid OTP.' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        user.password = newPassword;
        await user.save();
        await Otp.deleteMany({ email });

        res.json({ message: 'Password reset successfully. You can now log in.' });
    } catch (error) {
        console.error('Reset Password Error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { sendOtp, verifyOtpAndRegister, loginUser, getUserProfile, forgotPassword, resetPassword };
