const pool = require('../config/db');

const BillingModel = {

  // Crear factura
  async createFactura(data) {
    const query = `
      INSERT INTO facturas (id_cita, id_estado, concepto, monto)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;

    const result = await pool.query(query, [
      data.id_cita,
      data.id_estado,
      data.concepto,
      data.monto
    ]);

    return result.rows[0];
  },

  // Obtener tratamientos y sumar costo
  async getTotalFromCita(id_cita) {
    const query = `
      SELECT SUM(t.costo) as total
      FROM tratamientos t
      JOIN tratamientos_cita tc 
        ON t.id_tratamiento = tc.id_tratamiento
      WHERE tc.id_cita = $1;
    `;

    const result = await pool.query(query, [id_cita]);
    return result.rows[0].total || 0;
  },

  // Registrar pago
  async createPago(data) {
    const query = `
      INSERT INTO pagos (id_factura, monto, metodo_pago)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;

    const result = await pool.query(query, [
      data.id_factura,
      data.monto,
      data.metodo_pago
    ]);

    return result.rows[0];
  },

  // Cambiar estado factura
  async updateEstadoFactura(id_factura, id_estado) {
    const query = `
      UPDATE facturas
      SET id_estado = $1
      WHERE id_factura = $2
      RETURNING *;
    `;

    const result = await pool.query(query, [id_estado, id_factura]);
    return result.rows[0];
  },

  // Obtener facturas
  async getFacturas() {
    const query = `
      SELECT f.*, ef.estado
      FROM facturas f
      JOIN estados_factura ef 
        ON f.id_estado = ef.id_estado;
    `;

    const result = await pool.query(query);
    return result.rows;
  }

};

module.exports = BillingModel;