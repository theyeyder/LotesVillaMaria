import { Router } from "express";

import {
  obtenerLotes,
  obtenerLotePorId,
  crearLote,
  actualizarLote,
  eliminarLote,
} from "./lote.controller.js";

const router = Router();

/* =========================
   LOTES
========================= */

router.get(
  "/",
  obtenerLotes
);

router.get(
  "/:id",
  obtenerLotePorId
);

router.post(
  "/",
  crearLote
);

router.put(
  "/:id",
  actualizarLote
);

router.delete(
  "/:id",
  eliminarLote
);

export default router;