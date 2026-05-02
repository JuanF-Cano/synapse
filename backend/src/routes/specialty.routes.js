const express = require('express');
const router = express.Router();

const SpecialtyController = require('../controllers/specialty.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');

// GET (todos los usuarios autenticados pueden verlas)
router.get('/specialty', verifyToken, SpecialtyController.getAll);
router.get('/specialty/:id', verifyToken, SpecialtyController.getById);

// SOLO ADMIN
router.post('/specialty', verifyToken, authorizeRoles('admin'), SpecialtyController.create);
router.put('/specialty/:id', verifyToken, authorizeRoles('admin'), SpecialtyController.update);
router.delete('/specialty/:id', verifyToken, authorizeRoles('admin'), SpecialtyController.delete);

module.exports = router;