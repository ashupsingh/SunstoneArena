const mongoose = require('mongoose');

const crowdStatusSchema = new mongoose.Schema({
    foodCourtId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodCourt', required: true },
    peopleCount: { type: Number, required: true },
    crowdLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'OVERCROWDED'], required: true }
}, {
    timestamps: true
});

const CrowdStatus = mongoose.model('CrowdStatus', crowdStatusSchema);
module.exports = CrowdStatus;
