import api from "../api";

/* =========================================================
   INFORME DE MANZANAS Y LOTES

   GET /api/reportes/manzanas-lotes

   Filtros:
   - buscar
   - estado
   - tipo
   - manzana
========================================================= */

export const obtenerReporteManzanasLotes =
  async (
    filtros = {}
  ) => {
    const params = {};

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
       TIPO
    ===================================================== */

    if (
      filtros.tipo &&
      String(
        filtros.tipo
      ).trim()
    ) {
      params.tipo =
        String(
          filtros.tipo
        ).trim();
    }

    /* =====================================================
       MANZANA
    ===================================================== */

    if (
      filtros.manzana &&
      String(
        filtros.manzana
      ).trim()
    ) {
      params.manzana =
        String(
          filtros.manzana
        ).trim();
    }

    /* =====================================================
       PETICIÓN
    ===================================================== */

    const respuesta =
      await api.get(
        "/reportes/manzanas-lotes",
        {
          params,
        }
      );

    return respuesta.data;
  };

export default {
  obtenerReporteManzanasLotes,
};