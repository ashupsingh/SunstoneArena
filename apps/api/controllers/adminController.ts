import { Response, NextFunction } from 'express';
import { z } from 'zod';
import User from '../models/User';
import Department from '../models/Department';
import Schedule from '../models/Schedule';
import Notification from '../models/Notification';
import Event from '../models/Event';
import { sendPushToUsers } from '../config/pushService';
import { AuthRequest } from '../middleware/authMiddleware';

// Zod schemas
export const broadcastSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    message: z.string().min(1, 'Message is required'),
    targetRole: z.enum(['student', 'teacher', 'all']).optional(),
    targetDepartment: z.string().optional(),
});

export const updateRoleSchema = z.object({
    role: z.enum(['student', 'teacher', 'superadmin']),
});

// ── User Management ──

export const getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const filter: Record<string, string> = {};
        if (typeof req.query.role === 'string') filter.role = req.query.role;
        if (typeof req.query.department === 'string') filter.department = req.query.department;

        const users = await User.find(filter)
            .select('-password')
            .populate('department', 'name code')
            .sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        next(error);
    }
};

export const updateUserRole = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { role } = updateRoleSchema.parse(req.body);
        const targetUser = await User.findById(req.params.id);
        if (!targetUser) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        if (req.user?._id?.toString() === targetUser._id.toString()) {
            res.status(403).json({ message: 'Superadmin role is fixed for your own account.' });
            return;
        }

        if (targetUser.role === 'superadmin') {
            res.status(403).json({ message: 'Role of a superadmin account cannot be changed.' });
            return;
        }

        targetUser.role = role;
        await targetUser.save();

        const user = targetUser.toObject();
        delete (user as any).password;
        res.json(user);
    } catch (error) {
        next(error);
    }
};

export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json({ message: 'User deleted' });
    } catch (error) {
        next(error);
    }
};

// ── User Management & Approvals ──

export const getPendingTeachers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const pending = await User.find({ role: 'teacher', isApproved: false })
            .select('-password')
            .populate('department', 'name code')
            .sort({ createdAt: -1 });
        res.json(pending);
    } catch (error) {
        next(error);
    }
};

export const approveTeacher = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const teacher = await User.findById(req.params.id);
        if (!teacher || teacher.role !== 'teacher') {
            res.status(404).json({ message: 'Teacher not found' });
            return;
        }

        teacher.isApproved = true;
        await teacher.save();

        res.json({ message: 'Teacher approved successfully', teacher });
    } catch (error) {
        next(error);
    }
};

export const getFlaggedStudents = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const flagged = await User.find({ role: 'student', isFlagged: true })
            .select('-password')
            .populate('department', 'name code')
            .sort({ updatedAt: -1 });
        res.json(flagged);
    } catch (error) {
        next(error);
    }
};

export const getPendingGlobalEvents = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const events = await Event.find({
            isActive: true,
            visibilityScope: 'all',
            approvalStatus: 'pending',
        })
            .populate('createdBy', 'name email role departmentName')
            .populate('targetDepartment', 'name code')
            .sort({ createdAt: -1 });

        res.json(events);
    } catch (error) {
        next(error);
    }
};

// ── Dashboard Stats ──

export const getDashboardStats = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const [students, teachers, departments, schedules, notifications] = await Promise.all([
            User.countDocuments({ role: 'student' }),
            User.countDocuments({ role: 'teacher' }),
            Department.countDocuments(),
            Schedule.countDocuments(),
            Notification.countDocuments(),
        ]);
        res.json({ students, teachers, departments, schedules, notifications });
    } catch (error) {
        next(error);
    }
};

// ── Broadcast Notification ──

export const broadcastNotification = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { title, message, targetRole, targetDepartment } = broadcastSchema.parse(req.body);

        const filter: Record<string, string> = {};
        if (targetRole && targetRole !== 'all') filter.role = targetRole;
        if (targetDepartment) filter.department = targetDepartment;

        const users = await User.find(filter).select('_id');

        const notification = await Notification.create({
            title,
            message,
            type: 'announcement',
            sender: req.user!._id,
            targetRole: targetRole || 'all',
            targetDepartment: targetDepartment || undefined,
            recipients: users.map((u) => u._id),
        });

        await sendPushToUsers(
            users.map((u) => u._id as any),
            title,
            message,
            { type: 'announcement', notificationId: String(notification._id) }
        );

        res.status(201).json({ notification, recipientCount: users.length });
    } catch (error) {
        next(error);
    }
};
