const express = require("express");
const router = express.Router();
const catalogController = require("../controllers/catalogController");
const { verifyToken, isSupervisor } = require("../middleware/auth");


// Middleware de logging para depuración (Solo en desarrollo)
// Middleware de logging eliminado para producción

// Rutas públicas (requieren autenticación)
router.get("/", verifyToken, catalogController.getAllProducts);

// Rutas protegidas (solo supervisores)
router.post("/", [verifyToken, isSupervisor], catalogController.addProduct);
router.put(
  "/:id",
  [verifyToken, isSupervisor],
  catalogController.updateProduct
);
router.delete(
  "/:id",
  [verifyToken, isSupervisor],
  catalogController.deleteProduct
);
router.patch(
  "/:id/toggle",
  [verifyToken, isSupervisor],
  catalogController.toggleProductStatus
);

module.exports = router;
