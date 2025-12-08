const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { setupSocket } = require("./socket");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
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
const restaurantRoutes = require("./routes/restaurantRoutes");
const employeeRoutes = require("./routes/employeeRoutes");

const app = express();

// Configuración de Proxy (Vital para Railway y Rate Limit)
app.set('trust proxy', 1);

const server = http.createServer(app);

// ... (CORS config)



// Configuración de CORS
const allowedOrigins = [
  "https://caducidades.up.railway.app",
  "https://caducidades.es",
  "https://www.caducidades.es",
  "https://control-caducidades-caducidades.up.railway.app",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  process.env.RAILWAY_STATIC_URL,
  process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : null
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir solicitudes sin origen (como apps móviles o curl)
    if (!origin) return callback(null, true);

    // Permitir orígenes en la lista blanca
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // Permitir acceso desde la red local (ej. 192.168.x.x)
    // Regex para IPs de red local comunes: 192.168.x.x, 10.x.x.x, 172.16.x.x - 172.31.x.x
    const localNetworkRegex = /^(http|https):\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/;
    
    if (localNetworkRegex.test(origin)) {
      return callback(null, true);
    }
    
    logger.warn(`Origin bloqueado por CORS: ${origin}`);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Pragma", "Cache-Control"],
  maxAge: 86400, // 24 horas
};

// Aplicar CORS como primer middleware
app.use(cors(corsOptions));

// Configurar Socket.IO
const io = setupSocket(server, allowedOrigins);
app.set('io', io);

// Middleware
app.use(helmet()); // Security Headers
app.use(mongoSanitize()); // Prevent NoSQL Injection
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
  max: 5, // Límite de 5 intentos de login por ventana por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Demasiados intentos de inicio de sesión.",
    details: "Demasiados intentos de inicio de sesión, por favor intente de nuevo en 15 minutos",
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
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/employees", employeeRoutes);

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

const { seedAdmin } = require("./utils/seeder");

// Conexión a MongoDB con retry
const connectWithRetry = async () => {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      logger.info("Intentando conectar a MongoDB...");
      await mongoose.connect(process.env.MONGODB_URI);
      logger.info("Conectado a MongoDB exitosamente");
      
      // Intentar sembrar usuario admin
      await seedAdmin();
      
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
});
