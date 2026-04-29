const PatientModel = require('../models/patient.model');
const UserModel = require('../models/user.model');
const bcrypt = require('bcrypt');


const PatientService = {

  async createPatient(data) {
    const { nombre, apellido, email, password, documento } = data;

    // Crear usuario (reutilizamos lógica)
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await UserModel.createUser({
      nombre,
      apellido,
      email,
      password: hashedPassword,
      documento
    });

    // Insertar en pacientes
    await PatientModel.createPatient(user.id_usuario);

    // Asignar rol paciente (id 4)
    await UserModel.assignRole(user.id_usuario, 4);

    return user;
  },

  async getAllPatients() {
    return await PatientModel.getAllPatients();
  },

  async getPatientById(id) {
    const patient = await PatientModel.getPatientById(id);
    if (!patient) throw new Error('Paciente no encontrado');
    return patient;
  },

  async deletePatient(id) {
    await PatientModel.deletePatient(id);
  }

};

module.exports = PatientService;