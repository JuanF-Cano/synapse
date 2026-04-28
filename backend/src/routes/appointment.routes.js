const express = require('express');
const router = express.Router();

const AppointmentController = require('../controllers/appointment.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Appointments
 *   description: Gestión de citas
 */

/**
 * @swagger
 * /appointments:
 *   post:
 *     summary: Crear cita médica
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_paciente:
 *                 type: integer
 *               id_medico:
 *                 type: integer
 *               fecha:
 *                 type: string
 *                 example: 2026-05-01T10:00:00
 *               motivo:
 *                 type: string
 *               observaciones:
 *                 type: string
 *     responses:
 *       201:
 *         description: Cita creada
 */
router.post('/appointments', verifyToken, AppointmentController.create);

/**
 * @swagger
 * /appointments:
 *   get:
 *     summary: Listar citas
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de citas
 */
router.get('/appointments', verifyToken, AppointmentController.getAll);

/**
 * @swagger
 * /appointments/{id}/status:
 *   put:
 *     summary: Cambiar estado de una cita
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_estado:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Estado actualizado
 */
router.put('/appointments/:id/status', verifyToken, AppointmentController.updateStatus);

module.exports = router;