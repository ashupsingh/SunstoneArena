const express = require('express');
const router = express.Router();
const { getAllDepartments, createDepartment, updateDepartment, toggleHodAvailability, deleteDepartment } = require('../controllers/departmentController');
const { protect, teacherOnly, superAdminOnly } = require('../middleware/authMiddleware');

router.get('/', getAllDepartments); // public
router.post('/', protect, superAdminOnly, createDepartment);
router.put('/:id', protect, superAdminOnly, updateDepartment);
router.put('/:id/hod-toggle', protect, teacherOnly, toggleHodAvailability);
router.delete('/:id', protect, superAdminOnly, deleteDepartment);

module.exports = router;
