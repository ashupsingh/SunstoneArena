import { Request, Response, NextFunction } from 'express';
import CrowdStatus from '../models/CrowdStatus';
import '../models/FoodCourt'; // Required for mongoose populate
import { AuthRequest } from '../middleware/authMiddleware';

export const updateCrowdStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { foodCourtId, peopleCount, crowdLevel } = req.body;

        let status = await CrowdStatus.findOne({ foodCourtId });

        if (status) {
            status.peopleCount = peopleCount;
            status.crowdLevel = crowdLevel;
            await status.save();
        } else {
            status = await CrowdStatus.create({ foodCourtId, peopleCount, crowdLevel });
        }

        res.json(status);
    } catch (error) {
        next(error);
    }
};

export const getCrowdStatus = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const status = await CrowdStatus.find().populate('foodCourtId', 'name location capacity');
        res.json(status);
    } catch (error) {
        next(error);
    }
};

export const getSuggestion = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const altStatus = await CrowdStatus.find({ crowdLevel: { $in: ['LOW', 'MEDIUM'] } })
            .populate('foodCourtId', 'name location')
            .sort({ peopleCount: 1 });

        if (altStatus.length > 0) {
            res.json(altStatus[0]);
        } else {
            res.status(404).json({ message: 'No uncrowded food courts alternative found right now.' });
        }
    } catch (error) {
        next(error);
    }
};
