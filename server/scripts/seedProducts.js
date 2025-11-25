const mongoose = require("mongoose");
const CatalogProduct = require("../models/CatalogProduct");

const initialProducts = [
  { nombre: "Ketchup", tipo: "permanente" },
  { nombre: "Chocolate blanco", tipo: "permanente" },
  { nombre: "Chocolate", tipo: "permanente" },
  { nombre: "Caramelo", tipo: "permanente" },
  { nombre: "Leche", tipo: "permanente" },
  { nombre: "Café", tipo: "permanente" },
  { nombre: "Café descafeinado", tipo: "permanente" },
  { nombre: "Salsa barbacoa", tipo: "permanente" },
  { nombre: "Salsa agridulce", tipo: "permanente" },
  { nombre: "Salsa deluxe", tipo: "permanente" },
  { nombre: "Salsa buffalo", tipo: "permanente" },
  { nombre: "Sobres sour cream", tipo: "permanente" },
  { nombre: "Vinagre", tipo: "permanente" },
  { nombre: "Aceite", tipo: "permanente" },
  { nombre: "Zumo de naranja", tipo: "permanente" },
  { nombre: "Zumo de manzana", tipo: "permanente" },
  { nombre: "Danonino", tipo: "permanente" },
  { nombre: "Cerveza sin alcohol", tipo: "permanente" },
  { nombre: "Cerveza sin gluten", tipo: "permanente" },
  { nombre: "Gazpacho", tipo: "permanente" },
  { nombre: "Kit-Kat", tipo: "permanente" },
  { nombre: "Oreo", tipo: "permanente" },
  { nombre: "Lotus", tipo: "permanente" },
];

const seedProducts = async () => {
  try {
    // Conexión a MongoDB
    await mongoose.connect("mongodb://localhost:27017/control-caducidades");
    console.log("Conectado a MongoDB");

    // Eliminar productos existentes
    await CatalogProduct.deleteMany({});
    console.log("Catálogo limpiado");

    // Insertar nuevos productos
    await CatalogProduct.insertMany(initialProducts);
    console.log("Productos insertados correctamente");

    // Cerrar conexión
    await mongoose.connection.close();
    console.log("Conexión cerrada");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

// Ejecutar el script
seedProducts();
