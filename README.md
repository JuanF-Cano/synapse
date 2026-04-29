# SYNAPSE

System for Networked Administration and Patient Services Environment

---

## Description

SYNAPSE is a web application designed for the digital management of clinical and administrative information in small- and medium-sized healthcare institutions. Its purpose is to centralize data in a relational database, allowing it to be accessed and updated in an organized and secure manner by authorized users.

---

## Project Architecture

```
synapse/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── services/
│   │   └── app.js
│   │
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── pages/
│   ├── js/
│   ├── css/
│   └── index.html
│
├── database/
│   ├── schema.sql
│   ├── seed.sql
│
├── docs/
│   └── semantica.pdf
│
└── README.md
```

---

## Database Model

```mermaid
erDiagram

    USUARIOS {
        int id_usuario PK
        string nombre
        string apellido
        string email
        string password
        string telefono
        date fecha_nacimiento
        string direccion
        string documento
        timestamp created_at
    }

    TIPOS_USUARIO {
        int id_tipo PK
        string nombre
    }

    USUARIO_TIPO {
        int id_usuario PK, FK
        int id_tipo PK, FK
    }

    PACIENTES {
        int id_usuario PK, FK
    }

    PERSONAL {
        int id_usuario PK, FK
    }

    PERSONAL_SALUD {
        int id_usuario PK, FK
        string numero_licencia
        int id_especialidad FK
        boolean estado
    }

    PERSONAL_ADMINISTRATIVO {
        int id_usuario PK, FK
    }

    ESPECIALIDADES {
        int id_especialidad PK
        string nombre
        string descripcion
    }

    CITAS {
        int id_cita PK
        int id_paciente FK
        int id_medico FK
        int id_estado FK
        timestamp fecha
        string motivo
        string observaciones
        timestamp created_at
    }

    ESTADOS_CITA {
        int id_estado PK
        string estado
    }

    HISTORIAS_CLINICAS {
        int id_historia PK
        int id_cita FK
        string descripcion_general
        string observaciones
        timestamp fecha
    }

    TRATAMIENTOS {
        int id_tratamiento PK
        string descripcion
        float costo
    }

    TRATAMIENTOS_CITA {
        int id_cita PK, FK
        int id_tratamiento PK, FK
    }

    FACTURAS {
        int id_factura PK
        int id_cita FK
        int id_estado FK
        string concepto
        float monto
        timestamp created_at
    }

    ESTADOS_FACTURA {
        int id_estado PK
        string estado
        timestamp updated_at
    }

    PAGOS {
        int id_pago PK
        int id_factura FK
        float monto
        string metodo_pago
        timestamp created_at
    }

    %% RELACIONES

    USUARIOS ||--o{ USUARIO_TIPO : tiene
    TIPOS_USUARIO ||--o{ USUARIO_TIPO : clasifica

    USUARIOS ||--o{ PACIENTES : es
    USUARIOS ||--o{ PERSONAL : es

    PERSONAL ||--o{ PERSONAL_SALUD : especializa
    PERSONAL ||--o{ PERSONAL_ADMINISTRATIVO : especializa

    PERSONAL_SALUD }o--|| ESPECIALIDADES : pertenece

    PACIENTES ||--o{ CITAS : agenda
    PERSONAL_SALUD ||--o{ CITAS : atiende

    CITAS ||--|| HISTORIAS_CLINICAS : genera
    CITAS }o--|| ESTADOS_CITA : estado
    CITAS ||--o{ TRATAMIENTOS_CITA : incluye
    TRATAMIENTOS ||--o{ TRATAMIENTOS_CITA : aplicado

    CITAS ||--|| FACTURAS : genera
    FACTURAS ||--o{ PAGOS : recibe
    FACTURAS }o--|| ESTADOS_FACTURA : estado
```

---
