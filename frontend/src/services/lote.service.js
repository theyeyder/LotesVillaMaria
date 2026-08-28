import api from "./api";

/* =========================================================
   OBTENER LOTES
========================================================= */

export const obtenerLotes = async (
  params = {}
) => {
  const response = await api.get(
    "/lotes",
    {
      params,
    }
  );

  return response.data;
};

/* =========================================================
   OBTENER LOTE POR ID
========================================================= */

export const obtenerLotePorId = async (
  id
) => {
  const response = await api.get(
    `/lotes/${id}`
  );

  return response.data;
};

/* =========================================================
   CREAR LOTE
========================================================= */

export const crearLote = async (
  lote
) => {
  const response = await api.post(
    "/lotes",
    lote
  );

  return response.data;
};

/* =========================================================
   ACTUALIZAR LOTE
========================================================= */

export const actualizarLote = async (
  id,
  lote
) => {
  const response = await api.put(
    `/lotes/${id}`,
    lote
  );

  return response.data;
};

/* =========================================================
   ELIMINAR LOTE
========================================================= */

export const eliminarLote = async (
  id
) => {
  const response = await api.delete(
    `/lotes/${id}`
  );

  return response.data;
};

/* =========================================================
   EXPORTACIÓN GENERAL
========================================================= */

const loteService = {
  obtenerLotes,
  obtenerLotePorId,
  crearLote,
  actualizarLote,
  eliminarLote,
};

export default loteService;