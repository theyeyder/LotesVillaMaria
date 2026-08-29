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
   OBTENER VENTA ACTIVA POR LOTE

   Usado desde el módulo LOTES cuando
   se intenta editar un lote vendido.
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
   ANULAR VENTA

   Ahora el motivo es obligatorio.
========================================================= */

export const anularVenta = async (
  id,
  motivoAnulacion
) => {
  const response = await api.patch(
    `/ventas/${id}/anular`,
    {
      motivoAnulacion,
    }
  );

  return response.data;
};
/* =========================================================
   ELIMINAR / ANULAR

   En realidad no se borra de MongoDB.
   Se conserva como venta anulada.
========================================================= */

export const eliminarVenta = async (
  id,
  motivoAnulacion
) => {
  const response = await api.delete(
    `/ventas/${id}`,
    {
      data: {
        motivoAnulacion,
      },
    }
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
  anularVenta,
  eliminarVenta,
};

export default ventaService;