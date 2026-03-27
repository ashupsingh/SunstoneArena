import mongoose, { Document, Schema } from 'mongoose';

export interface ICrowdStatus extends Document {
    foodCourtId: mongoose.Types.ObjectId;
    peopleCount: number;
    crowdLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'OVERCROWDED';
}

const crowdStatusSchema = new Schema<ICrowdStatus>(
    {
        foodCourtId: { type: Schema.Types.ObjectId, ref: 'FoodCourt', required: true },
        peopleCount: { type: Number, required: true },
        crowdLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'OVERCROWDED'], required: true },
    },
    { timestamps: true }
);

const CrowdStatus = mongoose.model<ICrowdStatus>('CrowdStatus', crowdStatusSchema);
export default CrowdStatus;
