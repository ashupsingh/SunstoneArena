import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcrypt';

// Password regex: min 8 chars, at least 1 uppercase, 1 lowercase, 1 number, 1 special char
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=])[A-Za-z\d@$!%*?&#^()_\-+=]{8,}$/;

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: 'student' | 'teacher' | 'superadmin';
    rollNumber?: string;
    enrollmentNumber?: string;
    phoneNumber?: string;
    profilePicture?: string;
    expoPushTokens?: string[];
    isApproved?: boolean;
    isFlagged?: boolean;
    flagReason?: string;
    courseName?: string;
    employeeId?: string;
    designation?: string;
    specialization?: string;
    departmentName: string;
    branchName?: string;
    department?: mongoose.Types.ObjectId;
    matchPassword(enteredPassword: string): Promise<boolean>;
}

interface IUserModel extends Model<IUser> {}

const userSchema = new Schema<IUser>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role: { type: String, enum: ['student', 'teacher', 'superadmin'], default: 'student' },
        phoneNumber: { type: String },
        profilePicture: { type: String },
        expoPushTokens: [{ type: String }],
        isApproved: { type: Boolean, default: true },
        isFlagged: { type: Boolean, default: false },
        flagReason: { type: String },

        // Student-specific
        rollNumber: { type: String },
        enrollmentNumber: { type: String },
        courseName: { type: String },

        // Teacher-specific
        employeeId: { type: String },
        designation: { type: String },
        specialization: { type: String },

        // Common
        departmentName: { type: String, required: true },
        branchName: { type: String },
        department: { type: Schema.Types.ObjectId, ref: 'Department' },
    },
    { timestamps: true }
);

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Removed as it causes TS errors, exported as constant instead
const User = mongoose.model<IUser, IUserModel>('User', userSchema);
export default User;
