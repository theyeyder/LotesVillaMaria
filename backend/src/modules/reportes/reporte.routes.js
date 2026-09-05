import { Router } from "express";

import {
  obtenerReporteGeneral,
} from "./reporte.controller.js";

import {
  obtenerClientesLotesVendidos,
} from "./clientesLotes.controller.js";

import {
  obtenerReporteComisiones,
} from "./comisionesReporte.controller.js";

import {
  obtenerReporteManzanasLotes,
} from "./manzanasLotes.controller.js";

const router = Router();

/* =========================================================
   CLIENTES POR LOTES VENDIDOS
========================================================= */

router.get(
  "/clientes-lotes-vendidos",
  obtenerClientesLotesVendidos
);

/* =========================================================
   INFORME DE COMISIONES
========================================================= */

router.get(
  "/comisiones",
  obtenerReporteComisiones
);

/* =========================================================
   INFORME DE MANZANAS Y LOTES
========================================================= */

router.get(
  "/manzanas-lotes",
  obtenerReporteManzanasLotes
);

/* =========================================================
   REPORTE GENERAL
========================================================= */

router.get(
  "/",
  obtenerReporteGeneral
);

export default router;