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
 *             required:
 *               - nombre
 *               - email
 *               - password
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Juan"
 *               apellido:
 *                 type: string
 *                 example: "Pérez"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "juan.perez@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *               documento:
 *                 type: string
 *                 example: "12345678"
 *               roles:
 *                 type: array
 *                 items:
 *                   type: integer
 *                   example: 1
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 */
router.post('/users', UserController.register);

router.get('/users/me', verifyToken, UserController.me);
router.get('/users', verifyToken, authorizeRoles('admin', 'recepcionista'), UserController.list);

router.patch('/users/:id', verifyToken, UserController.update);

router.post('/users/:id/roles', verifyToken, authorizeRoles('admin', 'recepcionista'), UserController.assignRole);
router.delete('/users/:id/roles/:roleId', verifyToken, authorizeRoles('admin', 'recepcionista'), UserController.removeRole);

module.exports = router;