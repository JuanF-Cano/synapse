const express = require('express');
const router = express.Router();

const MedicalRecordController = require('../controllers/medicalRecord.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Crear historia clínica
router.post('/medical-records', verifyToken, MedicalRecordController.create);

// Obtener por cita
router.get('/medical-records/:id_cita', verifyToken, MedicalRecordController.getByCita);

module.exports = router;