import api from "./api";

/* =========================================================
   OBTENER TODAS LAS CUOTAS

   Filtros disponibles:

   {
     venta,
     cliente,
     estado,
     fechaInicio,
     fechaFinal
   }

   Estados válidos:
   - Pendiente
   - Parcial
   - Pagada
   - Vencida
========================================================= */

export const obtenerCuotas = async (
  params = {}
) => {
  const response = await api.get(
    "/cuotas",
    {
      params,
    }
  );

  return response.data;
};

/* =========================================================
   OBTENER RESUMEN GENERAL DE CUOTAS
========================================================= */

export const obtenerResumenCuotas =
  async () => {
    const response = await api.get(
      "/cuotas/resumen"
    );

    return response.data;
  };

/* =========================================================
   OBTENER UNA CUOTA POR ID
========================================================= */

export const obtenerCuotaPorId =
  async (id) => {
    const response = await api.get(
      `/cuotas/${id}`
    );

    return response.data;
  };

/* =========================================================
   OBTENER CUOTAS DE UNA VENTA
========================================================= */

export const obtenerCuotasPorVenta =
  async (ventaId) => {
    const response = await api.get(
      `/cuotas/venta/${ventaId}`
    );

    return response.data;
  };

/* =========================================================
   GENERAR CUOTAS MANUALMENTE

   Principalmente útil para una venta financiada
   que todavía no tenga cuotas generadas.

   fechaPrimeraCuota es opcional.

   Ejemplo:

   generarCuotasVenta(
     ventaId,
     "2026-09-28"
   );
========================================================= */

export const generarCuotasVenta =
  async (
    ventaId,
    fechaPrimeraCuota = ""
  ) => {
    const body = {};

    if (
      fechaPrimeraCuota
    ) {
      body.fechaPrimeraCuota =
        fechaPrimeraCuota;
    }

    const response =
      await api.post(
        `/cuotas/generar/${ventaId}`,
        body
      );

    return response.data;
  };

/* =========================================================
   EXPORTACIÓN GENERAL
========================================================= */

const cuotaService = {
  obtenerCuotas,
  obtenerResumenCuotas,
  obtenerCuotaPorId,
  obtenerCuotasPorVenta,
  generarCuotasVenta,
};

export default cuotaService;