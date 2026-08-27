import { Router } from "express";

import {
  obtenerHorasMaquinaria,
  obtenerHoraMaquinariaPorId,
  crearHoraMaquinaria,
  actualizarHoraMaquinaria,
  eliminarHoraMaquinaria,
  obtenerResumenHoras,
} from "./horaMaquinaria.controller.js";

const router = Router();

/*
  IMPORTANTE:
  La ruta /resumen debe ir antes de /:id
  para evitar que Express interprete
  "resumen" como si fuera un id.
*/

router.get("/resumen", obtenerResumenHoras);

router.get("/", obtenerHorasMaquinaria);

router.get("/:id", obtenerHoraMaquinariaPorId);

router.post("/", crearHoraMaquinaria);

router.put("/:id", actualizarHoraMaquinaria);

router.delete("/:id", eliminarHoraMaquinaria);

export default router;