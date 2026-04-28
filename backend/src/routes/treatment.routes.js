const express = require('express');
const router = express.Router();

const TreatmentController = require('../controllers/treatment.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Treatments
 *   description: Gestión de tratamientos médicos
 */

/**
 * @swagger
 * /treatments:
 *   post:
 *     summary: Crear un tratamiento
 *     tags: [Treatments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               descripcion:
 *                 type: string
 *                 example: Radiografía de tórax
 *               costo:
 *                 type: number
 *                 example: 50000
 *     responses:
 *       201:
 *         description: Tratamiento creado correctamente
 *       400:
 *         description: Error en los datos
 */
router.post('/treatments', verifyToken, TreatmentController.create);

/**
 * @swagger
 * /treatments:
 *   get:
 *     summary: Obtener todos los tratamientos
 *     tags: [Treatments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tratamientos
 */
router.get('/treatments', verifyToken, TreatmentController.getAll);


/**
 * @swagger
 * /treatments/assign:
 *   post:
 *     summary: Asignar un tratamiento a una cita
 *     tags: [Treatments]
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
 *                 example: 1
 *               id_tratamiento:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Tratamiento asignado correctamente
 *       400:
 *         description: Error (cita o tratamiento inválido)
 */
router.post('/treatments/assign', verifyToken, TreatmentController.assign);


/**
 * @swagger
 * /treatments/cita/{id_cita}:
 *   get:
 *     summary: Obtener tratamientos de una cita
 *     tags: [Treatments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_cita
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la cita
 *     responses:
 *       200:
 *         description: Lista de tratamientos asociados a la cita
 *       404:
 *         description: No encontrado
 */
router.get('/treatments/cita/:id_cita', verifyToken, TreatmentController.getByCita);

module.exports = router;