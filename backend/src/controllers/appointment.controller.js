const AppointmentService = require('../services/appointment.service');

const AppointmentController = {

  async create(req, res) {
    try {
      const appointment = await AppointmentService.createAppointment(req.body);

      res.status(201).json({
        message: 'Cita creada correctamente',
        appointment
      });

    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async getAll(req, res) {
    try {
      const data = await AppointmentService.getAllAppointments();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { id_estado } = req.body;

      const result = await AppointmentService.updateStatus(id, id_estado);

      res.json({
        message: 'Estado actualizado',
        result
      });

    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

};

module.exports = AppointmentController;