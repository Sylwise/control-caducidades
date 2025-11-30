const ProductStatus = require("../models/Product");
const logger = require("../logger");
const socketService = require("../services/socketService");

exports.getAllStatus = async (req, res) => {
  try {
    const statuses = await ProductStatus.find({ restaurante: req.user.restaurante }).populate("producto", "nombre");
    res.json(statuses);
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
      "nombre"
    );
    res.json(statuses);
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
      cajaUnica,
      hayUnicaCajaActual,
    } = req.body;

    const updateData = {
      fechaFrente,
      fechaAlmacen,
      cajasAlmacen,
      fechasAlmacen,
      cajaUnica: Boolean(cajaUnica),
      hayUnicaCajaActual: Boolean(hayUnicaCajaActual),
    };

    let productStatus = await ProductStatus.findOne({ producto: productoId, restaurante: req.user.restaurante });
    const isNew = !productStatus;

    if (productStatus) {
      Object.assign(productStatus, updateData);
    } else {
      productStatus = new ProductStatus({
        producto: productoId,
        restaurante: req.user.restaurante,
        ...updateData,
      });
    }

    // Forzamos la actualización de la fecha para confirmar la revisión manual
    productStatus.updatedAt = new Date();

    const savedStatus = await productStatus.save();
    const populatedStatus = await ProductStatus.findById(
      savedStatus._id
    ).populate("producto", "nombre tipo activo");

    logger.info(`Estado del producto actualizado: ${productoId}`);

    const io = req.app.get('io');
    socketService.notifyStatusUpdate(
      io, 
      req.user.restaurante, 
      isNew ? "create" : "update", 
      populatedStatus
    );

    res.json(populatedStatus);
  } catch (error) {
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
    }).populate("producto");

    if (deletedStatus) {
      logger.info(`Estado del producto eliminado: ${productoId}`);
      const io = req.app.get('io');
      socketService.notifyStatusDelete(
        io,
        req.user.restaurante,
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
