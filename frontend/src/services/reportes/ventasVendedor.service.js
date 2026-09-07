import api from "../api";

/* =========================================================
   REPORTE DE VENTAS POR VENDEDOR
========================================================= */

export const obtenerReporteVentasVendedor =
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

    if (filtros.vendedor) {
      params.vendedor =
        filtros.vendedor;
    }

    if (filtros.estado) {
      params.estado =
        filtros.estado;
    }

    const respuesta =
      await api.get(
        "/reportes/ventas-vendedor",
        {
          params,
        }
      );

    return respuesta.data;
  };

export default {
  obtenerReporteVentasVendedor,
};