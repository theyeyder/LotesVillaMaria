import { Router } from "express";

import {
  obtenerPagosManuales,
  obtenerPagoManualPorId,
  crearPagoManual,
  actualizarPagoManual,
  eliminarPagoManual,
} from "./pagoManual.controller.js";

/* =========================================================
   ROUTER
========================================================= */

const router = Router();

/* =========================================================
   LISTAR PAGOS MANUALES

   GET /api/pagos-manuales

   FILTROS OPCIONALES:

   ?buscar=cafe
   ?beneficiario=OBJECT_ID
   ?formaPago=Efectivo
   ?desde=2026-10-01
   ?hasta=2026-10-31
========================================================= */

router.get(
  "/",
  obtenerPagosManuales
);

/* =========================================================
   OBTENER PAGO MANUAL POR ID

   GET /api/pagos-manuales/:id
========================================================= */

router.get(
  "/:id",
  obtenerPagoManualPorId
);

/* =========================================================
   CREAR PAGO MANUAL

   POST /api/pagos-manuales

   EJEMPLO:

   {
     "beneficiario": "OBJECT_ID",
     "motivo": "Compra de café",
     "valor": 10000,
     "fechaPago": "2026-10-12",
     "formaPago": "Efectivo",
     "referenciaPago": "",
     "observaciones": "Café para oficina"
   }

   AUTOMÁTICAMENTE:

   Pago Manual
        ↓
   EG-XXXX
        ↓
   Egresos
========================================================= */

router.post(
  "/",
  crearPagoManual
);

/* =========================================================
   ACTUALIZAR PAGO MANUAL

   PUT /api/pagos-manuales/:id

   IMPORTANTE:

   Se actualiza también el Egreso relacionado,
   conservando el mismo código EG-XXXX.
========================================================= */

router.put(
  "/:id",
  actualizarPagoManual
);

/* =========================================================
   ELIMINAR PAGO MANUAL

   DELETE /api/pagos-manuales/:id

   Se elimina:

   PagoManual
       +
   Egreso relacionado
========================================================= */

router.delete(
  "/:id",
  eliminarPagoManual
);

/* =========================================================
   EXPORT
========================================================= */

export default router;