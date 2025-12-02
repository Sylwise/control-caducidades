const mongoose = require("mongoose");

const productStatusSchema = new mongoose.Schema(
  {
    producto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CatalogProduct",
      required: true,
    },
    restaurante: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    fechaFrente: {
      type: Date,
      required: false,
    },
    fechaAlmacen: {
      type: Date,
      default: null,
    },
    cajasAlmacen: {
      type: Number,
      default: 0,
    },
    fechasAlmacen: {
      type: [
        {
          date: Date,
          boxes: { type: Number, default: 1 },
        },
      ],
      default: [],
    },
    // Flags de compatibilidad o lógica interna
    cajaUnica: {
      type: Boolean,
      default: false,
    },
    hayUnicaCajaActual: {
      type: Boolean,
      default: false,
    },
    estado: {
      type: String,
      enum: [
        "sin-clasificar",
        "frente-agota",
        "frente-cambia",
        "abierto-cambia",
        "abierto-agota",
      ],
      required: true,
      default: "sin-clasificar",
    },
  },
  {
    timestamps: true,
  }
);

// Índices para optimización multi-tenant
productStatusSchema.index({ restaurante: 1 });
productStatusSchema.index({ restaurante: 1, estado: 1 });
productStatusSchema.index({ restaurante: 1, producto: 1 }, { unique: true });


module.exports = mongoose.model("ProductStatus", productStatusSchema);