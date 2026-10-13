import mongoose from "mongoose";

/* =========================================================
   MODELO BENEFICIARIO
   LOTES VILLA MARÍA

   Un beneficiario representa una persona o empresa
   a la que se le pueden realizar Pagos Manuales.

   Ejemplos:

   - Proveedor de café
   - Persona que realiza transporte
   - Trabajador ocasional
   - Proveedor de materiales
   - Empresa proveedora

   El beneficiario se registra una sola vez y después
   puede reutilizarse en múltiples pagos manuales.
========================================================= */

const beneficiarioSchema =
  new mongoose.Schema(
    {
      /* =====================================================
         NOMBRE

         Puede ser una persona:

         "Juan Carlos Pérez"

         o una empresa:

         "Cafés del Tolima SAS"
      ===================================================== */

      nombre: {
        type: String,

        required: [
          true,
          "El nombre del beneficiario es obligatorio",
        ],

        trim: true,
      },

      /* =====================================================
         TIPO DE DOCUMENTO
      ===================================================== */

      tipoDocumento: {
        type: String,

        enum: [
          "CC",
          "CE",
          "NIT",
          "TI",
          "PASAPORTE",
          "OTRO",
        ],

        default: "CC",

        trim: true,
        uppercase: true,
      },

      /* =====================================================
         DOCUMENTO

         Debe ser único.

         Esto evita crear dos veces a la misma persona
         con el mismo documento.
      ===================================================== */

      documento: {
        type: String,

        required: [
          true,
          "El documento del beneficiario es obligatorio",
        ],

        unique: true,

        trim: true,
        uppercase: true,
      },

      /* =====================================================
         TELÉFONO

         Opcional.
      ===================================================== */

      telefono: {
        type: String,

        trim: true,

        default: "",
      },

      /* =====================================================
         OBSERVACIONES

         Ejemplos:

         "Proveedor ocasional de café"

         "Realiza transportes para la empresa"

         "Proveedor de materiales de construcción"
      ===================================================== */

      observaciones: {
        type: String,

        trim: true,

        default: "",
      },

      /* =====================================================
         ESTADO

         No eliminaremos necesariamente una persona
         cuando deje de utilizarse.

         Podemos marcarla como Inactiva para conservar
         el historial de pagos anteriores.
      ===================================================== */

      estado: {
        type: String,

        enum: [
          "Activo",
          "Inactivo",
        ],

        default: "Activo",
      },
    },
    {
      timestamps: true,

      versionKey: false,
    }
  );

/* =========================================================
   ÍNDICES
========================================================= */

/*
  Buscamos frecuentemente beneficiarios
  por nombre.
*/

beneficiarioSchema.index({
  nombre: 1,
});

/*
  También será común consultar solamente
  los beneficiarios activos.
*/

beneficiarioSchema.index({
  estado: 1,
  nombre: 1,
});

/* =========================================================
   MODELO
========================================================= */

const Beneficiario =
  mongoose.model(
    "Beneficiario",
    beneficiarioSchema
  );

export default Beneficiario;