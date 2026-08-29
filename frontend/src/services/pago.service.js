import api from "./api";

/* =========================================================
   OBTENER TODOS LOS PAGOS

   Permite filtros como:

   {
     venta,
     cliente,
     estado,
     metodoPago,
     fechaInicio,
     fechaFinal
   }
========================================================= */

export const obtenerPagos = async (
  params = {}
) => {
  const response = await api.get(
    "/pagos",
    {
      params,
    }
  );

  return response.data;
};

/* =========================================================
   OBTENER RESUMEN GENERAL DE PAGOS
========================================================= */

export const obtenerResumenPagos =
  async () => {
    const response = await api.get(
      "/pagos/resumen"
    );

    return response.data;
  };

/* =========================================================
   OBTENER UN PAGO POR ID
========================================================= */

export const obtenerPagoPorId =
  async (id) => {
    const response = await api.get(
      `/pagos/${id}`
    );

    return response.data;
  };

/* =========================================================
   REGISTRAR PAGO
========================================================= */

export const crearPago =
  async (pago) => {
    const response = await api.post(
      "/pagos",
      pago
    );

    return response.data;
  };

/* =========================================================
   ANULAR PAGO

   motivoAnulacion es obligatorio.
========================================================= */

export const anularPago =
  async (
    id,
    motivoAnulacion
  ) => {
    const response =
      await api.patch(
        `/pagos/${id}/anular`,
        {
          motivoAnulacion,
        }
      );

    return response.data;
  };

/* =========================================================
   REVERTIR PAGO

   PATCH /api/pagos/:id/revertir

   Solo se permite cuando el pago anulado es el ÚNICO
   registro de pago para esa venta.
========================================================= */

export const revertirPago =
  async (id) => {
    const response =
      await api.patch(
        `/pagos/${id}/revertir`
      );

    return response.data;
  };

/* =========================================================
   ELIMINAR PAGO ANULADO

   DELETE /api/pagos/:id

   Solo se permite si:
   - está Anulado
   - ya existe OTRO pago Aplicado para esa misma venta
========================================================= */

export const eliminarPago =
  async (id) => {
    const response =
      await api.delete(
        `/pagos/${id}`
      );

    return response.data;
  };

/* =========================================================
   EXPORTACIÓN GENERAL
========================================================= */

const pagoService = {
  obtenerPagos,
  obtenerResumenPagos,
  obtenerPagoPorId,
  crearPago,
  anularPago,
  revertirPago,
  eliminarPago,
};

export default pagoService;