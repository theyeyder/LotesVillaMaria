import { Router } from "express";

import {
  obtenerReporteGeneral,
} from "./reporte.controller.js";

import {
  obtenerClientesLotesVendidos,
} from "./clientesLotes.controller.js";

const router = Router();

/* =========================================================
   INFORMES INDEPENDIENTES
========================================================= */

// GET /api/reportes/clientes-lotes-vendidos
router.get(
  "/clientes-lotes-vendidos",
  obtenerClientesLotesVendidos
);

/* =========================================================
   REPORTE GENERAL / RESUMEN
========================================================= */

// GET /api/reportes
router.get(
  "/",
  obtenerReporteGeneral
);

export default router;