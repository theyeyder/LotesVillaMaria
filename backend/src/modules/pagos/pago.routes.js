import { Router } from "express";

import {
  obtenerPagos,
  obtenerPagoPorId,
  crearPago,
  eliminarPago,
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
   ?metodoPago=Efectivo
   ?fechaInicio=2026-08-01
   ?fechaFinal=2026-08-31

   Ya NO existe filtro por estado.
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
   ELIMINAR PAGO DEFINITIVAMENTE

   DELETE /api/pagos/:id

   Al eliminar:
   - el pago desaparece
   - se recalculan las cuotas afectadas
   - el dinero vuelve al saldo pendiente
   - se recalcula el estado de la venta
========================================================= */

router.delete(
  "/:id",
  eliminarPago
);

/* =========================================================
   OBTENER PAGO POR ID

   GET /api/pagos/:id

   Debe permanecer después de "/resumen".
========================================================= */

router.get(
  "/:id",
  obtenerPagoPorId
);

export default router;