const UserModel = require('../models/user.model');
const bcrypt = require('bcrypt');

const UserService = {

  async registerUser(data) {
    const { nombre, apellido, email, password, documento, roles } = data;

    // Validar si ya existe
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      throw new Error('El usuario ya existe');
    }

    const hashedpassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const user = await UserModel.createUser({
      nombre,
      apellido,
      email,
      password: hashedpassword,
      documento
    });

    // Asignar roles
    if (roles && roles.length > 0) {
      for (let role of roles) {
        await UserModel.assignRole(user.id_usuario, role);
      }
    }

    return user;
  }

};

module.exports = UserService;