const StaffService = require('../services/staff.service');

const StaffController = {

  async create(req, res) {
    try {
      const staff = await StaffService.createStaff(req.body);

      res.status(201).json({
        message: 'Personal creado correctamente',
        staff
      });

    } catch (error) {
      res.status(400).json({
        error: error.message
      });
    }
  },

  async getAvailability(req, res) {
    try {
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({
          error: 'Fecha requerida'
        });
      }

      const data = await StaffService.getAvailability(date);
      res.json(data);

    } catch (error) {
      res.status(500).json({
        error: error.message
      });
    }
  }

};

module.exports = StaffController;