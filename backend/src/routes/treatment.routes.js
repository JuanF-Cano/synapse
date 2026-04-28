const express = require('express');
const router = express.Router();

const TreatmentController = require('../controllers/treatment.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// CRUD
router.post('/treatments', verifyToken, TreatmentController.create);
router.get('/treatments', verifyToken, TreatmentController.getAll);

// Asignar tratamiento a cita
router.post('/treatments/assign', verifyToken, TreatmentController.assign);

// Obtener tratamientos por cita
router.get('/treatments/cita/:id_cita', verifyToken, TreatmentController.getByCita);

module.exports = router;