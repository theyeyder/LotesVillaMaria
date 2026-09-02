import mongoose from "mongoose";

/* =========================================================
   MODELO EGRESO
   LOTES VILLA MARÍA

   Un egreso representa DINERO QUE SALE
   de la empresa.

   Puede corresponder a:

   - Comisión de vendedor
   - Horas de maquinaria
   - Otro gasto

   Cada ABONO o PAGO genera un egreso.
========================================================= */

const egresoSchema =
  new mongoose.Schema(
    {
      /* =====================================================
         CÓDIGO

         EG-0001
         EG-0002
      ===================================================== */

      codigo: {
        type: String,

        unique: true,
        sparse: true,

        trim: true,
        uppercase: true,
      },

      /* =====================================================
         TIPO DE EGRESO
      ===================================================== */

      tipo: {
        type: String,

        enum: [
          "Comision",
          "HorasMaquinaria",
          "Otro",
        ],

        required: [
          true,
          "El tipo de egreso es obligatorio",
        ],
      },

      /* =====================================================
         TIPO DE MOVIMIENTO

         Abono:
         paga solo una parte.

         Pago:
         cancela todo el saldo pendiente.
      ===================================================== */

      tipoMovimiento: {
        type: String,

        enum: [
          "Abono",
          "Pago",
        ],

        required: [
          true,
          "El tipo de movimiento es obligatorio",
        ],
      },

      /* =====================================================
         COMISIÓN RELACIONADA

         Solo se utiliza cuando:

         tipo = "Comision"
      ===================================================== */

      comision: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "Comision",

        default: null,
      },

      /* =====================================================
         HORA DE MAQUINARIA RELACIONADA

         Solo se utilizará cuando:

         tipo = "HorasMaquinaria"

         La conectaremos cuando integremos
         ese módulo.
      ===================================================== */

      horaMaquinaria: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "HoraMaquinaria",

        default: null,
      },

      /* =====================================================
         VENDEDOR

         Se utiliza en pagos de comisiones.
      ===================================================== */

      vendedor: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "Vendedor",

        default: null,
      },

      /* =====================================================
         BENEFICIARIO

         Guardamos también el nombre como
         histórico.

         Esto permite conservar el comprobante
         incluso si después cambia algún dato
         del vendedor u operario.
      ===================================================== */

      beneficiarioNombre: {
        type: String,

        trim: true,

        required: [
          true,
          "El beneficiario es obligatorio",
        ],
      },

      beneficiarioDocumento: {
        type: String,

        trim: true,

        default: "",
      },

      /* =====================================================
         CONCEPTO

         Ejemplos:

         "Abono comisión CM-0001"
         "Pago comisión CM-0002"
         "Pago horas maquinaria agosto"
      ===================================================== */

      concepto: {
        type: String,

        trim: true,

        required: [
          true,
          "El concepto del egreso es obligatorio",
        ],
      },

      /* =====================================================
         VALOR PAGADO

         Este es el dinero que realmente
         salió de la empresa.
      ===================================================== */

      valor: {
        type: Number,

        required: [
          true,
          "El valor del egreso es obligatorio",
        ],

        min: [
          1,
          "El valor del egreso debe ser mayor a cero",
        ],
      },

      /* =====================================================
         SALDO ANTES DEL PAGO

         Lo guardamos como histórico.
      ===================================================== */

      saldoAntes: {
        type: Number,

        default: 0,

        min: [
          0,
          "El saldo anterior no puede ser negativo",
        ],
      },

      /* =====================================================
         SALDO DESPUÉS DEL PAGO

         También queda como histórico.
      ===================================================== */

      saldoDespues: {
        type: Number,

        default: 0,

        min: [
          0,
          "El saldo posterior no puede ser negativo",
        ],
      },

      /* =====================================================
         FORMA DE PAGO
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

         Ejemplo:
         número de transferencia,
         comprobante bancario, etc.
      ===================================================== */

      referenciaPago: {
        type: String,

        trim: true,

        default: "",
      },

      /* =====================================================
         FECHA DEL EGRESO
      ===================================================== */

      fechaPago: {
        type: Date,

        default: Date.now,
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

egresoSchema.index({
  tipo: 1,
  fechaPago: -1,
});

egresoSchema.index({
  comision: 1,
  fechaPago: -1,
});

egresoSchema.index({
  vendedor: 1,
  fechaPago: -1,
});

egresoSchema.index({
  horaMaquinaria: 1,
  fechaPago: -1,
});

/* =========================================================
   MODELO
========================================================= */

const Egreso =
  mongoose.model(
    "Egreso",
    egresoSchema
  );

export default Egreso;