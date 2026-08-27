import { Router } from "express";

import {
  obtenerMaquinarias,
  obtenerMaquinariaPorId,
  crearMaquinaria,
  actualizarMaquinaria,
  eliminarMaquinaria,
} from "./maquinaria.controller.js";

const router = Router();

router.get("/", obtenerMaquinarias);

router.get("/:id", obtenerMaquinariaPorId);

router.post("/", crearMaquinaria);

router.put("/:id", actualizarMaquinaria);

router.delete("/:id", eliminarMaquinaria);

export default router;