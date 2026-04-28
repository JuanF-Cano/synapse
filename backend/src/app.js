const express = require('express');
const cors = require('cors');
require("dotenv").config();
const routes = require('./routes');
const testRoutes = require('./routes/test.routes.js');
const userRouter = require('./routes/user.routes.js');
const authRouter = require('./routes/auth.routes.js');
const patientRouter = require('./routes/patient.routes.js');
const staffRouter = require('./routes/staff.routes.js');
const appointmentRouter = require('./routes/appointment.routes.js');
const medicalRecordRouter = require('./routes/medicalRecord.routes.js');
const treatmentRouter = require('./routes/treatment.routes.js');
const billingRouter = require('./routes/billing.routes.js');

const app = express();

// ===== MIDDLEWARES =====

// Permite recibir JSON en requests
app.use(express.json());

// Permite conexiones desde frontend (CORS)
app.use(cors());

// ==== Rutas =====

// Ruta base
app.use('/', routes);

// Negocio
app.use('/api', testRoutes);
app.use('/api', userRouter);
app.use('/api', authRouter);
app.use('/api', patientRouter);
app.use('/api', staffRouter); 
app.use('/api', appointmentRouter); 
app.use('/api', medicalRecordRouter); 
app.use('/api', treatmentRouter); 
app.use('/api', billingRouter); 

// ===== SERVIDOR =====

const PORT = process.env.BACKEND_PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});