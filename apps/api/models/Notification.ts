import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
    title: string;
    message: string;
    attachmentUrl?: string;
    type: 'schedule_change' | 'announcement' | 'crowd_alert' | 'system';
    sender?: mongoose.Types.ObjectId;
    targetDepartment?: mongoose.Types.ObjectId;
    targetRole?: 'student' | 'teacher' | 'all';
    recipients: mongoose.Types.ObjectId[];
    readBy: mongoose.Types.ObjectId[];
    relatedSchedule?: mongoose.Types.ObjectId;
    heartBy: mongoose.Types.ObjectId[];
    thumbsUpBy: mongoose.Types.ObjectId[];
}

const notificationSchema = new Schema<INotification>(
    {
        title: { type: String, required: true },
        message: { type: String, required: true },
        attachmentUrl: { type: String, trim: true },
        type: {
            type: String,
            enum: ['schedule_change', 'announcement', 'crowd_alert', 'system'],
            default: 'announcement',
        },
        sender: { type: Schema.Types.ObjectId, ref: 'User' },
        targetDepartment: { type: Schema.Types.ObjectId, ref: 'Department' },
        targetRole: { type: String, enum: ['student', 'teacher', 'all'] },
        recipients: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        relatedSchedule: { type: Schema.Types.ObjectId, ref: 'Schedule' },
        heartBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        thumbsUpBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    },
    { timestamps: true }
);

const Notification = mongoose.model<INotification>('Notification', notificationSchema);
export default Notification;
