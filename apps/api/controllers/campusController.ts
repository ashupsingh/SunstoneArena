import { Request, Response, NextFunction } from 'express';
import { campusMeta } from '../config/campusData';

export const getCampusMeta = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        res.json(campusMeta);
    } catch (error) {
        next(error);
    }
};
