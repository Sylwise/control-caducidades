const mongoose = require("mongoose");
const path = require("path");
const Restaurant = require("../models/Restaurant");
const User = require("../models/User");
const CatalogProduct = require("../models/CatalogProduct");
const ProductStatus = require("../models/Product"); // Note: Model name is ProductStatus, file is Product.js

// Cargar variables de entorno
const envPath = path.join(__dirname, "../../.env");
require("dotenv").config({ path: envPath });

const migrate = async () => {
  try {
    console.log("Iniciando migración de multi-tenancy...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Conectado a MongoDB");

    // 1. Crear o buscar el Restaurante Principal
    let defaultRestaurant = await Restaurant.findOne({ nombre: "Restaurante Principal" });
    if (!defaultRestaurant) {
      defaultRestaurant = await Restaurant.create({
        nombre: "Restaurante Principal",
        direccion: "Sede Central",
        activo: true,
      });
      console.log("Restaurante Principal creado:", defaultRestaurant._id);
    } else {
      console.log("Restaurante Principal ya existe:", defaultRestaurant._id);
    }

    // 2. Migrar Usuarios
    const usersResult = await User.updateMany(
      { restaurante: { $exists: false } },
      { $set: { restaurante: defaultRestaurant._id } }
    );
    console.log(`Usuarios migrados: ${usersResult.modifiedCount}`);

    // 3. Migrar Productos del Catálogo
    const productsResult = await CatalogProduct.updateMany(
      { restaurante: { $exists: false } },
      { $set: { restaurante: defaultRestaurant._id } }
    );
    console.log(`Productos de catálogo migrados: ${productsResult.modifiedCount}`);

    // 4. Migrar Estados de Productos
    const statusResult = await ProductStatus.updateMany(
      { restaurante: { $exists: false } },
      { $set: { restaurante: defaultRestaurant._id } }
    );
    console.log(`Estados de productos migrados: ${statusResult.modifiedCount}`);

    console.log("Migración completada con éxito.");
    process.exit(0);
  } catch (error) {
    console.error("Error durante la migración:", error);
    process.exit(1);
  }
};

migrate();
