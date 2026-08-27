import api from "./api";

export const obtenerClientes = async (params = {}) => {
  const response = await api.get("/clientes", {
    params,
  });

  return response.data;
};

export const obtenerClientePorId = async (id) => {
  const response = await api.get(`/clientes/${id}`);

  return response.data;
};

export const crearCliente = async (cliente) => {
  const response = await api.post("/clientes", cliente);

  return response.data;
};

export const actualizarCliente = async (id, cliente) => {
  const response = await api.put(`/clientes/${id}`, cliente);

  return response.data;
};

export const eliminarCliente = async (id) => {
  const response = await api.delete(`/clientes/${id}`);

  return response.data;
};

const clienteService = {
  obtenerClientes,
  obtenerClientePorId,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
};

export default clienteService;