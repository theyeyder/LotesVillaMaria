import api from "./api";

/* =========================================================
   OBTENER VENDEDORES
========================================================= */

export const obtenerVendedores =
  async (
    params = {}
  ) => {
    const response =
      await api.get(
        "/vendedores",
        {
          params,
        }
      );

    return response.data;
  };

/* =========================================================
   OBTENER VENDEDOR POR ID
========================================================= */

export const obtenerVendedorPorId =
  async (
    id
  ) => {
    const response =
      await api.get(
        `/vendedores/${id}`
      );

    return response.data;
  };

/* =========================================================
   CREAR VENDEDOR
========================================================= */

export const crearVendedor =
  async (
    datos
  ) => {
    const response =
      await api.post(
        "/vendedores",
        datos
      );

    return response.data;
  };

/* =========================================================
   ACTUALIZAR VENDEDOR
========================================================= */

export const actualizarVendedor =
  async (
    id,
    datos
  ) => {
    const response =
      await api.put(
        `/vendedores/${id}`,
        datos
      );

    return response.data;
  };

/* =========================================================
   ACTIVAR / INACTIVAR VENDEDOR
========================================================= */

export const cambiarEstadoVendedor =
  async (
    id
  ) => {
    const response =
      await api.patch(
        `/vendedores/${id}/estado`
      );

    return response.data;
  };