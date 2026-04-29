const BillingModel = require('../models/billing.model');
const pool = require('../config/db');

const BillingService = {

  async createFactura(data) {
    const { copago, id_cita } = data;

    // verificar cita
    const cita = await pool.query(
      'SELECT * FROM citas WHERE id_cita = $1',
      [id_cita]
    );
    if (cita.rows.length === 0) {
      throw new Error('Cita no existe');
    }

    // evitar duplicar factura
    const existing = await pool.query(
      'SELECT * FROM facturas WHERE id_cita = $1',
      [id_cita]
    );
    if (existing.rows.length > 0) {
      throw new Error('La cita ya tiene factura');
    }

    // calcular monto
    const total = await BillingModel.getTotalFromCita(copago, id_cita);

    if (total === 0) {
      throw new Error('No hay tratamientos asociados a la cita');
    }

    // estado inicial = pendiente (estado 1)
    return await BillingModel.createFactura({
      id_cita,
      id_estado: 1,
      concepto: 'Servicios médicos',
      monto: total
    });
  },

  async registrarPago(data) {
    const { id_factura, monto } = data;

    // verificar factura
    const factura = await pool.query(
      'SELECT * FROM facturas WHERE id_factura = $1',
      [id_factura]
    );

    if (factura.rows.length === 0) {
      throw new Error('Factura no existe');
    }

    // registrar pago
    const pago = await BillingModel.createPago(data);

    // actualizar estado (pagada, estado 2)
    await BillingModel.updateEstadoFactura(id_factura, 2);

    return pago;
  },

  async getFacturas() {
    return await BillingModel.getFacturas();
  }

};

module.exports = BillingService;