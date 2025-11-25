const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const logger = require("../logger");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "El nombre de usuario es obligatorio"],
      unique: true,
      trim: true,
      minlength: [3, "El nombre de usuario debe tener al menos 3 caracteres"],
      maxlength: [
        20,
        "El nombre de usuario no puede tener más de 20 caracteres",
      ],
      validate: {
        validator: function (v) {
          return /^[a-zA-Z0-9_-]+$/.test(v);
        },
        message:
          "El nombre de usuario solo puede contener letras, números, guiones y guiones bajos",
      },
    },
    password: {
      type: String,
      required: [true, "La contraseña es obligatoria"],
      minlength: [6, "La contraseña debe tener al menos 6 caracteres"],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ["supervisor", "encargado"],
        message: "El rol debe ser supervisor o encargado",
      },
      required: [true, "El rol es obligatorio"],
    },
    restaurante: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Middleware para hashear la contraseña antes de guardar
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    logger.error({ error, userId: this._id }, "Error al hashear la contraseña");
    next(error);
  }
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    logger.error({ error, userId: this._id }, "Error al comparar contraseñas");
    throw new Error("Error al comparar contraseñas");
  }
};

// Método para devolver el usuario sin campos sensibles
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

logger.info("Modelo de Usuario configurado exitosamente");

module.exports = mongoose.model("User", userSchema);
