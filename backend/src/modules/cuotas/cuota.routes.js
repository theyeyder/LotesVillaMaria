import { Router } from "express";

import {
  obtenerCuotas,
  obtenerCuotaPorId,
  obtenerCuotasPorVenta,
  generarCuotasVenta,
  obtenerResumenCuotas,
} from "./cuota.controller.js";

const router = Router();

/* =========================================================
   CUOTAS
========================================================= */

/*
  Resumen general

  GET /api/cuotas/resumen

  IMPORTANTE:
  Debe ir antes de "/:id".
*/
router.get(
  "/resumen",
  obtenerResumenCuotas
);

/*
  Obtener todas las cuotas de una venta

  GET /api/cuotas/venta/:ventaId
*/
router.get(
  "/venta/:ventaId",
  obtenerCuotasPorVenta
);

/*
  Generar las cuotas de una venta financiada

  POST /api/cuotas/generar/:ventaId

  Body opcional:

  {
    "fechaPrimeraCuota": "2026-09-28"
  }
*/
router.post(
  "/generar/:ventaId",
  generarCuotasVenta
);

/*
  Listar cuotas

  GET /api/cuotas

  Filtros disponibles:

  ?venta=ID
  ?cliente=ID
  ?estado=Pendiente
  ?fechaInicio=2026-09-01
  ?fechaFinal=2026-09-30
*/
router.get(
  "/",
  obtenerCuotas
);

/*
  Obtener una cuota por ID

  GET /api/cuotas/:id

  Debe quedar después de las rutas
  especiales de arriba.
*/
router.get(
  "/:id",
  obtenerCuotaPorId
);

export default router;