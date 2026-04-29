const UserModel = require('../models/user.model');
const PatientModel = require('../models/patient.model');
const StaffModel = require('../models/staff.model');
const pool = require('../config/db');
const bcrypt = require('bcrypt');

const UserService = {

  async registerUser(data = {}) {
    const { nombre, apellido, email, password, documento, roles = [], extras = {} } = data;

    if (!nombre || !apellido || !email || !password) {
      throw new Error('Faltan datos obligatorios para crear el usuario');
    }

    // Validar si ya existe
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      throw new Error('El usuario ya existe');
    }

    const hashedpassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const user = await UserModel.createUser({
      nombre,
      apellido,
      email,
      password: hashedpassword,
      documento
    });

    // Asignar roles (solo usuario_tipo; related table rows created when needed via assignRoleToUser)
    if (roles && roles.length > 0) {
      for (let role of roles) {
        await UserService.assignRoleToUser(user.id_usuario, role, extras);
      }
    }

    return user;
  },

  async getCurrentUser(id_usuario) {
    const user = await UserModel.findById(id_usuario);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const roles = await UserModel.getRoles(id_usuario);

    return {
      ...user,
      roles: roles.map((role) => role.nombre)
    };
  },

  // Assign a role to an existing user and create related table rows if missing.
  // extras may contain id_zona, numero_licencia, id_especialidad
  async assignRoleToUser(id_usuario, id_tipo, extras = {}) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const roleId = Number(id_tipo);

      if (!Number.isInteger(roleId) || roleId < 1) {
        throw new Error('Rol invalido');
      }

      // Insert into usuario_tipo if not exists
      const existsRes = await client.query(
        'SELECT 1 FROM usuario_tipo WHERE id_usuario = $1 AND id_tipo = $2',
        [id_usuario, roleId]
      );
      if (existsRes.rowCount === 0) {
        await client.query(
          'INSERT INTO usuario_tipo (id_usuario, id_tipo) VALUES ($1, $2)',
          [id_usuario, roleId]
        );
      }

      // Role-specific related rows
      // Paciente (id 4)
      if (roleId === 4) {
        const p = await client.query('SELECT 1 FROM pacientes WHERE id_usuario = $1', [id_usuario]);
        if (p.rowCount === 0) {
          await client.query('INSERT INTO pacientes (id_usuario) VALUES ($1)', [id_usuario]);
        }
      }

      // Staff roles (medico id 2, recepcionista id 3, admin id 1 can also be staff)
      if ([1, 2, 3].includes(roleId)) {
        // Ensure personal exists
        const per = await client.query('SELECT 1 FROM personal WHERE id_usuario = $1', [id_usuario]);
        if (per.rowCount === 0) {
          await client.query('INSERT INTO personal (id_usuario, id_zona) VALUES ($1, $2)', [id_usuario, extras.id_zona ?? null]);
        }

        // If medico and license provided, create personal_salud if missing
        if (roleId === 2) {
          if (!extras.numero_licencia || extras.id_especialidad === undefined) {
            throw new Error('Para asignar el rol de medico se requiere numero_licencia e id_especialidad');
          }

          const ps = await client.query('SELECT 1 FROM personal_salud WHERE id_usuario = $1', [id_usuario]);
          if (ps.rowCount === 0) {
            await client.query(
              'INSERT INTO personal_salud (id_usuario, numero_licencia, id_especialidad, estado) VALUES ($1, $2, $3, true)',
              [id_usuario, extras.numero_licencia, extras.id_especialidad]
            );
          }
        }

        // If administrative staff (recepcionista or admin), ensure personal_administrativo
        if ([3, 1].includes(roleId)) {
          const pa = await client.query('SELECT 1 FROM personal_administrativo WHERE id_usuario = $1', [id_usuario]);
          if (pa.rowCount === 0) {
            await client.query('INSERT INTO personal_administrativo (id_usuario) VALUES ($1)', [id_usuario]);
          }
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Update user with rules: password can always be changed; other attrs only if null for self-updates.
  // requestUser is the authenticated user object (with id_usuario and roles array)
  async updateUser(requestUser, id_usuario, data) {
    const target = await UserModel.findById(id_usuario);
    if (!target) throw new Error('Usuario no encontrado');

    const normalizedRoles = Array.isArray(requestUser?.roles)
      ? requestUser.roles.map((role) => String(role).toLowerCase())
      : [];

    const updates = {};

    // Password handling
    if (data.password) {
      const isSelf = Number(requestUser.id_usuario) === Number(id_usuario);
      const isAdmin = normalizedRoles.includes('admin');
      const canChangePassword = isSelf || isAdmin;

      if (!canChangePassword) {
        throw new Error('No tienes permisos para modificar la contraseña');
      }

      updates.password = await bcrypt.hash(data.password, 10);
    }

    // Fields to consider
    const otherFields = ['nombre','apellido','telefono','direccion','fecha_nacimiento','documento','email'];
    for (let field of otherFields) {
      if (data[field] === undefined) continue;

      const isSelf = Number(requestUser.id_usuario) === Number(id_usuario);
      const isAdmin = normalizedRoles.includes('admin');
      const isRecepcion = normalizedRoles.includes('recepcionista');

      if (isSelf) {
        // self can only modify if current value is null
        if (target[field] === null) {
          updates[field] = data[field];
        } else {
          throw new Error(`No puedes modificar '${field}' una vez establecido`);
        }
      } else if (isRecepcion) {
        // recepcionistas can modify all except password
        updates[field] = data[field];
      } else if (isAdmin) {
        updates[field] = data[field];
      } else {
        throw new Error('No tienes permisos para modificar este usuario');
      }
    }

    if (Object.keys(updates).length === 0) return await UserModel.findById(id_usuario);

    const updated = await UserModel.updateUser(id_usuario, updates);
    return updated;
  }

};

module.exports = UserService;