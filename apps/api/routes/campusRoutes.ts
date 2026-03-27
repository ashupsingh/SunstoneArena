import { Router } from 'express';
import { getCampusMeta } from '../controllers/campusController';

const router = Router();

router.get('/meta', getCampusMeta);

export default router;
