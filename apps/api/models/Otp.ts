import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IOtp extends Document {
    email: string;
    otp: string;
    userData: Record<string, any>;
    attempts: number;
    createdAt: Date;
    matchOtp(enteredOtp: string): Promise<boolean>;
}

const otpSchema = new Schema<IOtp>({
    email: { type: String, required: true },
    otp: { type: String, required: true },
    userData: { type: Object, required: true },
    attempts: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now, expires: 300 }, // 5 min TTL
});

otpSchema.pre('save', async function () {
    if (!this.isModified('otp')) return;
    const salt = await bcrypt.genSalt(10);
    this.otp = await bcrypt.hash(this.otp, salt);
});

otpSchema.methods.matchOtp = async function (enteredOtp: string): Promise<boolean> {
    return await bcrypt.compare(enteredOtp, this.otp);
};

const Otp = mongoose.model<IOtp>('Otp', otpSchema);
export default Otp;
