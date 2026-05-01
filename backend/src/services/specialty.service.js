const SpecialtyModel = require('../models/specialty.model');

const SpecialtyService = {

  async getAll() {
    return await SpecialtyModel.getAll();
  },

  async getById(id) {
    const esp = await SpecialtyModel.getById(id);
    if (!esp) {
      throw new Error('Especialidad no encontrada');
    }
    return esp;
  },

  async create(data) {
    if (!data.nombre) {
      throw new Error('El nombre es obligatorio');
    }

    return await SpecialtyModel.create(data);
  },

  async update(id, data) {
    const exists = await SpecialtyModel.getById(id);
    if (!exists) {
      throw new Error('Especialidad no encontrada');
    }

    return await SpecialtyModel.update(id, data);
  },

  async delete(id) {
    const exists = await SpecialtyModel.getById(id);
    if (!exists) {
      throw new Error('Especialidad no encontrada');
    }

    return await SpecialtyModel.delete(id);
  }
};

module.exports = SpecialtyService;