import mongoose from 'mongoose';

let isConnected = false;

const connectDB = async (): Promise<void> => {
    if (isConnected) return;

    try {
        const conn = await mongoose.connect(process.env.MONGO_URI as string);
        isConnected = conn.connection.readyState === 1;
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error: any) {
        console.error(`Error: ${error.message}`);
        throw error;
    }
};

export default connectDB;
