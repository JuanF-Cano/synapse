const PatientService = require('../services/patient.service');

const PatientController = {

  async create(req, res) {
    try {
      const patient = await PatientService.createPatient(req.body);
      res.status(201).json({
        message: 'Paciente creado correctamente',
        patient
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async getAll(req, res) {
    try {
      const patients = await PatientService.getAllPatients();
      res.json(patients);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req, res) {
    try {
      const patient = await PatientService.getPatientById(req.params.id);
      res.json(patient);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  async delete(req, res) {
    try {
      await PatientService.deletePatient(req.params.id);
      res.json({ message: 'Paciente eliminado' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

};

module.exports = PatientController;