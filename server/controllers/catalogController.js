const CatalogProduct = require("../models/CatalogProduct");
const ProductStatus = require("../models/Product");
const logger = require("../logger");
const { runInTransaction } = require("../utils/transaction");

// Obtener todos los productos del catálogo
exports.getAllProducts = async (req, res) => {
  try {
    logger.info("Obteniendo todos los productos del catálogo");
    logger.info("Obteniendo todos los productos del catálogo");
    const products = await CatalogProduct.find({ restaurante: req.user.restaurante }).sort({ nombre: 1 });
    logger.info(`Se encontraron ${products.length} productos`);
    res.json(products);
  } catch (error) {
    logger.error({ error }, "Error al obtener productos del catálogo");
    res.status(500).json({
      message: "Error al obtener productos",
      error: error.message,
    });
  }
};

// Añadir nuevo producto al catálogo
exports.addProduct = async (req, res) => {
  try {
    const result = await runInTransaction(async (session) => {
      const productData = {
        ...req.body,
        restaurante: req.user.restaurante
      };
      const newProduct = new CatalogProduct(productData);
      const savedProduct = await newProduct.save({ session });

      const newStatus = new ProductStatus({
        producto: savedProduct._id,
        producto: savedProduct._id,
        restaurante: req.user.restaurante,
        estado: "sin-clasificar",
      });
      const savedStatus = await newStatus.save({ session });

      return { savedProduct, savedStatus };
    });

    logger.info(`Producto añadido al catálogo y estado inicial creado: ${result.savedProduct.nombre}`);

    const populatedStatus = await ProductStatus.findById(result.savedStatus._id).populate("producto");

    const io = req.app.get('io');
    if (io) {
        logger.info(`Emitting catalogUpdate event for product: ${populatedStatus.producto.nombre} to restaurant: ${req.user.restaurante}`);
        io.to(req.user.restaurante.toString()).emit("catalogUpdate", {
            type: "create",
            productStatus: populatedStatus,
        });
    } else {
        logger.error("Socket.io instance not found in request");
    }

    res.status(201).json(populatedStatus);
  } catch (error) {
    logger.error({ error, body: req.body }, "Error al añadir producto al catálogo");
    
    // Explicitly handle duplicate key error (E11000)
    if (error.code === 11000 || (error.errorLabels && error.errorLabels.includes('TransientTransactionError') === false && error.message.includes('11000'))) {
        return res.status(400).json({ 
            message: "Error de duplicado", 
            error: "Ya existe un producto con ese nombre en este restaurante" 
        });
    }

    res
      .status(400)
      .json({ message: "Error al añadir producto", error: error.message });
  }
};

const mongoose = require("mongoose");

// Eliminar un producto
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    await runInTransaction(async (session) => {
      const deletedProduct = await CatalogProduct.findOneAndDelete(
        { _id: id, restaurante: req.user.restaurante },
        { session }
      );

      if (!deletedProduct) {
        throw new Error("Producto no encontrado");
      }

      await ProductStatus.deleteMany({ producto: id }, { session });
    });

    logger.info(`Producto eliminado del catálogo y estados asociados: ${id}`);

    const io = req.app.get('io');
    io.to(req.user.restaurante.toString()).emit("catalogUpdate", {
      type: "delete",
      productId: id,
    });

    res.json({ message: "Producto eliminado correctamente" });
  } catch (error) {
    logger.error({ error, params: req.params }, "Error al eliminar producto del catálogo");
    
    if (error.message === "Producto no encontrado") {
        return res.status(404).json({ message: "Producto no encontrado" });
    }

    res
      .status(400)
      .json({ message: "Error al eliminar producto", error: error.message });
  }
};

// Desactivar/activar un producto
exports.toggleProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await CatalogProduct.findOne({ _id: id, restaurante: req.user.restaurante });

    if (!product) {
      logger.warn(`Intento de activar/desactivar un producto no encontrado: ${id}`);
      return res.status(404).json({
        message: "Producto no encontrado",
      });
    }

    product.activo = !product.activo;
    const updatedProduct = await product.save();
    logger.info(`Estado del producto actualizado: ${updatedProduct.nombre}, activo: ${updatedProduct.activo}`);

    const io = req.app.get('io');
    io.to(req.user.restaurante.toString()).emit("catalogUpdate", {
      type: "update",
      product: updatedProduct,
    });

    res.json(updatedProduct);
  } catch (error) {
    logger.error({ error, params: req.params }, "Error al activar/desactivar producto");
    res.status(400).json({
      message: "Error al actualizar producto",
      error: error.message,
    });
  }
};

// Actualizar un producto del catálogo
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const allowedUpdates = ['nombre', 'tipo', 'activo', 'isDirectConsumption'];
    const updates = {};
    
    for (const key of allowedUpdates) {
      if (updateData[key] !== undefined) {
        updates[key] = updateData[key];
      }
    }
    
    const updatedProduct = await CatalogProduct.findOneAndUpdate(
      { _id: id, restaurante: req.user.restaurante },
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      logger.warn(`Intento de actualizar un producto no encontrado: ${id}`);
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    logger.info(`Producto actualizado en el catálogo: ${updatedProduct.nombre}`);

    const io = req.app.get('io');
    io.to(req.user.restaurante.toString()).emit("catalogUpdate", {
      type: "update",
      product: updatedProduct,
    });

    res.json(updatedProduct);
  } catch (error) {
    logger.error({ error, params: req.params, body: req.body }, "Error al actualizar producto del catálogo");
    res.status(400).json({
      message: "Error al actualizar producto",
      error: error.message,
    });
  }
};
