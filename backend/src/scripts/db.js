const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function run() {
  try {
    await client.connect();

    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const seedPath = path.join(__dirname, '../../database/seed.sql');

    const schema = fs.readFileSync(schemaPath).toString();
    const seed = fs.readFileSync(seedPath).toString();

    await client.query(schema);
    await client.query(seed);

    console.log('✅ DB creada y poblada correctamente');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

run();