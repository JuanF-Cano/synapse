const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      message: 'Conexión exitosa',
      time: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Error conectando a la base de datos'
    });
  }
});

module.exports = router;