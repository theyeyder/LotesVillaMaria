import {
  Router,
} from "express";

import {
  obtenerComisiones,
  obtenerComisionPorId,
  sincronizarComisiones,
} from "./comision.controller.js";

/* =========================================================
   ROUTER
========================================================= */

const router =
  Router();

/* =========================================================
   RUTAS DE COMISIONES
========================================================= */

/*
  GET /api/comisiones

  Lista todas las comisiones.

  Permite filtros:

  ?vendedor=
  ?cliente=
  ?venta=
  ?estado=Pendiente
*/

router.get(
  "/",
  obtenerComisiones
);

/*
  POST /api/comisiones/sincronizar

  Revisa todas las ventas existentes
  y crea las comisiones que hagan falta.

  Importante:
  esta ruta debe ir ANTES de /:id
*/

router.post(
  "/sincronizar",
  sincronizarComisiones
);

/*
  GET /api/comisiones/:id

  Obtiene el detalle de una comisión.
*/

router.get(
  "/:id",
  obtenerComisionPorId
);

/* =========================================================
   EXPORTAR
========================================================= */

export default router;