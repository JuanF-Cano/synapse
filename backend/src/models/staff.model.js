const pool = require('../config/db');

const StaffModel = {

  // Insertar en personal
  async createStaff(id_usuario, id_zona) {
    const query = `
      INSERT INTO personal (id_usuario, id_zona)
      VALUES ($1, $2)
      RETURNING *;
    `;
    const result = await pool.query(query, [id_usuario, id_zona]);
    return result.rows[0];
  },

  // Insertar en personal_salud
  async createHealthStaff(id_usuario, numero_licencia, id_especialidad) {
    const query = `
      INSERT INTO personal_salud (id_usuario, numero_licencia, id_especialidad, estado)
      VALUES ($1, $2, $3, true)
      RETURNING *;
    `;
    const result = await pool.query(query, [
      id_usuario,
      numero_licencia,
      id_especialidad
    ]);
    return result.rows[0];
  },

  // Obtener médicos
  async getDoctors() {
    const query = `
      SELECT 
        u.id_usuario,
        u.nombre,
        u.apellido,
        e.nombre AS especialidad,
        z.nombre AS zona
      FROM personal_salud ps
      JOIN usuarios u ON ps.id_usuario = u.id_usuario
      JOIN especialidades e ON ps.id_especialidad = e.id_especialidad
      JOIN personal p ON p.id_usuario = u.id_usuario
      JOIN zonas z ON p.id_zona = z.id_zona;
    `;
    const result = await pool.query(query);
    return result.rows;
  }

};

module.exports = StaffModel;