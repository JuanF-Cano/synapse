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
  async assignRole(id_usuario, id_tipo, client = pool) {
    await client.query(
      'INSERT INTO usuario_tipo (id_usuario, id_tipo) VALUES ($1, $2)',
      [id_usuario, id_tipo]
    );
  },

  async removeRole(id_usuario, id_tipo, client = pool) {
    await client.query(
      'DELETE FROM usuario_tipo WHERE id_usuario = $1 AND id_tipo = $2',
      [id_usuario, id_tipo]
    );
  },

  async getRoles(id_usuario, client = pool) {
    const res = await client.query(
      `SELECT tu.id_tipo, t.nombre
       FROM usuario_tipo tu
       JOIN tipos_usuario t ON tu.id_tipo = t.id_tipo
       WHERE tu.id_usuario = $1`,
      [id_usuario]
    );
    return res.rows;
  },

  async countRoles(id_usuario, client = pool) {
    const res = await client.query(
      'SELECT COUNT(*) FROM usuario_tipo WHERE id_usuario = $1',
      [id_usuario]
    );
    return parseInt(res.rows[0].count);
  },

  // Buscar usuario por email
  async findByEmail(email) {
    const query = `
      SELECT * FROM usuarios WHERE email = $1;
    `;

    const result = await pool.query(query, [email]);
    return result.rows[0];
  },

  async findById(id_usuario) {
    const query = 'SELECT * FROM usuarios WHERE id_usuario = $1;';
    const result = await pool.query(query, [id_usuario]);
    return result.rows[0];
  },

  async updateUser(id_usuario, updates) {
    const fields = Object.keys(updates);
    if (fields.length === 0) {
      return this.findById(id_usuario);
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    const values = fields.map((field) => updates[field]);

    const query = `
      UPDATE usuarios
      SET ${setClause}
      WHERE id_usuario = $${fields.length + 1}
      RETURNING *;
    `;

    const result = await pool.query(query, [...values, id_usuario]);
    return result.rows[0];
  },

  async getAllUsers() {
    const query = `
      SELECT u.id_usuario, u.nombre, u.apellido, u.email, u.documento, u.telefono, u.direccion, u.fecha_nacimiento
      FROM usuarios u
      ORDER BY u.id_usuario DESC;
    `;

    const result = await pool.query(query);
    return result.rows;
  }

};

module.exports = UserModel;