const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/report.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');

router.get('/appointments/status', verifyToken, authorizeRoles('admin'), ReportController.appointmentsByStatus);

router.get('/financial', verifyToken, authorizeRoles('admin'), ReportController.financialSummary);

router.get('/appointments/doctor', verifyToken, authorizeRoles('admin'), ReportController.appointmentsByDoctor);

router.get('/appointments/date', verifyToken, authorizeRoles('admin'), ReportController.appointmentsByDate);

module.exports = router;