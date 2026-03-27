import mongoose, { Document, Schema } from 'mongoose';

export interface IBusRoute extends Document {
    routeName: string;
    busNumber?: string;
    driverName?: string;
    driverContact?: string;
    stops: { name: string; arrivalTime: string; order: number }[];
    departureTime: string;
    arrivalTimeCampus: string;
    returnDepartureTime?: string;
    isActive: boolean;
}

const busRouteSchema = new Schema<IBusRoute>(
    {
        routeName: { type: String, required: true },
        busNumber: { type: String },
        driverName: { type: String },
        driverContact: { type: String },
        stops: [
            {
                name: { type: String, required: true },
                arrivalTime: { type: String, required: true },
                order: { type: Number, required: true },
            },
        ],
        departureTime: { type: String, required: true },
        arrivalTimeCampus: { type: String, required: true },
        returnDepartureTime: { type: String },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const BusRoute = mongoose.model<IBusRoute>('BusRoute', busRouteSchema);
export default BusRoute;
