const TreatmentService = require('../services/treatment.service');

const TreatmentController = {

  async create(req, res) {
    try {
      const treatment = await TreatmentService.createTreatment(req.body);
      res.status(201).json({
        message: 'Tratamiento creado',
        treatment
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async getAll(req, res) {
    try {
      const treatments = await TreatmentService.getAllTreatments();
      res.json(treatments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async assign(req, res) {
    try {
      await TreatmentService.assignToCita(req.body);
      res.json({ message: 'Tratamiento asignado a la cita' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async getByCita(req, res) {
    try {
      const data = await TreatmentService.getByCita(req.params.id_cita);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

};

module.exports = TreatmentController;