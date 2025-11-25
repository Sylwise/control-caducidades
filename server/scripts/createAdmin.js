const mongoose = require("mongoose");
const User = require("../models/User"); // bcrypt ya no es necesario aquí
const logger = require("../logger");
require("dotenv").config({ path: "./.env" });

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info("Conectado a MongoDB");

    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    const adminPassword = process.env.ADMIN_PASSWORD || "adminpassword";

    const existingAdmin = await User.findOne({ username: adminUsername });

    if (existingAdmin) {
      logger.info("El usuario admin ya existe, no se tomarán acciones.");
      // Si el usuario ya existe, podríamos querer eliminarlo para recrearlo correctamente.
      // Por ahora, asumiremos que el usuario lo borrará manualmente si es necesario.
      return;
    }

    const admin = new User({
      username: adminUsername,
      password: adminPassword, // Pasamos la contraseña en texto plano
      role: "supervisor",
      restaurante: "Restaurante Principal",
    });

    await admin.save();
    logger.info("Usuario admin creado exitosamente");
  } catch (error) {
    logger.error({ error }, "Error al crear el usuario admin");
  } finally {
    await mongoose.disconnect();
    logger.info("Desconectado de MongoDB");
  }
};

createAdmin();
