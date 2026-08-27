import api from "./api";

export const obtenerMaquinarias = async (params = {}) => {
  const response = await api.get("/maquinaria", {
    params,
  });

  return response.data;
};

export const obtenerMaquinariaPorId = async (id) => {
  const response = await api.get(`/maquinaria/${id}`);

  return response.data;
};

export const crearMaquinaria = async (maquinaria) => {
  const response = await api.post("/maquinaria", maquinaria);

  return response.data;
};

export const actualizarMaquinaria = async (id, maquinaria) => {
  const response = await api.put(
    `/maquinaria/${id}`,
    maquinaria
  );

  return response.data;
};

export const eliminarMaquinaria = async (id) => {
  const response = await api.delete(`/maquinaria/${id}`);

  return response.data;
};

const maquinariaService = {
  obtenerMaquinarias,
  obtenerMaquinariaPorId,
  crearMaquinaria,
  actualizarMaquinaria,
  eliminarMaquinaria,
};

export default maquinariaService;