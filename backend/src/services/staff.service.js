const StaffModel = require('../models/staff.model');
const UserModel = require('../models/user.model');
const bcrypt = require('bcrypt');

const StaffService = {

  async createDoctor(data) {
    const {
      nombre,
      apellido,
      email,
      password,
      documento,
      id_zona,
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

    // Insertar en personal
    await StaffModel.createStaff(user.id_usuario, id_zona);

    // Insertar en personal_salud
    await StaffModel.createHealthStaff(
      user.id_usuario,
      numero_licencia,
      id_especialidad
    );

    // Asignar rol medico (id 2)
    await UserModel.assignRole(user.id_usuario, 2);

    return user;
  },

  async getDoctors() {
    return await StaffModel.getDoctors();
  }

};

module.exports = StaffService;