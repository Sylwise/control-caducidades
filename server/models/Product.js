const mongoose = require("mongoose");

const productStatusSchema = new mongoose.Schema(
  {
    producto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CatalogProduct",
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
    fechasAlmacen: {
      type: [Date],
      default: [],
    },
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

productStatusSchema.pre("save", function (next) {
  console.log("Pre-save middleware ejecutándose con datos:", {
    fechaFrente: this.fechaFrente,
    fechaAlmacen: this.fechaAlmacen,
    fechasAlmacen: this.fechasAlmacen,
    cajaUnica: this.cajaUnica,
    hayUnicaCajaActual: this.hayUnicaCajaActual,
    estado: this.estado,
  });

  try {
    // Si el estado es "sin-clasificar" y no hay fechas, mantenerlo así
    if (this.estado === "sin-clasificar" && !this.fechaFrente && !this.fechaAlmacen) {
      console.log("Manteniendo estado: sin-clasificar (nuevo producto)");
      return next();
    }

    // Si no hay fecha de almacén, es "frente-agota"
    if (!this.fechaAlmacen) {
      console.log("Estableciendo estado: frente-agota (sin fecha almacén)");
      this.estado = "frente-agota";
      return next();
    }

    // Convertir fechas a timestamps para comparación
    const frontDate = new Date(this.fechaFrente).setHours(0, 0, 0, 0);
    const storageDate = new Date(this.fechaAlmacen).setHours(0, 0, 0, 0);

    // Si las fechas son diferentes, es "frente-cambia"
    if (frontDate !== storageDate) {
      console.log("Estableciendo estado: frente-cambia (fechas diferentes)");
      this.estado = "frente-cambia";
      return next();
    }

    // Si las fechas coinciden
    if (frontDate === storageDate) {
      if (this.cajaUnica) {
        console.log("Estableciendo estado: abierto-agota (última caja)");
        this.estado = "abierto-agota";
      } else if (this.fechasAlmacen && this.fechasAlmacen.length > 0 && this.hayUnicaCajaActual) {
        console.log("Estableciendo estado: abierto-cambia (hay otras fechas y solo una caja actual)");
        this.estado = "abierto-cambia";
      } else {
        console.log(
          "Estableciendo estado: sin-clasificar (fechas iguales, sin condiciones especiales)"
        );
        this.estado = "sin-clasificar";
      }
    }

    next();
  } catch (error) {
    console.error("Error en pre-save middleware:", error);
    next(error);
  }
});

module.exports = mongoose.model("ProductStatus", productStatusSchema);
