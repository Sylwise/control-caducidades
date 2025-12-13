const express = require("express");
const router = express.Router();
const catalogController = require("../controllers/catalogController");
const { verifyToken, isSupervisor } = require("../middleware/auth");

// Rutas protegidas con autenticación
router.use(verifyToken);

// Rutas para todos los usuarios autenticados

/**
 * @swagger
 * /api/catalog:
 *   get:
 *     summary: Obtener todos los productos del catálogo
 *     description: Devuelve la lista completa de productos del catálogo asociados al restaurante del usuario.
 *     tags: [Catalog]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de productos obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   nombre:
 *                     type: string
 *                   tipo:
 *                     type: string
 *                   activo:
 *                     type: boolean
 *                   restaurante:
 *                     type: string
 *       500:
 *         description: Error del servidor
 */
router.get("/", catalogController.getAllProducts);

// Rutas solo para supervisores
router.post("/", isSupervisor, catalogController.addProduct);
router.put("/:id", isSupervisor, catalogController.updateProduct);
router.delete("/:id", isSupervisor, catalogController.deleteProduct);
router.put("/:id/toggle", isSupervisor, catalogController.toggleProductStatus);

module.exports = router;
