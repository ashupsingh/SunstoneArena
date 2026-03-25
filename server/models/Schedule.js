const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    type: { type: String, enum: ['class', 'lab'], required: true },
    subject: { type: String, required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    lab: { type: mongoose.Schema.Types.ObjectId, ref: 'Lab' }, // only for type=lab
    room: { type: String }, // for type=class
    dayOfWeek: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], required: true },
    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true },   // "10:00"
    semester: { type: Number },
    section: { type: String },

    // Rescheduling
    isRescheduled: { type: Boolean, default: false },
    rescheduledDate: { type: Date },
    rescheduledStartTime: { type: String },
    rescheduledEndTime: { type: String },
    rescheduledRoom: { type: String },
    rescheduledReason: { type: String },
    isCancelled: { type: Boolean, default: false },
}, {
    timestamps: true
});

const Schedule = mongoose.model('Schedule', scheduleSchema);
module.exports = Schedule;
