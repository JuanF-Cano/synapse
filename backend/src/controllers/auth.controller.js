const AuthService = require('../services/auth.service');

const AuthController = {

  async login(req, res) {
    try {
      const { email, password } = req.body;

      const result = await AuthService.login(email, password);

      res.json({
        message: 'Login exitoso',
        ...result
      });

    } catch (error) {
      res.status(401).json({
        error: error.message
      });
    }
  }

};

module.exports = AuthController;