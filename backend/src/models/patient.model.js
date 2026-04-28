const pool = require('../config/db');

const PatientModel = {

  // Crear paciente (solo tabla pacientes)
  async createPatient(id_usuario) {
    const query = `
      INSERT INTO pacientes (id_usuario)
      VALUES ($1)
      RETURNING *;
    `;
    const result = await pool.query(query, [id_usuario]);
    return result.rows[0];
  },

  // Obtener todos los pacientes
  async getAllPatients() {
    const query = `
      SELECT u.id_usuario, u.nombre, u.apellido, u.email, u.documento
      FROM pacientes p
      JOIN usuarios u ON p.id_usuario = u.id_usuario;
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  // Obtener paciente por ID
  async getPatientById(id) {
    const query = `
      SELECT u.id_usuario, u.nombre, u.apellido, u.email, u.documento
      FROM pacientes p
      JOIN usuarios u ON p.id_usuario = u.id_usuario
      WHERE u.id_usuario = $1;
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // Eliminar paciente
  async deletePatient(id) {
    const query = `
      DELETE FROM pacientes
      WHERE id_usuario = $1;
    `;
    await pool.query(query, [id]);
  }

};

module.exports = PatientModel;