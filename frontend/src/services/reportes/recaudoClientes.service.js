import api from "../api";

/* =========================================================
   OBTENER REPORTE DE RECAUDO POR CLIENTE
========================================================= */

export const obtenerReporteRecaudoClientes =
  async (filtros = {}) => {
    const params = {};

    if (filtros.desde) {
      params.desde =
        filtros.desde;
    }

    if (filtros.hasta) {
      params.hasta =
        filtros.hasta;
    }

    if (filtros.buscar) {
      params.buscar =
        filtros.buscar;
    }

    if (filtros.cliente) {
      params.cliente =
        filtros.cliente;
    }

    if (filtros.metodo) {
      params.metodo =
        filtros.metodo;
    }

    const respuesta =
      await api.get(
        "/reportes/recaudo-clientes",
        {
          params,
        }
      );

    return respuesta.data;
  };

export default {
  obtenerReporteRecaudoClientes,
};