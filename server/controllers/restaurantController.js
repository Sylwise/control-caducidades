const Restaurant = require("../models/Restaurant");
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

// Eliminar un restaurante (Soft delete o hard delete, por ahora hard delete)
exports.deleteRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndDelete(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        error: "Restaurante no encontrado",
      });
    }

    logger.info(`Restaurante eliminado: ${restaurant.nombre} (${restaurant._id})`);

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    logger.error({ error }, "Error al eliminar restaurante");
    res.status(500).json({
      error: "Error al eliminar restaurante",
    });
  }
};
