const express = require('express');
const router = express.Router();

const PatientController = require('../controllers/patient.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');

// Crear paciente (solo admin por ejemplo)
router.post('/patients', verifyToken, authorizeRoles('admin', 'recepcionista'), PatientController.create);

// Obtener todos
router.get('/patients', verifyToken, PatientController.getAll);

// Obtener uno
router.get('/patients/:id', verifyToken, PatientController.getById);

// Eliminar
router.delete('/patients/:id', verifyToken, authorizeRoles('admin', 'recepcionista'), PatientController.delete);

module.exports = router;