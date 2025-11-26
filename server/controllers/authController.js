const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const logger = require("../logger");

// Login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    logger.info(`Intento de login para el usuario: ${username}`);

    if (!username || !password) {
      logger.warn("Intento de login con credenciales faltantes");
      return res.status(400).json({
        error: "Usuario y contraseña son requeridos",
      });
    }

    const user = await User.findOne({ username }).select("+password");

    if (!user) {
      logger.warn(`Intento de login para usuario no existente: ${username}`);
      return res.status(401).json({
        error: "Credenciales inválidas",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      logger.warn(`Intento de login con contraseña incorrecta para: ${username}`);
      return res.status(401).json({
        error: "Credenciales inválidas",
      });
    }

    if (!process.env.JWT_SECRET) {
      logger.error("JWT_SECRET no está definido en el entorno");
      return res.status(500).json({
        error: "Error de configuración del servidor",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    logger.info(`Login exitoso para el usuario: ${username}`);

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error({ error }, "Error en el proceso de login");
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener usuario actual
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json(user);
  } catch (error) {
    logger.error({ error, userId: req.user.id }, "Error al obtener usuario actual");
    res.status(500).json({
      error: "Error al obtener usuario",
    });
  }
};

// Cambiar contraseña
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Contraseña actual y nueva son requeridas",
      });
    }

    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        error: "Contraseña actual incorrecta",
      });
    }

    user.password = newPassword;
    await user.save();
    logger.info(`Contraseña actualizada para el usuario: ${user.username}`);

    res.json({
      message: "Contraseña actualizada correctamente",
    });
  } catch (error) {
    logger.error({ error, userId: req.user.id }, "Error al cambiar contraseña");
    res.status(500).json({
      error: "Error al cambiar contraseña",
    });
  }
};

// Obtener todos los usuarios (solo supervisor)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    logger.error({ error }, "Error al obtener todos los usuarios");
    res.status(500).json({
      error: "Error al obtener usuarios",
    });
  }
};

// Crear usuario (solo supervisor)
exports.createUser = async (req, res) => {
  try {
    const { username, password, role, restaurante } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({
        error: "Todos los campos son requeridos",
      });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        error: "El usuario ya existe",
      });
    }

    const user = new User({
      username,
      password,
      role,
      restaurante,
    });

    await user.save();
    logger.info(`Nuevo usuario creado: ${username}`);

    const io = req.app.get('io');
    io.to("supervisors").emit("userUpdate", {
      type: "create",
      user: user.toJSON(),
    });

    res.status(201).json({
      message: "Usuario creado correctamente",
      user: user.toJSON(),
    });
  } catch (error) {
    logger.error({ error, body: req.body }, "Error al crear usuario");
    if (error.name === "ValidationError") {
      return res.status(400).json({
        error: "Error de validación",
        details: Object.values(error.errors).map((err) => err.message),
      });
    }
    res.status(500).json({
      error: "Error al crear usuario",
    });
  }
};

// Actualizar usuario (solo supervisor)
exports.updateUser = async (req, res) => {
  try {
    const { username, role } = req.body;
    const userId = req.params.id;

    if (!username || !role) {
      return res.status(400).json({
        error: "Nombre de usuario y rol son requeridos",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    user.username = username;
    user.role = role;
    await user.save();
    logger.info(`Usuario actualizado: ${username}`);

    const io = req.app.get('io');
    io.to("supervisors").emit("userUpdate", {
      type: "update",
      user: user.toJSON(),
    });

    res.json({
      message: "Usuario actualizado correctamente",
      user: user.toJSON(),
    });
  } catch (error) {
    logger.error({ error, params: req.params, body: req.body }, "Error al actualizar usuario");
    res.status(500).json({
      error: "Error al actualizar usuario",
    });
  }
};

// Eliminar usuario (solo supervisor)
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    if (user.role === "supervisor") {
      const supervisorCount = await User.countDocuments({ role: "supervisor" });
      if (supervisorCount <= 1) {
        return res.status(400).json({
          error: "No se puede eliminar al último supervisor",
        });
      }
    }

    await user.deleteOne();
    logger.info(`Usuario eliminado: ${user.username}`);

    const io = req.app.get('io');
    io.to("supervisors").emit("userUpdate", {
      type: "delete",
      userId: userId,
    });

    res.json({
      message: "Usuario eliminado correctamente",
    });
  } catch (error) {
    logger.error({ error, params: req.params }, "Error al eliminar usuario");
    res.status(500).json({
      error: "Error al eliminar usuario",
    });
  }
};
