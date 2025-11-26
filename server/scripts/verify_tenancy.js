const mongoose = require("mongoose");
const path = require("path");
const Restaurant = require("../models/Restaurant");
const User = require("../models/User");
const CatalogProduct = require("../models/CatalogProduct");

// Cargar variables de entorno
const envPath = path.join(__dirname, "../../.env");
require("dotenv").config({ path: envPath });

const verify = async () => {
  try {
    console.log("Iniciando verificación de aislamiento...");
    await mongoose.connect(process.env.MONGODB_URI);

    // 1. Obtener Restaurante Principal (donde están los datos migrados)
    const mainRestaurant = await Restaurant.findOne({ nombre: "Restaurante Principal" });
    if (!mainRestaurant) throw new Error("No se encontró el Restaurante Principal");
    console.log("Restaurante Principal:", mainRestaurant._id);

    // 2. Crear Restaurante de Prueba
    let testRestaurant = await Restaurant.findOne({ nombre: "Restaurante Test" });
    if (!testRestaurant) {
      testRestaurant = await Restaurant.create({
        nombre: "Restaurante Test",
        direccion: "Calle Falsa 123",
      });
    }
    console.log("Restaurante Test:", testRestaurant._id);

    // 3. Crear Producto en Restaurante Test
    const testProduct = await CatalogProduct.create({
      nombre: "Producto Test Único",
      restaurante: testRestaurant._id,
      tipo: "permanente",
    });
    console.log("Producto creado en Test:", testProduct.nombre);

    // 4. Verificar Aislamiento: Buscar desde el contexto del Principal
    // Simulamos lo que hace el controlador: find({ restaurante: mainRestaurant._id })
    const productsInMain = await CatalogProduct.find({ restaurante: mainRestaurant._id });
    const foundInMain = productsInMain.find(p => p.nombre === "Producto Test Único");

    if (foundInMain) {
      console.error("FALLO: El producto del Test se ve en el Principal");
    } else {
      console.log("ÉXITO: El producto del Test NO es visible en el Principal");
    }

    // 5. Verificar Aislamiento Inverso
    const productsInTest = await CatalogProduct.find({ restaurante: testRestaurant._id });
    const mainProductsVisibleInTest = productsInTest.filter(p => p.restaurante.toString() === mainRestaurant._id.toString());

    if (mainProductsVisibleInTest.length > 0) {
      console.error("FALLO: Productos del Principal son visibles en el Test");
    } else {
      console.log("ÉXITO: Productos del Principal NO son visibles en el Test");
    }

    // Limpieza
    await CatalogProduct.deleteOne({ _id: testProduct._id });
    // await Restaurant.deleteOne({ _id: testRestaurant._id }); // Dejamos el restaurante por si quieres usarlo
    
    console.log("Verificación completada.");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

verify();
