const UserService = require('../services/user.service');

const UserController = {

  async register(req, res) {
    try {
      const user = await UserService.registerUser(req.body);

      res.status(201).json({
        message: 'Usuario creado correctamente',
        user
      });

    } catch (error) {
      res.status(400).json({
        error: error.message
      });
    }
  }

};

module.exports = UserController;