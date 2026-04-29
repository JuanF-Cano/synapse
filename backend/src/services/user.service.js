const { runInContext } = require('vm');
const UserModel = require('../models/user.model');
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

    let assignedRoles = [];

    if (roles.length > 0) {
      for (const role of roles) {
        await this.assignRoleToUser(user.id_usuario, role, extras);
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

  async getUsersWithRoles() {
    const users = await UserModel.getAllUsers();
    const withRoles = await Promise.all(
      users.map(async (user) => {
        const roles = await UserModel.getRoles(user.id_usuario);
        return {
          ...user,
          roles: roles.map((role) => role.nombre)
        };
      })
    );

    return withRoles;
  },

  // Assign a role to an existing user and create related table rows if missing.
  // extras may contain numero_licencia and id_especialidad for medics.
  async assignRoleToUser(id_usuario, id_tipo, extras = {}) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const roleId = Number(id_tipo);

      // evitar duplicados
      const exists = await client.query(
        'SELECT 1 FROM usuario_tipo WHERE id_usuario = $1 AND id_tipo = $2',
        [id_usuario, roleId]
      );

      if (exists.rowCount === 0) {
        await UserModel.assignRole(id_usuario, roleId, client);
      }

      // =====================
      // PACIENTE
      // =====================
      if (roleId === 4) {
        const p = await client.query(
          'SELECT 1 FROM pacientes WHERE id_usuario = $1',
          [id_usuario]
        );

        if (p.rowCount === 0) {
          await client.query(
            'INSERT INTO pacientes (id_usuario) VALUES ($1)',
            [id_usuario]
          );
        }
      }

      // =====================
      // STAFF
      // =====================
      if ([1, 2, 3].includes(roleId)) {

        // personal base
        const per = await client.query(
          'SELECT 1 FROM personal WHERE id_usuario = $1',
          [id_usuario]
        );

        if (per.rowCount === 0) {
          await client.query(
            'INSERT INTO personal (id_usuario) VALUES ($1)',
            [id_usuario]
          );
        }

        // medico
        if (roleId === 2) {
          if (!extras.numero_licencia || !extras.id_especialidad) {
            throw new Error('Faltan datos del medico');
          }

          const ps = await client.query(
            'SELECT 1 FROM personal_salud WHERE id_usuario = $1',
            [id_usuario]
          );

          if (ps.rowCount === 0) {
            await client.query(
              `INSERT INTO personal_salud 
              (id_usuario, numero_licencia, id_especialidad, estado)
              VALUES ($1, $2, $3, true)`,
              [id_usuario, extras.numero_licencia, extras.id_especialidad]
            );
          }
        }

        // administrativo
        if ([1, 3].includes(roleId)) {
          const pa = await client.query(
            'SELECT 1 FROM personal_administrativo WHERE id_usuario = $1',
            [id_usuario]
          );

          if (pa.rowCount === 0) {
            await client.query(
              'INSERT INTO personal_administrativo (id_usuario) VALUES ($1)',
              [id_usuario]
            );
          }
        }
      }

      await client.query('COMMIT');
      return true;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async removeRoleFromUser(id_usuario, id_tipo) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const roleId = Number(id_tipo);

      const totalRoles = await UserModel.countRoles(id_usuario, client);

      if (totalRoles <= 1) {
        throw new Error('No se puede eliminar el ultimo rol');
      }

      await UserModel.removeRole(id_usuario, roleId, client);

      // =====================
      // LIMPIEZA
      // =====================

      if (roleId === 4) {
        await client.query(
          'DELETE FROM pacientes WHERE id_usuario = $1',
          [id_usuario]
        );
      }

      if (roleId === 2) {
        await client.query(
          'DELETE FROM personal_salud WHERE id_usuario = $1',
          [id_usuario]
        );
      }

      if ([1, 3].includes(roleId)) {
        const stillAdmin = await client.query(
          `SELECT 1 FROM usuario_tipo 
          WHERE id_usuario = $1 AND id_tipo IN (1,3)`,
          [id_usuario]
        );

        if (stillAdmin.rowCount === 0) {
          await client.query(
            'DELETE FROM personal_administrativo WHERE id_usuario = $1',
            [id_usuario]
          );
        }
      }

      // 🔥 CLAVE: verificar si queda staff
      const stillStaff = await client.query(
        `SELECT 1 FROM usuario_tipo 
        WHERE id_usuario = $1 AND id_tipo IN (1,2,3)`,
        [id_usuario]
      );

      if (stillStaff.rowCount === 0) {
        await client.query(
          'DELETE FROM personal WHERE id_usuario = $1',
          [id_usuario]
        );
      }

      await client.query('COMMIT');
      return true;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Update user with rules: password can always be changed; other attrs only if null for self-updates.
  // requestUser is the authenticated user object (with id_usuario and roles array)
  async updatePassword(requestUser, id_usuario, data) {
    const target = await UserModel.findById(id_usuario);
    if (!target) throw new Error('Usuario no encontrado');

    const normalizedRoles = Array.isArray(requestUser?.roles)
      ? requestUser.roles.map((role) => String(role).toLowerCase())
      : [];

    const updates = {};

    if (!data) {
      throw new Error('No se recibieron datos');
    }

    // Password handling
    if (data.password) {
      const isSelf = Number(requestUser.id_usuario || requestUser.id) === Number(id_usuario);
      const isAdmin = normalizedRoles.includes('admin');
      if (!isSelf && !isAdmin) {
        throw new Error('No tienes permisos para modificar la contraseña');
      }
      updates.password = await bcrypt.hash(data.password, 10);
    }

    if (Object.keys(updates).length === 0) {
      return await UserModel.findById(id_usuario);
    }

    return await UserModel.updateUser(id_usuario, updates);
  }

};

module.exports = UserService;