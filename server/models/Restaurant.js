const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, "El nombre del restaurante es obligatorio"],
      trim: true,
    },
    direccion: {
      type: String,
      trim: true,
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Restaurant", restaurantSchema);
