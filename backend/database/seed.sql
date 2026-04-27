-- TIPOS DE USUARIO
INSERT INTO tipos_usuario (nombre) VALUES
('admin'),
('medico'),
('recepcionista'),
('paciente');

-- ESTADOS CITA
INSERT INTO estados_cita (estado) VALUES
('pendiente'),
('confirmada'),
('cancelada'),
('atendida');

-- ESTADOS FACTURA
INSERT INTO estados_factura (estado) VALUES
('pendiente'),
('pagada'),
('anulada');

-- ZONAS
INSERT INTO zonas (nombre) VALUES
('Urgencias'),
('Consulta externa'),
('Administración');

-- ESPECIALIDADES
INSERT INTO especialidades (nombre, descripcion) VALUES
('Medicina General', 'Atención primaria'),
('Cardiología', 'Corazón'),
('Pediatría', 'Niños');

-- USUARIO PACIENTE EJEMPLO
INSERT INTO usuarios (nombre, apellido, email, password, documento)
VALUES ('Paciente', 'Pérez', 'paciente@test.com', '123456', '12345678'); -- crear usuario
INSERT INTO pacientes (id_usuario) VALUES (1); -- indexar en pacientes
INSERT INTO usuario_tipo (id_usuario, id_tipo)
SELECT id_usuario, 4
FROM usuarios
WHERE email = 'paciente@test.com'; -- paciente

-- USUARIO ADMIN/MÉDICO EJEMPLO
INSERT INTO usuarios (nombre, apellido, email, password)
VALUES ('Admin', 'Gomez', 'admin@test.com', '123456'); -- crear usuario
INSERT INTO usuario_tipo (id_usuario, id_tipo)
SELECT id_usuario, 1
FROM usuarios
WHERE email = 'admin@test.com'; -- admin
INSERT INTO usuario_tipo (id_usuario, id_tipo)
SELECT id_usuario, 2
FROM usuarios
WHERE email = 'admin@test.com'; -- medico