import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

type AuthUser = {
    _id: string;
    role: 'student' | 'teacher' | 'superadmin';
    department?: string;
    [key: string]: any;
};

export interface AuthRequest extends Request {
    user?: AuthUser;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
            const dbUser = await User.findById(decoded.id).select('-password').lean();
            if (!dbUser) {
                res.status(401).json({ message: 'User no longer exists' });
                return;
            }

            req.user = {
                ...(dbUser as any),
                _id: String((dbUser as any)._id),
            } as AuthUser;

            next();
            return;
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
            return;
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
        return;
    }
};

export const teacherOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (req.user && (req.user.role === 'teacher' || req.user.role === 'superadmin')) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Teachers only.' });
    }
};

export const superAdminOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (req.user && req.user.role === 'superadmin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. SuperAdmin only.' });
    }
};

export const adminOnly = superAdminOnly;
