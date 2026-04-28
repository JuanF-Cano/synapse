const express = require('express');
const router = express.Router();

const MedicalRecordController = require('../controllers/medicalRecord.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: MedicalRecords
 *   description: Historias clínicas
 */

/**
 * @swagger
 * /medical-records:
 *   post:
 *     summary: Crear historia clínica
 *     tags: [MedicalRecords]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_cita:
 *                 type: integer
 *               descripcion_general:
 *                 type: string
 *               observaciones:
 *                 type: string
 *     responses:
 *       201:
 *         description: Historia creada
 */
router.post('/medical-records', verifyToken, MedicalRecordController.create);

/**
 * @swagger
 * /medical-records/{id_cita}:
 *   get:
 *     summary: Obtener historia clínica por cita
 *     tags: [MedicalRecords]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_cita
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Historia encontrada
 */
router.get('/medical-records/:id_cita', verifyToken, MedicalRecordController.getByCita);

module.exports = router;