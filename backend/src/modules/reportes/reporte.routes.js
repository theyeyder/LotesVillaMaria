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

import {
  obtenerReporteLotesDisponibles,
} from "./lotesDisponibles.controller.js";

import {
  obtenerReporteEgresos,
} from "./egresosReporte.controller.js";

import {
  obtenerReporteMaquinaria,
} from "./maquinariaReporte.controller.js";

import {
  obtenerResumenFinanciero,
} from "./resumenFinanciero.controller.js";

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
   INFORME DE LOTES DISPONIBLES
========================================================= */

router.get(
  "/lotes-disponibles",
  obtenerReporteLotesDisponibles
);

/* =========================================================
   INFORME DE EGRESOS
========================================================= */

router.get(
  "/egresos",
  obtenerReporteEgresos
);

/* =========================================================
   INFORME DE MAQUINARIA
========================================================= */

router.get(
  "/maquinaria",
  obtenerReporteMaquinaria
);

/* =========================================================
   RESUMEN FINANCIERO
========================================================= */

router.get(
  "/resumen-financiero",
  obtenerResumenFinanciero
);

/* =========================================================
   REPORTE GENERAL
========================================================= */

router.get(
  "/",
  obtenerReporteGeneral
);

export default router;