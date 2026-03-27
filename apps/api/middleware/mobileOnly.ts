import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';

export const mobileOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const platform = String(req.headers['x-client-platform'] || '').toLowerCase();
    if (platform === 'mobile') {
        next();
        return;
    }

    res.status(403).json({
        message: 'Attendance via bluetooth is available only in the mobile app.',
    });
};
