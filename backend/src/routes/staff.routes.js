const express = require('express');
const router = express.Router();

const StaffController = require('../controllers/staff.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Doctors
 *   description: Gestión de médicos
 */

/**
 * @swagger
 * /doctors:
 *   post:
 *     summary: Crear un médico
 *     tags: [Doctors]
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
 *               password:
 *                 type: string
 *               documento:
 *                 type: string
 *               id_zona:
 *                 type: integer
 *               numero_licencia:
 *                 type: string
 *               id_especialidad:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Médico creado
 *       400:
 *         description: Error en datos
 */
router.post('/doctors', verifyToken, authorizeRoles('admin', 'recepcionista'), StaffController.createDoctor);

/**
 * @swagger
 * /doctors:
 *   get:
 *     summary: Listar médicos
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de médicos
 */
router.get('/doctors', verifyToken, StaffController.getDoctors);

module.exports = router;