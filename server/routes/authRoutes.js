const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { verifyToken, isSupervisor } = require("../middleware/auth");

// Health check endpoint (debe estar antes del middleware de autenticación)
router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Rutas públicas

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     description: Autentica a un usuario y devuelve un token JWT junto con la información del usuario.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: "supervisor_rest1"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Token JWT para autenticación
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     role:
 *                       type: string
 *                     restaurante:
 *                       type: object
 *                       properties:
 *                         nombre:
 *                           type: string
 *       400:
 *         description: Datos faltantes o inválidos
 *       401:
 *         description: Credenciales inválidas
 *       500:
 *         description: Error del servidor
 */
router.post("/login", authController.login);

// Rutas protegidas
router.use(verifyToken);

// Rutas para usuarios autenticados
router.get("/me", authController.getCurrentUser);
router.put("/change-password", authController.changePassword);

// Rutas solo para supervisores
router.get("/users", isSupervisor, authController.getAllUsers);

/**
 * @swagger
 * /api/auth/users:
 *   post:
 *     summary: Crear nuevo usuario
 *     description: Crea un nuevo usuario en el sistema. Requiere privilegios de Supervisor o Admin.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - role
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *               role:
 *                 type: string
 *                 enum: [encargado, supervisor, admin]
 *               restaurante:
 *                 type: string
 *                 description: ID del restaurante (obligatorio para admin, automático para supervisor)
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       400:
 *         description: Datos inválidos o usuario ya existente
 *       403:
 *         description: No tiene permisos suficientes
 *       500:
 *         description: Error del servidor
 */
router.post("/users", isSupervisor, authController.createUser);
router.put("/users/:id", isSupervisor, authController.updateUser);
router.delete("/users/:id", isSupervisor, authController.deleteUser);

module.exports = router;
