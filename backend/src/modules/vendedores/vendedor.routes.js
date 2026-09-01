import express from "express";

import {
  obtenerVendedores,
  obtenerVendedorPorId,
  crearVendedor,
  actualizarVendedor,
  cambiarEstadoVendedor,
} from "./vendedor.controller.js";

const router = express.Router();

/* =========================================================
   VENDEDORES
========================================================= */

/* LISTAR */
router.get(
  "/",
  obtenerVendedores
);

/* OBTENER UNO */
router.get(
  "/:id",
  obtenerVendedorPorId
);

/* CREAR */
router.post(
  "/",
  crearVendedor
);

/* ACTUALIZAR */
router.put(
  "/:id",
  actualizarVendedor
);

/* ACTIVAR / INACTIVAR */
router.patch(
  "/:id/estado",
  cambiarEstadoVendedor
);

export default router;