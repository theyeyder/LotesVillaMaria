import mongoose from "mongoose";

/* =========================================================
   MODELO COMISIÓN
   LOTES VILLA MARÍA

   Cada venta genera UNA comisión.

   Ejemplo:

   VT-0001
   ↓
   CM-0001
   Vendedor: José
   Comisión: $2.000.000
========================================================= */

const comisionSchema =
  new mongoose.Schema(
    {
      /* =====================================================
         CÓDIGO
      ===================================================== */

      codigo: {
        type: String,

        unique: true,
        sparse: true,

        trim: true,
        uppercase: true,
      },

      /* =====================================================
         VENTA

         Una venta solo puede generar
         una comisión.
      ===================================================== */

      venta: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "Venta",

        required: [
          true,
          "La venta es obligatoria",
        ],

        unique: true,
      },

      /* =====================================================
         VENDEDOR
      ===================================================== */

      vendedor: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "Vendedor",

        required: [
          true,
          "El vendedor es obligatorio",
        ],
      },

      /* =====================================================
         CLIENTE

         Lo guardamos para identificar
         fácilmente de qué cliente
         proviene la comisión.
      ===================================================== */

      cliente: {
        type:
          mongoose.Schema.Types
            .ObjectId,

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
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "Lote",

        required: [
          true,
          "El lote es obligatorio",
        ],
      },

      /* =====================================================
         VALOR TOTAL DE LA COMISIÓN

         Este valor viene de la venta.

         Normalmente:
         $2.000.000
      ===================================================== */

      valorComision: {
        type: Number,

        required: [
          true,
          "El valor de la comisión es obligatorio",
        ],

        min: [
          0,
          "La comisión no puede ser negativa",
        ],
      },

      /* =====================================================
         TOTAL PAGADO

         Se irá incrementando cuando
         hagamos abonos o pagos completos.
      ===================================================== */

      totalPagado: {
        type: Number,

        default: 0,

        min: [
          0,
          "El valor pagado no puede ser negativo",
        ],
      },

      /* =====================================================
         SALDO PENDIENTE
      ===================================================== */

      saldoPendiente: {
        type: Number,

        required: [
          true,
          "El saldo pendiente es obligatorio",
        ],

        min: [
          0,
          "El saldo pendiente no puede ser negativo",
        ],
      },

      /* =====================================================
         ESTADO
      ===================================================== */

      estado: {
        type: String,

        enum: [
          "Pendiente",
          "Abonada",
          "Pagada",
        ],

        default:
          "Pendiente",
      },

      /* =====================================================
         FECHA EN QUE SE GENERÓ
      ===================================================== */

      fechaGeneracion: {
        type: Date,

        default: Date.now,
      },

      /* =====================================================
         ÚLTIMO PAGO
      ===================================================== */

      fechaUltimoPago: {
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

comisionSchema.index({
  vendedor: 1,
  estado: 1,
});

comisionSchema.index({
  cliente: 1,
});

comisionSchema.index({
  fechaGeneracion: -1,
});

/* =========================================================
   MODELO
========================================================= */

const Comision =
  mongoose.model(
    "Comision",
    comisionSchema
  );

export default Comision;