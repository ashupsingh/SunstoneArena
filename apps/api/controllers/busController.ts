import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import BusRoute from '../models/BusRoute';
import { AuthRequest } from '../middleware/authMiddleware';

// Zod schemas
export const createBusRouteSchema = z.object({
    routeName: z.string().min(1, 'Route name is required'),
    busNumber: z.string().optional(),
    driverName: z.string().optional(),
    driverContact: z.string().optional(),
    stops: z.array(z.object({
        name: z.string(),
        arrivalTime: z.string(),
        order: z.number(),
    })).optional(),
    departureTime: z.string().min(1, 'Departure time is required'),
    arrivalTimeCampus: z.string().min(1, 'Arrival time is required'),
    returnDepartureTime: z.string().optional(),
    isActive: z.boolean().optional(),
});

export const getAllRoutes = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const routes = await BusRoute.find({ isActive: true }).sort({ routeName: 1 });
        res.json(routes);
    } catch (error) {
        next(error);
    }
};

export const createRoute = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = createBusRouteSchema.parse(req.body);
        const route = await BusRoute.create(data);
        res.status(201).json(route);
    } catch (error) {
        next(error);
    }
};

export const updateRoute = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const allowed = ['routeName', 'busNumber', 'driverName', 'driverContact', 'stops', 'departureTime', 'arrivalTimeCampus', 'returnDepartureTime', 'isActive'];
        const updates: Record<string, any> = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }
        const route = await BusRoute.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!route) {
            res.status(404).json({ message: 'Route not found' });
            return;
        }
        res.json(route);
    } catch (error) {
        next(error);
    }
};

export const deleteRoute = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        await BusRoute.findByIdAndDelete(req.params.id);
        res.json({ message: 'Route deleted' });
    } catch (error) {
        next(error);
    }
};
