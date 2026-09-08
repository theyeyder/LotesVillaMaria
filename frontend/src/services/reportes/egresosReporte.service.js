import api from "../api";

/* =========================================================
   OBTENER REPORTE DE EGRESOS
========================================================= */

export const obtenerReporteEgresos =
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

    if (filtros.tipo) {
      params.tipo =
        filtros.tipo;
    }

    if (filtros.tipoMovimiento) {
      params.tipoMovimiento =
        filtros.tipoMovimiento;
    }

    if (filtros.formaPago) {
      params.formaPago =
        filtros.formaPago;
    }

    const respuesta =
      await api.get(
        "/reportes/egresos",
        {
          params,
        }
      );

    return respuesta.data;
  };

export default {
  obtenerReporteEgresos,
};