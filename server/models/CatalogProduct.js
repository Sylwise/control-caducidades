const mongoose = require("mongoose");

const catalogProductSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      unique: true,
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
