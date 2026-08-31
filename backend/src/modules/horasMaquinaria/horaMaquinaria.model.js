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

    /*
      Minutos trabajados solamente
      dentro de este turno.
    */

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
         TOTAL MINUTOS TRABAJADOS

         Ejemplo:

         2 horas 30 minutos
         =
         150 minutos
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
         VALOR DE UNA HORA

         Ejemplo:
         $40.000
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

         Se calcula automáticamente:

         totalMinutos / 60 × valorHora

         Ejemplo:

         150 / 60 = 2,5 horas

         2,5 × $40.000
         =
         $100.000
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
   CALCULAR VALOR A PAGAR AUTOMÁTICAMENTE

   IMPORTANTE:

   El dinero NO se calcula solamente
   por horas completas.

   También se pagan los minutos.

   Ejemplo:

   1 hora 30 minutos
   =
   90 minutos

   90 / 60
   =
   1,5 horas

   Si la hora vale $50.000:

   1,5 × 50.000
   =
   $75.000
========================================================= */

horaMaquinariaSchema.pre(
  "validate",
  function (next) {
    const minutos =
      Number(
        this.totalMinutos ||
          0
      );

    const valorHora =
      Number(
        this.valorHora ||
          0
      );

    /* =========================
       NORMALIZAR
    ========================= */

    this.totalMinutos =
      Number.isFinite(
        minutos
      )
        ? Math.max(
            0,
            minutos
          )
        : 0;

    this.valorHora =
      Number.isFinite(
        valorHora
      )
        ? Math.max(
            0,
            valorHora
          )
        : 0;

    /* =========================
       CALCULAR VALOR
    ========================= */

    const horasDecimales =
      this.totalMinutos /
      60;

    const valorCalculado =
      horasDecimales *
      this.valorHora;

    /*
      Como trabajamos en pesos COP,
      redondeamos al peso completo.
    */

    this.valorPagar =
      Math.round(
        valorCalculado
      );

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
   MODELO
========================================================= */

const HoraMaquinaria =
  mongoose.model(
    "HoraMaquinaria",
    horaMaquinariaSchema
  );

export default HoraMaquinaria;