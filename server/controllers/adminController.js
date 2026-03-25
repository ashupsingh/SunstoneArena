const User = require('../models/User');
const Department = require('../models/Department');
const Schedule = require('../models/Schedule');
const Notification = require('../models/Notification');

// ── User Management ──

const getAllUsers = async (req, res) => {
    try {
        const { role, department } = req.query;
        const filter = {};
        if (role) filter.role = role;
        if (department) filter.department = department;

        const users = await User.find(filter)
            .select('-password')
            .populate('department', 'name code')
            .sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true }
        ).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ── Dashboard Stats ──

const getDashboardStats = async (req, res) => {
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
        res.status(500).json({ message: error.message });
    }
};

// ── Broadcast Notification ──

const broadcastNotification = async (req, res) => {
    try {
        const { title, message, targetRole, targetDepartment } = req.body;

        const filter = {};
        if (targetRole && targetRole !== 'all') filter.role = targetRole;
        if (targetDepartment) filter.department = targetDepartment;

        const users = await User.find(filter).select('_id');

        const notification = await Notification.create({
            title,
            message,
            type: 'announcement',
            sender: req.user._id,
            targetRole: targetRole || 'all',
            targetDepartment: targetDepartment || undefined,
            recipients: users.map(u => u._id),
        });

        res.status(201).json({ notification, recipientCount: users.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getAllUsers, updateUserRole, deleteUser, getDashboardStats, broadcastNotification };
