const UserService = require('../services/user.service');

const UserController = {

  async register(req, res) {
    try {
      const user = await UserService.registerUser(req.body || {});

      res.status(201).json({
        message: 'Usuario creado correctamente',
        user
      });

    } catch (error) {
      res.status(400).json({
        error: error.message
      });
    }
  },

  async me(req, res) {
    try {
      const userId = Number(req.user?.id);
      const user = await UserService.getCurrentUser(userId);
      res.json({ user });
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  async list(req, res) {
    try {
      const users = await UserService.getUsersWithRoles();
      res.status(200).json({ users });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Assign role to existing user
  async assignRole(req, res) {
    try {
      const { id_usuario, id_tipo, extras } = req.body;

      await UserService.assignRoleToUser(id_usuario, id_tipo, extras);

      res.json({ message: 'Rol asignado correctamente' });

    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async removeRole(req, res) {
    try {
      const { id_usuario, id_tipo } = req.body;

      await UserService.removeRoleFromUser(id_usuario, id_tipo);

      res.json({ message: 'Rol eliminado correctamente' });

    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      const id_usuario = Number(req.params.id);
      console.log('Headers:', req.headers);
      console.log('Body raw:', req.body);
      const updated = await UserService.updatePassword(req.user, id_usuario, req.body);
      res.status(200).json({ message: 'Usuario actualizado', user: updated });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

};

module.exports = UserController;