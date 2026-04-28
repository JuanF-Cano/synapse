const pool = require('../config/db');

const TreatmentModel = {

  // Crear tratamiento
  async createTreatment(data) {
    const query = `
      INSERT INTO tratamientos (descripcion, costo)
      VALUES ($1, $2)
      RETURNING *;
    `;
    const result = await pool.query(query, [
      data.descripcion,
      data.costo
    ]);
    return result.rows[0];
  },

  // Obtener todos
  async getAllTreatments() {
    const result = await pool.query('SELECT * FROM tratamientos');
    return result.rows;
  },

  // Asignar tratamiento a cita
  async assignToCita(id_cita, id_tratamiento) {
    const query = `
      INSERT INTO tratamientos_cita (id_cita, id_tratamiento)
      VALUES ($1, $2);
    `;
    await pool.query(query, [id_cita, id_tratamiento]);
  },

  // Obtener tratamientos de una cita
  async getByCita(id_cita) {
    const query = `
      SELECT t.*
      FROM tratamientos t
      JOIN tratamientos_cita tc 
        ON t.id_tratamiento = tc.id_tratamiento
      WHERE tc.id_cita = $1;
    `;
    const result = await pool.query(query, [id_cita]);
    return result.rows;
  }

};

module.exports = TreatmentModel;