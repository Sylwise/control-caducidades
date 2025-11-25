const { Server } = require("socket.io");
const logger = require("./logger");
const jwt = require("jsonwebtoken");

function setupSocket(server, allowedOrigins) {
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    },
    allowEIO3: true,
    transports: ["websocket", "polling"],
  });

  // Middleware de autenticación para WebSockets
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      logger.warn("Intento de conexión a WebSocket sin token");
      return next(new Error("Authentication error"));
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        logger.warn("Intento de conexión a WebSocket con token inválido");
        return next(new Error("Authentication error"));
      }
      socket.user = decoded;
      next();
    });
  });

  io.on("connection", (socket) => {
    logger.info(`Cliente conectado y autenticado: ${socket.id}, usuario: ${socket.user.username}`);

    // Unir al usuario a una sala con su ID
    socket.join(socket.user.id);
    if (socket.user.role === 'supervisor') {
      socket.join('supervisors');
    }

    socket.on("productStatusUpdate", (data) => {
      logger.info({ data }, "Actualización de estado recibida");
      io.emit("productStatusUpdate", data);
    });

    socket.on("catalogUpdate", (data) => {
      logger.info({ data }, "Actualización de catálogo recibida");
      io.emit("catalogUpdate", data);
    });

    socket.on("disconnect", () => {
      logger.info(`Cliente desconectado: ${socket.id}`);
    });
  });

  return io;
}

module.exports = { setupSocket };
