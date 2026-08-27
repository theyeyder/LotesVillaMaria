import express from "express";
import cors from "cors";
import morgan from "morgan";

import clientesRouter from "./modules/clientes/cliente.routes.js";
import maquinariaRouter from "./modules/maquinaria/maquinaria.routes.js";
import horasMaquinariaRouter from "./modules/horasMaquinaria/horaMaquinaria.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    app: "LotesVillaMaria",
  });
});

app.use("/api/clientes", clientesRouter);

app.use("/api/maquinaria", maquinariaRouter);

app.use(
  "/api/horas-maquinaria",
  horasMaquinariaRouter
);

app.use((req, res) => {
  res.status(404).json({
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
});

export default app;