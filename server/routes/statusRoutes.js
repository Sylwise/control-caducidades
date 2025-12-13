const express = require("express");
const router = express.Router();
const statusController = require("../controllers/statusController");
const { verifyToken } = require("../middleware/auth");

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Asegúrate de que cada ruta corresponde a una función existente en el controlador
router.get("/", statusController.getAllStatus);
router.get("/estado/:estado", statusController.getByStatus);

/**
 * @swagger
 * /api/status/{productoId}:
 *   put:
 *     summary: Actualizar estado de caducidad
 *     description: Actualiza o crea el estado de caducidad de un producto.
 *     tags: [Status]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productoId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del producto del catálogo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fechaFrente:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha de caducidad del producto en frente
 *               fechaAlmacen:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha de caducidad antigua (deprecated)
 *               cajasAlmacen:
 *                 type: number
 *                 description: Número de cajas en almacén (deprecated)
 *               fechasAlmacen:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     fecha:
 *                       type: string
 *                       format: date-time
 *                     cantidad:
 *                       type: number
 *                 description: Lista de fechas y cantidades en almacén
 *     responses:
 *       200:
 *         description: Estado actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 estado:
 *                   type: string
 *                   enum: [sin-clasificar, ok, caduca-hoy, caducado, urgente, alerta]
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error del servidor
 */
router.put("/:productoId", statusController.updateStatus);
/**
 * @swagger
 * /api/status/{productoId}:
 *   delete:
 *     summary: Eliminar estado de caducidad
 *     description: Elimina el seguimiento de caducidad de un producto.
 *     tags: [Status]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productoId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Estado eliminado correctamente
 *       400:
 *         description: Error al eliminar
 */
router.delete("/:productoId", statusController.deleteStatus);

module.exports = router;
