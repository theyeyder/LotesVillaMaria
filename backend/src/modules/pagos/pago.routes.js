import { Router } from "express";

import {
  obtenerPagos,
  obtenerPagoPorId,
  crearPago,
  anularPago,
  obtenerResumenPagos,
} from "./pago.controller.js";

const router = Router();

/* =========================================================
   RESUMEN DE PAGOS

   GET /api/pagos/resumen

   IMPORTANTE:
   Debe quedar antes de "/:id".
========================================================= */

router.get(
  "/resumen",
  obtenerResumenPagos
);

/* =========================================================
   LISTAR PAGOS

   GET /api/pagos

   Filtros disponibles:

   ?venta=ID
   ?cliente=ID
   ?estado=Aplicado
   ?metodoPago=Efectivo
   ?fechaInicio=2026-08-01
   ?fechaFinal=2026-08-31
========================================================= */

router.get(
  "/",
  obtenerPagos
);

/* =========================================================
   REGISTRAR PAGO

   POST /api/pagos
========================================================= */

router.post(
  "/",
  crearPago
);

/* =========================================================
   ANULAR PAGO

   PATCH /api/pagos/:id/anular

   Body:

   {
     "motivoAnulacion": "Pago registrado por error"
   }
========================================================= */

router.patch(
  "/:id/anular",
  anularPago
);

/* =========================================================
   OBTENER PAGO POR ID

   GET /api/pagos/:id

   Esta ruta debe quedar después de "/resumen".
========================================================= */

router.get(
  "/:id",
  obtenerPagoPorId
);

export default router;