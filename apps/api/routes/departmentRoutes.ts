import { Router } from 'express';
import { getAllDepartments, createDepartment, updateDepartment, toggleHodAvailability, deleteDepartment, createDepartmentSchema } from '../controllers/departmentController';
import { protect, teacherOnly, superAdminOnly } from '../middleware/authMiddleware';
import validate from '../middleware/validate';

const router = Router();

router.get('/', getAllDepartments);
router.post('/', protect, superAdminOnly, validate(createDepartmentSchema), createDepartment);
router.put('/:id', protect, superAdminOnly, updateDepartment);
router.put('/:id/hod-toggle', protect, teacherOnly, toggleHodAvailability);
router.delete('/:id', protect, superAdminOnly, deleteDepartment);

export default router;
