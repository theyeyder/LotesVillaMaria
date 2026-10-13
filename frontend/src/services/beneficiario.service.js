import api from "./api";

/* =========================================================
   BENEFICIARIOS
========================================================= */

/* =========================================================
   LISTAR BENEFICIARIOS

   filtros opcionales:

   {
     buscar: "",
     estado: "Activo"
   }
========================================================= */

export const obtenerBeneficiarios = async (
  filtros = {}
) => {
  const response =
    await api.get(
      "/beneficiarios",
      {
        params: filtros,
      }
    );

  return response.data;
};

/* =========================================================
   OBTENER BENEFICIARIO POR ID
========================================================= */

export const obtenerBeneficiarioPorId = async (
  id
) => {
  const response =
    await api.get(
      `/beneficiarios/${id}`
    );

  return response.data;
};

/* =========================================================
   BUSCAR POR DOCUMENTO

   Este se utilizará dentro del modal
   de Pago Manual.
========================================================= */

export const obtenerBeneficiarioPorDocumento =
  async (
    documento
  ) => {
    const documentoLimpio =
      String(
        documento || ""
      ).trim();

    if (!documentoLimpio) {
      return null;
    }

    const response =
      await api.get(
        `/beneficiarios/documento/${encodeURIComponent(
          documentoLimpio
        )}`
      );

    return response.data;
  };

/* =========================================================
   CREAR BENEFICIARIO
========================================================= */

export const crearBeneficiario = async (
  datos
) => {
  const response =
    await api.post(
      "/beneficiarios",
      datos
    );

  return response.data;
};

/* =========================================================
   ACTUALIZAR BENEFICIARIO
========================================================= */

export const actualizarBeneficiario = async (
  id,
  datos
) => {
  const response =
    await api.put(
      `/beneficiarios/${id}`,
      datos
    );

  return response.data;
};

/* =========================================================
   ELIMINAR BENEFICIARIO
========================================================= */

export const eliminarBeneficiario = async (
  id
) => {
  const response =
    await api.delete(
      `/beneficiarios/${id}`
    );

  return response.data;
};