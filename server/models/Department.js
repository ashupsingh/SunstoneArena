const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
    faculty: { type: String, required: true }, // e.g. "Faculty of Engineering & Technology"
    building: { type: String },
    floor: { type: String },
    hodName: { type: String },
    hodEmail: { type: String },
    hodAvailable: { type: Boolean, default: false },
    hodAvailableNote: { type: String, default: '' },
}, {
    timestamps: true
});

const Department = mongoose.model('Department', departmentSchema);
module.exports = Department;
