const express = require('express');
const router = express.Router();

const EspecialidadController = require('../controllers/specialty.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

// GET (todos pueden ver si están logeados)
router.get('/specialty', authenticate, SpecialtyController.getAll);
router.get('/specialty/:id', authenticate, SpecialtyController.getById);

// SOLO ADMIN
router.post('/specialty', authenticate, authorizeRoles('admin'), SpecialtyController.create);
router.put('/specialty/:id', authenticate, authorizeRoles('admin'), SpecialtyController.update);
router.delete('/specialty/:id', authenticate, authorizeRoles('admin'), SpecialtyController.delete);

module.exports = router;