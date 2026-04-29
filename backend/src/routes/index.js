const express = require('express');
const router = express.Router();

// Ruta base
router.get('/', (req, res) => {
  res.send('🚀 SYNAPSE API funcionando');
});

module.exports = router;