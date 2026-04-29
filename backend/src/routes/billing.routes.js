const express = require('express');
const router = express.Router();

const BillingController = require('../controllers/billing.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Billing
 *   description: Facturación y pagos
 */

/**
 * @swagger
 * /facturas:
 *   post:
 *     summary: Generar factura desde una cita
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               copago:
 *                 type: integer
 *               id_cita:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Factura generada
 */
router.post('/facturas', verifyToken, BillingController.createFactura);

/**
 * @swagger
 * /pagos:
 *   post:
 *     summary: Registrar pago de factura
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_factura:
 *                 type: integer
 *               monto:
 *                 type: number
 *               metodo_pago:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pago registrado
 */
router.post('/pagos', verifyToken, BillingController.registrarPago);

/**
 * @swagger
 * /facturas:
 *   get:
 *     summary: Obtener facturas
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de facturas
 */
router.get('/facturas', verifyToken, BillingController.getFacturas);

module.exports = router;