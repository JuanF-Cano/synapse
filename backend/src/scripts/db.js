const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Credenciales iniciales del admin.
// Si quieres cambiarlas, hazlo aqui en codigo.
const DEFAULT_ADMIN = {
  nombre: 'Admin',
  apellido: 'Synapse',
  email: 'admin@synapse.local',
  password: 'SynapseAdmin123!'
};

async function ensureDefaultAdmin() {
  const adminRole = await client.query(
    "SELECT id_tipo FROM tipos_usuario WHERE LOWER(nombre) = 'admin' LIMIT 1"
  );

  if (adminRole.rowCount === 0) {
    throw new Error("No se encontro el rol 'admin' en tipos_usuario");
  }

  const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, 10);

  const userResult = await client.query(
    `INSERT INTO usuarios (nombre, apellido, email, password)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email)
     DO UPDATE SET
       nombre = EXCLUDED.nombre,
       apellido = EXCLUDED.apellido,
       password = EXCLUDED.password
     RETURNING id_usuario`,
    [
      DEFAULT_ADMIN.nombre,
      DEFAULT_ADMIN.apellido,
      DEFAULT_ADMIN.email,
      hashedPassword
    ]
  );

  const idUsuario = userResult.rows[0].id_usuario;
  const idTipoAdmin = adminRole.rows[0].id_tipo;

  await client.query(
    `INSERT INTO usuario_tipo (id_usuario, id_tipo)
     VALUES ($1, $2)
     ON CONFLICT (id_usuario, id_tipo) DO NOTHING`,
    [idUsuario, idTipoAdmin]
  );

  // Mantener consistencia del modelo de datos para usuarios administrativos.
  await client.query(
    'INSERT INTO personal (id_usuario) VALUES ($1) ON CONFLICT (id_usuario) DO NOTHING',
    [idUsuario]
  );

  await client.query(
    'INSERT INTO personal_administrativo (id_usuario) VALUES ($1) ON CONFLICT (id_usuario) DO NOTHING',
    [idUsuario]
  );
}

async function run() {
  try {
    await client.connect();

    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const seedPath = path.join(__dirname, '../../database/seed.sql');

    const schema = fs.readFileSync(schemaPath).toString();
    const seed = fs.readFileSync(seedPath).toString();

    await client.query(schema);
    await client.query(seed);
    await ensureDefaultAdmin();

    console.log('✅ DB creada y poblada correctamente');
    console.log('👤 Admin inicial:');
    console.log(`   email: ${DEFAULT_ADMIN.email}`);
    console.log(`   password: ${DEFAULT_ADMIN.password}`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

run();