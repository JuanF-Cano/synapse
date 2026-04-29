const pool = require('../config/db');

const ReportService = {

  // Citas por estado
  async getAppointmentsByStatus() {
    const result = await pool.query(`
      SELECT ec.estado, COUNT(*) as total
      FROM citas c
      JOIN estados_cita ec ON c.id_estado = ec.id_estado
      GROUP BY ec.estado
      ORDER BY total DESC
    `);

    return result.rows;
  },

  // Ingresos
  async getFinancialSummary() {
    const result = await pool.query(`
      SELECT 
        SUM(monto) FILTER (WHERE ef.estado = 'pagada') AS total_pagado,
        SUM(monto) FILTER (WHERE ef.estado = 'pendiente') AS total_pendiente,
        SUM(monto) AS total_general
      FROM facturas f
      JOIN estados_factura ef ON f.id_estado = ef.id_estado
    `);

    return result.rows[0];
  },

  // Citas por médico
  async getAppointmentsByDoctor() {
    const result = await pool.query(`
      SELECT 
        u.nombre,
        u.apellido,
        COUNT(c.id_cita) AS total_citas
      FROM personal_salud ps
      JOIN usuarios u ON ps.id_usuario = u.id_usuario
      LEFT JOIN citas c ON c.id_medico = u.id_usuario
      GROUP BY u.id_usuario
      ORDER BY total_citas DESC
    `);

    return result.rows;
  },

  // Citas por fecha
  async getAppointmentsByDate() {
    const result = await pool.query(`
      SELECT 
        DATE(fecha) as fecha,
        COUNT(*) as total
      FROM citas
      GROUP BY DATE(fecha)
      ORDER BY fecha DESC
    `);

    return result.rows;
  }

};

module.exports = ReportService;