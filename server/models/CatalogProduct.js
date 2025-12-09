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
    isDirectConsumption: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Índices para optimización multi-tenant
catalogProductSchema.index({ restaurante: 1 }); // Búsquedas generales
catalogProductSchema.index({ restaurante: 1, nombre: 1 }); // Ordenamiento y unicidad por nombre dentro del restaurante

module.exports = mongoose.model("CatalogProduct", catalogProductSchema);
