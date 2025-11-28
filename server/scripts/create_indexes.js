const mongoose = require("mongoose");
const path = require("path");
const logger = require("../logger");

// Cargar variables de entorno
const envPath = path.join(
  __dirname,
  "../",
  process.env.NODE_ENV === "production" ? ".env.production" : ".env"
);
require("dotenv").config({ path: envPath });

const ProductStatus = require("../models/Product");
const CatalogProduct = require("../models/CatalogProduct");
const User = require("../models/User");

const createIndexes = async () => {
  try {
    logger.info("Conectando a MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info("Conectado a MongoDB");

    logger.info("Creando índices para ProductStatus...");
    // 1. Índice simple por restaurante (para getAllStatus)
    await ProductStatus.collection.createIndex({ restaurante: 1 });
    
    // 2. Índice compuesto por restaurante y estado (para getByStatus)
    await ProductStatus.collection.createIndex({ restaurante: 1, estado: 1 });
    
    // 3. Índice compuesto único por restaurante y producto (para evitar duplicados y búsquedas rápidas)
    await ProductStatus.collection.createIndex({ restaurante: 1, producto: 1 }, { unique: true });

    logger.info("Creando índices para CatalogProduct...");
    // 1. Índice simple por restaurante (para búsquedas generales)
    await CatalogProduct.collection.createIndex({ restaurante: 1 });
    
    // 2. Índice compuesto por restaurante y nombre (para ordenamiento y unicidad)
    // Nota: Usamos collation para ordenamiento case-insensitive si es necesario, 
    // pero por ahora índice simple para soportar el sort({ nombre: 1 })
    await CatalogProduct.collection.createIndex({ restaurante: 1, nombre: 1 });

    logger.info("Creando índices para User...");
    // 1. Índice por restaurante (para listar usuarios de un restaurante)
    await User.collection.createIndex({ restaurante: 1 });

    logger.info("Índices creados exitosamente");
    
    // Listar índices actuales para verificación
    const statusIndexes = await ProductStatus.collection.indexes();
    const catalogIndexes = await CatalogProduct.collection.indexes();
    const userIndexes = await User.collection.indexes();

    console.log("\nÍndices en ProductStatus:", statusIndexes);
    console.log("\nÍndices en CatalogProduct:", catalogIndexes);
    console.log("\nÍndices en User:", userIndexes);

  } catch (error) {
    logger.error("Error creando índices:", error);
  } finally {
    await mongoose.disconnect();
    logger.info("Desconectado de MongoDB");
  }
};

createIndexes();
