import mongoose, { Document, Schema } from 'mongoose';

export interface IFoodCourt extends Document {
    name: string;
    location: string;
    capacity: number;
    cameraId?: string;
}

const foodCourtSchema = new Schema<IFoodCourt>(
    {
        name: { type: String, required: true },
        location: { type: String, required: true },
        capacity: { type: Number, required: true },
        cameraId: { type: String, required: false },
    },
    { timestamps: true }
);

const FoodCourt = mongoose.model<IFoodCourt>('FoodCourt', foodCourtSchema);
export default FoodCourt;
