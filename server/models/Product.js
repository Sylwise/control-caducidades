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
    // cajaUnica y hayUnicaCajaActual ya no son necesarios como inputs manuales,
    // pero los mantenemos por compatibilidad o para lógica interna si se requiere,
    // aunque la lógica principal ahora se basará en contadores.
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
    cajasAlmacen: this.cajasAlmacen,
    fechasAlmacen: this.fechasAlmacen,
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
      // Lógica basada en CAJAS
      // Si solo queda 1 caja en almacén (la actual) y NO hay más fechas detrás -> abierto-agota
      if (this.cajasAlmacen === 1 && (!this.fechasAlmacen || this.fechasAlmacen.length === 0)) {
        console.log("Estableciendo estado: abierto-agota (última caja y no hay más fechas)");
        this.estado = "abierto-agota";
        this.cajaUnica = true; // Mantener compatibilidad
      } 
      // Si solo queda 1 caja en almacén (la actual) y SÍ hay más fechas detrás -> abierto-cambia
      else if (this.cajasAlmacen === 1 && this.fechasAlmacen && this.fechasAlmacen.length > 0) {
        console.log("Estableciendo estado: abierto-cambia (última caja de esta fecha, pero hay más fechas)");
        this.estado = "abierto-cambia";
        this.hayUnicaCajaActual = true; // Mantener compatibilidad
      } 
      // En cualquier otro caso (más de 1 caja), es sin-clasificar (o el estado por defecto)
      // Nota: Antes usábamos "sin-clasificar" para esto, pero semánticamente es "tengo stock de sobra"
      else {
        console.log(
          "Estableciendo estado: sin-clasificar (fechas iguales, stock suficiente)"
        );
        this.estado = "sin-clasificar";
        this.cajaUnica = false;
        this.hayUnicaCajaActual = false;
      }
    }

    next();
  } catch (error) {
    console.error("Error en pre-save middleware:", error);
    next(error);
  }
});

module.exports = mongoose.model("ProductStatus", productStatusSchema);
