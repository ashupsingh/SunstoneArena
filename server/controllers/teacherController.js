const User = require('../models/User');
const Department = require('../models/Department');
const Schedule = require('../models/Schedule');
const Notification = require('../models/Notification');

// Get students in teacher's department
const getMyStudents = async (req, res) => {
    try {
        const students = await User.find({
            role: 'student',
            department: req.user.department
        }).select('-password').sort({ name: 1 });
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Teacher sends announcement to their department
const sendAnnouncement = async (req, res) => {
    try {
        const { title, message } = req.body;

        const students = await User.find({
            role: 'student',
            department: req.user.department
        });

        const notification = await Notification.create({
            title,
            message,
            type: 'announcement',
            sender: req.user._id,
            targetDepartment: req.user.department,
            targetRole: 'student',
            recipients: students.map(s => s._id),
        });

        res.status(201).json({ notification, studentsNotified: students.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getMyStudents, sendAnnouncement };
