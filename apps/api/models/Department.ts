import mongoose, { Document, Schema } from 'mongoose';

export interface IDepartment extends Document {
    name: string;
    code: string;
    faculty: string;
    building?: string;
    floor?: string;
    hodName?: string;
    hodEmail?: string;
    hodAvailable: boolean;
    hodAvailableNote: string;
}

const departmentSchema = new Schema<IDepartment>(
    {
        name: { type: String, required: true, unique: true },
        code: { type: String, required: true, unique: true },
        faculty: { type: String, required: true },
        building: { type: String },
        floor: { type: String },
        hodName: { type: String },
        hodEmail: { type: String },
        hodAvailable: { type: Boolean, default: false },
        hodAvailableNote: { type: String, default: '' },
    },
    { timestamps: true }
);

const Department = mongoose.model<IDepartment>('Department', departmentSchema);
export default Department;
