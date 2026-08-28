import mongoose from "mongoose";

const loteSchema = new mongoose.Schema(
  {
    /* =====================================================
       MANZANA A LA QUE PERTENECE
    ===================================================== */

    manzana: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manzana",
      required: [
        true,
        "La manzana es obligatoria",
      ],
    },

    /* =====================================================
       IDENTIFICACIÓN DEL LOTE
    ===================================================== */

    codigo: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },

    numeroLote: {
      type: String,
      required: [
        true,
        "El número del lote es obligatorio",
      ],
      trim: true,
      uppercase: true,
    },

    /* =====================================================
       MEDIDA DEL FRENTE
    ===================================================== */

    frenteMetros: {
      type: Number,
      required: [
        true,
        "Los metros del frente son obligatorios",
      ],
      min: [
        0,
        "Los metros del frente no pueden ser negativos",
      ],
      default: 0,
    },

    frenteCentimetros: {
      type: Number,
      min: [
        0,
        "Los centímetros no pueden ser negativos",
      ],
      max: [
        99,
        "Los centímetros deben estar entre 0 y 99",
      ],
      default: 0,
    },

    /* =====================================================
       MEDIDA DEL FONDO
    ===================================================== */

    fondoMetros: {
      type: Number,
      required: [
        true,
        "Los metros del fondo son obligatorios",
      ],
      min: [
        0,
        "Los metros del fondo no pueden ser negativos",
      ],
      default: 0,
    },

    fondoCentimetros: {
      type: Number,
      min: [
        0,
        "Los centímetros no pueden ser negativos",
      ],
      max: [
        99,
        "Los centímetros deben estar entre 0 y 99",
      ],
      default: 0,
    },

    /* =====================================================
       ÁREA CALCULADA
    ===================================================== */

    areaM2: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    /* =====================================================
       VALOR GENERAL DEL LOTE
    ===================================================== */

    valorLote: {
      type: Number,
      required: [
        true,
        "El valor del lote es obligatorio",
      ],
      min: [
        0,
        "El valor del lote no puede ser negativo",
      ],
    },

    /* =====================================================
       ESTADO
    ===================================================== */

    estado: {
      type: String,
      enum: [
        "Disponible",
        "Reservado",
        "Vendido",
      ],
      default: "Disponible",
    },

    /* =====================================================
       INFORMACIÓN ADICIONAL
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
   NO PERMITIR REPETIR EL MISMO NÚMERO DE LOTE
   DENTRO DE UNA MISMA MANZANA

   MANZANA A - LOTE 01   ✅
   MANZANA A - LOTE 01   ❌

   MANZANA B - LOTE 01   ✅
========================================================= */

loteSchema.index(
  {
    manzana: 1,
    numeroLote: 1,
  },
  {
    unique: true,
  }
);

/* =========================================================
   ÍNDICES PARA BÚSQUEDA
========================================================= */

loteSchema.index({
  manzana: 1,
  estado: 1,
});

const Lote = mongoose.model(
  "Lote",
  loteSchema
);

export default Lote;