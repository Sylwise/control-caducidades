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

// Middleware pre-save: Lógica de negocio para determinar el estado
productStatusSchema.pre("save", function (next) {
  try {
    // 1. Caso base: Sin clasificar y sin fechas
    if (this.estado === "sin-clasificar" && !this.fechaFrente && !this.fechaAlmacen) {
      return next();
    }

    // 2. Si no hay fecha de almacén -> frente-agota
    if (!this.fechaAlmacen) {
      this.estado = "frente-agota";
      return next();
    }

    // Normalización de fechas para comparación
    const frontDate = new Date(this.fechaFrente).setHours(0, 0, 0, 0);
    const storageDate = new Date(this.fechaAlmacen).setHours(0, 0, 0, 0);

    // 3. Si las fechas son diferentes -> frente-cambia
    if (frontDate !== storageDate) {
      this.estado = "frente-cambia";
      return next();
    }

    // 4. Si las fechas coinciden (Lógica basada en CAJAS)
    if (frontDate === storageDate) {
      
      const hasMoreDates = this.fechasAlmacen && this.fechasAlmacen.length > 0;

      // Caso: Última caja y NO hay más fechas detrás -> abierto-agota
      if (this.cajasAlmacen === 1 && !hasMoreDates) {
        this.estado = "abierto-agota";
        this.cajaUnica = true;
      } 
      // Caso: Última caja de esta fecha, pero SÍ hay más fechas detrás -> abierto-cambia
      else if (this.cajasAlmacen === 1 && hasMoreDates) {
        this.estado = "abierto-cambia";
        this.hayUnicaCajaActual = true;
      } 
      // Caso: Stock suficiente -> sin-clasificar
      else {
        this.estado = "sin-clasificar";
        this.cajaUnica = false;
        this.hayUnicaCajaActual = false;
      }
    }

    next();
  } catch (error) {
    // TODO: Integrar aquí logger.error(error) cuando sea posible
    next(error);
  }
});

module.exports = mongoose.model("ProductStatus", productStatusSchema);