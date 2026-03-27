import { Router } from 'express';
import { updateCrowdStatus, getCrowdStatus, getSuggestion } from '../controllers/crowdController';
import { protect, superAdminOnly } from '../middleware/authMiddleware';

const router = Router();

router.post('/update', protect, superAdminOnly, updateCrowdStatus);
router.get('/status', getCrowdStatus);
router.get('/suggestion', getSuggestion);

export default router;
