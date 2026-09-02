import api from "./api";

/* =========================================================
   OBTENER EGRESOS

   Filtros disponibles:

   tipo
   tipoMovimiento
   vendedor
   comision
   desde
   hasta
========================================================= */

export const obtenerEgresos =
  async (
    params = {}
  ) => {
    const response =
      await api.get(
        "/egresos",
        {
          params,
        }
      );

    return response.data;
  };

/* =========================================================
   OBTENER EGRESO POR ID
========================================================= */

export const obtenerEgresoPorId =
  async (
    id
  ) => {
    const response =
      await api.get(
        `/egresos/${id}`
      );

    return response.data;
  };

/* =========================================================
   REGISTRAR ABONO DE COMISIÓN

   Ejemplo:

   {
     valor: 500000,
     formaPago: "Transferencia",
     referenciaPago: "TRX-123",
     observaciones: ""
   }
========================================================= */

export const abonarComision =
  async (
    comisionId,
    datos = {}
  ) => {
    const response =
      await api.post(
        `/egresos/comisiones/${comisionId}`,
        {
          tipoMovimiento:
            "Abono",

          valor:
            Number(
              datos.valor
            ),

          formaPago:
            datos.formaPago ||
            "Efectivo",

          referenciaPago:
            datos.referenciaPago ||
            "",

          fechaPago:
            datos.fechaPago ||
            undefined,

          observaciones:
            datos.observaciones ||
            "",
        }
      );

    return response.data;
  };

/* =========================================================
   PAGAR SALDO COMPLETO DE COMISIÓN

   El backend toma automáticamente
   TODO el saldo pendiente.

   No enviamos valor.
========================================================= */

export const pagarSaldoComision =
  async (
    comisionId,
    datos = {}
  ) => {
    const response =
      await api.post(
        `/egresos/comisiones/${comisionId}`,
        {
          tipoMovimiento:
            "Pago",

          formaPago:
            datos.formaPago ||
            "Efectivo",

          referenciaPago:
            datos.referenciaPago ||
            "",

          fechaPago:
            datos.fechaPago ||
            undefined,

          observaciones:
            datos.observaciones ||
            "",
        }
      );

    return response.data;
  };

/* =========================================================
   HISTORIAL DE PAGOS DE UNA COMISIÓN
========================================================= */

export const obtenerPagosComision =
  async (
    comisionId
  ) => {
    const response =
      await api.get(
        `/egresos/comisiones/${comisionId}`
      );

    return response.data;
  };