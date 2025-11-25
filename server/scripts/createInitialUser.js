const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config({ path: "../.env" });

async function createInitialSupervisor() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/control-caducidades"
    );
    console.log("Conectado a MongoDB");

    // Verificar si ya existe un supervisor
    const existingSupervisor = await User.findOne({ role: "supervisor" });
    if (existingSupervisor) {
      console.log("Ya existe un supervisor en el sistema");
      process.exit(0);
    }

    // Crear nuevo supervisor
    const supervisor = new User({
      username: "admin",
      password: "admin123456",
      role: "supervisor",
      restaurante: "Administración Central",
    });

    await supervisor.save();
    console.log("Supervisor creado exitosamente:");
    console.log("Username:", supervisor.username);
    console.log("Password: admin123456");
    console.log("Role:", supervisor.role);
    console.log(
      "\nPor favor, cambia la contraseña después del primer inicio de sesión."
    );
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

createInitialSupervisor();
