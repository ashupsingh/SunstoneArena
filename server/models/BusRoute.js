const mongoose = require('mongoose');

const busRouteSchema = new mongoose.Schema({
    routeName: { type: String, required: true },
    busNumber: { type: String },
    driverName: { type: String },
    driverContact: { type: String },
    stops: [{
        name: { type: String, required: true },
        arrivalTime: { type: String, required: true }, // "07:30"
        order: { type: Number, required: true }
    }],
    departureTime: { type: String, required: true }, // from first stop
    arrivalTimeCampus: { type: String, required: true }, // arrival at campus
    returnDepartureTime: { type: String }, // evening departure from campus
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true
});

const BusRoute = mongoose.model('BusRoute', busRouteSchema);
module.exports = BusRoute;
