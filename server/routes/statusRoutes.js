const express = require("express");
const router = express.Router();
const statusController = require("../controllers/statusController");

// Asegúrate de que cada ruta corresponde a una función existente en el controlador
router.get("/", statusController.getAllStatus);
router.get("/estado/:estado", statusController.getByStatus);
router.put("/:productoId", statusController.updateStatus);
router.delete("/:productoId", statusController.deleteStatus);

module.exports = router;
