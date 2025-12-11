const mongoose = require("mongoose");
const path = require("path");
const Product = require("../models/Product");

// Determinar entorno y cargar variables
const isProduction = process.env.NODE_ENV === "production";
const envFile = isProduction ? ".env.production" : ".env";
const envPath = path.join(__dirname, `../../${envFile}`);

try {
  require("dotenv").config({ path: envPath });
} catch (e) {
  // Ignorar error de carga de .env
}

const migrateTimestamps = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI no está definida.");
    }

    console.log("Conectando a MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Buscar productos sin updatedAt
    // Nota: Mongoose timestamps true crea el campo automaticamente al guardar, 
    // pero si fueron creados sin schema o importados, podrian faltar.
    const query = { updatedAt: { $exists: false } };
    const count = await Product.countDocuments(query);

    console.log(`Encontrados ${count} productos sin 'updatedAt'.`);

    if (count === 0) {
      console.log("No se requiere migración.");
      process.exit(0);
    }

    console.log("Iniciando migración...");
    
    const products = await Product.find(query);
    const now = new Date();
    let updatedCount = 0;

    for (const p of products) {
        // Usar createdAt si existe, si no, usar ahora (resetear frescura)
        const newDate = p.createdAt || now;
        
        // Actualizamos usando updateOne para evitar validaciones excesivas o hooks si no son necesarios,
        // pero timestamps: true de mongoose podria interferir si usamos save().
        // Forzamos el set manual.
        await Product.updateOne(
            { _id: p._id },
            { $set: { updatedAt: newDate } },
            { timestamps: false } // Importante: evitar que mongoose overwrite con 'now' si queremos usar 'createdAt'
        );
        updatedCount++;
        if (updatedCount % 10 === 0) process.stdout.write(".");
    }

    console.log(`\n\nMigración completada. ${updatedCount} productos actualizados.`);
    process.exit(0);

  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

migrateTimestamps();
