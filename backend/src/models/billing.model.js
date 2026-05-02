const pool = require('../config/db');

function buildFacturaSummaryQuery(whereClause = '') {
  return `
      SELECT
        f.id_factura,
        f.id_cita,
        f.id_estado,
        ef.estado,
        f.concepto,
        f.monto,
        f.created_at,
        COALESCE(SUM(p.monto), 0) AS total_pagado,
        GREATEST(f.monto - COALESCE(SUM(p.monto), 0), 0) AS saldo_pendiente
      FROM facturas f
      JOIN estados_factura ef ON f.id_estado = ef.id_estado
      LEFT JOIN pagos p ON p.id_factura = f.id_factura
      ${whereClause}
      GROUP BY f.id_factura, ef.estado
      ORDER BY f.created_at DESC;
    `;
}

const BillingModel = {

  // Crear factura
  async createFactura(data, client = pool) {
    const existing = await client.query(
      'SELECT id_factura FROM facturas WHERE id_cita = $1',
      [data.id_cita]
    );

    if (existing.rows.length > 0) {
      const result = await client.query(
        `UPDATE facturas
         SET id_estado = $1,
             concepto = $2,
             monto = $3
         WHERE id_cita = $4
         RETURNING *;`,
        [data.id_estado, data.concepto, data.monto, data.id_cita]
      );

      return result.rows[0];
    }

    const result = await client.query(
      `INSERT INTO facturas (id_cita, id_estado, concepto, monto)
       VALUES ($1, $2, $3, $4)
       RETURNING *;`,
      [data.id_cita, data.id_estado, data.concepto, data.monto]
    );

    return result.rows[0];
  },

  // Obtener tratamientos y sumar costo
  async getTotalFromCita(copago, id_cita, client = pool) {
    const query = `
      SELECT COALESCE(SUM(t.costo), 0) + $1 AS total
      FROM tratamientos t
      JOIN tratamientos_cita tc 
        ON t.id_tratamiento = tc.id_tratamiento
      WHERE tc.id_cita = $2;
    `;

    const result = await client.query(query, [copago, id_cita]);
    return result.rows[0].total || 0;
  },

  // Registrar pago
  async createPago(data, client = pool) {
    const query = `
      INSERT INTO pagos (id_factura, monto, metodo_pago)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;

    const result = await client.query(query, [
      data.id_factura,
      data.monto,
      data.metodo_pago
    ]);

    return result.rows[0];
  },

  // Cambiar estado factura
  async updateEstadoFactura(id_factura, id_estado, client = pool) {
    const query = `
      UPDATE facturas
      SET id_estado = $1
      WHERE id_factura = $2
      RETURNING *;
    `;

    const result = await client.query(query, [id_estado, id_factura]);
    return result.rows[0];
  },

  async getFacturaResumenById(id_factura, client = pool) {
    const query = `
      SELECT
        f.id_factura,
        f.id_cita,
        f.id_estado,
        ef.estado,
        f.concepto,
        f.monto,
        f.created_at,
        COALESCE(SUM(p.monto), 0) AS total_pagado,
        GREATEST(f.monto - COALESCE(SUM(p.monto), 0), 0) AS saldo_pendiente
      FROM facturas f
      JOIN estados_factura ef ON f.id_estado = ef.id_estado
      LEFT JOIN pagos p ON p.id_factura = f.id_factura
      WHERE f.id_factura = $1
      GROUP BY f.id_factura, ef.estado;
    `;

    const result = await client.query(query, [id_factura]);
    return result.rows[0] || null;
  },

  // Obtener facturas
  async getFacturas(client = pool) {
    const query = buildFacturaSummaryQuery(`
      LEFT JOIN citas c ON c.id_cita = f.id_cita
      LEFT JOIN pacientes pa ON pa.id_usuario = c.id_paciente
      LEFT JOIN usuarios u_p ON u_p.id_usuario = pa.id_usuario
      LEFT JOIN personal_salud ps ON ps.id_usuario = c.id_medico
      LEFT JOIN usuarios u_m ON u_m.id_usuario = ps.id_usuario
    `);

    const result = await client.query(query);
    return result.rows;
  }

};

module.exports = BillingModel;