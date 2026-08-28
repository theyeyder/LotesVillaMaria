import api from "./api";

/* =========================================================
   OBTENER MANZANAS
========================================================= */

export const obtenerManzanas = async (
  params = {}
) => {
  const response = await api.get(
    "/manzanas",
    {
      params,
    }
  );

  return response.data;
};

/* =========================================================
   OBTENER MANZANA POR ID
========================================================= */

export const obtenerManzanaPorId = async (
  id
) => {
  const response = await api.get(
    `/manzanas/${id}`
  );

  return response.data;
};

/* =========================================================
   CREAR MANZANA
========================================================= */

export const crearManzana = async (
  manzana
) => {
  const response = await api.post(
    "/manzanas",
    manzana
  );

  return response.data;
};

/* =========================================================
   ACTUALIZAR MANZANA
========================================================= */

export const actualizarManzana = async (
  id,
  manzana
) => {
  const response = await api.put(
    `/manzanas/${id}`,
    manzana
  );

  return response.data;
};

/* =========================================================
   ELIMINAR MANZANA
========================================================= */

export const eliminarManzana = async (
  id
) => {
  const response = await api.delete(
    `/manzanas/${id}`
  );

  return response.data;
};

/* =========================================================
   EXPORTACIÓN GENERAL
========================================================= */

const manzanaService = {
  obtenerManzanas,
  obtenerManzanaPorId,
  crearManzana,
  actualizarManzana,
  eliminarManzana,
};

export default manzanaService;