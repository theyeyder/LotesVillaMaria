import api from "../api";

/* =========================================================
   OBTENER REPORTE DE LOTES DISPONIBLES
========================================================= */

export const obtenerReporteLotesDisponibles =
  async (filtros = {}) => {
    const params = {};

    if (filtros.buscar) {
      params.buscar =
        filtros.buscar;
    }

    if (filtros.manzana) {
      params.manzana =
        filtros.manzana;
    }

    if (filtros.tipo) {
      params.tipo =
        filtros.tipo;
    }

    if (
      filtros.areaDesde !== undefined &&
      filtros.areaDesde !== ""
    ) {
      params.areaDesde =
        filtros.areaDesde;
    }

    if (
      filtros.areaHasta !== undefined &&
      filtros.areaHasta !== ""
    ) {
      params.areaHasta =
        filtros.areaHasta;
    }

    if (
      filtros.valorDesde !== undefined &&
      filtros.valorDesde !== ""
    ) {
      params.valorDesde =
        filtros.valorDesde;
    }

    if (
      filtros.valorHasta !== undefined &&
      filtros.valorHasta !== ""
    ) {
      params.valorHasta =
        filtros.valorHasta;
    }

    const respuesta =
      await api.get(
        "/reportes/lotes-disponibles",
        {
          params,
        }
      );

    return respuesta.data;
  };

export default {
  obtenerReporteLotesDisponibles,
};