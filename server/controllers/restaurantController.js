const Restaurant = require("../models/Restaurant");
const User = require("../models/User");
const CatalogProduct = require("../models/CatalogProduct");
const ProductStatus = require("../models/Product");
const { runInTransaction } = require("../utils/transaction");
const logger = require("../logger");

// Crear un nuevo restaurante
exports.createRestaurant = async (req, res) => {
  try {
    const { nombre, direccion } = req.body;

    const restaurant = await Restaurant.create({
      nombre,
      direccion,
    });

    logger.info(`Restaurante creado: ${restaurant.nombre} (${restaurant._id})`);

    res.status(201).json({
      success: true,
      data: restaurant,
    });
  } catch (error) {
    logger.error({ error }, "Error al crear restaurante");
    res.status(500).json({
      error: "Error al crear restaurante",
      details: error.message,
    });
  }
};

// Obtener todos los restaurantes
exports.getRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find();

    res.status(200).json({
      success: true,
      count: restaurants.length,
      data: restaurants,
    });
  } catch (error) {
    logger.error({ error }, "Error al obtener restaurantes");
    res.status(500).json({
      error: "Error al obtener restaurantes",
    });
  }
};

// Actualizar un restaurante
exports.updateRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!restaurant) {
      return res.status(404).json({
        error: "Restaurante no encontrado",
      });
    }

    logger.info(`Restaurante actualizado: ${restaurant.nombre} (${restaurant._id})`);

    res.status(200).json({
      success: true,
      data: restaurant,
    });
  } catch (error) {
    logger.error({ error }, "Error al actualizar restaurante");
    res.status(500).json({
      error: "Error al actualizar restaurante",
    });
  }
};

// Eliminar un restaurante (Cascading delete)
exports.deleteRestaurant = async (req, res) => {
  try {
    const { id } = req.params;

    await runInTransaction(async (session) => {
      // 1. Verificar que el restaurante existe
      const restaurant = await Restaurant.findById(id).session(session);
      if (!restaurant) {
        throw new Error("Restaurante no encontrado");
      }

      // 2. Eliminar usuarios asociados
      const deletedUsers = await User.deleteMany({ restaurante: id }, { session });
      logger.info(`Eliminados ${deletedUsers.deletedCount} usuarios del restaurante ${id}`);

      // 3. Eliminar estados de productos asociados
      const deletedStatuses = await ProductStatus.deleteMany({ restaurante: id }, { session });
      logger.info(`Eliminados ${deletedStatuses.deletedCount} estados de productos del restaurante ${id}`);

      // 4. Eliminar productos del catálogo asociados
      const deletedProducts = await CatalogProduct.deleteMany({ restaurante: id }, { session });
      logger.info(`Eliminados ${deletedProducts.deletedCount} productos del catálogo del restaurante ${id}`);

      // 5. Eliminar el restaurante
      await Restaurant.findByIdAndDelete(id, { session });
      logger.info(`Restaurante eliminado: ${restaurant.nombre} (${id})`);

      // Emitir evento de borrado a la sala del restaurante
      // Nota: Esto se hace fuera de la transacción de DB, pero dentro del bloque lógico
      const io = req.app.get('io');
      if (io) {
        io.to(id).emit("restaurantDeleted", {
          restaurantId: id,
          message: "El restaurante ha sido eliminado."
        });
      }
    });

    res.status(200).json({
      success: true,
      message: "Restaurante y todos sus datos asociados eliminados correctamente",
      data: {},
    });
  } catch (error) {
    logger.error({ error }, "Error al eliminar restaurante");
    
    if (error.message === "Restaurante no encontrado") {
      return res.status(404).json({
        error: "Restaurante no encontrado",
      });
    }

    res.status(500).json({
      error: "Error al eliminar restaurante",
      details: error.message,
    });
  }
};
