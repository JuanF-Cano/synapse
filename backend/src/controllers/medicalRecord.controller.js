const MedicalRecordService = require('../services/medicalRecord.service');

const MedicalRecordController = {

  async create(req, res) {
    try {
      const record = await MedicalRecordService.createRecord(req.body);

      res.status(201).json({
        message: 'Historia clínica creada',
        record
      });

    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async getByCita(req, res) {
    try {
      const record = await MedicalRecordService.getByCita(req.params.id_cita);

      res.json(record);

    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

};

module.exports = MedicalRecordController;