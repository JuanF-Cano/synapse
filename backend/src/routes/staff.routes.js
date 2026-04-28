const express = require('express');
const router = express.Router();

const StaffController = require('../controllers/staff.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

// Crear médico (solo admin)
router.post('/doctors', verifyToken, isAdmin, StaffController.createDoctor);

// Listar médicos
router.get('/doctors', verifyToken, StaffController.getDoctors);

module.exports = router;