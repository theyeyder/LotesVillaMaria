import { Router } from "express";

import {
  obtenerVentas,
  obtenerVentaPorId,
  obtenerVentaActivaPorLote,
  crearVenta,
  actualizarVenta,
  eliminarVenta,
} from "./venta.controller.js";

const router = Router();

/* =========================================================
   VENTAS
========================================================= */

/* =========================================================
   LISTAR VENTAS

   GET /api/ventas
========================================================= */

router.get(
  "/",
  obtenerVentas
);

/* =========================================================
   OBTENER VENTA ASOCIADA A UN LOTE

   IMPORTANTE:
   Esta ruta debe permanecer ANTES de "/:id"
   para que Express no interprete "lote"
   como si fuera el ID de una venta.

   GET /api/ventas/lote/:loteId/activa
========================================================= */

router.get(
  "/lote/:loteId/activa",
  obtenerVentaActivaPorLote
);

/* =========================================================
   OBTENER VENTA POR ID

   GET /api/ventas/:id
========================================================= */

router.get(
  "/:id",
  obtenerVentaPorId
);

/* =========================================================
   CREAR VENTA

   POST /api/ventas
========================================================= */

router.post(
  "/",
  crearVenta
);

/* =========================================================
   ACTUALIZAR VENTA

   PUT /api/ventas/:id
========================================================= */

router.put(
  "/:id",
  actualizarVenta
);

/* =========================================================
   ELIMINAR VENTA DEFINITIVAMENTE

   DELETE /api/ventas/:id

   REGLA:
   - Si tiene pagos registrados, NO permite eliminar.
   - Primero deben eliminarse los pagos.
   - Después elimina cuotas.
   - Libera el lote.
   - Elimina definitivamente la venta.
========================================================= */

router.delete(
  "/:id",
  eliminarVenta
);

export default router;