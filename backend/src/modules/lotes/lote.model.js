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
       TIPO DE LOTE

       Regular:
       - el área se obtiene con frente × fondo

       Irregular:
       - el área se registra directamente
       - frente y fondo son solamente referencia
    ===================================================== */

    tipoLote: {
      type: String,
      enum: [
        "Regular",
        "Irregular",
      ],
      default: "Regular",
      required: true,
    },

    /* =====================================================
       MEDIDA DEL FRENTE

       REGULAR:
       Debe existir una medida mayor que cero.

       IRREGULAR:
       Puede quedar en cero o utilizarse como referencia.
    ===================================================== */

    frenteMetros: {
      type: Number,
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
        "Los centímetros del frente no pueden ser negativos",
      ],
      max: [
        99,
        "Los centímetros del frente deben estar entre 0 y 99",
      ],
      default: 0,
    },

    /* =====================================================
       MEDIDA DEL FONDO

       REGULAR:
       Debe existir una medida mayor que cero.

       IRREGULAR:
       Puede quedar en cero o utilizarse como referencia.
    ===================================================== */

    fondoMetros: {
      type: Number,
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
        "Los centímetros del fondo no pueden ser negativos",
      ],
      max: [
        99,
        "Los centímetros del fondo deben estar entre 0 y 99",
      ],
      default: 0,
    },

    /* =====================================================
       ÁREA OFICIAL DEL LOTE

       REGULAR:
       será calculada por el backend usando frente × fondo.

       IRREGULAR:
       será el área total escrita directamente por el usuario.
    ===================================================== */

    areaM2: {
      type: Number,
      required: [
        true,
        "El área del lote es obligatoria",
      ],
      min: [
        0.01,
        "El área del lote debe ser mayor que cero",
      ],
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
        0.01,
        "El valor del lote debe ser mayor que cero",
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
   VALIDAR MEDIDAS SEGÚN EL TIPO DE LOTE
========================================================= */

loteSchema.pre(
  "validate",
  function (next) {
    const frenteTotal =
      Number(
        this.frenteMetros || 0
      ) +
      Number(
        this.frenteCentimetros || 0
      ) /
        100;

    const fondoTotal =
      Number(
        this.fondoMetros || 0
      ) +
      Number(
        this.fondoCentimetros || 0
      ) /
        100;

    /* =====================================================
       LOTE REGULAR

       Frente y fondo deben ser mayores que cero.
    ===================================================== */

    if (
      this.tipoLote ===
      "Regular"
    ) {
      if (
        frenteTotal <= 0
      ) {
        this.invalidate(
          "frenteMetros",
          "El lote regular debe tener una medida de frente mayor que cero"
        );
      }

      if (
        fondoTotal <= 0
      ) {
        this.invalidate(
          "fondoMetros",
          "El lote regular debe tener una medida de fondo mayor que cero"
        );
      }
    }

    /* =====================================================
       LOTE IRREGULAR

       No exigimos frente ni fondo.

       El área total sí debe existir porque esa es
       la medida oficial con la que se venderá.
    ===================================================== */

    if (
      this.tipoLote ===
      "Irregular"
    ) {
      const area =
        Number(
          this.areaM2
        );

      if (
        !Number.isFinite(
          area
        ) ||
        area <= 0
      ) {
        this.invalidate(
          "areaM2",
          "El lote irregular debe tener un área total mayor que cero"
        );
      }
    }

    next();
  }
);

/* =========================================================
   NO PERMITIR REPETIR EL MISMO NÚMERO DE LOTE
   DENTRO DE UNA MISMA MANZANA

   MANZANA A - LOTE 01   
   MANZANA A - LOTE 01   

   MANZANA B - LOTE 01   
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

loteSchema.index({
  tipoLote: 1,
  estado: 1,
});

/* =========================================================
   MODELO
========================================================= */

const Lote = mongoose.model(
  "Lote",
  loteSchema
);

export default Lote;