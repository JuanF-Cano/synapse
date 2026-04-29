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
 *     summary: Crear un usuario nuevo
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
 *                 example: "SecurePassword123"
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
 *       400:
 *         description: Error de validación o datos faltantes
 */
router.post('/users', UserController.register);

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Obtener información del usuario autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario actual
 *       401:
 *         description: No autorizado
 */
router.get('/users/me', verifyToken, UserController.me);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Obtener todos los usuarios con sus roles
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *       403:
 *         description: Acceso denegado
 */
router.get('/users', verifyToken, authorizeRoles('admin', 'recepcionista'), UserController.list);

/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     summary: Actualizar datos de un usuario o contraseña
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *               nombre:
 *                 type: string
 *               apellido:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *       400:
 *         description: Error en la actualización
 */
router.patch('/users/:id', verifyToken, UserController.update);

/**
 * @swagger
 * /users/assign-role:
 *   post:
 *     summary: Asignar un rol a un usuario existente
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_usuario
 *               - id_tipo
 *             properties:
 *               id_usuario:
 *                 type: integer
 *                 example: 1
 *               id_tipo:
 *                 type: integer
 *                 example: 2
 *               extras:
 *                 type: object
 *                 description: Datos adicionales para asignar el rol
 *     responses:
 *       200:
 *         description: Rol asignado correctamente
 *       400:
 *         description: Error en la asignación del rol
 */
router.post('/users/assign-role', verifyToken, authorizeRoles('admin'), UserController.assignRole);

/**
 * @swagger
 * /users/remove-role:
 *   post:
 *     summary: Eliminar un rol de un usuario
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_usuario
 *               - id_tipo
 *             properties:
 *               id_usuario:
 *                 type: integer
 *                 example: 1
 *               id_tipo:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Rol eliminado correctamente
 *       400:
 *         description: Error en la eliminación del rol
 */
router.post('/users/remove-role', verifyToken, authorizeRoles('admin'), UserController.removeRole);

module.exports = router;