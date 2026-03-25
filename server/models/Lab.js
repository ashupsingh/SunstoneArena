const mongoose = require('mongoose');

const labSchema = new mongoose.Schema({
    name: { type: String, required: true },
    building: { type: String, required: true },
    floor: { type: String },
    roomNumber: { type: String },
    capacity: { type: Number, required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    equipment: [{ type: String }],
    isAvailable: { type: Boolean, default: true },
}, {
    timestamps: true
});

const Lab = mongoose.model('Lab', labSchema);
module.exports = Lab;
