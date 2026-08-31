import mongoose from "mongoose";

/* =========================================================
   CONSECUTIVOS DEL SISTEMA

   Ejemplos:

   venta:
   VT-0001
   VT-0002
   VT-0003

   En el futuro podemos reutilizar esta colección
   para pagos, facturas u otros módulos.
========================================================= */

const consecutivoSchema =
  new mongoose.Schema(
    {
      /* =====================================================
         TIPO DE CONSECUTIVO
      ===================================================== */

      tipo: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
      },

      /* =====================================================
         ÚLTIMO NÚMERO UTILIZADO
      ===================================================== */

      ultimoNumero: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },
    },
    {
      timestamps: true,
      versionKey: false,
    }
  );

/* =========================================================
   MODELO
========================================================= */

const Consecutivo =
  mongoose.model(
    "Consecutivo",
    consecutivoSchema
  );

export default Consecutivo;