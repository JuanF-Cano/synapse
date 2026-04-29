const express = require('express');
const router = express.Router();

const StaffController = require('../controllers/staff.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Staff
 *   description: Gestión del personal médico y su disponibilidad
 */

/**
 * @swagger
 * /staff:
 *   post:
 *     summary: Crear un nuevo miembro del personal
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               apellido:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               especialidad:
 *                 type: string
 *               roles:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       201:
 *         description: Personal creado correctamente
 *       400:
 *         description: Error en los datos del personal
 */
router.post('/staff', verifyToken, authorizeRoles('admin'), StaffController.create);

/**
 * @swagger
 * /doctors/availability:
 *   get:
 *     summary: Obtener disponibilidad de médicos por fecha
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha para consultar disponibilidad
 *     responses:
 *       200:
 *         description: Disponibilidad de médicos
 *       400:
 *         description: Fecha requerida
 */
router.get('/doctors/availability', verifyToken, StaffController.getAvailability);

module.exports = router;