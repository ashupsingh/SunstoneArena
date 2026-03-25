const Notification = require('../models/Notification');

// Get my notifications
const getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            $or: [
                { recipients: req.user._id },
                { targetRole: 'all' },
                { targetRole: req.user.role },
                { targetDepartment: req.user.department }
            ]
        })
            .populate('sender', 'name role')
            .sort({ createdAt: -1 })
            .limit(50);

        // Add isRead flag for this user
        const result = notifications.map(n => ({
            ...n.toObject(),
            isRead: n.readBy.some(id => id.toString() === req.user._id.toString())
        }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get unread count
const getUnreadCount = async (req, res) => {
    try {
        const notifications = await Notification.find({
            $or: [
                { recipients: req.user._id },
                { targetRole: 'all' },
                { targetRole: req.user.role },
                { targetDepartment: req.user.department }
            ],
            readBy: { $ne: req.user._id }
        });
        res.json({ count: notifications.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Mark as read
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) return res.status(404).json({ message: 'Notification not found' });

        if (!notification.readBy.includes(req.user._id)) {
            notification.readBy.push(req.user._id);
            await notification.save();
        }
        res.json({ message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Mark all as read
const markAllRead = async (req, res) => {
    try {
        await Notification.updateMany(
            {
                $or: [
                    { recipients: req.user._id },
                    { targetRole: 'all' },
                    { targetRole: req.user.role },
                    { targetDepartment: req.user.department }
                ],
                readBy: { $ne: req.user._id }
            },
            { $addToSet: { readBy: req.user._id } }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create notification (for teacher / admin announcements)
const createNotification = async (req, res) => {
    try {
        const notification = await Notification.create({
            ...req.body,
            sender: req.user._id,
        });
        res.status(201).json(notification);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { getMyNotifications, getUnreadCount, markAsRead, markAllRead, createNotification };
