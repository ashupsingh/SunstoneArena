import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const validate = (schema: z.ZodType) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const messages = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`);
            res.status(400).json({ message: 'Validation failed', errors: messages });
            return;
        }
        next();
    };
};

export default validate;
