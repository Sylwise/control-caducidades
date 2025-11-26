const User = require("../models/User");
const logger = require("../logger");

const seedAdmin = async () => {
  try {
    const userCount = await User.countDocuments();
    
    if (userCount === 0) {
      logger.info("Base de datos de usuarios vacía. Creando usuario administrador inicial...");
      
      const adminUser = new User({
        username: "admin",
        password: "admin123456",
        role: "supervisor",
        restaurante: "Administración Central"
      });

      await adminUser.save();
      logger.info("✅ Usuario administrador creado exitosamente: admin / admin123456");
    } else {
      logger.info("Usuarios existentes detectados. Saltando seed inicial.");
    }
  } catch (error) {
    logger.error({ error }, "Error al intentar sembrar el usuario administrador");
  }
};

module.exports = { seedAdmin };
