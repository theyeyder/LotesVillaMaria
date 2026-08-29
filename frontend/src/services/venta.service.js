import api from "./api";

/* =========================================================
   OBTENER VENTAS
========================================================= */

export const obtenerVentas = async (
  params = {}
) => {
  const response = await api.get(
    "/ventas",
    {
      params,
    }
  );

  return response.data;
};

/* =========================================================
   OBTENER VENTA POR ID
========================================================= */

export const obtenerVentaPorId = async (
  id
) => {
  const response = await api.get(
    `/ventas/${id}`
  );

  return response.data;
};

/* =========================================================
   OBTENER VENTA POR LOTE

   Conservamos este nombre porque el módulo LOTES
   ya lo utiliza actualmente.

   Si la venta fue eliminada, ya no existirá.
========================================================= */

export const obtenerVentaActivaPorLote =
  async (loteId) => {
    const response = await api.get(
      `/ventas/lote/${loteId}/activa`
    );

    return response.data;
  };

/* =========================================================
   CREAR VENTA
========================================================= */

export const crearVenta = async (
  venta
) => {
  const response = await api.post(
    "/ventas",
    venta
  );

  return response.data;
};

/* =========================================================
   ACTUALIZAR VENTA
========================================================= */

export const actualizarVenta = async (
  id,
  venta
) => {
  const response = await api.put(
    `/ventas/${id}`,
    venta
  );

  return response.data;
};

/* =========================================================
   ELIMINAR VENTA DEFINITIVAMENTE

   DELETE /api/ventas/:id

   Ya NO:
   - solicita motivo
   - cambia estado a Anulada
   - conserva la venta

   Ahora:
   - elimina las cuotas
   - elimina la venta
   - libera el lote

   El backend bloqueará la eliminación si la venta
   todavía tiene pagos registrados.
========================================================= */

export const eliminarVenta = async (
  id
) => {
  const response = await api.delete(
    `/ventas/${id}`
  );

  return response.data;
};

/* =========================================================
   EXPORTACIÓN GENERAL
========================================================= */

const ventaService = {
  obtenerVentas,
  obtenerVentaPorId,
  obtenerVentaActivaPorLote,
  crearVenta,
  actualizarVenta,
  eliminarVenta,
};

export default ventaService;