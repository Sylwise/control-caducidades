const mongoose = require("mongoose");
const path = require("path");
const logger = require("../logger");

// Cargar variables de entorno
const envPath = path.join(__dirname, "../.env");
require("dotenv").config({ path: envPath });

const CatalogProduct = require("../models/CatalogProduct");

const fixIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info("Conectado a MongoDB");

    const collection = mongoose.connection.collection("catalogproducts");
    
    // 1. Listar índices actuales
    const indexes = await collection.indexes();
    logger.info("Índices actuales:", indexes);

    // 2. Buscar y eliminar el índice problemático (nombre_1)
    const nameIndex = indexes.find(idx => idx.name === "nombre_1");
    if (nameIndex) {
      logger.info("Eliminando índice global 'nombre_1'...");
      await collection.dropIndex("nombre_1");
      logger.info("Índice 'nombre_1' eliminado correctamente.");
    } else {
      logger.info("El índice 'nombre_1' no existe, continuando...");
    }

    // 3. Crear el nuevo índice compuesto (nombre + restaurante)
    logger.info("Creando índice compuesto único (nombre + restaurante)...");
    // Usamos createIndex directamente en la colección para asegurar
    await collection.createIndex(
      { nombre: 1, restaurante: 1 },
      { unique: true, name: "nombre_restaurante_unique" }
    );
    logger.info("Nuevo índice compuesto creado exitosamente.");

    logger.info("Operación completada.");
    process.exit(0);
  } catch (error) {
    logger.error("Error al arreglar índices:", error);
    process.exit(1);
  }
};

fixIndexes();
