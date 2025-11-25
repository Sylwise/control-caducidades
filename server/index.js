const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { setupSocket } = require("./socket");
const rateLimit = require("express-rate-limit");
const logger = require("./logger");

// Cargar variables de entorno según el entorno
const envPath = path.join(
  __dirname,
  process.env.NODE_ENV === "production" ? ".env.production" : ".env"
);

try {
  require("dotenv").config({ path: envPath });
  logger.info(`Variables de entorno cargadas desde: ${envPath}`);
} catch (error) {
  logger.error("Error al cargar variables de entorno:", error);
}

// Verificar variables de entorno requeridas
const requiredEnvVars = ["JWT_SECRET", "MONGODB_URI"];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  logger.error("Error: Faltan variables de entorno requeridas:", missingEnvVars);
  process.exit(1);
}

logger.info("Variables de entorno cargadas correctamente");

const catalogRoutes = require("./routes/catalogRoutes");
const statusRoutes = require("./routes/statusRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();
const server = http.createServer(app);

// Configuración de CORS
const allowedOrigins = [
  "https://control-caducidades-caducidades.up.railway.app",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  process.env.NODE_ENV === "production" ? process.env.RAILWAY_STATIC_URL : null,
  process.env.NODE_ENV === "production"
    ? process.env.RAILWAY_PUBLIC_DOMAIN
    : null,
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      logger.warn(`Origin bloqueado por CORS: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400, // 24 horas
};

// Aplicar CORS como primer middleware
app.use(cors(corsOptions));

// Configurar Socket.IO
const io = setupSocket(server, allowedOrigins);
app.set('io', io);

// Middleware
app.use(express.json());

// Middleware de logging de peticiones
app.use((req, res, next) => {
  logger.info({ req: { method: req.method, url: req.originalUrl, headers: req.headers } }, `Petición recibida: ${req.method} ${req.originalUrl}`);
  next();
});

// Servir archivos estáticos en producción
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/dist")));
}

// Configurar rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // Límite de 1000 solicitudes por ventana por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Demasiadas solicitudes, por favor intente más tarde.",
    details: "Se ha excedido el límite de solicitudes permitidas.",
  },
  handler: (req, res) => {
    logger.warn(`Rate limit excedido para la IP: ${req.ip}`);
    res.status(429).json({
      error: "Demasiadas solicitudes, por favor intente más tarde.",
      details: "Se ha excedido el límite de solicitudes permitidas.",
    });
  },
});

// Configurar rate limiter específico para autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Límite de 100 intentos de login por ventana por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Demasiados intentos de inicio de sesión.",
    details: "Por favor, espere antes de intentar nuevamente.",
  },
  handler: (req, res) => {
    logger.warn(`Rate limit de autenticación excedido para la IP: ${req.ip}`);
    res.status(429).json({
      error: "Demasiados intentos de inicio de sesión.",
      details: "Por favor, espere antes de intentar nuevamente.",
    });
  },
});

// Aplicar rate limiter global a todas las rutas
app.use(limiter);

// Aplicar rate limiter específico para rutas de autenticación
app.use("/api/auth/login", authLimiter);

// Rutas API
app.use("/api/catalog", catalogRoutes);
app.use("/api/status", statusRoutes);
app.use("/api/auth", authRoutes);

// En producción, todas las rutas no-API sirven el index.html
if (process.env.NODE_ENV === "production") {
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(__dirname, "../client/dist/index.html"));
    }
  });
}

// Manejo de errores global
app.use((err, req, res, _next) => {
  logger.error(err.stack);

  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Error de validación",
      details: Object.values(err.errors).map((e) => e.message),
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      error: "Error de duplicado",
      details: "Ya existe un registro con esos datos únicos",
    });
  }

  res.status(500).json({
    error: "Error interno del servidor",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  logger.warn(`Ruta no encontrada: ${req.originalUrl}`);
  res.status(404).json({ error: "Ruta no encontrada" });
});

// Conexión a MongoDB con retry
const connectWithRetry = async () => {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      logger.info("Intentando conectar a MongoDB...");
      await mongoose.connect(process.env.MONGODB_URI);
      logger.info("Conectado a MongoDB exitosamente");
      break;
    } catch (err) {
      retries++;
      logger.error(
        `Error conectando a MongoDB (intento ${retries}/${maxRetries}): ${err.message}`
      );
      if (retries === maxRetries) {
        logger.error(
          "No se pudo conectar a MongoDB después de múltiples intentos"
        );
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};

connectWithRetry();

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`Servidor corriendo en puerto ${PORT}`);
  
  // Debug: Log connected clients count
  setInterval(() => {
    const io = app.get('io');
    if (io) {
      const count = io.engine.clientsCount;
      if (count > 0) logger.info(`[SOCKET DEBUG] Connected clients: ${count}`);
    }
  }, 10000);
});
