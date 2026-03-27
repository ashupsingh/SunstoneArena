import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendanceRecord {
    student: mongoose.Types.ObjectId;
    status: 'present' | 'absent';
    markedAt?: Date;
    source: 'bluetooth_auto' | 'teacher_manual';
    note?: string;
}

export interface IAttendanceSession extends Document {
    schedule: mongoose.Types.ObjectId;
    teacher: mongoose.Types.ObjectId;
    department: mongoose.Types.ObjectId;
    status: 'active' | 'closed';
    bluetoothCode: string;
    bleServiceUuid: string;
    startedAt: Date;
    endedAt?: Date;
    expectedStudents: mongoose.Types.ObjectId[];
    records: IAttendanceRecord[];
}

const attendanceRecordSchema = new Schema<IAttendanceRecord>(
    {
        student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        status: { type: String, enum: ['present', 'absent'], default: 'present' },
        markedAt: { type: Date },
        source: { type: String, enum: ['bluetooth_auto', 'teacher_manual'], required: true },
        note: { type: String },
    },
    { _id: false }
);

const attendanceSessionSchema = new Schema<IAttendanceSession>(
    {
        schedule: { type: Schema.Types.ObjectId, ref: 'Schedule', required: true, index: true },
        teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        department: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
        status: { type: String, enum: ['active', 'closed'], default: 'active', index: true },
        bluetoothCode: { type: String, required: true },
        bleServiceUuid: { type: String, required: true },
        startedAt: { type: Date, default: Date.now },
        endedAt: { type: Date },
        expectedStudents: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        records: [attendanceRecordSchema],
    },
    { timestamps: true }
);

attendanceSessionSchema.index({ schedule: 1, status: 1 });

const AttendanceSession = mongoose.model<IAttendanceSession>('AttendanceSession', attendanceSessionSchema);
export default AttendanceSession;
