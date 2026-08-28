import mongoose from "mongoose";

const ventaSchema = new mongoose.Schema(
  {
    /* =====================================================
       CÓDIGO
       V-0001, V-0002...
    ===================================================== */

    codigo: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },

    /* =====================================================
       CLIENTE
    ===================================================== */

    cliente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cliente",
      required: [
        true,
        "El cliente es obligatorio",
      ],
    },

    /* =====================================================
       LOTE
    ===================================================== */

    lote: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lote",
      required: [
        true,
        "El lote es obligatorio",
      ],
    },

    /* =====================================================
       FECHA DE VENTA
    ===================================================== */

    fechaVenta: {
      type: Date,
      required: true,
      default: Date.now,
    },

    /* =====================================================
       VALOR DE LA VENTA
    ===================================================== */

    valorVenta: {
      type: Number,
      required: [
        true,
        "El valor de la venta es obligatorio",
      ],
      min: 0,
    },

    /* =====================================================
       CUOTA INICIAL
    ===================================================== */

    cuotaInicial: {
      type: Number,
      default: 0,
      min: 0,
    },

    /* =====================================================
       SALDO FINANCIADO
    ===================================================== */

    saldoFinanciar: {
      type: Number,
      default: 0,
      min: 0,
    },

    /* =====================================================
       FORMA DE PAGO
    ===================================================== */

    formaPago: {
      type: String,

      enum: [
        "Contado",
        "Financiado",
      ],

      default: "Financiado",
    },

    /* =====================================================
       NÚMERO DE CUOTAS
    ===================================================== */

    numeroCuotas: {
      type: Number,
      default: 0,
      min: 0,
    },

    /* =====================================================
       VALOR DE CUOTA
    ===================================================== */

    valorCuota: {
      type: Number,
      default: 0,
      min: 0,
    },

    /* =====================================================
       ESTADO
    ===================================================== */

    estado: {
      type: String,

      enum: [
        "Activa",
        "Pagada",
        "Anulada",
      ],

      default: "Activa",
    },

    /* =====================================================
       MOTIVO DE ANULACIÓN

       Se llena solamente cuando la venta
       pasa al estado "Anulada".
    ===================================================== */

    motivoAnulacion: {
      type: String,
      trim: true,
      default: "",
    },

    /* =====================================================
       FECHA DE ANULACIÓN
    ===================================================== */

    fechaAnulacion: {
      type: Date,
      default: null,
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
   ÍNDICES
========================================================= */

ventaSchema.index({
  lote: 1,
});

ventaSchema.index({
  cliente: 1,
  fechaVenta: -1,
});

ventaSchema.index({
  estado: 1,
});

const Venta = mongoose.model(
  "Venta",
  ventaSchema
);

export default Venta;