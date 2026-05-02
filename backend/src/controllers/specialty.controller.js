const SpecialtyService = require('../services/specialty.service');

const SpecialtyController = {

  async getAll(req, res) {
    try {
      const data = await SpecialtyService.getAll();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const data = await SpecialtyService.getById(id);
      res.json(data);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  async create(req, res) {
    try {
      const data = await SpecialtyService.create(req.body);
      res.status(201).json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const data = await SpecialtyService.update(id, req.body);
      res.json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      await SpecialtyService.delete(id);
      res.json({ message: 'Especialidad eliminada' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = SpecialtyController;