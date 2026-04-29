const express = require('express');
const router = express.Router();

const StaffController = require('../controllers/staff.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');

// Crear staff (solo admin)
router.post('/staff', verifyToken, authorizeRoles('admin'), StaffController.create);

// disponibilidad médicos
router.get('/doctors/availability', verifyToken, StaffController.getAvailability);

module.exports = router;