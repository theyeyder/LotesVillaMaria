import api from "./api";

export const obtenerHorasMaquinaria = async (params = {}) => {
  const response = await api.get("/horas-maquinaria", {
    params,
  });

  return response.data;
};

export const obtenerHoraMaquinariaPorId = async (id) => {
  const response = await api.get(
    `/horas-maquinaria/${id}`
  );

  return response.data;
};

export const crearHoraMaquinaria = async (registro) => {
  const response = await api.post(
    "/horas-maquinaria",
    registro
  );

  return response.data;
};

export const actualizarHoraMaquinaria = async (
  id,
  registro
) => {
  const response = await api.put(
    `/horas-maquinaria/${id}`,
    registro
  );

  return response.data;
};

export const eliminarHoraMaquinaria = async (id) => {
  const response = await api.delete(
    `/horas-maquinaria/${id}`
  );

  return response.data;
};

export const obtenerResumenHoras = async (params = {}) => {
  const response = await api.get(
    "/horas-maquinaria/resumen",
    {
      params,
    }
  );

  return response.data;
};

const horaMaquinariaService = {
  obtenerHorasMaquinaria,
  obtenerHoraMaquinariaPorId,
  crearHoraMaquinaria,
  actualizarHoraMaquinaria,
  eliminarHoraMaquinaria,
  obtenerResumenHoras,
};

export default horaMaquinariaService;