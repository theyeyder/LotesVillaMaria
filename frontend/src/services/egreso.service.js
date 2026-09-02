import api from "./api";

/* =========================================================
   OBTENER TODOS LOS EGRESOS
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
========================================================= */

export const abonarComision =
  async (
    comisionId,
    datos
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
            datos.formaPago,

          referenciaPago:
            datos.referenciaPago ||
            "",

          fechaPago:
            datos.fechaPago,

          observaciones:
            datos.observaciones ||
            "",
        }
      );

    return response.data;
  };

/* =========================================================
   PAGAR SALDO TOTAL DE COMISIÓN

   El backend calcula automáticamente el saldo pendiente.
========================================================= */

export const pagarSaldoComision =
  async (
    comisionId,
    datos
  ) => {
    const response =
      await api.post(
        `/egresos/comisiones/${comisionId}`,
        {
          tipoMovimiento:
            "Pago",

          formaPago:
            datos.formaPago,

          referenciaPago:
            datos.referenciaPago ||
            "",

          fechaPago:
            datos.fechaPago,

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

/* =========================================================
   EDITAR ABONO

   SOLO ABONOS.

   Un movimiento tipo Pago total NO puede editarse.
========================================================= */

export const editarAbonoComision =
  async (
    egresoId,
    datos
  ) => {
    const response =
      await api.put(
        `/egresos/comisiones/abonos/${egresoId}`,
        {
          valor:
            Number(
              datos.valor
            ),

          formaPago:
            datos.formaPago,

          referenciaPago:
            datos.referenciaPago ||
            "",

          fechaPago:
            datos.fechaPago,

          observaciones:
            datos.observaciones ||
            "",
        }
      );

    return response.data;
  };

/* =========================================================
   ELIMINAR MOVIMIENTO DE COMISIÓN

   PERMITE:

   - Eliminar Abono
   - Eliminar Pago total

   NO permite editar Pago total.
========================================================= */

export const eliminarMovimientoComision =
  async (
    egresoId
  ) => {
    const response =
      await api.delete(
        `/egresos/comisiones/movimientos/${egresoId}`
      );

    return response.data;
  };