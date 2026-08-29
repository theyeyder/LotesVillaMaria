import mongoose from "mongoose";

/* =========================================================
   APLICACIÓN DEL PAGO A CUOTAS

   Un mismo pago puede aplicarse a una o varias cuotas.

   Ejemplo:
   Pago: $2.500.000

   Cuota 1 -> $1.000.000
   Cuota 2 -> $1.000.000
   Cuota 3 ->   $500.000
========================================================= */

const aplicacionPagoSchema =
  new mongoose.Schema(
    {
      /* =====================================================
         CUOTA
      ===================================================== */

      cuota: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cuota",

        required: [
          true,
          "La cuota aplicada es obligatoria",
        ],
      },

      /* =====================================================
         NÚMERO DE CUOTA

         Se guarda también para facilitar comprobantes,
         consultas y trazabilidad del pago.
      ===================================================== */

      numeroCuota: {
        type: Number,

        required: true,

        min: 1,
      },

      /* =====================================================
         VALOR APLICADO A ESA CUOTA
      ===================================================== */

      valorAplicado: {
        type: Number,

        required: [
          true,
          "El valor aplicado es obligatorio",
        ],

        min: [
          0.01,
          "El valor aplicado debe ser mayor que cero",
        ],
      },
    },
    {
      _id: false,
    }
  );

/* =========================================================
   PAGO
========================================================= */

const pagoSchema =
  new mongoose.Schema(
    {
      /* =====================================================
         CÓDIGO AUTOMÁTICO

         Ejemplo:
         PG-0001
         PG-0002
      ===================================================== */

      codigo: {
        type: String,

        unique: true,

        trim: true,

        uppercase: true,
      },

      /* =====================================================
         VENTA
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
         CLIENTE

         También se guarda directamente para facilitar:
         - búsquedas
         - reportes
         - comprobantes
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
         FECHA DEL PAGO
      ===================================================== */

      fechaPago: {
        type: Date,

        required: [
          true,
          "La fecha del pago es obligatoria",
        ],

        default: Date.now,
      },

      /* =====================================================
         VALOR TOTAL RECIBIDO
      ===================================================== */

      valorPago: {
        type: Number,

        required: [
          true,
          "El valor del pago es obligatorio",
        ],

        min: [
          0.01,
          "El valor del pago debe ser mayor que cero",
        ],
      },

      /* =====================================================
         MÉTODO DE PAGO
      ===================================================== */

      metodoPago: {
        type: String,

        enum: [
          "Efectivo",
          "Transferencia",
          "Consignación",
          "PSE",
          "Otro",
        ],

        default: "Efectivo",
      },

      /* =====================================================
         REFERENCIA

         Útil principalmente para:
         - transferencia
         - consignación
         - PSE
      ===================================================== */

      referencia: {
        type: String,

        trim: true,

        default: "",
      },

      /* =====================================================
         DISTRIBUCIÓN DEL PAGO

         Aquí se registra cuánto dinero de este pago
         fue aplicado a cada cuota.

         IMPORTANTE:
         Ya NO existe estado Aplicado / Anulado.

         Si el pago existe, afecta la cartera.
         Si se elimina, deja de afectarla.
      ===================================================== */

      aplicaciones: {
        type: [
          aplicacionPagoSchema,
        ],

        default: [],
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

/* =========================================================
   PAGOS DE UNA VENTA
========================================================= */

pagoSchema.index({
  venta: 1,
  fechaPago: -1,
});

/* =========================================================
   PAGOS DE UN CLIENTE
========================================================= */

pagoSchema.index({
  cliente: 1,
  fechaPago: -1,
});

/* =========================================================
   BUSCAR PAGOS APLICADOS A UNA CUOTA
========================================================= */

pagoSchema.index({
  "aplicaciones.cuota": 1,
});

/* =========================================================
   MODELO
========================================================= */

const Pago =
  mongoose.model(
    "Pago",
    pagoSchema
  );

export default Pago;