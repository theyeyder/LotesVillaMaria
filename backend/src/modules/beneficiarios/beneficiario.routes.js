import { Router } from "express";

import {
  obtenerBeneficiarios,
  obtenerBeneficiarioPorId,
  obtenerBeneficiarioPorDocumento,
  crearBeneficiario,
  actualizarBeneficiario,
  eliminarBeneficiario,
} from "./beneficiario.controller.js";

/* =========================================================
   ROUTER
========================================================= */

const router = Router();

/* =========================================================
   LISTAR BENEFICIARIOS

   GET /api/beneficiarios
========================================================= */

router.get(
  "/",
  obtenerBeneficiarios
);

/* =========================================================
   BUSCAR POR DOCUMENTO

   IMPORTANTE:
   Debe ir antes de /:id
========================================================= */

router.get(
  "/documento/:documento",
  obtenerBeneficiarioPorDocumento
);

/* =========================================================
   OBTENER POR ID
========================================================= */

router.get(
  "/:id",
  obtenerBeneficiarioPorId
);

/* =========================================================
   CREAR
========================================================= */

router.post(
  "/",
  crearBeneficiario
);

/* =========================================================
   ACTUALIZAR
========================================================= */

router.put(
  "/:id",
  actualizarBeneficiario
);

/* =========================================================
   ELIMINAR
========================================================= */

router.delete(
  "/:id",
  eliminarBeneficiario
);

/* =========================================================
   EXPORT
========================================================= */

export default router;