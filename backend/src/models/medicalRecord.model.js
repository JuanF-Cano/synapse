const pool = require('../config/db');

const MedicalRecordModel = {

  // Crear historia clínica
  async createRecord(data, client = pool) {
    const query = `
      INSERT INTO historias_clinicas (id_cita, descripcion_general, observaciones, fecha)
      VALUES ($1, $2, $3, NOW())
      RETURNING *;
    `;

    const values = [
      data.id_cita,
      data.descripcion_general,
      data.observaciones
    ];

    const result = await client.query(query, values);
    return result.rows[0];
  },

  // Obtener por cita
  async getByCita(id_cita) {
    const query = `
      SELECT 
        hc.*,
        u_p.nombre AS paciente,
        u_m.nombre AS medico
      FROM historias_clinicas hc
      JOIN citas c ON hc.id_cita = c.id_cita
      JOIN usuarios u_p ON c.id_paciente = u_p.id_usuario
      JOIN usuarios u_m ON c.id_medico = u_m.id_usuario
      WHERE hc.id_cita = $1;
    `;

    const result = await pool.query(query, [id_cita]);
    return result.rows[0];
  }

};

module.exports = MedicalRecordModel;