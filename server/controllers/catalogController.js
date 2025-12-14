const CatalogProduct = require("../models/CatalogProduct");
const ProductStatus = require("../models/Product");
const logger = require("../logger");
const { runInTransaction } = require("../utils/transaction");

const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

// Obtener todos los productos del catálogo
exports.getAllProducts = catchAsync(async (req, res, next) => {
  logger.info("Obteniendo todos los productos del catálogo");
  
  const products = await CatalogProduct.find({ restaurante: req.user.restaurante }).sort({ nombre: 1 });
  
  logger.info(`Se encontraron ${products.length} productos`);
  
  res.status(200).json({
    status: 'success',
    results: products.length,
    data: products
  });
});

// Añadir nuevo producto al catálogo
exports.addProduct = catchAsync(async (req, res, next) => {
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

    res.status(201).json({
        status: 'success',
        data: populatedStatus
    });
});

const mongoose = require("mongoose");

// Eliminar un producto
exports.deleteProduct = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    await runInTransaction(async (session) => {
      const deletedProduct = await CatalogProduct.findOneAndDelete(
        { _id: id, restaurante: req.user.restaurante },
        { session }
      );

      if (!deletedProduct) {
        throw new AppError("Producto no encontrado", 404);
      }

      await ProductStatus.deleteMany({ producto: id }, { session });
    });

    logger.info(`Producto eliminado del catálogo y estados asociados: ${id}`);

    const io = req.app.get('io');
    io.to(req.user.restaurante.toString()).emit("catalogUpdate", {
      type: "delete",
      productId: id,
    });

    res.status(204).json({
        status: 'success',
        data: null
    });
});

// Desactivar/activar un producto
exports.toggleProductStatus = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const product = await CatalogProduct.findOne({ _id: id, restaurante: req.user.restaurante });

    if (!product) {
      return next(new AppError("Producto no encontrado", 404));
    }

    product.activo = !product.activo;
    const updatedProduct = await product.save();
    logger.info(`Estado del producto actualizado: ${updatedProduct.nombre}, activo: ${updatedProduct.activo}`);

    const io = req.app.get('io');
    io.to(req.user.restaurante.toString()).emit("catalogUpdate", {
      type: "update",
      product: updatedProduct,
    });

    res.status(200).json({
        status: 'success',
        data: updatedProduct
    });
});

// Actualizar un producto del catálogo
exports.updateProduct = catchAsync(async (req, res, next) => {
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
      return next(new AppError("Producto no encontrado", 404));
    }

    logger.info(`Producto actualizado en el catálogo: ${updatedProduct.nombre}`);

    const io = req.app.get('io');
    io.to(req.user.restaurante.toString()).emit("catalogUpdate", {
      type: "update",
      product: updatedProduct,
    });

    res.status(200).json({
        status: 'success',
        data: updatedProduct
    });
});
