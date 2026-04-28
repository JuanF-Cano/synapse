const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');

// Crear usuario
router.post('/users', UserController.register);

module.exports = router;