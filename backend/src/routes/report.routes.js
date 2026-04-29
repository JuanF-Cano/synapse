const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/report.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Informes y resúmenes del sistema
 */

/**
 * @swagger
 * /appointments/status:
 *   get:
 *     summary: Obtener el recuento de citas por estado
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos de citas por estado
 *       403:
 *         description: Acceso denegado
 */
router.get('/appointments/status', verifyToken, authorizeRoles('admin'), ReportController.appointmentsByStatus);

/**
 * @swagger
 * /financial:
 *   get:
 *     summary: Obtener resumen financiero
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resumen financiero de facturación y pagos
 *       403:
 *         description: Acceso denegado
 */
router.get('/financial', verifyToken, authorizeRoles('admin'), ReportController.financialSummary);

/**
 * @swagger
 * /appointments/doctor:
 *   get:
 *     summary: Obtener citas agrupadas por médico
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos de citas por médico
 *       403:
 *         description: Acceso denegado
 */
router.get('/appointments/doctor', verifyToken, authorizeRoles('admin'), ReportController.appointmentsByDoctor);

/**
 * @swagger
 * /appointments/date:
 *   get:
 *     summary: Obtener citas agrupadas por fecha
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos de citas por fecha
 *       403:
 *         description: Acceso denegado
 */
router.get('/appointments/date', verifyToken, authorizeRoles('admin'), ReportController.appointmentsByDate);

module.exports = router;