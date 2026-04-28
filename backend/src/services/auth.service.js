const UserModel = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const AuthService = {

  async login(email, password) {

    // Buscar usuario
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Comparar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Contraseña incorrecta');
    }

    // Obtener roles
    const rolesResult = await UserModel.getRoles(user.id_usuario);
    const roles = rolesResult.map(r => r.nombre);

    // Generar token
    const token = jwt.sign(
      {
        id: user.id_usuario,
        email: user.email,
        roles
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return { user, token };
  }

};

module.exports = AuthService;