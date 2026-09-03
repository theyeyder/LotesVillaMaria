import { Router } from "express";

import {
  obtenerCartera,
} from "./cartera.controller.js";

const router = Router();

/* =========================================================
   CARTERA

   GET /api/cartera

   Ejemplos:

   /api/cartera

   /api/cartera?estado=Pendiente

   /api/cartera?estado=Vencida

   /api/cartera?estado=Pagada

   /api/cartera?buscar=juan

   /api/cartera?desde=2026-09-01&hasta=2026-09-30
========================================================= */

router.get(
  "/",
  obtenerCartera
);

export default router;