const pool = require('../config/db');

const UserModel = {

  // Crear usuario
  async createUser({ nombre, apellido, email, password, documento }) {
    const query = `
      INSERT INTO usuarios (nombre, apellido, email, password, documento)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

    const values = [nombre, apellido, email, password, documento];

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Asignar rol
  async assignRole(id_usuario, id_tipo) {
    const query = `
      INSERT INTO usuario_tipo (id_usuario, id_tipo)
      VALUES ($1, $2);
    `;

    await pool.query(query, [id_usuario, id_tipo]);
  },

  // Buscar usuario por email
  async findByEmail(email) {
    const query = `
      SELECT * FROM usuarios WHERE email = $1;
    `;

    const result = await pool.query(query, [email]);
    return result.rows[0];
  },

  // Obtener rol por id
  async getRoles(id_usuario) {
  const query = `
    SELECT t.nombre
    FROM usuario_tipo ut
    JOIN tipos_usuario t ON ut.id_tipo = t.id_tipo
    WHERE ut.id_usuario = $1;
  `;

    const result = await pool.query(query, [id_usuario]);
    return result.rows;
  }

};

module.exports = UserModel;