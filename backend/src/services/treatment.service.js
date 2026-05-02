const TreatmentModel = require('../models/treatment.model');
const pool = require('../config/db');
const BillingService = require('./billing.service');

const TreatmentService = {

  async createTreatment(data) {
    return await TreatmentModel.createTreatment(data);
  },

  async getAllTreatments() {
    return await TreatmentModel.getAllTreatments();
  },

  async assignToCita(data, client = pool) {
    const { id_cita } = data;
    const rawIds = Array.isArray(data.id_tratamientos)
      ? data.id_tratamientos
      : data.id_tratamiento !== undefined
        ? [data.id_tratamiento]
        : [];

    const treatmentIds = [...new Set(rawIds.map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0))];

    if (treatmentIds.length === 0) {
      throw new Error('Selecciona al menos un tratamiento');
    }

    const ownsTransaction = client === pool;
    const activeClient = ownsTransaction ? await pool.connect() : client;

    try {
      if (ownsTransaction) {
        await activeClient.query('BEGIN');
      }

      // verificar cita
      const cita = await activeClient.query(
        'SELECT * FROM citas WHERE id_cita = $1',
        [id_cita]
      );
      if (cita.rows.length === 0) {
        throw new Error('Cita no existe');
      }

      // verificar tratamiento
      const tratamientos = await activeClient.query(
        'SELECT id_tratamiento FROM tratamientos WHERE id_tratamiento = ANY($1::int[])',
        [treatmentIds]
      );
      if (tratamientos.rows.length !== treatmentIds.length) {
        throw new Error('Tratamiento no existe');
      }

      // evitar duplicados
      const exists = await activeClient.query(
        `SELECT id_tratamiento FROM tratamientos_cita 
         WHERE id_cita = $1 AND id_tratamiento = ANY($2::int[])`,
        [id_cita, treatmentIds]
      );

      if (exists.rows.length > 0) {
        throw new Error('Tratamiento ya asignado a la cita');
      }

      for (const id_tratamiento of treatmentIds) {
        await TreatmentModel.assignToCita(id_cita, id_tratamiento, activeClient);
      }

      await BillingService.createFactura({
        id_cita,
        copago: 0
      }, activeClient);

      if (ownsTransaction) {
        await activeClient.query('COMMIT');
      }

      return {
        id_cita,
        id_tratamientos: treatmentIds
      };
    } catch (error) {
      if (ownsTransaction) {
        await activeClient.query('ROLLBACK');
      }
      throw error;
    } finally {
      if (ownsTransaction) {
        activeClient.release();
      }
    }
  },

  async getByCita(id_cita) {
    return await TreatmentModel.getByCita(id_cita);
  }

};

module.exports = TreatmentService;