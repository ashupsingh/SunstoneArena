import mongoose, { Document, Schema } from 'mongoose';

export interface IEventRegistration {
    user: mongoose.Types.ObjectId;
    createdAt: Date;
}

export interface IEvent extends Document {
    title: string;
    description: string;
    flyerUrl?: string;
    locationName: string;
    mapUrl?: string;
    startAt: Date;
    endAt?: Date;
    createdBy: mongoose.Types.ObjectId;
    targetDepartment?: mongoose.Types.ObjectId;
    visibilityScope: 'department' | 'all';
    approvalStatus: 'approved' | 'pending';
    registrations: IEventRegistration[];
    isActive: boolean;
}

const eventSchema = new Schema<IEvent>(
    {
        title: { type: String, required: true, trim: true, maxlength: 120 },
        description: { type: String, required: true, trim: true, maxlength: 2000 },
        flyerUrl: { type: String, trim: true },
        locationName: { type: String, required: true, trim: true, maxlength: 200 },
        mapUrl: { type: String, trim: true },
        startAt: { type: Date, required: true },
        endAt: { type: Date },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        targetDepartment: { type: Schema.Types.ObjectId, ref: 'Department' },
        visibilityScope: { type: String, enum: ['department', 'all'], default: 'department' },
        approvalStatus: { type: String, enum: ['approved', 'pending'], default: 'approved' },
        registrations: [
            {
                user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
                createdAt: { type: Date, default: Date.now },
            },
        ],
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

eventSchema.index({ startAt: -1 });
eventSchema.index({ targetDepartment: 1, visibilityScope: 1, approvalStatus: 1, isActive: 1 });

const Event = mongoose.model<IEvent>('Event', eventSchema);
export default Event;
