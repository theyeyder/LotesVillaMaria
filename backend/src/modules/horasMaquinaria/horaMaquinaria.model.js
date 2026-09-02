import mongoose from "mongoose";

/* =========================================================
   TURNO
========================================================= */

const turnoSchema = new mongoose.Schema(
  {
    periodo: {
      type: String,
      enum: [
        "Mañana",
        "Tarde",
        "Noche",
      ],
      required: true,
    },

    activo: {
      type: Boolean,
      default: false,
    },

    horaInicio: {
      type: String,
      default: "",
    },

    horaFinal: {
      type: String,
      default: "",
    },

    totalMinutos: {
      type: Number,
      default: 0,

      min: [
        0,
        "Los minutos del turno no pueden ser negativos",
      ],
    },
  },
  {
    _id: false,
  }
);

/* =========================================================
   HORAS DE MAQUINARIA
========================================================= */

const horaMaquinariaSchema =
  new mongoose.Schema(
    {
      /* ===================================================
         MAQUINARIA
      =================================================== */

      maquinaria: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          "Maquinaria",

        required: [
          true,
          "La máquina es obligatoria",
        ],
      },

      /* ===================================================
         OPERARIO
      =================================================== */

      operario: {
        type: String,

        required: [
          true,
          "El operario es obligatorio",
        ],

        trim: true,
      },

      /* ===================================================
         FECHA
      =================================================== */

      fecha: {
        type: Date,

        required: [
          true,
          "La fecha es obligatoria",
        ],
      },

      /* ===================================================
         TURNOS
      =================================================== */

      turnos: {
        type: [
          turnoSchema,
        ],

        default: [
          {
            periodo:
              "Mañana",

            activo:
              false,

            horaInicio:
              "",

            horaFinal:
              "",

            totalMinutos:
              0,
          },

          {
            periodo:
              "Tarde",

            activo:
              false,

            horaInicio:
              "",

            horaFinal:
              "",

            totalMinutos:
              0,
          },

          {
            periodo:
              "Noche",

            activo:
              false,

            horaInicio:
              "",

            horaFinal:
              "",

            totalMinutos:
              0,
          },
        ],
      },

      /* ===================================================
         TOTAL MINUTOS
      =================================================== */

      totalMinutos: {
        type: Number,

        required: true,

        default:
          0,

        min: [
          0,
          "Los minutos trabajados no pueden ser negativos",
        ],
      },

      /* ===================================================
         VALOR DE LA HORA
      =================================================== */

      valorHora: {
        type: Number,

        default:
          0,

        min: [
          0,
          "El valor de la hora no puede ser negativo",
        ],
      },

      /* ===================================================
         VALOR TOTAL A PAGAR

         totalMinutos / 60 × valorHora
      =================================================== */

      valorPagar: {
        type: Number,

        default:
          0,

        min: [
          0,
          "El valor a pagar no puede ser negativo",
        ],
      },

      /* ===================================================
         TOTAL PAGADO

         Se actualiza mediante EGRESOS.

         Ejemplo:

         Valor a pagar:
         $500.000

         EG-0002:
         Abono $200.000

         totalPagado:
         $200.000
      =================================================== */

      totalPagado: {
        type: Number,

        default:
          0,

        min: [
          0,
          "El total pagado no puede ser negativo",
        ],
      },

      /* ===================================================
         SALDO PENDIENTE
      =================================================== */

      saldoPendiente: {
        type: Number,

        default:
          0,

        min: [
          0,
          "El saldo pendiente no puede ser negativo",
        ],
      },

      /* ===================================================
         ESTADO DEL PAGO
      =================================================== */

      estadoPago: {
        type: String,

        enum: [
          "Pendiente",
          "Abonada",
          "Pagada",
        ],

        default:
          "Pendiente",
      },

      /* ===================================================
         ÚLTIMA FECHA DE PAGO
      =================================================== */

      fechaUltimoPago: {
        type: Date,

        default:
          null,
      },

      /* ===================================================
         OBSERVACIONES
      =================================================== */

      observaciones: {
        type: String,

        trim: true,

        default:
          "",
      },
    },
    {
      timestamps:
        true,

      versionKey:
        false,
    }
  );

/* =========================================================
   CALCULAR VALORES AUTOMÁTICAMENTE

   Ejemplo:

   90 minutos
   =
   1,5 horas

   Hora:
   $50.000

   Total:
   $75.000
========================================================= */

horaMaquinariaSchema.pre(
  "validate",
  function (next) {
    /* =====================================================
       NORMALIZAR MINUTOS
    ===================================================== */

    const minutos =
      Number(
        this.totalMinutos ||
          0
      );

    this.totalMinutos =
      Number.isFinite(
        minutos
      )
        ? Math.max(
            0,
            minutos
          )
        : 0;

    /* =====================================================
       NORMALIZAR VALOR HORA
    ===================================================== */

    const valorHora =
      Number(
        this.valorHora ||
          0
      );

    this.valorHora =
      Number.isFinite(
        valorHora
      )
        ? Math.max(
            0,
            valorHora
          )
        : 0;

    /* =====================================================
       CALCULAR VALOR TOTAL
    ===================================================== */

    const horasDecimales =
      this.totalMinutos /
      60;

    const valorCalculado =
      horasDecimales *
      this.valorHora;

    this.valorPagar =
      Math.round(
        valorCalculado
      );

    /* =====================================================
       NORMALIZAR TOTAL PAGADO
    ===================================================== */

    const totalPagado =
      Number(
        this.totalPagado ||
          0
      );

    this.totalPagado =
      Number.isFinite(
        totalPagado
      )
        ? Math.max(
            0,
            totalPagado
          )
        : 0;

    /* =====================================================
       EVITAR PAGOS MAYORES AL VALOR DEL TRABAJO
    ===================================================== */

    if (
      this.totalPagado >
      this.valorPagar
    ) {
      return next(
        new Error(
          "El valor pagado no puede superar el valor total de las horas de maquinaria"
        )
      );
    }

    /* =====================================================
       CALCULAR SALDO
    ===================================================== */

    this.saldoPendiente =
      Math.max(
        0,
        this.valorPagar -
          this.totalPagado
      );

    /* =====================================================
       ESTADO DEL PAGO
    ===================================================== */

    if (
      this.totalPagado <= 0
    ) {
      this.estadoPago =
        "Pendiente";
    } else if (
      this.saldoPendiente >
      0
    ) {
      this.estadoPago =
        "Abonada";
    } else {
      this.estadoPago =
        "Pagada";
    }

    next();
  }
);

/* =========================================================
   ÍNDICES
========================================================= */

horaMaquinariaSchema.index({
  maquinaria:
    1,

  fecha:
    1,
});

horaMaquinariaSchema.index({
  fecha:
    1,
});

horaMaquinariaSchema.index({
  operario:
    1,

  fecha:
    1,
});

/* =========================================================
   CONTROL DE PAGOS
========================================================= */

horaMaquinariaSchema.index({
  estadoPago:
    1,

  fecha:
    -1,
});

/* =========================================================
   MODELO
========================================================= */

const HoraMaquinaria =
  mongoose.model(
    "HoraMaquinaria",
    horaMaquinariaSchema
  );

export default HoraMaquinaria;