const StaffService = require('../services/staff.service');

const StaffController = {

  async createDoctor(req, res) {
    try {
      const doctor = await StaffService.createDoctor(req.body);

      res.status(201).json({
        message: 'Médico creado correctamente',
        doctor
      });

    } catch (error) {
      res.status(400).json({
        error: error.message
      });
    }
  },

  async getDoctors(req, res) {
    try {
      const doctors = await StaffService.getDoctors();
      res.json(doctors);
    } catch (error) {
      res.status(500).json({
        error: error.message
      });
    }
  }

};

module.exports = StaffController;