import { Router } from "express";

import {
  obtenerReporteGeneral,
} from "./reporte.controller.js";

import {
  obtenerClientesLotesVendidos,
} from "./clientesLotes.controller.js";

const router = Router();

/* =========================================================
   CLIENTES POR LOTES VENDIDOS
========================================================= */

router.get(
  "/clientes-lotes-vendidos",
  obtenerClientesLotesVendidos
);

/* =========================================================
   REPORTE GENERAL
========================================================= */

router.get(
  "/",
  obtenerReporteGeneral
);

export default router;