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

router.get('/users/me', verifyToken, UserController.me);
router.get('/users', verifyToken, authorizeRoles('admin', 'recepcionista'), UserController.list);

router.patch('/users/:id', verifyToken, UserController.update);

router.post('/users/:id/roles', verifyToken, authorizeRoles('admin', 'recepcionista'), UserController.assignRole);
router.delete('/users/:id/roles/:roleId', verifyToken, authorizeRoles('admin', 'recepcionista'), UserController.removeRole);

module.exports = router;