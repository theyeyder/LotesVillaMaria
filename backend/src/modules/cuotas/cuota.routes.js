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

/* =========================================================
   RESUMEN GENERAL

   GET /api/cuotas/resumen

   IMPORTANTE:
   Debe quedar antes de "/:id".
========================================================= */

router.get(
  "/resumen",
  obtenerResumenCuotas
);

/* =========================================================
   OBTENER CUOTAS DE UNA VENTA

   GET /api/cuotas/venta/:ventaId
========================================================= */

router.get(
  "/venta/:ventaId",
  obtenerCuotasPorVenta
);

/* =========================================================
   GENERAR CUOTAS DE UNA VENTA FINANCIADA

   POST /api/cuotas/generar/:ventaId

   Body opcional:

   {
     "fechaPrimeraCuota": "2026-09-28"
   }
========================================================= */

router.post(
  "/generar/:ventaId",
  generarCuotasVenta
);

/* =========================================================
   LISTAR CUOTAS

   GET /api/cuotas

   Filtros disponibles:

   ?venta=ID
   ?cliente=ID
   ?estado=Pendiente
   ?estado=Parcial
   ?estado=Pagada
   ?estado=Vencida
   ?fechaInicio=2026-09-01
   ?fechaFinal=2026-09-30

   Ya NO existe estado "Anulada".
========================================================= */

router.get(
  "/",
  obtenerCuotas
);

/* =========================================================
   OBTENER CUOTA POR ID

   GET /api/cuotas/:id

   Debe quedar después de las rutas especiales.
========================================================= */

router.get(
  "/:id",
  obtenerCuotaPorId
);

export default router;