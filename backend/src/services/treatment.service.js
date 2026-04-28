const TreatmentModel = require('../models/treatment.model');
const pool = require('../config/db');

const TreatmentService = {

  async createTreatment(data) {
    return await TreatmentModel.createTreatment(data);
  },

  async getAllTreatments() {
    return await TreatmentModel.getAllTreatments();
  },

  async assignToCita(data) {
    const { id_cita, id_tratamiento } = data;

    // verificar cita
    const cita = await pool.query(
      'SELECT * FROM citas WHERE id_cita = $1',
      [id_cita]
    );
    if (cita.rows.length === 0) {
      throw new Error('Cita no existe');
    }

    // verificar tratamiento
    const tratamiento = await pool.query(
      'SELECT * FROM tratamientos WHERE id_tratamiento = $1',
      [id_tratamiento]
    );
    if (tratamiento.rows.length === 0) {
      throw new Error('Tratamiento no existe');
    }

    // evitar duplicados
    const exists = await pool.query(
      `SELECT * FROM tratamientos_cita 
       WHERE id_cita = $1 AND id_tratamiento = $2`,
      [id_cita, id_tratamiento]
    );

    if (exists.rows.length > 0) {
      throw new Error('Tratamiento ya asignado a la cita');
    }

    await TreatmentModel.assignToCita(id_cita, id_tratamiento);
  },

  async getByCita(id_cita) {
    return await TreatmentModel.getByCita(id_cita);
  }

};

module.exports = TreatmentService;