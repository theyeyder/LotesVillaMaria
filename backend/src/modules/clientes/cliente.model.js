import mongoose from "mongoose";

const clienteSchema = new mongoose.Schema(
  {
    nombres: {
      type: String,
      required: [true, "Los nombres son obligatorios"],
      trim: true,
    },

    apellidos: {
      type: String,
      required: [true, "Los apellidos son obligatorios"],
      trim: true,
    },

    tipoDocumento: {
      type: String,
      enum: ["CC", "CE", "NIT", "TI", "PASAPORTE"],
      default: "CC",
      trim: true,
    },

    documento: {
      type: String,
      required: [true, "El documento es obligatorio"],
      unique: true,
      trim: true,
    },

    telefono: {
      type: String,
      trim: true,
      default: "",
    },

    correo: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    ciudad: {
      type: String,
      trim: true,
      default: "",
    },

    direccion: {
      type: String,
      trim: true,
      default: "",
    },

    observaciones: {
      type: String,
      trim: true,
      default: "",
    },

    estado: {
      type: String,
      enum: ["Activo", "Inactivo"],
      default: "Activo",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Cliente = mongoose.model("Cliente", clienteSchema);

export default Cliente;