const express = require("express");
const router = express.Router();
const catalogController = require("../controllers/catalogController");
const { verifyToken, isSupervisor } = require("../middleware/auth");

// Middleware de logging para depuración
router.use((req, res, next) => {
  console.log("\n=== Petición a Catalog Router ===");
  console.log("Método:", req.method);
  console.log("URL:", req.originalUrl);
  console.log("Params:", req.params);
  console.log("Body:", req.body);
  console.log("=================================\n");
  next();
});

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
