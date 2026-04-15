import mongoose from 'mongoose';

let isConnected = false;
let connectionPromise: Promise<void> | null = null;

const connectDB = async (): Promise<void> => {
    if (isConnected || mongoose.connection.readyState === 1) {
        isConnected = true;
        return;
    }

    if (connectionPromise) {
        await connectionPromise;
        return;
    }

    connectionPromise = (async () => {
        try {
            const conn = await mongoose.connect(process.env.MONGO_URI as string);
            isConnected = conn.connection.readyState === 1;
            console.log(`MongoDB Connected: ${conn.connection.host}`);
        } catch (error: any) {
            isConnected = false;
            console.error(`Error: ${error.message}`);
            throw error;
        } finally {
            connectionPromise = null;
        }
    })();

    await connectionPromise;
};

export default connectDB;
