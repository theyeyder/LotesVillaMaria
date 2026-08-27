import mongoose from "mongoose";

const maquinariaSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, "El nombre de la máquina es obligatorio"],
      trim: true,
    },

    codigo: {
      type: String,
      required: [true, "El código de la máquina es obligatorio"],
      unique: true,
      trim: true,
      uppercase: true,
    },

    tipo: {
      type: String,
      trim: true,
      default: "",
    },

    placa: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    marca: {
      type: String,
      trim: true,
      default: "",
    },

    modelo: {
      type: String,
      trim: true,
      default: "",
    },

    descripcion: {
      type: String,
      trim: true,
      default: "",
    },

    estado: {
      type: String,
      enum: ["Activa", "Inactiva", "Mantenimiento"],
      default: "Activa",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Maquinaria = mongoose.model(
  "Maquinaria",
  maquinariaSchema
);

export default Maquinaria;