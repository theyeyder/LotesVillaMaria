import mongoose from "mongoose";

/* =========================================================
   ESQUEMA DE VENDEDOR
========================================================= */

const vendedorSchema =
  new mongoose.Schema(
    {
      /* =====================================================
         CÓDIGO DEL VENDEDOR

         VD-0001
         VD-0002
         VD-0003...
      ===================================================== */

      codigo: {
        type: String,

        unique: true,

        sparse: true,

        trim: true,

        uppercase: true,
      },

      /* =====================================================
         NOMBRES
      ===================================================== */

      nombres: {
        type: String,

        required: [
          true,
          "Los nombres del vendedor son obligatorios",
        ],

        trim: true,
      },

      /* =====================================================
         APELLIDOS
      ===================================================== */

      apellidos: {
        type: String,

        required: [
          true,
          "Los apellidos del vendedor son obligatorios",
        ],

        trim: true,
      },

      /* =====================================================
         DOCUMENTO
      ===================================================== */

      documento: {
        type: String,

        required: [
          true,
          "El documento del vendedor es obligatorio",
        ],

        unique: true,

        trim: true,
      },

      /* =====================================================
         TELÉFONO
      ===================================================== */

      telefono: {
        type: String,

        trim: true,

        default: "",
      },

      /* =====================================================
         CORREO
      ===================================================== */

      correo: {
        type: String,

        trim: true,

        lowercase: true,

        default: "",
      },

      /* =====================================================
         COMISIÓN FIJA POR LOTE VENDIDO

         Actualmente:
         $2.000.000 por cada lote vendido,
         independientemente del precio del lote.
      ===================================================== */

      valorComision: {
        type: Number,

        required: [
          true,
          "El valor de la comisión es obligatorio",
        ],

        default: 2000000,

        min: [
          0,
          "La comisión no puede ser negativa",
        ],
      },

      /* =====================================================
         ESTADO

         Activo:
         puede asignarse a nuevas ventas.

         Inactivo:
         conserva sus ventas y comisiones anteriores,
         pero no debería aparecer para nuevas ventas.
      ===================================================== */

      estado: {
        type: String,

        enum: [
          "Activo",
          "Inactivo",
        ],

        default: "Activo",
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
   ÍNDICES DE CONSULTA
========================================================= */

vendedorSchema.index({
  estado: 1,
});

vendedorSchema.index({
  nombres: 1,
  apellidos: 1,
});

vendedorSchema.index({
  documento: 1,
});

/* =========================================================
   MODELO
========================================================= */

const Vendedor =
  mongoose.model(
    "Vendedor",
    vendedorSchema
  );

export default Vendedor;