import mongoose from "mongoose";

/* =========================================================
   MODELO PAGO MANUAL
   LOTES VILLA MARÍA

   Un Pago Manual representa un gasto realizado
   directamente a una persona o empresa.

   Ejemplos:

   - Compra de café
   - Transporte
   - Compra de materiales
   - Pago de servicio ocasional
   - Alimentación
   - Gastos menores

   Cada Pago Manual debe generar posteriormente
   un Egreso EG-XXXX.
========================================================= */

const pagoManualSchema =
  new mongoose.Schema(
    {
      /* =====================================================
         BENEFICIARIO

         Persona o empresa que recibe el dinero.
      ===================================================== */

      beneficiario: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "Beneficiario",

        required: [
          true,
          "El beneficiario es obligatorio",
        ],
      },

      /* =====================================================
         DATOS HISTÓRICOS DEL BENEFICIARIO

         Aunque exista la relación con Beneficiario,
         guardamos nombre y documento.

         Esto permite conservar cómo estaba registrada
         la persona al momento de realizar el pago.
      ===================================================== */

      beneficiarioNombre: {
        type: String,

        required: [
          true,
          "El nombre del beneficiario es obligatorio",
        ],

        trim: true,
      },

      beneficiarioDocumento: {
        type: String,

        required: [
          true,
          "El documento del beneficiario es obligatorio",
        ],

        trim: true,
      },

      /* =====================================================
         MOTIVO

         Describe por qué se realizó el pago.

         Ejemplos:

         "Compra de café"
         "Servicio de transporte"
         "Compra de materiales"
      ===================================================== */

      motivo: {
        type: String,

        required: [
          true,
          "El motivo del pago es obligatorio",
        ],

        trim: true,
      },

      /* =====================================================
         VALOR

         Dinero entregado al beneficiario.
      ===================================================== */

      valor: {
        type: Number,

        required: [
          true,
          "El valor del pago es obligatorio",
        ],

        min: [
          1,
          "El valor del pago debe ser mayor a cero",
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
         FORMA DE PAGO

         Debe mantenerse igual al modelo Egreso.
      ===================================================== */

      formaPago: {
        type: String,

        enum: [
          "Efectivo",
          "Transferencia",
          "Consignacion",
          "Otro",
        ],

        default: "Efectivo",
      },

      /* =====================================================
         REFERENCIA DEL PAGO

         Opcional.

         Puede contener:

         - Número de transferencia
         - Número de consignación
         - Referencia bancaria
         - Otro soporte
      ===================================================== */

      referenciaPago: {
        type: String,

        trim: true,

        default: "",
      },

      /* =====================================================
         OBSERVACIONES

         Información adicional sobre el gasto.

         Ejemplo:

         "10 bolsas de café para la oficina"
      ===================================================== */

      observaciones: {
        type: String,

        trim: true,

        default: "",
      },

      /* =====================================================
         EGRESO RELACIONADO

         Después de registrar el Pago Manual,
         se genera un Egreso.

         Ejemplo:

         Pago Manual
              ↓
         EG-0048

         Esta relación permite localizar el Egreso
         generado por este movimiento.

         No creamos un consecutivo adicional para
         Pago Manual porque el código financiero
         oficial será EG-XXXX.
      ===================================================== */

      egreso: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "Egreso",

        default: null,

        unique: true,
        sparse: true,
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

/*
  Consultar todos los pagos realizados
  a determinado beneficiario.
*/

pagoManualSchema.index({
  beneficiario: 1,
  fechaPago: -1,
});

/*
  Consultar pagos por fecha.
*/

pagoManualSchema.index({
  fechaPago: -1,
});

/*
  Buscar por motivo.
*/

pagoManualSchema.index({
  motivo: 1,
});

/* =========================================================
   MODELO
========================================================= */

const PagoManual =
  mongoose.model(
    "PagoManual",
    pagoManualSchema
  );

export default PagoManual;