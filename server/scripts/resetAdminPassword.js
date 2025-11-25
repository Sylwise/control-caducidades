const mongoose = require("mongoose");
const User = require("../models/User");
const logger = require("../logger");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const upsertAdminUser = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI not found in environment variables");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    logger.info("Conectado a MongoDB");

    const adminUsername = "Admin";
    const newPassword = "admin123";

    let user = await User.findOne({ username: adminUsername });

    if (!user) {
      logger.info(`Usuario '${adminUsername}' no encontrado. Creando nuevo usuario...`);
      user = new User({
        username: adminUsername,
        password: newPassword,
        role: "supervisor",
        restaurante: "Restaurante Principal"
      });
    } else {
      logger.info(`Usuario '${adminUsername}' encontrado. Actualizando contraseña...`);
      user.password = newPassword;
    }

    await user.save();
    logger.info(`Usuario '${adminUsername}' configurado exitosamente con contraseña '${newPassword}'`);

  } catch (error) {
    logger.error({ error }, "Error al configurar usuario admin");
  } finally {
    await mongoose.disconnect();
    logger.info("Desconectado de MongoDB");
    process.exit(0);
  }
};

upsertAdminUser();
