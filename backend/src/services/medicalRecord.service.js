const MedicalRecordModel = require('../models/medicalRecord.model');
const pool = require('../config/db');
const TreatmentService = require('./treatment.service');

const MedicalRecordService = {

  async createRecord(data) {

    const { id_cita } = data;
    const treatmentIds = [...new Set((data.id_tratamientos || []).map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0))];

    if (treatmentIds.length === 0) {
      throw new Error('Selecciona al menos un tratamiento');
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Verificar que la cita existe
      const cita = await client.query(
        'SELECT * FROM citas WHERE id_cita = $1',
        [id_cita]
      );

      if (cita.rows.length === 0) {
        throw new Error('La cita no existe');
      }

      // erificar que NO tenga historia ya
      const existing = await client.query(
        'SELECT * FROM historias_clinicas WHERE id_cita = $1',
        [id_cita]
      );

      if (existing.rows.length > 0) {
        throw new Error('La cita ya tiene historia clínica');
      }

      // Auto-marcar la cita como 'atendida' para permitir crear la historia
      if (cita.rows[0].id_estado !== 4) {
        await client.query(
          'UPDATE citas SET id_estado = 4 WHERE id_cita = $1',
          [id_cita]
        );
        // reflejar cambio localmente
        cita.rows[0].id_estado = 4;
      }

      const record = await MedicalRecordModel.createRecord(data, client);

      await TreatmentService.assignToCita({
        id_cita,
        id_tratamientos: treatmentIds
      }, client);

      await client.query('COMMIT');

      return record;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async getByCita(id_cita) {
    const record = await MedicalRecordModel.getByCita(id_cita);

    if (!record) {
      throw new Error('Historia clínica no encontrada');
    }

    const treatments = await TreatmentService.getByCita(id_cita);

    return {
      ...record,
      tratamientos: treatments || []
    };
  }

};

module.exports = MedicalRecordService;