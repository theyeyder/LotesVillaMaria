import api from "./api";

/* =========================================================
   OBTENER REPORTE GENERAL
========================================================= */

export const obtenerReporteGeneral =
  async (
    filtros = {}
  ) => {
    const params = {};

    if (
      filtros.desde
    ) {
      params.desde =
        filtros.desde;
    }

    if (
      filtros.hasta
    ) {
      params.hasta =
        filtros.hasta;
    }

    if (
      filtros.buscar &&
      String(
        filtros.buscar
      ).trim()
    ) {
      params.buscar =
        String(
          filtros.buscar
        ).trim();
    }

    const respuesta =
      await api.get(
        "/reportes",
        {
          params,
        }
      );

    return respuesta.data;
  };