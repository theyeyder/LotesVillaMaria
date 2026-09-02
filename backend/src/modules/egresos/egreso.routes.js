import express from "express";

import {
  obtenerEgresos,
  obtenerEgresoPorId,
  registrarPagoComision,
  obtenerPagosComision,
  editarAbonoComision,
  eliminarMovimientoComision,
} from "./egreso.controller.js";

const router =
  express.Router();

/* =========================================================
   EGRESOS
========================================================= */

/*
  LISTAR TODOS LOS EGRESOS

  GET /api/egresos
*/

router.get(
  "/",
  obtenerEgresos
);

/* =========================================================
   COMISIONES
========================================================= */

/*
  HISTORIAL DE PAGOS DE UNA COMISIÓN

  GET /api/egresos/comisiones/:comisionId
*/

router.get(
  "/comisiones/:comisionId",
  obtenerPagosComision
);

/*
  REGISTRAR ABONO O PAGO TOTAL

  POST /api/egresos/comisiones/:comisionId
*/

router.post(
  "/comisiones/:comisionId",
  registrarPagoComision
);

/*
  EDITAR ABONO

  Solamente:
  - movimiento tipo Abono
  - último movimiento registrado

  El Pago total NO se puede editar.

  PUT /api/egresos/comisiones/abonos/:egresoId
*/

router.put(
  "/comisiones/abonos/:egresoId",
  editarAbonoComision
);

/*
  ELIMINAR MOVIMIENTO

  Puede eliminar:
  - Abono
  - Pago total

  Solamente si es el último movimiento.

  DELETE /api/egresos/comisiones/movimientos/:egresoId
*/

router.delete(
  "/comisiones/movimientos/:egresoId",
  eliminarMovimientoComision
);

/* =========================================================
   EGRESO POR ID

   IMPORTANTE:
   Esta ruta debe ir al final para evitar que "/:id"
   capture rutas como "/comisiones/..."
========================================================= */

router.get(
  "/:id",
  obtenerEgresoPorId
);

export default router;