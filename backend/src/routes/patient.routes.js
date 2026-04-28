const express = require('express');
const router = express.Router();

const PatientController = require('../controllers/patient.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Patients
 *   description: Gestión de pacientes
 */

/**
 * @swagger
 * /patients:
 *   post:
 *     summary: Crear paciente
 *     tags: [Patients]
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
 *     responses:
 *       201:
 *         description: Paciente creado
 */
router.post('/patients', verifyToken, authorizeRoles('admin', 'recepcionista'), PatientController.create);

/**
 * @swagger
 * /patients:
 *   get:
 *     summary: Obtener todos los pacientes
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pacientes
 */
router.get('/patients', verifyToken, PatientController.getAll);

/**
 * @swagger
 * /patients/{id}:
 *   get:
 *     summary: Obtener paciente por ID
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paciente encontrado
 *       404:
 *         description: No encontrado
 */
router.get('/patients/:id', verifyToken, PatientController.getById);

/**
 * @swagger
 * /patients/{id}:
 *   delete:
 *     summary: Eliminar paciente
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paciente eliminado
 */
router.delete('/patients/:id', verifyToken, authorizeRoles('admin', 'recepcionista'), PatientController.delete);

module.exports = router;