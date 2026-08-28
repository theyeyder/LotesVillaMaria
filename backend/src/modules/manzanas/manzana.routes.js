import { Router } from "express";

import {
  obtenerManzanas,
  obtenerManzanaPorId,
  crearManzana,
  actualizarManzana,
  eliminarManzana,
} from "./manzana.controller.js";

const router = Router();

router.get(
  "/",
  obtenerManzanas
);

router.get(
  "/:id",
  obtenerManzanaPorId
);

router.post(
  "/",
  crearManzana
);

router.put(
  "/:id",
  actualizarManzana
);

router.delete(
  "/:id",
  eliminarManzana
);

export default router;