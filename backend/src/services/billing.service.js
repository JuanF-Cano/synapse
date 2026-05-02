const BillingModel = require('../models/billing.model');
const pool = require('../config/db');

const BillingService = {

  async createFactura(data, client = pool) {
    const { copago, id_cita } = data;

    // verificar cita
    const cita = await client.query(
      'SELECT * FROM citas WHERE id_cita = $1',
      [id_cita]
    );
    if (cita.rows.length === 0) {
      throw new Error('Cita no existe');
    }

    // calcular monto
    const total = await BillingModel.getTotalFromCita(copago || 0, id_cita, client);

    if (total === 0) {
      throw new Error('No hay tratamientos asociados a la cita');
    }

    // estado inicial = pendiente (estado 1)
    return await BillingModel.createFactura({
      id_cita,
      id_estado: 1,
      concepto: 'Servicios médicos',
      monto: total
    }, client);
  },

  async registrarPago(data) {
    const { id_factura, monto } = data;

    if (!Number.isFinite(Number(monto)) || Number(monto) <= 0) {
      throw new Error('Monto inválido');
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // verificar factura
      const factura = await BillingModel.getFacturaResumenById(id_factura, client);
      if (!factura) {
        throw new Error('Factura no existe');
      }

      const saldoPendiente = Number(factura.saldo_pendiente || 0);
      if (Number(monto) > saldoPendiente) {
        throw new Error('El monto no puede superar el saldo pendiente');
      }

      // registrar pago
      const pago = await BillingModel.createPago(data, client);

      const nuevoSaldo = saldoPendiente - Number(monto);

      // actualizar estado (pagada, estado 2)
      await BillingModel.updateEstadoFactura(id_factura, nuevoSaldo === 0 ? 2 : 1, client);

      await client.query('COMMIT');

      return {
        ...pago,
        saldo_pendiente: nuevoSaldo
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async getFacturas() {
    return await BillingModel.getFacturas();
  }

};

module.exports = BillingService;