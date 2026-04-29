const MedicalRecordModel = require('../models/medicalRecord.model');
const pool = require('../config/db');

const MedicalRecordService = {

  async createRecord(data) {

    const { id_cita } = data;

    // Verificar que la cita existe
    const cita = await pool.query(
      'SELECT * FROM citas WHERE id_cita = $1',
      [id_cita]
    );

    if (cita.rows.length === 0) {
      throw new Error('La cita no existe');
    }

    // erificar que NO tenga historia ya
    const existing = await pool.query(
      'SELECT * FROM historias_clinicas WHERE id_cita = $1',
      [id_cita]
    );

    if (existing.rows.length > 0) {
      throw new Error('La cita ya tiene historia clínica');
    }

    // (Opcional pero PRO) validar que esté atendida
    if (cita.rows[0].id_estado !== 4) {
      throw new Error('La cita debe estar en estado "atendida"');
    }

    return await MedicalRecordModel.createRecord(data);
  },

  async getByCita(id_cita) {
    const record = await MedicalRecordModel.getByCita(id_cita);

    if (!record) {
      throw new Error('Historia clínica no encontrada');
    }

    return record;
  }

};

module.exports = MedicalRecordService;