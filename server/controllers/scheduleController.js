const Schedule = require('../models/Schedule');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendOtpEmail } = require('../config/emailService');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

// Get schedules for a department
const getSchedules = async (req, res) => {
    try {
        const { departmentId, dayOfWeek } = req.query;
        const filter = {};
        if (departmentId) filter.department = departmentId;
        if (dayOfWeek) filter.dayOfWeek = dayOfWeek;

        const schedules = await Schedule.find(filter)
            .populate('teacher', 'name email')
            .populate('department', 'name code')
            .populate('lab', 'name building roomNumber')
            .sort({ startTime: 1 });
        res.json(schedules);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get my schedule (teacher)
const getMySchedule = async (req, res) => {
    try {
        const schedules = await Schedule.find({ teacher: req.user._id })
            .populate('department', 'name code')
            .populate('lab', 'name building roomNumber')
            .sort({ dayOfWeek: 1, startTime: 1 });
        res.json(schedules);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create schedule
const createSchedule = async (req, res) => {
    try {
        const schedule = await Schedule.create(req.body);
        const populated = await schedule.populate([
            { path: 'teacher', select: 'name email' },
            { path: 'department', select: 'name code' }
        ]);
        res.status(201).json(populated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update schedule
const updateSchedule = async (req, res) => {
    try {
        const schedule = await Schedule.findByIdAndUpdate(req.params.id, req.body, { new: true })
            .populate('teacher', 'name email')
            .populate('department', 'name code');
        if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
        res.json(schedule);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Reschedule a class — triggers email + notification
const rescheduleClass = async (req, res) => {
    try {
        const { rescheduledDate, rescheduledStartTime, rescheduledEndTime, rescheduledRoom, rescheduledReason } = req.body;

        const schedule = await Schedule.findById(req.params.id)
            .populate('teacher', 'name email')
            .populate('department', 'name code');

        if (!schedule) return res.status(404).json({ message: 'Schedule not found' });

        schedule.isRescheduled = true;
        schedule.rescheduledDate = rescheduledDate;
        schedule.rescheduledStartTime = rescheduledStartTime || schedule.startTime;
        schedule.rescheduledEndTime = rescheduledEndTime || schedule.endTime;
        schedule.rescheduledRoom = rescheduledRoom || schedule.room;
        schedule.rescheduledReason = rescheduledReason;
        await schedule.save();

        // Find students in this department
        const students = await User.find({
            role: 'student',
            department: schedule.department._id
        });

        // Create notification
        const notification = await Notification.create({
            title: `📅 Class Rescheduled: ${schedule.subject}`,
            message: `${schedule.subject} by ${schedule.teacher.name} has been rescheduled. Reason: ${rescheduledReason}. New time: ${rescheduledStartTime || schedule.startTime} - ${rescheduledEndTime || schedule.endTime} on ${new Date(rescheduledDate).toLocaleDateString()}.`,
            type: 'schedule_change',
            sender: req.user._id,
            targetDepartment: schedule.department._id,
            targetRole: 'student',
            recipients: students.map(s => s._id),
            relatedSchedule: schedule._id,
        });

        // Send emails to students
        const studentEmails = students.map(s => s.email).filter(Boolean);
        if (studentEmails.length > 0) {
            try {
                await transporter.sendMail({
                    from: `"SyntaxError" <${process.env.GMAIL_USER}>`,
                    to: studentEmails.join(','),
                    subject: `📅 Class Rescheduled: ${schedule.subject}`,
                    html: `
                        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0f172a; border-radius: 16px; padding: 40px; color: #e2e8f0;">
                            <h1 style="margin: 0 0 8px; font-size: 20px;"><span style="color: #e2e8f0;">Syntax</span><span style="color: #818cf8;">Error</span></h1>
                            <p style="color: #94a3b8; font-size: 13px; margin: 0 0 24px;">Schedule Change Notification</p>
                            <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px;">
                                <h2 style="color: #f59e0b; font-size: 16px; margin: 0 0 12px;">⚠️ ${schedule.subject} — Rescheduled</h2>
                                <p style="color: #cbd5e1; font-size: 14px; margin: 0 0 8px;"><strong>Teacher:</strong> ${schedule.teacher.name}</p>
                                <p style="color: #cbd5e1; font-size: 14px; margin: 0 0 8px;"><strong>New Date:</strong> ${new Date(rescheduledDate).toLocaleDateString()}</p>
                                <p style="color: #cbd5e1; font-size: 14px; margin: 0 0 8px;"><strong>New Time:</strong> ${rescheduledStartTime || schedule.startTime} - ${rescheduledEndTime || schedule.endTime}</p>
                                ${rescheduledRoom ? `<p style="color: #cbd5e1; font-size: 14px; margin: 0 0 8px;"><strong>Room:</strong> ${rescheduledRoom}</p>` : ''}
                                <p style="color: #cbd5e1; font-size: 14px; margin: 0 0 0;"><strong>Reason:</strong> ${rescheduledReason}</p>
                            </div>
                        </div>
                    `,
                });
            } catch (emailErr) {
                console.error('Email send error:', emailErr);
            }
        }

        res.json({ schedule, notification, emailsSent: studentEmails.length });
    } catch (error) {
        console.error('Reschedule Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Cancel a class
const cancelClass = async (req, res) => {
    try {
        const schedule = await Schedule.findById(req.params.id)
            .populate('teacher', 'name email')
            .populate('department', 'name code');

        if (!schedule) return res.status(404).json({ message: 'Schedule not found' });

        schedule.isCancelled = true;
        schedule.rescheduledReason = req.body.reason || 'Class cancelled';
        await schedule.save();

        const students = await User.find({ role: 'student', department: schedule.department._id });

        await Notification.create({
            title: `❌ Class Cancelled: ${schedule.subject}`,
            message: `${schedule.subject} by ${schedule.teacher.name} on ${schedule.dayOfWeek} has been cancelled. Reason: ${req.body.reason || 'Not specified'}.`,
            type: 'schedule_change',
            sender: req.user._id,
            targetDepartment: schedule.department._id,
            targetRole: 'student',
            recipients: students.map(s => s._id),
            relatedSchedule: schedule._id,
        });

        res.json({ message: 'Class cancelled and students notified', schedule });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete schedule
const deleteSchedule = async (req, res) => {
    try {
        const schedule = await Schedule.findByIdAndDelete(req.params.id);
        if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
        res.json({ message: 'Schedule deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getSchedules, getMySchedule, createSchedule, updateSchedule, rescheduleClass, cancelClass, deleteSchedule };
