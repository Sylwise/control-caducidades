const mongoose = require("mongoose");
const path = require("path");
const User = require("../models/User");
const Restaurant = require("../models/Restaurant");

// Cargar variables de entorno
const envPath = path.join(__dirname, "../../.env");
require("dotenv").config({ path: envPath });

const createAdmin = async () => {
  try {
    console.log("Conectando a MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Conectado.");

    // 1. Buscar o Crear Restaurante Principal
    let restaurant = await Restaurant.findOne({ nombre: "Restaurante Principal" });
    if (!restaurant) {
      console.log("Creando Restaurante Principal...");
      restaurant = await Restaurant.create({
        nombre: "Restaurante Principal",
        direccion: "Sede Central",
        activo: true,
      });
    }
    console.log("Restaurante ID:", restaurant._id);

    // 2. Crear o Actualizar Admin
    const adminData = {
      username: "admin",
      password: "admin123456",
      role: "admin",
      restaurante: restaurant._id,
    };

    // Usamos findOne primero para obtener la instancia y poder usar .save() (para que corra el pre-save hook de bcrypt)
    let admin = await User.findOne({ username: "admin" });

    if (admin) {
      console.log("Usuario admin existente. Actualizando...");
      admin.password = adminData.password;
      admin.role = adminData.role;
      admin.restaurante = adminData.restaurante;
    } else {
      console.log("Creando nuevo usuario admin...");
      admin = new User(adminData);
    }

    await admin.save();
    console.log("✅ Usuario admin configurado correctamente.");
    console.log("Credenciales: admin / admin123456");

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

createAdmin();
