import api from "./api";

/* =========================================================
   OBTENER TODAS LAS CUOTAS

   Permite filtros como:
   {
     venta,
     cliente,
     estado,
     fechaInicio,
     fechaFinal
   }
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
   OBTENER RESUMEN GENERAL
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
   OBTENER TODAS LAS CUOTAS DE UNA VENTA
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

   Esto nos sirve principalmente para ventas financiadas
   creadas antes de implementar la generación automática.

   fechaPrimeraCuota es opcional.

   Ejemplo:
   generarCuotasVenta(id, "2026-09-28")
========================================================= */

export const generarCuotasVenta =
  async (
    ventaId,
    fechaPrimeraCuota = ""
  ) => {
    const body = {};

    if (fechaPrimeraCuota) {
      body.fechaPrimeraCuota =
        fechaPrimeraCuota;
    }

    const response = await api.post(
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