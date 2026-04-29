// backend/src/controllers/report.controller.js

const ReportService = require('../services/report.service');

const ReportController = {

  async appointmentsByStatus(req, res) {
    try {
      const data = await ReportService.getAppointmentsByStatus();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async financialSummary(req, res) {
    try {
      const data = await ReportService.getFinancialSummary();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async appointmentsByDoctor(req, res) {
    try {
      const data = await ReportService.getAppointmentsByDoctor();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async appointmentsByDate(req, res) {
    try {
      const data = await ReportService.getAppointmentsByDate();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

};

module.exports = ReportController;