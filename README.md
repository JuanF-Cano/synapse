# SYNAPSE

System for Networked Administration and Patient Services Environment

---

## Description

SYNAPSE is a web application designed for the digital management of clinical and administrative information in small- and medium-sized healthcare institutions. Its purpose is to centralize data in a relational database, allowing it to be accessed and updated in an organized and secure manner by authorized users.

---

## Steps to run app



## Project Architecture

```
synapse/
│
├── backend/
│   ├── database/
│   │   ├── schema.sql
│   │   └── seed.sql
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── scripts/
│   │   ├── services/
│   │   └── app.js
│   │
│   ├── package.json
│   ├── .env.example
│   └── .env
│
├── frontend/
│   ├── css/
│   ├── images/
│   ├── js/
│   ├── pages/
│   └── index.html
│
├── docs/
│   └── Semantica_SYNAPSE.pdf
│
├── .gitignore
├── structure.txt
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

# Initial Setup
Follow these steps to run the SYNAPSE project locally.

## 1. Clone the repository
```bash
git clone https://github.com/JuanF-Cano/synapse
cd synapse
```


## 2. Configure Environment Variables
Use `backend/.env.example` as reference and create a `.env` file inside `/backend`:
```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=synapse
DB_PASSWORD=your_password
DB_PORT=5432

JWT_SECRET=your_secret_key
BACKEND_PORT=3000
```

For this, you will need to make sure PostgreSQL is correctly installed beforehand, and an empty database named `synapse` should exist.

## 3. Initialize the Database
```bash
cd backend
npm install
npm run db:init
```
This will:

- Create all tables (`schema.sql`)
- Insert initial data (`seed.sql`)
- Automatically create/update a default admin user with hashed password

Default admin credentials created by `db:init`:

- Email: `admin@synapse.local`
- Password: `SynapseAdmin123!`

To change those credentials, edit `backend/src/scripts/db.js` in `DEFAULT_ADMIN`.


## 4. Run the Backend
```bash
npm run dev
```
Backend will be available at: `http://localhost:3000/api`

## 5. Run the Frontend
Go to back root:
```bash
cd ..
cd frontend
```

### Option A — Open directly
Open in browser: 
```bash
index.html
```

Exmaple:
```bash
C:/.../synapse/frontend/index.html
```

### Option B — Run local server (recommended)
```bash
npx serve .
```
Then open:
```bash
http://localhost:3000
```
Or on another port if port 3000 it's busy.

---

# API Documentation
The API documentation is available at:
```bash
http://localhost:3000/api/docs
```

---

# Authentication & Roles

The system supports multiple roles:

Admin
Medico
Recepcionista
Paciente

Each role has different permissions within the system.

---

# Features
User management with roles
Appointment scheduling system
Medical records (histories)
Treatments management
Billing and payments
Doctor availability tracking
Administrative reports

---

# API Overview
Main endpoints:

```bash
/api/auth
/api/users
/api/doctors
/api/appointments
/api/reports
/api/specialty
/api/docs
```
---