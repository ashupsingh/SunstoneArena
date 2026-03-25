const mongoose = require('mongoose');

const foodCourtSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    capacity: { type: Number, required: true },
    cameraId: { type: String, required: false }
}, {
    timestamps: true
});

const FoodCourt = mongoose.model('FoodCourt', foodCourtSchema);
module.exports = FoodCourt;
