import express from "express";

import {
  obtenerEgresos,
  obtenerEgresoPorId,

  /* =======================================================
     COMISIONES
  ======================================================= */

  registrarPagoComision,
  obtenerPagosComision,
  editarAbonoComision,
  eliminarMovimientoComision,

  /* =======================================================
     MAQUINARIA
  ======================================================= */

  registrarPagoMaquinaria,
  obtenerPagosMaquinaria,
  editarAbonoMaquinaria,
  eliminarMovimientoMaquinaria,
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

  GET
  /api/egresos/comisiones/:comisionId
*/

router.get(
  "/comisiones/:comisionId",
  obtenerPagosComision
);

/*
  REGISTRAR ABONO O PAGO TOTAL DE COMISIÓN

  POST
  /api/egresos/comisiones/:comisionId
*/

router.post(
  "/comisiones/:comisionId",
  registrarPagoComision
);

/*
  EDITAR ABONO DE COMISIÓN

  REGLAS:

  ABONO
  ✅ Editar

  PAGO TOTAL
  ❌ Editar

  Solamente se puede editar
  el último movimiento.

  PUT
  /api/egresos/comisiones/abonos/:egresoId
*/

router.put(
  "/comisiones/abonos/:egresoId",
  editarAbonoComision
);

/*
  ELIMINAR MOVIMIENTO DE COMISIÓN

  ABONO
  ✅ Eliminar

  PAGO TOTAL
  ✅ Eliminar

  Solamente se puede eliminar
  el último movimiento.

  DELETE
  /api/egresos/comisiones/movimientos/:egresoId
*/

router.delete(
  "/comisiones/movimientos/:egresoId",
  eliminarMovimientoComision
);

/* =========================================================
   MAQUINARIA
========================================================= */

/*
  HISTORIAL DE PAGOS DE UN REGISTRO
  DE HORAS DE MAQUINARIA

  GET
  /api/egresos/maquinaria/:horaMaquinariaId
*/

router.get(
  "/maquinaria/:horaMaquinariaId",
  obtenerPagosMaquinaria
);

/*
  REGISTRAR ABONO O PAGO TOTAL
  DE HORAS DE MAQUINARIA

  POST
  /api/egresos/maquinaria/:horaMaquinariaId
*/

router.post(
  "/maquinaria/:horaMaquinariaId",
  registrarPagoMaquinaria
);

/*
  EDITAR ABONO DE MAQUINARIA

  ABONO
  ✅ Editar

  PAGO TOTAL
  ❌ Editar

  Solamente se puede editar
  el último movimiento.

  PUT
  /api/egresos/maquinaria/abonos/:egresoId
*/

router.put(
  "/maquinaria/abonos/:egresoId",
  editarAbonoMaquinaria
);

/*
  ELIMINAR MOVIMIENTO DE MAQUINARIA

  ABONO
  ✅ Eliminar

  PAGO TOTAL
  ✅ Eliminar

  Solamente se puede eliminar
  el último movimiento.

  DELETE
  /api/egresos/maquinaria/movimientos/:egresoId
*/

router.delete(
  "/maquinaria/movimientos/:egresoId",
  eliminarMovimientoMaquinaria
);

/* =========================================================
   EGRESO POR ID

   IMPORTANTE:

   ESTA RUTA DEBE PERMANECER AL FINAL.

   Si "/:id" se coloca antes, Express podría interpretar
   otras rutas como:

   /comisiones/...
   /maquinaria/...

   como si fueran IDs.
========================================================= */

router.get(
  "/:id",
  obtenerEgresoPorId
);

export default router;