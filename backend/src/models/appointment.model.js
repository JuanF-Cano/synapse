const pool = require('../config/db');

const AppointmentModel = {

  // Crear cita
  async createAppointment(data) {
    const query = `
      INSERT INTO citas (id_paciente, id_medico, id_estado, fecha, motivo, observaciones)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

    const values = [
      data.id_paciente,
      data.id_medico,
      data.id_estado,
      data.fecha,
      data.motivo,
      data.observaciones
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Obtener todas
  async getAllAppointments() {
    const query = `
      SELECT 
        c.id_cita,
        c.fecha,
        c.motivo,
        ec.estado,
        u_p.nombre AS paciente,
        u_m.nombre AS medico
      FROM citas c
      JOIN estados_cita ec ON c.id_estado = ec.id_estado
      JOIN usuarios u_p ON c.id_paciente = u_p.id_usuario
      JOIN usuarios u_m ON c.id_medico = u_m.id_usuario
      ORDER BY c.fecha;
    `;

    const result = await pool.query(query);
    return result.rows;
  },

  // Cambiar estado
  async updateStatus(id_cita, id_estado) {
    const query = `
      UPDATE citas
      SET id_estado = $1
      WHERE id_cita = $2
      RETURNING *;
    `;

    const result = await pool.query(query, [id_estado, id_cita]);
    return result.rows[0];
  }

};

module.exports = AppointmentModel;