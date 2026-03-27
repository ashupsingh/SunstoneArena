import mongoose, { Document, Schema } from 'mongoose';

export interface ILab extends Document {
    name: string;
    building: string;
    floor?: string;
    roomNumber?: string;
    capacity: number;
    department: mongoose.Types.ObjectId;
    equipment: string[];
    isAvailable: boolean;
}

const labSchema = new Schema<ILab>(
    {
        name: { type: String, required: true },
        building: { type: String, required: true },
        floor: { type: String },
        roomNumber: { type: String },
        capacity: { type: Number, required: true },
        department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
        equipment: [{ type: String }],
        isAvailable: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const Lab = mongoose.model<ILab>('Lab', labSchema);
export default Lab;
