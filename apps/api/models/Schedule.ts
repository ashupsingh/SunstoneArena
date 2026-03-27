import mongoose, { Document, Schema } from 'mongoose';

export interface ISchedule extends Document {
    type: 'class' | 'lab';
    subject: string;
    teacher: mongoose.Types.ObjectId;
    department: mongoose.Types.ObjectId;
    lab?: mongoose.Types.ObjectId;
    room?: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    semester?: number;
    section?: string;
    isRescheduled: boolean;
    rescheduledDate?: Date;
    rescheduledStartTime?: string;
    rescheduledEndTime?: string;
    rescheduledRoom?: string;
    rescheduledReason?: string;
    isCancelled: boolean;
}

const scheduleSchema = new Schema<ISchedule>(
    {
        type: { type: String, enum: ['class', 'lab'], required: true },
        subject: { type: String, required: true },
        teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
        lab: { type: Schema.Types.ObjectId, ref: 'Lab' },
        room: { type: String },
        dayOfWeek: {
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            required: true,
        },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        semester: { type: Number },
        section: { type: String },
        isRescheduled: { type: Boolean, default: false },
        rescheduledDate: { type: Date },
        rescheduledStartTime: { type: String },
        rescheduledEndTime: { type: String },
        rescheduledRoom: { type: String },
        rescheduledReason: { type: String },
        isCancelled: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const Schedule = mongoose.model<ISchedule>('Schedule', scheduleSchema);
export default Schedule;
