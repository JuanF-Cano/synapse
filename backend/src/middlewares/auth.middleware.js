const jwt = require('jsonwebtoken');
require('dotenv').config();

// Verificar el Token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).json({ error: 'Token requerido' });
  }

  try {
    const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Verificar si puede crear usuarios
const isAdmin = (req, res, next) => {
  if (!req.user.roles.includes('admin') && !req.user.roles.includes('recepcionista')) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  next();
};

module.exports = { verifyToken, isAdmin };