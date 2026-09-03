import api from "./api";

/* =========================================================
   OBTENER CARTERA

   Filtros disponibles:

   buscar:
   - Cliente
   - Documento
   - Venta
   - Lote
   - Manzana

   estado:
   - ""
   - "Pendiente"
   - "Vencida"
   - "Pagada"

   desde / hasta:
   - YYYY-MM-DD
========================================================= */

export const obtenerCartera = async (
  filtros = {}
) => {
  const params = {};

  /* =========================
     BÚSQUEDA
  ========================= */

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

  /* =========================
     ESTADO
  ========================= */

  if (
    filtros.estado
  ) {
    params.estado =
      filtros.estado;
  }

  /* =========================
     FECHA INICIAL
  ========================= */

  if (
    filtros.desde
  ) {
    params.desde =
      filtros.desde;
  }

  /* =========================
     FECHA FINAL
  ========================= */

  if (
    filtros.hasta
  ) {
    params.hasta =
      filtros.hasta;
  }

  /* =========================
     PETICIÓN
  ========================= */

  const respuesta =
    await api.get(
      "/cartera",
      {
        params,
      }
    );

  return respuesta.data;
};