const pool = require('../config/db');

const SpecialtyModel = {

  async getAll() {
    const res = await pool.query('SELECT * FROM especialidades ORDER BY id_especialidad');
    return res.rows;
  },

  async getById(id) {
    const res = await pool.query(
      'SELECT * FROM especialidades WHERE id_especialidad = $1',
      [id]
    );
    return res.rows[0];
  },

  async create(data) {
    const { nombre, descripcion } = data;

    const res = await pool.query(
      `INSERT INTO especialidades (nombre, descripcion)
       VALUES ($1, $2)
       RETURNING *`,
      [nombre, descripcion]
    );

    return res.rows[0];
  },

  async update(id, data) {
    const { nombre, descripcion } = data;

    const res = await pool.query(
      `UPDATE especialidades
       SET nombre = $1,
           descripcion = $2
       WHERE id_especialidad = $3
       RETURNING *`,
      [nombre, descripcion, id]
    );

    return res.rows[0];
  },

  async delete(id) {
    await pool.query(
      'DELETE FROM especialidades WHERE id_especialidad = $1',
      [id]
    );
    return true;
  }
};

module.exports = SpecialtyModel;