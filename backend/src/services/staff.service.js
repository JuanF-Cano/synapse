const StaffModel = require('../models/staff.model');
const AppointmentModel = require('../models/appointment.model');
const UserModel = require('../models/user.model');
const bcrypt = require('bcrypt');

const StaffService = {

  // CREAR STAFF GENERAL (decide tipo)
  async createStaff(data) {

    const {
      nombre,
      apellido,
      email,
      password,
      documento,
      id_zona,
      tipo, // 'medico' | 'recepcionista' | 'admin'
      numero_licencia,
      id_especialidad
    } = data;

    // Encriptar password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const user = await UserModel.createUser({
      nombre,
      apellido,
      email,
      password: hashedPassword,
      documento
    });

    // Insertar en PERSONAL (común a todos)
    await StaffModel.createStaff(user.id_usuario, id_zona);

    // LÓGICA SEGÚN TIPO

    if (tipo === 'medico') {

      if (!numero_licencia || !id_especialidad) {
        throw new Error('Faltan datos del médico');
      }

      await StaffModel.createHealthStaff(
        user.id_usuario,
        numero_licencia,
        id_especialidad
      );

      // rol medico = 2
      await UserModel.assignRole(user.id_usuario, 2);

    } else if (tipo === 'recepcionista' || tipo === 'admin') {

      await StaffModel.createAdministrativeStaff(user.id_usuario);

      // roles según seed
      const roleMap = {
        admin: 1,
        medico: 2,
        recepcionista: 3
      };

      await UserModel.assignRole(user.id_usuario, roleMap[tipo]);

    } else {
      throw new Error('Tipo de personal inválido');
    }

    return user;
  },

  // disponibilidad (la versión pro)
  async getAvailability(date) {
    return await StaffModel.getAvailabilityByDate(date);
  }

};

module.exports = StaffService;