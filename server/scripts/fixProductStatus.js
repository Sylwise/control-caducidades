const mongoose = require("mongoose");
const path = require("path");
const CatalogProduct = require("../models/CatalogProduct");
const ProductStatus = require("../models/Product");

const envPath = path.resolve(__dirname, "../.env");
require("dotenv").config({ path: envPath });

async function fixProductStatus() {
  try {
    const MONGODB_URI =
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/control-caducidades";
    console.log("Conectando a:", MONGODB_URI);

    await mongoose.connect(MONGODB_URI);

    // Buscar el zumo de naranja
    const catalogProduct = await CatalogProduct.findOne({ nombre: /naranja/i });

    if (catalogProduct) {
      // Actualizar el estado del producto
      const productStatus = await ProductStatus.findOne({
        producto: catalogProduct._id,
      });

      if (productStatus) {
        // Si las fechas son iguales y no hay otras condiciones, establecer como "sin-clasificar"
        if (
          productStatus.fechaFrente &&
          productStatus.fechaAlmacen &&
          productStatus.fechaFrente.getTime() ===
            productStatus.fechaAlmacen.getTime() &&
          !productStatus.cajaUnica &&
          !productStatus.hayOtrasFechas
        ) {
          productStatus.estado = "sin-clasificar";
          await productStatus.save();
          console.log('Estado actualizado a "sin-clasificar"');
        }

        console.log("Estado actualizado del producto:", productStatus);
      }
    }

    mongoose.connection.close();
  } catch (error) {
    console.error("Error:", error);
    mongoose.connection.close();
  }
}

fixProductStatus();
