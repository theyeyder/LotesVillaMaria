import api from "./api";

/* =========================================================
   PAGOS MANUALES
========================================================= */

/* =========================================================
   LISTAR PAGOS MANUALES

   filtros opcionales:

   {
     buscar: "",
     beneficiario: "",
     formaPago: "",
     desde: "",
     hasta: ""
   }
========================================================= */

export const obtenerPagosManuales = async (
  filtros = {}
) => {
  const response =
    await api.get(
      "/pagos-manuales",
      {
        params: filtros,
      }
    );

  return response.data;
};

/* =========================================================
   OBTENER PAGO MANUAL POR ID
========================================================= */

export const obtenerPagoManualPorId = async (
  id
) => {
  const response =
    await api.get(
      `/pagos-manuales/${id}`
    );

  return response.data;
};

/* =========================================================
   CREAR PAGO MANUAL

   Al crear:

   Pago Manual
       ↓
   genera EG-XXXX
       ↓
   aparece en Egresos
========================================================= */

export const crearPagoManual = async (
  datos
) => {
  const response =
    await api.post(
      "/pagos-manuales",
      datos
    );

  return response.data;
};

/* =========================================================
   ACTUALIZAR PAGO MANUAL

   IMPORTANTE:

   El backend conserva el mismo EG-XXXX
   y actualiza también el Egreso relacionado.
========================================================= */

export const actualizarPagoManual = async (
  id,
  datos
) => {
  const response =
    await api.put(
      `/pagos-manuales/${id}`,
      datos
    );

  return response.data;
};

/* =========================================================
   ELIMINAR PAGO MANUAL

   Al eliminar:

   - elimina PagoManual
   - elimina el EG-XXXX relacionado
========================================================= */

export const eliminarPagoManual = async (
  id
) => {
  const response =
    await api.delete(
      `/pagos-manuales/${id}`
    );

  return response.data;
};