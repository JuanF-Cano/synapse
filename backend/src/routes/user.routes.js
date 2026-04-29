const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestión de usuarios
 */

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Crear usuario
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario creado
 */
router.post('/users', UserController.register);

// Usuario autenticado
router.get('/users/me', verifyToken, UserController.me);

// Asignar rol a usuario existente (admin/recepcionista)
router.post('/users/:id/roles', verifyToken, authorizeRoles('admin', 'recepcionista'), UserController.assignRole);

// Actualizar usuario (password siempre permitido; other rules enforced in service)
router.patch('/users/:id', verifyToken, UserController.update);

module.exports = router;