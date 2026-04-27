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

    TIPO_USUARIO {
        int id_usuario PK
        int tipo PK
    }

    PACIENTES {
        int id_usuario PK
    }

    PERSONAL {
        int id_usuario PK
        int zona
    }

    PERSONAL_SALUD {
        int id_usuario PK
        string numero_licencia
        int id_especialidad
        boolean estado
    }

    PERSONAL_ADMINISTRATIVO {
        int id_usuario PK
    }

    ESPECIALIDADES {
        int id_especialidad PK
        string nombre
        string descripcion
    }

    ZONAS {
        int id_zona PK
        string nombre
    }

    CITAS {
        int id_cita PK
        int id_paciente
        int id_medico
        timestamp fecha
        string estado
        string motivo
        string observaciones
        timestamp created_at
    }

    HISTORIAS_CLINICAS {
        int id_cita PK
        int id_paciente PK
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
        int id_cita PK
        int id_tratamiento PK
    }

    FACTURAS {
        int id_factura PK
        int id_cita
        string concepto
        float monto
        timestamp created_at
    }

    ESTADOS_FACTURA {
        int id_factura PK
        string estado
        timestamp updated_at
    }


    %% RELACIONES

    USUARIOS ||--o{ TIPO_USUARIO : tiene
    USUARIOS ||--|| PACIENTES : es
    USUARIOS ||--|| PERSONAL : es

    PERSONAL ||--|| PERSONAL_SALUD : especializa
    PERSONAL ||--|| PERSONAL_ADMINISTRATIVO : especializa

    PERSONAL }o--|| ZONAS : asignado

    PERSONAL_SALUD }o--|| ESPECIALIDADES : pertenece

    PACIENTES ||--o{ CITAS : agenda
    PERSONAL_SALUD ||--o{ CITAS : atiende

    CITAS ||--|| HISTORIAS_CLINICAS : genera

    CITAS ||--o{ TRATAMIENTOS_CITA : incluye
    TRATAMIENTOS ||--o{ TRATAMIENTOS_CITA : aplicado

    CITAS ||--|| FACTURAS : genera
    FACTURAS ||--|| ESTADOS_FACTURA : estado
```

---