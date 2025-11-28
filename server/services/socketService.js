const logger = require("../logger");

/**
 * Notifica a los clientes sobre una actualización de estado de producto (creación o modificación).
 * @param {Object} io - Instancia de Socket.IO
 * @param {string} restaurantId - ID del restaurante (sala)
 * @param {string} type - Tipo de actualización ('create' o 'update')
 * @param {Object} productStatus - Objeto del estado del producto
 */
exports.notifyStatusUpdate = (io, restaurantId, type, productStatus) => {
  if (!io) {
    logger.warn("Socket.IO instance not provided to notifyStatusUpdate");
    return;
  }
  
  io.to(restaurantId).emit("productStatusUpdate", {
    type,
    productStatus,
  });
};

/**
 * Notifica a los clientes sobre la eliminación de un estado de producto.
 * @param {Object} io - Instancia de Socket.IO
 * @param {string} restaurantId - ID del restaurante (sala)
 * @param {string} productId - ID del producto eliminado
 * @param {Object} product - Datos del producto eliminado (para restauración)
 */
exports.notifyStatusDelete = (io, restaurantId, productId, product) => {
  if (!io) {
    logger.warn("Socket.IO instance not provided to notifyStatusDelete");
    return;
  }

  io.to(restaurantId).emit("productStatusUpdate", {
    type: "delete",
    productId,
    product,
  });
};
