import mongoose from "mongoose";

const manzanaSchema = new mongoose.Schema(
  {
    codigo: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },

    nombre: {
      type: String,
      required: [
        true,
        "El nombre de la manzana es obligatorio",
      ],
      unique: true,
      trim: true,
      uppercase: true,
    },

    /* =====================================================
       ÁREA TOTAL DE LA MANZANA
       CAMPO OPCIONAL
    ===================================================== */

    areaM2: {
      type: Number,
      min: [
        0,
        "El área de la manzana no puede ser negativa",
      ],
      default: null,
    },

    descripcion: {
      type: String,
      trim: true,
      default: "",
    },

    estado: {
      type: String,
      enum: [
        "Activa",
        "Inactiva",
      ],
      default: "Activa",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Manzana = mongoose.model(
  "Manzana",
  manzanaSchema
);

export default Manzana;