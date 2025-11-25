const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const {
  login,
  register,
  getCurrentUser,
  getUsers,
  deleteUser,
} = require("../controllers/authController");
const { verifyToken, isSupervisor } = require("../middleware/auth");

// Login
router.post(
  "/login",
  [
    check("username", "El nombre de usuario es requerido").not().isEmpty(),
    check("password", "La contraseña es requerida").not().isEmpty(),
  ],
  login
);

// Registro (solo supervisores)
router.post(
  "/register",
  [
    verifyToken,
    isSupervisor,
    check("username", "El nombre de usuario es requerido").not().isEmpty(),
    check(
      "password",
      "La contraseña debe tener al menos 6 caracteres"
    ).isLength({
      min: 6,
    }),
    check("role", "El rol es requerido").not().isEmpty(),
  ],
  register
);

// Obtener usuario actual
router.get("/me", verifyToken, getCurrentUser);

// Obtener todos los usuarios (solo supervisores)
router.get("/users", [verifyToken, isSupervisor], getUsers);

// Eliminar usuario (solo supervisores)
router.delete("/users/:userId", [verifyToken, isSupervisor], deleteUser);

module.exports = router;
