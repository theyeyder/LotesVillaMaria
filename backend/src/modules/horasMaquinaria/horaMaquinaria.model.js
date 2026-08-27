import mongoose from "mongoose";

const turnoSchema = new mongoose.Schema(
  {
    periodo: {
      type: String,
      enum: ["Mañana", "Tarde", "Noche"],
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
      min: 0,
    },
  },
  {
    _id: false,
  }
);

const horaMaquinariaSchema = new mongoose.Schema(
  {
    maquinaria: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Maquinaria",
      required: [true, "La máquina es obligatoria"],
    },

    operario: {
      type: String,
      required: [true, "El operario es obligatorio"],
      trim: true,
    },

    fecha: {
      type: Date,
      required: [true, "La fecha es obligatoria"],
    },

    turnos: {
      type: [turnoSchema],

      default: [
        {
          periodo: "Mañana",
          activo: false,
          horaInicio: "",
          horaFinal: "",
          totalMinutos: 0,
        },
        {
          periodo: "Tarde",
          activo: false,
          horaInicio: "",
          horaFinal: "",
          totalMinutos: 0,
        },
        {
          periodo: "Noche",
          activo: false,
          horaInicio: "",
          horaFinal: "",
          totalMinutos: 0,
        },
      ],
    },

    /*
      Este será el total de todos los
      turnos activos del día.
    */
    totalMinutos: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

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

horaMaquinariaSchema.index({
  maquinaria: 1,
  fecha: 1,
});

horaMaquinariaSchema.index({
  fecha: 1,
});

horaMaquinariaSchema.index({
  operario: 1,
  fecha: 1,
});

const HoraMaquinaria = mongoose.model(
  "HoraMaquinaria",
  horaMaquinariaSchema
);

export default HoraMaquinaria;