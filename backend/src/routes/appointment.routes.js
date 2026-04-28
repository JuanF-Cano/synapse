const express = require('express');
const router = express.Router();

const AppointmentController = require('../controllers/appointment.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Crear cita
router.post('/appointments', verifyToken, AppointmentController.create);

// Listar
router.get('/appointments', verifyToken, AppointmentController.getAll);

// Cambiar estado
router.put('/appointments/:id/status', verifyToken, AppointmentController.updateStatus);

module.exports = router;