import api from "../api";

/* =========================================================
   OBTENER REPORTE DE MAQUINARIA
========================================================= */

export const obtenerReporteMaquinaria =
  async (filtros = {}) => {
    const params = {};

    if (filtros.buscar) {
      params.buscar =
        filtros.buscar;
    }

    if (filtros.maquinaria) {
      params.maquinaria =
        filtros.maquinaria;
    }

    if (filtros.operario) {
      params.operario =
        filtros.operario;
    }

    if (filtros.desde) {
      params.desde =
        filtros.desde;
    }

    if (filtros.hasta) {
      params.hasta =
        filtros.hasta;
    }

    if (filtros.estadoPago) {
      params.estadoPago =
        filtros.estadoPago;
    }

    const respuesta =
      await api.get(
        "/reportes/maquinaria",
        {
          params,
        }
      );

    return respuesta.data;
  };

export default {
  obtenerReporteMaquinaria,
};