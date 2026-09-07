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

import {
  obtenerReporteVentasVendedor,
} from "./ventasVendedor.controller.js";

import {
  obtenerReporteCarteraClientes,
} from "./carteraClientes.controller.js";

import {
  obtenerReporteRecaudoClientes,
} from "./recaudoClientes.controller.js";

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
   INFORME DE VENTAS POR VENDEDOR
========================================================= */

router.get(
  "/ventas-vendedor",
  obtenerReporteVentasVendedor
);

/* =========================================================
   INFORME DE CARTERA POR CLIENTE
========================================================= */

router.get(
  "/cartera-clientes",
  obtenerReporteCarteraClientes
);

/* =========================================================
   INFORME DE RECAUDO POR CLIENTE
========================================================= */

router.get(
  "/recaudo-clientes",
  obtenerReporteRecaudoClientes
);

/* =========================================================
   REPORTE GENERAL
========================================================= */

router.get(
  "/",
  obtenerReporteGeneral
);

export default router;