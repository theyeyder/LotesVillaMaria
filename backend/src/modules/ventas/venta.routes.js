import { Router } from "express";

import {
  obtenerVentas,
  obtenerVentaPorId,
  obtenerVentaActivaPorLote,
  crearVenta,
  actualizarVenta,
  anularVenta,
  eliminarVenta,
} from "./venta.controller.js";

const router = Router();

/* =========================================================
   VENTAS
========================================================= */

/*
  Listar ventas
  GET /api/ventas
*/
router.get(
  "/",
  obtenerVentas
);

/*
  Obtener la venta activa asociada a un lote

  IMPORTANTE:
  Esta ruta debe ir ANTES de "/:id"
  para que Express no interprete "lote"
  como si fuera el ID de una venta.

  GET /api/ventas/lote/:loteId/activa
*/
router.get(
  "/lote/:loteId/activa",
  obtenerVentaActivaPorLote
);

/*
  Obtener venta por ID
  GET /api/ventas/:id
*/
router.get(
  "/:id",
  obtenerVentaPorId
);

/*
  Crear venta
  POST /api/ventas
*/
router.post(
  "/",
  crearVenta
);

/*
  Actualizar venta
  PUT /api/ventas/:id
*/
router.put(
  "/:id",
  actualizarVenta
);

/*
  Anular venta con motivo

  PATCH /api/ventas/:id/anular

  Body:
  {
    "motivoAnulacion": "Medidas incorrectas del lote"
  }
*/
router.patch(
  "/:id/anular",
  anularVenta
);

/*
  DELETE también conserva el historial:
  realmente anula la venta.

  Requiere igualmente motivoAnulacion.
*/
router.delete(
  "/:id",
  eliminarVenta
);

export default router;