import mongoose from "mongoose";

const cuotaSchema = new mongoose.Schema(
  {
    /* =====================================================
       VENTA A LA QUE PERTENECE
    ===================================================== */

    venta: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venta",

      required: [
        true,
        "La venta es obligatoria",
      ],
    },

    /* =====================================================
       NÚMERO DE CUOTA

       Ejemplo:
       1, 2, 3, 4...
    ===================================================== */

    numeroCuota: {
      type: Number,

      required: [
        true,
        "El número de cuota es obligatorio",
      ],

      min: [
        1,
        "El número de cuota debe ser mayor que cero",
      ],
    },

    /* =====================================================
       FECHA DE VENCIMIENTO
    ===================================================== */

    fechaVencimiento: {
      type: Date,

      required: [
        true,
        "La fecha de vencimiento es obligatoria",
      ],
    },

    /* =====================================================
       VALOR ORIGINAL DE LA CUOTA
    ===================================================== */

    valorCuota: {
      type: Number,

      required: [
        true,
        "El valor de la cuota es obligatorio",
      ],

      min: [
        0,
        "El valor de la cuota no puede ser negativo",
      ],
    },

    /* =====================================================
       VALOR PAGADO

       El módulo PAGOS irá aumentando este campo.
    ===================================================== */

    valorPagado: {
      type: Number,

      default: 0,

      min: [
        0,
        "El valor pagado no puede ser negativo",
      ],
    },

    /* =====================================================
       SALDO PENDIENTE

       Inicialmente será igual al valor de la cuota.
    ===================================================== */

    saldoPendiente: {
      type: Number,

      required: true,

      min: [
        0,
        "El saldo pendiente no puede ser negativo",
      ],
    },

    /* =====================================================
       ESTADO DE LA CUOTA
    ===================================================== */

    estado: {
      type: String,

      enum: [
        "Pendiente",
        "Parcial",
        "Pagada",
        "Vencida",
        "Anulada",
      ],

      default: "Pendiente",
    },

    /* =====================================================
       FECHA EN QUE QUEDÓ TOTALMENTE PAGADA
    ===================================================== */

    fechaPago: {
      type: Date,

      default: null,
    },

    /* =====================================================
       FECHA DE ANULACIÓN

       Se utilizará si la venta asociada
       llega a ser anulada.
    ===================================================== */

    fechaAnulacion: {
      type: Date,

      default: null,
    },

    /* =====================================================
       MOTIVO DE ANULACIÓN

       Conservamos también el motivo de la venta.
    ===================================================== */

    motivoAnulacion: {
      type: String,

      trim: true,

      default: "",
    },

    /* =====================================================
       OBSERVACIONES
    ===================================================== */

    observaciones: {
      type: String,

      trim: true,

      default: "",
    },
  },
  {
    timestamps: true,

    versionKey: false,
  }
);

/* =========================================================
   NO REPETIR UNA CUOTA DENTRO DE LA MISMA VENTA

   V-0001
   Cuota 1 ✅
   Cuota 2 ✅
   Cuota 1 ❌
========================================================= */

cuotaSchema.index(
  {
    venta: 1,
    numeroCuota: 1,
  },
  {
    unique: true,
  }
);

/* =========================================================
   CONSULTAS POR VENTA Y ESTADO
========================================================= */

cuotaSchema.index({
  venta: 1,
  estado: 1,
});

/* =========================================================
   CONSULTAS DE VENCIMIENTOS
========================================================= */

cuotaSchema.index({
  fechaVencimiento: 1,
  estado: 1,
});

/* =========================================================
   MODELO
========================================================= */

const Cuota = mongoose.model(
  "Cuota",
  cuotaSchema
);

export default Cuota;