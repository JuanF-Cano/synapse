const BillingService = require('../services/billing.service');

const BillingController = {

  async createFactura(req, res) {
    try {
      const factura = await BillingService.createFactura(req.body);

      res.status(201).json({
        message: 'Factura generada',
        factura
      });

    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async registrarPago(req, res) {
    try {
      const pago = await BillingService.registrarPago(req.body);

      res.json({
        message: 'Pago registrado',
        pago
      });

    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async getFacturas(req, res) {
    try {
      const data = await BillingService.getFacturas();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

};

module.exports = BillingController;