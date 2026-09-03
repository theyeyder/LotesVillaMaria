import api from "./api";

/* =========================================================
   OBTENER COMPROBANTES

   Filtros disponibles:

   movimiento:
   - ""
   - "Ingreso"
   - "Egreso"

   desde:
   - YYYY-MM-DD

   hasta:
   - YYYY-MM-DD

   buscar:
   - Código
   - Nombre
   - Documento
   - Concepto
========================================================= */

export const obtenerComprobantes = async (
  filtros = {}
) => {
  const params = {};

  if (filtros.movimiento) {
    params.movimiento =
      filtros.movimiento;
  }

  if (filtros.desde) {
    params.desde =
      filtros.desde;
  }

  if (filtros.hasta) {
    params.hasta =
      filtros.hasta;
  }

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

  const respuesta =
    await api.get(
      "/comprobantes",
      {
        params,
      }
    );

  return respuesta.data;
};