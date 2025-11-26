const mongoose = require("mongoose");

const catalogProductSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
    },
    restaurante: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    activo: {
      type: Boolean,
      default: true,
    },
    tipo: {
      type: String,
      enum: ["permanente", "promocional"],
      default: "permanente",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CatalogProduct", catalogProductSchema);
