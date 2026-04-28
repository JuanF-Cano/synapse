const express = require('express');
const router = express.Router();

const PatientController = require('../controllers/patient.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

// Crear paciente (solo admin por ejemplo)
router.post('/patients', verifyToken, isAdmin, PatientController.create);

// Obtener todos
router.get('/patients', verifyToken, PatientController.getAll);

// Obtener uno
router.get('/patients/:id', verifyToken, PatientController.getById);

// Eliminar
router.delete('/patients/:id', verifyToken, isAdmin, PatientController.delete);

module.exports = router;