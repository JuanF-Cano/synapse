const express = require('express');
const router = express.Router();

const BillingController = require('../controllers/billing.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// generar factura
router.post('/facturas', verifyToken, BillingController.createFactura);

// registrar pago
router.post('/pagos', verifyToken, BillingController.registrarPago);

// listar facturas
router.get('/facturas', verifyToken, BillingController.getFacturas);

module.exports = router;