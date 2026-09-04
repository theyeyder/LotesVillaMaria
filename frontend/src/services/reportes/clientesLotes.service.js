import api from "../api";

/* =========================================================
   INFORME:
   CLIENTES POR LOTES VENDIDOS
========================================================= */

export const obtenerClientesLotesVendidos =
  async (
    filtros = {}
  ) => {
    const params = {};

    /* =====================================================
       FECHAS
    ===================================================== */

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
       ESTADO DE CARTERA
       Pendiente / Vencida / Pagada
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
        "/reportes/clientes-lotes-vendidos",
        {
          params,
        }
      );

    return respuesta.data;
  };