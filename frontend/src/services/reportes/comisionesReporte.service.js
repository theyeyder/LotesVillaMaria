import api from "../api";

/* =========================================================
   INFORME DE COMISIONES

   GET /api/reportes/comisiones

   Filtros disponibles:
   - desde
   - hasta
   - buscar
   - vendedor
   - estado
========================================================= */

export const obtenerReporteComisiones =
  async (
    filtros = {}
  ) => {
    const params = {};

    /* =====================================================
       FECHA DESDE
    ===================================================== */

    if (
      filtros.desde
    ) {
      params.desde =
        filtros.desde;
    }

    /* =====================================================
       FECHA HASTA
    ===================================================== */

    if (
      filtros.hasta
    ) {
      params.hasta =
        filtros.hasta;
    }

    /* =====================================================
       BUSCADOR
    ===================================================== */

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

    /* =====================================================
       VENDEDOR
    ===================================================== */

    if (
      filtros.vendedor &&
      String(
        filtros.vendedor
      ).trim()
    ) {
      params.vendedor =
        String(
          filtros.vendedor
        ).trim();
    }

    /* =====================================================
       ESTADO
    ===================================================== */

    if (
      filtros.estado &&
      String(
        filtros.estado
      ).trim()
    ) {
      params.estado =
        String(
          filtros.estado
        ).trim();
    }

    /* =====================================================
       PETICIÓN
    ===================================================== */

    const respuesta =
      await api.get(
        "/reportes/comisiones",
        {
          params,
        }
      );

    return respuesta.data;
  };

export default {
  obtenerReporteComisiones,
};