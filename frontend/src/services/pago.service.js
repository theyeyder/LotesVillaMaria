import api from "./api";

/* =========================================================
   OBTENER TODOS LOS PAGOS

   Permite filtros como:

   {
     venta,
     cliente,
     metodoPago,
     fechaInicio,
     fechaFinal
   }

   Ya NO existe filtro por estado.
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
   ELIMINAR PAGO DEFINITIVAMENTE

   DELETE /api/pagos/:id

   Al eliminar:
   - el pago desaparece
   - se recalculan las cuotas afectadas
   - el valor vuelve al saldo pendiente
   - se recalcula el estado de la venta
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
  eliminarPago,
};

export default pagoService;