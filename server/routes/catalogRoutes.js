const express = require("express");
const router = express.Router();
const catalogController = require("../controllers/catalogController");
const { verifyToken, isSupervisor } = require("../middleware/auth");

// Rutas protegidas con autenticación
router.use(verifyToken);

// Rutas para todos los usuarios autenticados
router.get("/", catalogController.getAllProducts);

// Rutas solo para supervisores
router.post("/", isSupervisor, catalogController.addProduct);
router.put("/:id", isSupervisor, catalogController.updateProduct);
router.delete("/:id", isSupervisor, catalogController.deleteProduct);
router.put("/:id/toggle", isSupervisor, catalogController.toggleProductStatus);

module.exports = router;
