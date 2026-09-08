import api from "../api";

/* =========================================================
   OBTENER RESUMEN FINANCIERO
========================================================= */

export const obtenerResumenFinanciero =
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

    const respuesta =
      await api.get(
        "/reportes/resumen-financiero",
        {
          params,
        }
      );

    return respuesta.data;
  };

export default {
  obtenerResumenFinanciero,
};