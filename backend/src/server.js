import "dotenv/config";

import { networkInterfaces } from "os";

import app from "./app.js";
import { connectDB } from "./config/db.js";

const PORT =
  process.env.PORT || 5000;

const HOST =
  "0.0.0.0";

/* =========================================================
   OBTENER IP LOCAL
========================================================= */

const obtenerIPsLocales = () => {
  const interfaces =
    networkInterfaces();

  const ips = [];

  Object.values(
    interfaces
  ).forEach(
    (lista) => {
      if (
        !Array.isArray(lista)
      ) {
        return;
      }

      lista.forEach(
        (interfaz) => {
          if (
            interfaz.family ===
              "IPv4" &&
            !interfaz.internal
          ) {
            ips.push(
              interfaz.address
            );
          }
        }
      );
    }
  );

  return ips;
};

/* =========================================================
   INICIAR SERVIDOR
========================================================= */

const iniciarServidor =
  async () => {
    try {
      await connectDB();

      app.listen(
        PORT,
        HOST,
        () => {
          console.log("");
          console.log(
            "=============================================="
          );

          console.log(
            "   LOTES VILLA MARIA"
          );

          console.log(
            "=============================================="
          );

          console.log("");

          console.log(
            `Servidor ejecutándose en puerto ${PORT}`
          );

          console.log("");

          console.log(
            "Acceso desde este computador:"
          );

          console.log(
            `http://localhost:${PORT}`
          );

          const ips =
            obtenerIPsLocales();

          if (
            ips.length > 0
          ) {
            console.log("");

            console.log(
              "Acceso desde otros dispositivos:"
            );

            ips.forEach(
              (ip) => {
                console.log(
                  `http://${ip}:${PORT}`
                );
              }
            );
          }

          console.log("");
          console.log(
            "=============================================="
          );
          console.log("");
        }
      );
    } catch (error) {
      console.error(
        "Error iniciando LotesVillaMaria:",
        error
      );

      process.exit(1);
    }
  };

iniciarServidor();