const AppointmentModel = require('../models/appointment.model');
const pool = require('../config/db');

const AppointmentService = {

  async createAppointment(data) {

    const { id_paciente, id_medico, fecha } = data;

    // Validar que paciente y médico no sean la misma persona
    if (Number(id_paciente) === Number(id_medico)) {
      throw new Error('El paciente y el médico no pueden ser la misma persona');
    }

    // Validar paciente existe
    const paciente = await pool.query(
      'SELECT * FROM pacientes WHERE id_usuario = $1',
      [id_paciente]
    );
    if (paciente.rows.length === 0) {
      throw new Error('Paciente no existe');
    }

    // Validar médico existe
    const medico = await pool.query(
      'SELECT * FROM personal_salud WHERE id_usuario = $1',
      [id_medico]
    );
    if (medico.rows.length === 0) {
      throw new Error('Médico no existe');
    }

    // Validar fecha futura
    if (new Date(fecha) < new Date()) {
      throw new Error('La cita debe ser en el futuro');
    }

    // Estado inicial = pendiente (id 1)
    data.id_estado = 1;

    return await AppointmentModel.createAppointment(data);
  },

  async getAllAppointments() {
    return await AppointmentModel.getAllAppointments();
  },

  async updateStatus(id, estado) {
    return await AppointmentModel.updateStatus(id, estado);
  }

};

module.exports = AppointmentService;