const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
        type: String,
        enum: ['schedule_change', 'announcement', 'crowd_alert', 'system'],
        default: 'announcement'
    },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // Target audience
    targetDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    targetRole: { type: String, enum: ['student', 'teacher', 'all'] },
    recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    relatedSchedule: { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule' },
}, {
    timestamps: true
});

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
