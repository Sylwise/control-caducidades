const { calculateProductStatus } = require("../services/productStateService");
const ProductStatus = require("../models/Product");
const logger = require("../logger");
const socketService = require("../services/socketService");

exports.getAllStatus = async (req, res) => {
  try {
    const statuses = await ProductStatus.find({ restaurante: req.user.restaurante }).populate("producto", "nombre isDirectConsumption");
    
    // Filtrar estados huérfanos (donde el producto referenciado ya no existe)
    const validStatuses = [];
    const orphanIds = [];

    statuses.forEach(status => {
      if (status.producto) {
        validStatuses.push(status);
      } else {
        orphanIds.push(status._id);
      }
    });

    // Limpiar huérfanos automáticamente
    if (orphanIds.length > 0) {
      logger.warn(`Detectados ${orphanIds.length} estados huérfanos en getAllStatus. Eliminando...`, { orphanIds });
      // No esperamos a que termine la eliminación para responder, pero manejamos errores en background
      ProductStatus.deleteMany({ _id: { $in: orphanIds } })
        .then(() => logger.info("Limpieza de estados huérfanos completada"))
        .catch(err => logger.error({ err }, "Error al limpiar estados huérfanos"));
    }

    // Ordenar alfabéticamente
    validStatuses.sort((a, b) => {
      const nameA = a.producto.nombre.toLowerCase();
      const nameB = b.producto.nombre.toLowerCase();
      return nameA.localeCompare(nameB);
    });

    res.json(validStatuses);
  } catch (error) {
    logger.error({ error }, "Error al obtener todos los estados");
    res
      .status(500)
      .json({ message: "Error al obtener estados", error: error.message });
  }
};

exports.getByStatus = async (req, res) => {
  try {
    const { estado } = req.params;
    const statuses = await ProductStatus.find({ estado, restaurante: req.user.restaurante }).populate(
      "producto",
      "nombre isDirectConsumption"
    );

    // Filtrar y limpiar huérfanos
    const validStatuses = [];
    const orphanIds = [];

    statuses.forEach(status => {
      if (status.producto) {
        validStatuses.push(status);
      } else {
        orphanIds.push(status._id);
      }
    });

    if (orphanIds.length > 0) {
      logger.warn(`Detectados ${orphanIds.length} estados huérfanos en getByStatus. Eliminando...`, { orphanIds });
      ProductStatus.deleteMany({ _id: { $in: orphanIds } }).catch(err => 
        logger.error({ err }, "Error al limpiar estados huérfanos en getByStatus")
      );
    }

    // Ordenar alfabéticamente
    validStatuses.sort((a, b) => {
        const nameA = a.producto.nombre.toLowerCase();
        const nameB = b.producto.nombre.toLowerCase();
        return nameA.localeCompare(nameB);
    });

    res.json(validStatuses);
  } catch (error) {
    logger.error({ error, params: req.params }, "Error al obtener por estado");
    res
      .status(500)
      .json({ message: "Error al obtener por estado", error: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { productoId } = req.params;
    const {
      fechaFrente,
      fechaAlmacen,
      cajasAlmacen,
      fechasAlmacen = [],
      // cajaUnica y hayUnicaCajaActual ya NO se leen del body, se calculan
    } = req.body;

    // 1. Preparamos los datos básicos que vienen del usuario
    const incomingData = {
      fechaFrente,
      fechaAlmacen,
      cajasAlmacen,
      fechasAlmacen,
    };

    let productStatus = await ProductStatus.findOne({ producto: productoId, restaurante: req.user.restaurante });
    const isNew = !productStatus;

    if (!productStatus) {
      productStatus = new ProductStatus({
        producto: productoId,
        restaurante: req.user.restaurante,
      });
    }

    // 2. Fusionamos datos: Lo que había en DB + Lo nuevo que llega
    // Esto es crucial para que el cálculo tenga todos los datos necesarios
    Object.assign(productStatus, incomingData);

    // 3. INVOCAMOS AL SERVICIO: Calculamos el estado basado en la fusión
    // Pasamos productStatus porque ahora ya contiene los datos mezclados
    const calculatedState = calculateProductStatus({
        fechaFrente: productStatus.fechaFrente,
        fechaAlmacen: productStatus.fechaAlmacen,
        cajasAlmacen: productStatus.cajasAlmacen,
        fechasAlmacen: productStatus.fechasAlmacen,
        estadoActual: productStatus.estado // Pasamos el estado actual por si acaso
    });

    // 4. Aplicamos los campos calculados al documento
    Object.assign(productStatus, calculatedState);

    // Forzamos la actualización de la fecha
    productStatus.updatedAt = new Date();

    const savedStatus = await productStatus.save();
    
    // ... resto del código (populate, socket, response) igual que antes ...
    const populatedStatus = await ProductStatus.findById(
      savedStatus._id
    ).populate("producto", "nombre tipo activo isDirectConsumption");

    logger.info(`Estado del producto actualizado: ${productoId} por usuario: ${req.user.username}`);

    const io = req.app.get('io');

    socketService.notifyStatusUpdate(
      io, 
      req.user.restaurante.toString(), 
      isNew ? "create" : "update", 
      populatedStatus
    );

    res.json(populatedStatus);
  } catch (error) {
    // ... tu manejo de errores existente ...
    logger.error({ error, params: req.params, body: req.body }, "Error al actualizar el estado del producto");
    if (error.name === "ValidationError") {
      const validationErrors = Object.keys(error.errors).map((key) => ({
        field: key,
        message: error.errors[key].message,
      }));
      return res.status(400).json({
        message: "Error de validación",
        errors: validationErrors,
      });
    }
    res.status(500).json({
      message: "Error al actualizar el estado",
      error: error.message,
    });
  }
};

exports.deleteStatus = async (req, res) => {
  try {
    const { productoId } = req.params;
    const deletedStatus = await ProductStatus.findOneAndDelete({
      producto: productoId,
      restaurante: req.user.restaurante,
    }).populate("producto", "nombre isDirectConsumption");

    if (deletedStatus) {
      logger.info(`Estado del producto eliminado: ${productoId}`);
      const io = req.app.get('io');
      
      socketService.notifyStatusDelete(
        io,
        req.user.restaurante.toString(),
        productoId,
        deletedStatus.producto
      );
    }

    res.json({ 
      message: "Estado eliminado correctamente",
      product: deletedStatus ? deletedStatus.producto : null
    });
  } catch (error) {
    logger.error({ error, params: req.params }, "Error al eliminar el estado del producto");
    res.status(400).json({ message: "Error al eliminar el estado" });
  }
};
