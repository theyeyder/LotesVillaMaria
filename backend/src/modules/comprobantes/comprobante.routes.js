import { Router } from "express";

import {
  obtenerComprobantes,
} from "./comprobante.controller.js";

const router = Router();

/* =========================================================
   COMPROBANTES

   GET /api/comprobantes

   Ejemplos:

   /api/comprobantes

   /api/comprobantes?movimiento=Ingreso

   /api/comprobantes?movimiento=Egreso

   /api/comprobantes?desde=2026-09-01&hasta=2026-09-30

   /api/comprobantes?buscar=PG-0001
========================================================= */

router.get(
  "/",
  obtenerComprobantes
);

export default router;