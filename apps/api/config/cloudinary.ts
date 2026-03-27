import { v2 as cloudinary } from 'cloudinary';

const getCloudinaryEnv = () => ({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
});

export const isCloudinaryConfigured = (): boolean => {
    const { cloudName, apiKey, apiSecret } = getCloudinaryEnv();
    return Boolean(cloudName && apiKey && apiSecret);
};

const configureCloudinary = (): boolean => {
    const { cloudName, apiKey, apiSecret } = getCloudinaryEnv();
    if (!cloudName || !apiKey || !apiSecret) return false;

    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
    });

    return true;
};

export const uploadProfileImage = async (fileBuffer: Buffer, userId: string, mimeType?: string): Promise<string> => {
    if (!configureCloudinary()) {
        throw new Error('Cloudinary is not configured.');
    }

    const dataUri = `data:${mimeType || 'image/jpeg'};base64,${fileBuffer.toString('base64')}`;

    const result = await cloudinary.uploader.upload(dataUri, {
        folder: 'syntaxerror/profiles',
        public_id: `user-${userId}-${Date.now()}`,
        overwrite: true,
        resource_type: 'image',
        transformation: [
            { width: 600, height: 600, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' },
        ],
    });

    return result.secure_url;
};

export const uploadEventFlyerImage = async (fileBuffer: Buffer, ownerId: string, mimeType?: string): Promise<string> => {
    if (!configureCloudinary()) {
        throw new Error('Cloudinary is not configured.');
    }

    const dataUri = `data:${mimeType || 'image/jpeg'};base64,${fileBuffer.toString('base64')}`;

    const result = await cloudinary.uploader.upload(dataUri, {
        folder: 'syntaxerror/events',
        public_id: `event-${ownerId}-${Date.now()}`,
        overwrite: false,
        resource_type: 'image',
        transformation: [
            { width: 1280, height: 1280, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' },
        ],
    });

    return result.secure_url;
};
