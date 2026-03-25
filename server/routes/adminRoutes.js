const express = require('express');
const router = express.Router();
const { getAllUsers, updateUserRole, deleteUser, getDashboardStats, broadcastNotification } = require('../controllers/adminController');
const { protect, superAdminOnly } = require('../middleware/authMiddleware');

router.get('/users', protect, superAdminOnly, getAllUsers);
router.put('/users/:id/role', protect, superAdminOnly, updateUserRole);
router.delete('/users/:id', protect, superAdminOnly, deleteUser);
router.get('/stats', protect, superAdminOnly, getDashboardStats);
router.post('/broadcast', protect, superAdminOnly, broadcastNotification);

module.exports = router;
