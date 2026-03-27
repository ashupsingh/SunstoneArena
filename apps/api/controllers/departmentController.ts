import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import Department from '../models/Department';
import { AuthRequest } from '../middleware/authMiddleware';

// Zod schemas
export const createDepartmentSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    code: z.string().min(1, 'Code is required'),
    faculty: z.string().min(1, 'Faculty is required'),
    building: z.string().optional(),
    floor: z.string().optional(),
    hodName: z.string().optional(),
    hodEmail: z.string().email().optional(),
});

export const getAllDepartments = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const departments = await Department.find().sort({ name: 1 });
        res.json(departments);
    } catch (error) {
        next(error);
    }
};

export const createDepartment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = createDepartmentSchema.parse(req.body);
        const dept = await Department.create(data);
        res.status(201).json(dept);
    } catch (error) {
        next(error);
    }
};

export const updateDepartment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const allowed = ['name', 'code', 'faculty', 'building', 'floor', 'hodName', 'hodEmail'];
        const updates: Record<string, any> = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }
        const dept = await Department.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!dept) {
            res.status(404).json({ message: 'Department not found' });
            return;
        }
        res.json(dept);
    } catch (error) {
        next(error);
    }
};

export const toggleHodAvailability = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const dept = await Department.findById(req.params.id);
        if (!dept) {
            res.status(404).json({ message: 'Department not found' });
            return;
        }
        dept.hodAvailable = !dept.hodAvailable;
        if (typeof req.body.note === 'string') dept.hodAvailableNote = req.body.note;
        await dept.save();
        res.json(dept);
    } catch (error) {
        next(error);
    }
};

export const deleteDepartment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        await Department.findByIdAndDelete(req.params.id);
        res.json({ message: 'Department deleted' });
    } catch (error) {
        next(error);
    }
};
