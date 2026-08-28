import express from "express";
import cors from "cors";
import morgan from "morgan";

import clientesRouter from "./modules/clientes/cliente.routes.js";
import maquinariaRouter from "./modules/maquinaria/maquinaria.routes.js";
import horasMaquinariaRouter from "./modules/horasMaquinaria/horaMaquinaria.routes.js";
import manzanasRouter from "./modules/manzanas/manzana.routes.js";
import lotesRouter from "./modules/lotes/lote.routes.js";
import ventasRouter from "./modules/ventas/venta.routes.js";

const app = express();

/* =========================================================
   MIDDLEWARES
========================================================= */

app.use(cors());

app.use(express.json());

app.use(morgan("dev"));

/* =========================================================
   HEALTH
========================================================= */

app.get(
  "/api/health",
  (_req, res) => {
    res.json({
      ok: true,
      app: "LotesVillaMaria",
    });
  }
);

/* =========================================================
   RUTAS
========================================================= */

app.use(
  "/api/clientes",
  clientesRouter
);

app.use(
  "/api/maquinaria",
  maquinariaRouter
);

app.use(
  "/api/horas-maquinaria",
  horasMaquinariaRouter
);

app.use(
  "/api/manzanas",
  manzanasRouter
);

app.use(
  "/api/lotes",
  lotesRouter
);

app.use(
  "/api/ventas",
  ventasRouter
);

/* =========================================================
   404
========================================================= */

app.use(
  (req, res) => {
    res.status(404).json({
      message:
        `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    });
  }
);

export default app;