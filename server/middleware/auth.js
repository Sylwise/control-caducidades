const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const logger = require("../logger");

// Verificar token JWT
exports.verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
      logger.warn("Intento de acceso sin token");
      return res.status(401).json({
        error: "No autorizado - Token no proporcionado",
      });
    }

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn({ error }, "Error al verificar token");

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Token expirado",
      });
    }

    return res.status(401).json({
      error: "Token inválido",
    });
  }
};

// Middleware para verificar rol de supervisor
exports.isSupervisor = (req, res, next) => {
  if (!req.user) {
    logger.error("isSupervisor middleware llamado sin req.user");
    return res.status(401).json({
      error: "No autorizado",
    });
  }

  if (req.user.role !== "supervisor") {
    logger.warn(`Acceso denegado a usuario no supervisor: ${req.user.username}`);
    return res.status(403).json({
      error: "Acceso denegado - Se requiere rol de supervisor",
    });
  }

  next();
};
