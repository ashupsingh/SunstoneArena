const express = require('express');
const router = express.Router();
const { getAllRoutes, createRoute, updateRoute, deleteRoute } = require('../controllers/busController');
const { protect, superAdminOnly } = require('../middleware/authMiddleware');

router.get('/', getAllRoutes); // public
router.post('/', protect, superAdminOnly, createRoute);
router.put('/:id', protect, superAdminOnly, updateRoute);
router.delete('/:id', protect, superAdminOnly, deleteRoute);

module.exports = router;
