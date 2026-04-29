const BillingModel = require('../models/billing.model');
const pool = require('../config/db');

const BillingService = {

  async createFactura(data) {
    const { id_cita } = data;

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
    const total = await BillingModel.getTotalFromCita(id_cita);

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

    const facturaActual = factura.rows[0];

    if (!Number.isFinite(Number(monto)) || Number(monto) <= 0) {
      throw new Error('El monto debe ser mayor a 0');
    }

    // Calcular saldo restante real
    const pagosAcumulados = await pool.query(
      'SELECT COALESCE(SUM(monto), 0) AS total_pagado FROM pagos WHERE id_factura = $1',
      [id_factura]
    );

    const totalPagado = Number(pagosAcumulados.rows[0].total_pagado || 0);
    const montoFactura = Number(facturaActual.monto || 0);
    const saldoRestante = montoFactura - totalPagado;

    if (saldoRestante <= 0) {
      throw new Error('La factura ya está pagada');
    }

    if (Number(monto) > saldoRestante) {
      throw new Error('El pago excede el saldo pendiente');
    }

    // registrar pago
    const pago = await BillingModel.createPago(data);

    // Actualizar estado según saldo
    const pagosDespues = await pool.query(
      'SELECT COALESCE(SUM(monto), 0) AS total_pagado FROM pagos WHERE id_factura = $1',
      [id_factura]
    );
    const totalPagadoDespues = Number(pagosDespues.rows[0].total_pagado || 0);
    const nuevoSaldo = Number(facturaActual.monto || 0) - totalPagadoDespues;

    // estado 2 = pagada, estado 1 = pendiente
    await BillingModel.updateEstadoFactura(id_factura, nuevoSaldo <= 0 ? 2 : 1);

    return pago;
  },

  async getFacturas() {
    return await BillingModel.getFacturas();
  }

};

module.exports = BillingService;