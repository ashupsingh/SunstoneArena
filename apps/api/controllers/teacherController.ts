import { Response, NextFunction } from 'express';
import { z } from 'zod';
import User from '../models/User';
import Notification from '../models/Notification';
import { sendPushToUsers } from '../config/pushService';
import { broadcastRealtimeSync } from '../config/realtime';
import { AuthRequest } from '../middleware/authMiddleware';

// Zod schema
export const announceSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    message: z.string().min(1, 'Message is required'),
    attachmentUrl: z.string().url('Attachment URL must be valid').optional().or(z.literal('')),
});

export const flagStudentSchema = z.object({
    reason: z.string().min(1, 'Reason is required'),
});

// Get students in teacher's department
export const getMyStudents = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const students = await User.find({
            role: 'student',
            department: req.user!.department,
        })
            .select('-password')
            .sort({ name: 1 });
        res.json(students);
    } catch (error) {
        next(error);
    }
};

// Teacher sends announcement to their department
export const sendAnnouncement = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { title, message, attachmentUrl } = req.body;

        const students = await User.find({
            role: 'student',
            department: req.user!.department,
        });

        const notification = await Notification.create({
            title,
            message,
            attachmentUrl: attachmentUrl || undefined,
            type: 'announcement',
            sender: req.user!._id,
            targetDepartment: req.user!.department as any,
            targetRole: 'student',
            recipients: students.map((s) => s._id),
        });

        await sendPushToUsers(
            students.map((s) => s._id as any),
            title,
            message,
            { type: 'announcement', notificationId: String(notification._id) }
        );

        broadcastRealtimeSync('announcement.updated');

        res.status(201).json({ notification, studentsNotified: students.length });
    } catch (error) {
        next(error);
    }
};

// Teacher flags a student
export const flagStudent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { reason } = req.body;
        const studentId = req.params.id;

        const student = await User.findOne({ _id: studentId, role: 'student', department: req.user!.department });
        if (!student) {
            res.status(404).json({ message: 'Student not found in your department' });
            return;
        }

        student.isFlagged = true;
        student.flagReason = reason;
        await student.save();

        res.json({ message: 'Student has been flagged for admin review', student });
    } catch (error) {
        next(error);
    }
};

