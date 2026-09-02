import api from "./api";

/* =========================================================
   OBTENER COMISIONES

   Permite filtros:

   vendedor
   cliente
   venta
   estado
========================================================= */

export const obtenerComisiones =
  async (
    params = {}
  ) => {
    const response =
      await api.get(
        "/comisiones",
        {
          params,
        }
      );

    return response.data;
  };

/* =========================================================
   OBTENER COMISIÓN POR ID
========================================================= */

export const obtenerComisionPorId =
  async (
    id
  ) => {
    const response =
      await api.get(
        `/comisiones/${id}`
      );

    return response.data;
  };

/* =========================================================
   SINCRONIZAR COMISIONES

   Revisa las ventas existentes
   y genera las comisiones faltantes.
========================================================= */

export const sincronizarComisiones =
  async () => {
    const response =
      await api.post(
        "/comisiones/sincronizar"
      );

    return response.data;
  };