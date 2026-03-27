import { Router } from 'express';
import { getAllRoutes, createRoute, updateRoute, deleteRoute, createBusRouteSchema } from '../controllers/busController';
import { protect, superAdminOnly } from '../middleware/authMiddleware';
import validate from '../middleware/validate';

const router = Router();

router.get('/', getAllRoutes);
router.post('/', protect, superAdminOnly, validate(createBusRouteSchema), createRoute);
router.put('/:id', protect, superAdminOnly, updateRoute);
router.delete('/:id', protect, superAdminOnly, deleteRoute);

export default router;
