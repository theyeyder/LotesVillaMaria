import api from "../api";

/* =========================================================
   REPORTE DE CARTERA POR CLIENTE
========================================================= */

export const obtenerReporteCarteraClientes =
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
      filtros.buscar
    ) {
      params.buscar =
        filtros.buscar;
    }

    if (
      filtros.cliente
    ) {
      params.cliente =
        filtros.cliente;
    }

    if (
      filtros.estado
    ) {
      params.estado =
        filtros.estado;
    }

    const respuesta =
      await api.get(
        "/reportes/cartera-clientes",
        {
          params,
        }
      );

    return respuesta.data;
  };

export default {
  obtenerReporteCarteraClientes,
};