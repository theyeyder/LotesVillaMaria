import mongoose from "mongoose";

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

    horaInicio: {
      type: String,
      required: [true, "La hora de inicio es obligatoria"],
      trim: true,
    },

    horaFinal: {
      type: String,
      required: [true, "La hora final es obligatoria"],
      trim: true,
    },

    totalMinutos: {
      type: Number,
      required: true,
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

/*
  Índices para que después los cálculos por:
  día, semana, mes y año sean rápidos.
*/
horaMaquinariaSchema.index({
  maquinaria: 1,
  fecha: 1,
});

horaMaquinariaSchema.index({
  fecha: 1,
});

const HoraMaquinaria = mongoose.model(
  "HoraMaquinaria",
  horaMaquinariaSchema
);

export default HoraMaquinaria;