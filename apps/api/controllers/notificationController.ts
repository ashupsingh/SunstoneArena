import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import Notification from '../models/Notification';
import User from '../models/User';
import { sendPushToUsers } from '../config/pushService';
import { AuthRequest } from '../middleware/authMiddleware';

// Zod schema
export const createNotificationSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    message: z.string().min(1, 'Message is required'),
    type: z.enum(['schedule_change', 'announcement', 'crowd_alert', 'system']).optional(),
    targetDepartment: z.string().optional(),
    targetRole: z.enum(['student', 'teacher', 'all']).optional(),
    recipients: z.array(z.string()).optional(),
});

export const reactNotificationSchema = z.object({
    reaction: z.enum(['heart', 'thumbsUp']),
});

export const pushTokenSchema = z.object({
    token: z.string().min(10, 'Invalid push token'),
});

// Get my notifications
export const getMyNotifications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const notifications = await Notification.find({
            $or: [
                { recipients: req.user!._id },
                { targetRole: 'all' },
                { targetRole: req.user!.role },
                { targetDepartment: req.user!.department },
            ],
        })
            .populate('sender', 'name role')
            .sort({ createdAt: -1 })
            .limit(50);

        const result = notifications.map((n) => ({
            ...n.toObject(),
            isRead: n.readBy.some((id) => id.toString() === req.user!._id.toString()),
            reactions: {
                heartCount: n.heartBy.length,
                thumbsUpCount: n.thumbsUpBy.length,
                myHeart: n.heartBy.some((id) => id.toString() === req.user!._id.toString()),
                myThumbsUp: n.thumbsUpBy.some((id) => id.toString() === req.user!._id.toString()),
            },
        }));

        res.json(result);
    } catch (error) {
        next(error);
    }
};

// Get unread count — uses countDocuments instead of fetching all documents
export const getUnreadCount = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const count = await Notification.countDocuments({
            $or: [
                { recipients: req.user!._id },
                { targetRole: 'all' },
                { targetRole: req.user!.role },
                { targetDepartment: req.user!.department },
            ],
            readBy: { $ne: req.user!._id },
        });
        res.json({ count });
    } catch (error) {
        next(error);
    }
};

// Mark as read
export const markAsRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) {
            res.status(404).json({ message: 'Notification not found' });
            return;
        }

        const userObjectId = new mongoose.Types.ObjectId(req.user!._id);
        if (!notification.readBy.some((id) => id.toString() === req.user!._id.toString())) {
            notification.readBy.push(userObjectId);
            await notification.save();
        }
        res.json({ message: 'Marked as read' });
    } catch (error) {
        next(error);
    }
};

// Mark all as read
export const markAllRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        await Notification.updateMany(
            {
                $or: [
                    { recipients: req.user!._id },
                    { targetRole: 'all' },
                    { targetRole: req.user!.role },
                    { targetDepartment: req.user!.department },
                ],
                readBy: { $ne: req.user!._id },
            },
            { $addToSet: { readBy: req.user!._id } }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        next(error);
    }
};

// Create notification — uses validated data only
export const createNotification = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = createNotificationSchema.parse(req.body);
        let recipientIds = (data.recipients || []) as string[];

        if (recipientIds.length === 0) {
            const filter: Record<string, any> = {};
            if (data.targetRole && data.targetRole !== 'all') filter.role = data.targetRole;
            if (data.targetDepartment) filter.department = data.targetDepartment;
            const users = await User.find(filter).select('_id');
            recipientIds = users.map((u) => String(u._id));
        }

        const notification = await Notification.create({
            ...data,
            recipients: recipientIds,
            sender: req.user!._id,
        });

        await sendPushToUsers(recipientIds, data.title, data.message, {
            type: notification.type,
            notificationId: String(notification._id),
        });

        res.status(201).json(notification);
    } catch (error) {
        next(error);
    }
};

export const registerPushToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { token } = pushTokenSchema.parse(req.body);

        await User.findByIdAndUpdate(req.user!._id, {
            $addToSet: { expoPushTokens: token },
        });

        res.json({ message: 'Push token registered' });
    } catch (error) {
        next(error);
    }
};

export const unregisterPushToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { token } = pushTokenSchema.parse(req.body);

        await User.findByIdAndUpdate(req.user!._id, {
            $pull: { expoPushTokens: token },
        });

        res.json({ message: 'Push token removed' });
    } catch (error) {
        next(error);
    }
};

export const reactToNotification = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { reaction } = reactNotificationSchema.parse(req.body);
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            res.status(404).json({ message: 'Notification not found' });
            return;
        }

        const userId = req.user!._id;
        const userObjectId = new mongoose.Types.ObjectId(userId);
        const heartIndex = notification.heartBy.findIndex((id) => id.toString() === userId.toString());
        const thumbsIndex = notification.thumbsUpBy.findIndex((id) => id.toString() === userId.toString());

        if (reaction === 'heart') {
            if (heartIndex >= 0) notification.heartBy.splice(heartIndex, 1);
            else notification.heartBy.push(userObjectId);
        }

        if (reaction === 'thumbsUp') {
            if (thumbsIndex >= 0) notification.thumbsUpBy.splice(thumbsIndex, 1);
            else notification.thumbsUpBy.push(userObjectId);
        }

        await notification.save();

        res.json({
            message: 'Reaction updated',
            reactions: {
                heartCount: notification.heartBy.length,
                thumbsUpCount: notification.thumbsUpBy.length,
                myHeart: notification.heartBy.some((id) => id.toString() === userId.toString()),
                myThumbsUp: notification.thumbsUpBy.some((id) => id.toString() === userId.toString()),
            },
        });
    } catch (error) {
        next(error);
    }
};
