-- =========================
-- EXTENSIONES (opcional)
-- =========================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================
-- TABLAS BASE
-- =========================

CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    telefono VARCHAR(20),
    fecha_nacimiento DATE,
    direccion TEXT,
    documento VARCHAR(50) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tipos_usuario (
    id_tipo SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE usuario_tipo (
    id_usuario INT,
    id_tipo INT,
    PRIMARY KEY (id_usuario, id_tipo),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_tipo) REFERENCES tipos_usuario(id_tipo) ON DELETE CASCADE
);

-- =========================
-- PACIENTES Y PERSONAL
-- =========================

CREATE TABLE pacientes (
    id_usuario INT PRIMARY KEY,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

CREATE TABLE personal (
    id_usuario INT PRIMARY KEY,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

CREATE TABLE especialidades (
    id_especialidad SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

CREATE TABLE personal_salud (
    id_usuario INT PRIMARY KEY,
    numero_licencia VARCHAR(100) UNIQUE NOT NULL,
    id_especialidad INT,
    estado BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_usuario) REFERENCES personal(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_especialidad) REFERENCES especialidades(id_especialidad)
);

CREATE TABLE personal_administrativo (
    id_usuario INT PRIMARY KEY,
    FOREIGN KEY (id_usuario) REFERENCES personal(id_usuario) ON DELETE CASCADE
);

-- =========================
-- CITAS
-- =========================

CREATE TABLE estados_cita (
    id_estado SERIAL PRIMARY KEY,
    estado VARCHAR(50) NOT NULL
);

CREATE TABLE citas (
    id_cita SERIAL PRIMARY KEY,
    id_paciente INT NOT NULL,
    id_medico INT NOT NULL,
    id_estado INT NOT NULL,
    fecha TIMESTAMP NOT NULL,
    motivo TEXT,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_paciente) REFERENCES pacientes(id_usuario),
    FOREIGN KEY (id_medico) REFERENCES personal_salud(id_usuario),
    FOREIGN KEY (id_estado) REFERENCES estados_cita(id_estado)
);

-- =========================
-- HISTORIA CLINICA
-- =========================

CREATE TABLE historias_clinicas (
    id_historia SERIAL PRIMARY KEY,
    id_cita INT UNIQUE, -- 1:1 con cita
    descripcion_general TEXT,
    observaciones TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_cita) REFERENCES citas(id_cita) ON DELETE CASCADE
);

-- =========================
-- TRATAMIENTOS
-- =========================

CREATE TABLE tratamientos (
    id_tratamiento SERIAL PRIMARY KEY,
    descripcion TEXT NOT NULL,
    costo NUMERIC(10,2) NOT NULL
);

CREATE TABLE tratamientos_cita (
    id_cita INT,
    id_tratamiento INT,
    PRIMARY KEY (id_cita, id_tratamiento),
    FOREIGN KEY (id_cita) REFERENCES citas(id_cita) ON DELETE CASCADE,
    FOREIGN KEY (id_tratamiento) REFERENCES tratamientos(id_tratamiento)
);

-- =========================
-- FACTURACION
-- =========================

CREATE TABLE estados_factura (
    id_estado SERIAL PRIMARY KEY,
    estado VARCHAR(50) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE facturas (
    id_factura SERIAL PRIMARY KEY,
    id_cita INT UNIQUE, -- 1:1 con cita
    id_estado INT,
    concepto TEXT,
    monto NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_cita) REFERENCES citas(id_cita) ON DELETE CASCADE,
    FOREIGN KEY (id_estado) REFERENCES estados_factura(id_estado)
);

CREATE TABLE pagos (
    id_pago SERIAL PRIMARY KEY,
    id_factura INT,
    monto NUMERIC(10,2) NOT NULL,
    metodo_pago VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_factura) REFERENCES facturas(id_factura) ON DELETE CASCADE
);