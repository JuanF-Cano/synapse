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

// Verificacion de roles
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {

    if (!req.user || !req.user.roles) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const hasRole = req.user.roles.some(role =>
      allowedRoles.includes(role)
    );

    if (!hasRole) {
      return res.status(403).json({
        error: 'No tienes permisos para esta acción'
      });
    }

    next();
  };
};

module.exports = { verifyToken, authorizeRoles };