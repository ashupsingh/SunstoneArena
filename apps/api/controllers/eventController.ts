import { Response, NextFunction } from 'express';
import { z } from 'zod';
import Event from '../models/Event';
import Notification from '../models/Notification';
import User from '../models/User';
import { sendPushToUsers } from '../config/pushService';
import { isCloudinaryConfigured, uploadEventFlyerImage } from '../config/cloudinary';
import { broadcastRealtimeSync } from '../config/realtime';
import { AuthRequest } from '../middleware/authMiddleware';

const getDepartmentId = (value: any): any => {
    if (!value) return undefined;
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value._id) return value._id;
    return undefined;
};

export const createEventSchema = z.object({
    title: z.string().min(3, 'Title is required').max(120),
    description: z.string().min(10, 'Description is required').max(2000),
    flyerUrl: z.string().url('Flyer URL must be valid').optional().or(z.literal('')),
    locationName: z.string().min(2, 'Location is required').max(200),
    mapUrl: z.string().url('Map URL must be valid').optional().or(z.literal('')),
    startAt: z.string().min(1, 'Start date/time is required'),
    endAt: z.string().optional(),
    postToAll: z.boolean().optional(),
});

export const promotionRequestSchema = z.object({
    title: z.string().min(3, 'Title is required').max(120),
    message: z.string().min(10, 'Message is required').max(1000),
    requestedDate: z.string().optional(),
    flyerUrl: z.string().url('Flyer URL must be valid').optional().or(z.literal('')),
});

export const updateEventSchema = z.object({
    title: z.string().min(3).max(120).optional(),
    description: z.string().min(10).max(2000).optional(),
    flyerUrl: z.string().url().optional().or(z.literal('')),
    locationName: z.string().min(2).max(200).optional(),
    mapUrl: z.string().url().optional().or(z.literal('')),
    startAt: z.string().optional(),
    endAt: z.string().optional(),
});

export const getEvents = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const isSuperAdmin = req.user?.role === 'superadmin';
        const currentDepartment = getDepartmentId(req.user?.department);

        const baseFilter: Record<string, any> = { isActive: true };
        if (!isSuperAdmin) {
            baseFilter.$or = [
                { visibilityScope: 'all', approvalStatus: 'approved' },
                { visibilityScope: 'department', targetDepartment: currentDepartment },
                { createdBy: req.user!._id },
            ];
        }

        const events = await Event.find(baseFilter)
            .populate('createdBy', 'name role')
            .populate('targetDepartment', 'name code')
            .sort({ startAt: 1 })
            .limit(100);

        const enriched = events.map((e: any) => {
            const isRegistered = e.registrations?.some((r: any) => String(r.user) === String(req.user!._id));
            return {
                ...e.toObject(),
                isRegistered,
            };
        });

        res.json(enriched);
    } catch (error) {
        next(error);
    }
};

export const createEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = createEventSchema.parse(req.body);
        const isSuperAdmin = req.user?.role === 'superadmin';
        const postToAll = Boolean(data.postToAll);

        const visibilityScope: 'department' | 'all' = isSuperAdmin
            ? (postToAll ? 'all' : 'department')
            : (postToAll ? 'all' : 'department');

        const approvalStatus: 'approved' | 'pending' =
            !postToAll || isSuperAdmin ? 'approved' : 'pending';

        const departmentId = getDepartmentId(req.user?.department);

        const event: any = await Event.create({
            title: data.title,
            description: data.description,
            flyerUrl: data.flyerUrl || undefined,
            locationName: data.locationName,
            mapUrl: data.mapUrl || undefined,
            startAt: new Date(data.startAt),
            endAt: data.endAt ? new Date(data.endAt) : undefined,
            createdBy: req.user!._id,
            targetDepartment: departmentId,
            visibilityScope,
            approvalStatus,
        });

        const recipientFilter: Record<string, any> =
            visibilityScope === 'all'
                ? {}
                : { department: departmentId };

        const recipients = await User.find(recipientFilter).select('_id');

        await Notification.create({
            title: `New Event: ${data.title}`,
            message: `${data.description.slice(0, 180)}${data.description.length > 180 ? '...' : ''}`,
            type: 'announcement',
            sender: req.user!._id,
            targetRole: visibilityScope === 'all' ? 'all' : undefined,
            targetDepartment: visibilityScope === 'department' ? departmentId : undefined,
            recipients: recipients.map((u) => u._id),
        });

        if (approvalStatus === 'approved') {
            await sendPushToUsers(
                recipients.map((u) => u._id as any),
                `New Event: ${data.title}`,
                data.locationName,
                { type: 'announcement', eventId: String(event._id) }
            );
        } else {
            const admins = await User.find({ role: 'superadmin' }).select('_id');
            await Notification.create({
                title: `Global Event Approval Needed: ${data.title}`,
                message: `Teacher requested all-department visibility for event: ${data.title}`,
                type: 'system',
                sender: req.user!._id,
                recipients: admins.map((u) => u._id),
                targetRole: 'all',
            });
        }

        broadcastRealtimeSync('event.created');

        res.status(201).json(event);
    } catch (error) {
        next(error);
    }
};

export const updateEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = updateEventSchema.parse(req.body);
        const event = await Event.findById(req.params.id);

        if (!event || !event.isActive) {
            res.status(404).json({ message: 'Event not found' });
            return;
        }

        const isOwner = String(event.createdBy) === String(req.user!._id);
        if (!isOwner && req.user?.role !== 'superadmin') {
            res.status(403).json({ message: 'Only creator or superadmin can edit this event.' });
            return;
        }

        if (data.title !== undefined) event.title = data.title;
        if (data.description !== undefined) event.description = data.description;
        if (data.locationName !== undefined) event.locationName = data.locationName;
        if (data.mapUrl !== undefined) event.mapUrl = data.mapUrl || undefined;
        if (data.flyerUrl !== undefined) event.flyerUrl = data.flyerUrl || undefined;
        if (data.startAt !== undefined) event.startAt = new Date(data.startAt);
        if (data.endAt !== undefined) event.endAt = data.endAt ? new Date(data.endAt) : undefined;

        await event.save();
        broadcastRealtimeSync('event.updated');
        res.json(event);
    } catch (error) {
        next(error);
    }
};

export const deleteEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event || !event.isActive) {
            res.status(404).json({ message: 'Event not found' });
            return;
        }

        const isOwner = String(event.createdBy) === String(req.user!._id);
        if (!isOwner && req.user?.role !== 'superadmin') {
            res.status(403).json({ message: 'Only creator or superadmin can delete this event.' });
            return;
        }

        event.isActive = false;
        await event.save();
        broadcastRealtimeSync('event.deleted');
        res.json({ message: 'Event deleted' });
    } catch (error) {
        next(error);
    }
};

export const requestGlobalVisibility = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event || !event.isActive) {
            res.status(404).json({ message: 'Event not found' });
            return;
        }

        const isOwner = String(event.createdBy) === String(req.user!._id);
        if (!isOwner && req.user?.role !== 'superadmin') {
            res.status(403).json({ message: 'Only creator can request global visibility.' });
            return;
        }

        if (event.visibilityScope === 'all' && event.approvalStatus === 'approved') {
            res.status(400).json({ message: 'Event is already visible to all departments.' });
            return;
        }

        event.visibilityScope = 'all';
        event.approvalStatus = req.user?.role === 'superadmin' ? 'approved' : 'pending';
        await event.save();

        if (req.user?.role !== 'superadmin') {
            const admins = await User.find({ role: 'superadmin' }).select('_id');
            await Notification.create({
                title: `Global Event Approval Needed: ${event.title}`,
                message: `Teacher requested all-department visibility for event: ${event.title}`,
                type: 'system',
                sender: req.user!._id,
                recipients: admins.map((u) => u._id),
                targetRole: 'all',
            });
        }

        broadcastRealtimeSync('event.visibility-requested');

        res.json({ message: req.user?.role === 'superadmin' ? 'Event made global.' : 'Approval request sent to superadmin.', event });
    } catch (error) {
        next(error);
    }
};

export const approveGlobalVisibility = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event || !event.isActive) {
            res.status(404).json({ message: 'Event not found' });
            return;
        }

        event.visibilityScope = 'all';
        event.approvalStatus = 'approved';
        await event.save();

        await Notification.create({
            title: `Global Approval Granted: ${event.title}`,
            message: 'Your event is now visible to all departments.',
            type: 'system',
            sender: req.user!._id,
            recipients: [event.createdBy],
        });

        const allUsers = await User.find({}).select('_id');
        await sendPushToUsers(
            allUsers.map((u) => u._id as any),
            `New Campus Event: ${event.title}`,
            event.locationName,
            { type: 'announcement', eventId: String(event._id) }
        );

        broadcastRealtimeSync('event.approved-global');

        res.json({ message: 'Event approved for all departments.', event });
    } catch (error) {
        next(error);
    }
};

export const registerEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event || !event.isActive) {
            res.status(404).json({ message: 'Event not found' });
            return;
        }

        const alreadyRegistered = event.registrations.some(
            (r) => r.user.toString() === req.user!._id.toString()
        );

        if (alreadyRegistered) {
            res.status(400).json({ message: 'You are already registered for this event' });
            return;
        }

        event.registrations.push({ user: req.user!._id as any, createdAt: new Date() });
        await event.save();

        await Notification.create({
            title: `Registered: ${event.title}`,
            message: `You are successfully registered for ${event.title}.`,
            type: 'system',
            sender: req.user!._id,
            recipients: [req.user!._id as any],
        });

        await Notification.create({
            title: `New Registration: ${event.title}`,
            message: `${req.user?.name || 'A user'} registered for your event.`,
            type: 'system',
            sender: req.user!._id,
            recipients: [event.createdBy as any],
        });

        broadcastRealtimeSync('event.registration-updated');

        res.json({ message: 'Registered successfully', totalRegistrations: event.registrations.length });
    } catch (error) {
        next(error);
    }
};

export const unregisterEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event || !event.isActive) {
            res.status(404).json({ message: 'Event not found' });
            return;
        }

        const before = event.registrations.length;
        event.registrations = event.registrations.filter((r) => String(r.user) !== String(req.user!._id));

        if (event.registrations.length === before) {
            res.status(400).json({ message: 'You are not registered for this event' });
            return;
        }

        await event.save();

        await Notification.create({
            title: `Unregistered: ${event.title}`,
            message: `You have cancelled your registration for ${event.title}.`,
            type: 'system',
            sender: req.user!._id,
            recipients: [req.user!._id as any],
        });

        broadcastRealtimeSync('event.registration-updated');

        res.json({ message: 'Unregistered successfully', totalRegistrations: event.registrations.length });
    } catch (error) {
        next(error);
    }
};

export const getMyRegisteredEvents = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const events = await Event.find({
            isActive: true,
            'registrations.user': req.user!._id,
        })
            .populate('createdBy', 'name role')
            .sort({ startAt: 1 });

        res.json(events);
    } catch (error) {
        next(error);
    }
};

export const requestEventPromotion = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (req.user?.role !== 'student') {
            res.status(403).json({ message: 'Only students can request event promotions.' });
            return;
        }

        const data = promotionRequestSchema.parse(req.body);
        const teachersAndAdmins = await User.find({ role: { $in: ['teacher', 'superadmin'] } }).select('_id');

        const note = await Notification.create({
            title: `Promotion Request: ${data.title}`,
            message: `${data.message}${data.requestedDate ? ` | Requested date: ${data.requestedDate}` : ''}${data.flyerUrl ? ` | Flyer: ${data.flyerUrl}` : ''}`,
            type: 'system',
            sender: req.user!._id,
            targetRole: 'teacher',
            recipients: teachersAndAdmins.map((u) => u._id),
        });

        await sendPushToUsers(
            teachersAndAdmins.map((u) => u._id as any),
            `Promotion Request: ${data.title}`,
            'A student submitted an event promotion request.',
            { type: 'system', notificationId: String(note._id) }
        );

        broadcastRealtimeSync('event.promotion-requested');

        res.status(201).json({ message: 'Promotion request sent to teachers/admin.', requestId: note._id });
    } catch (error) {
        next(error);
    }
};

export const uploadEventFlyer = async (req: AuthRequest & { file?: Express.Multer.File }, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'Please select an image to upload.' });
            return;
        }

        if (!isCloudinaryConfigured()) {
            res.status(503).json({ message: 'Event flyer upload is not configured on server.' });
            return;
        }

        const imageUrl = await uploadEventFlyerImage(req.file.buffer, String(req.user!._id), req.file.mimetype);
        res.json({ message: 'Flyer uploaded successfully', flyerUrl: imageUrl });
    } catch (error) {
        next(error);
    }
};
