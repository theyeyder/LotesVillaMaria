import mongoose from "mongoose";

const ventaSchema = new mongoose.Schema(
  {
    /* =====================================================
      CÓDIGO ÚNICO DE LA VENTA

      VT-0001
      VT-0002
      VT-0003...
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
      VENDEDOR QUE REALIZÓ LA VENTA

      Se deja opcional para no romper
      ventas antiguas ya guardadas.
    ===================================================== */

    vendedor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendedor",
      default: null,
    },

    /* =====================================================
      COMISIÓN DEL VENDEDOR POR ESTA VENTA

      La comisión corresponde a un valor fijo
      por lote vendido.

      Actualmente:
      $2.000.000 por cada lote.

      Este valor queda guardado dentro de la venta
      para conservar el histórico.

      NO reduce la deuda del cliente.
    ===================================================== */

    valorComision: {
      type: Number,

      default: 0,

      min: [
        0,
        "El valor de la comisión no puede ser negativo",
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

      Ya NO existe "Anulada".

      Si una venta se elimina, el registro se borra
      definitivamente de la colección.

      Activa:
      Todavía tiene saldo pendiente.

      Pagada:
      Ya se pagó completamente.
    ===================================================== */

    estado: {
      type: String,

      enum: [
        "Activa",
        "Pagada",
      ],

      default: "Activa",
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

ventaSchema.index({
  vendedor: 1,
  fechaVenta: -1,
});

/* =========================================================
  MODELO
========================================================= */

const Venta = mongoose.model(
  "Venta",
  ventaSchema
);

export default Venta;