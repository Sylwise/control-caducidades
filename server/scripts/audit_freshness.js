const mongoose = require("mongoose");
const path = require("path");
const Product = require("../models/Product");

// Determinar entorno y cargar variables
const isProduction = process.env.NODE_ENV === "production";
const envFile = isProduction ? ".env.production" : ".env";
const envPath = path.join(__dirname, `../../${envFile}`);

// Intentar cargar dotenv solo si no estamos en producción o si queremos forzarlo
// En Railway las variables suelen estar ya en el process.env
try {
  require("dotenv").config({ path: envPath });
} catch (e) {
  console.log("Nota: No se pudo cargar archivo .env (normal en producción si se usan variables de entorno)");
}

const auditFreshness = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI no está definida en las variables de entorno.");
    }

    console.log("Conectando a MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Conectado.");

    const totalProducts = await Product.countDocuments();
    console.log(`\nTotal de productos: ${totalProducts}`);

    // Check 1: Missing updatedAt
    const missingUpdatedAt = await Product.countDocuments({ updatedAt: { $exists: false } });
    console.log(`Productos sin campo 'updatedAt': ${missingUpdatedAt}`);

    if (totalProducts === 0) {
      console.log("No hay productos para analizar.");
      process.exit(0);
    }

    // Check 2: Freshness Distribution
    const products = await Product.find({}, "updatedAt producto");
    const now = new Date();
    
    let stats = {
      fresh: 0,   // 0-2 days
      stale: 0,   // 2-4 days
      old: 0,     // 4-7 days
      abandoned: 0 // >7 days
    };

    let invalidDates = 0;

    products.forEach(p => {
      if (!p.updatedAt) {
        // En la UI, si falta updatedAt devuelve 0 (Fresh)
        stats.fresh++; 
        return;
      }

      const updated = new Date(p.updatedAt);
      if (isNaN(updated.getTime())) {
        invalidDates++;
        return;
      }

      const daysDiff = (now - updated) / (1000 * 60 * 60 * 24);

      if (daysDiff > 7) stats.abandoned++;
      else if (daysDiff > 4) stats.old++;
      else if (daysDiff > 2) stats.stale++;
      else stats.fresh++;
    });

    console.log("\nDistribución de 'Frescura' (simulación servidores):");
    console.log(`- Fresh (0-2 días): ${stats.fresh}`);
    console.log(`- Stale (2-4 días): ${stats.stale}`);
    console.log(`- Old (4-7 días): ${stats.old}`);
    console.log(`- Abandoned (>7 días): ${stats.abandoned}`);
    
    if (invalidDates > 0) {
       console.log(`- Fechas inválidas: ${invalidDates}`);
    }

    console.log("\nSimulación completada.");
    process.exit(0);

  } catch (error) {
    console.error("Error durante la auditoría:", error);
    process.exit(1);
  }
};

auditFreshness();
