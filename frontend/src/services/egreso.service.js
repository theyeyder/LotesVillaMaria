import api from "./api";

/* =========================================================
   EGRESOS GENERALES
========================================================= */

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
   COMISIONES
========================================================= */

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
   EDITAR ABONO DE COMISIÓN

   SOLO:
   - Abono
   - Último movimiento

   Pago total NO se edita.
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

   Permite:
   - eliminar Abono
   - eliminar Pago total
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

/* =========================================================
   MAQUINARIA
========================================================= */

/* =========================================================
   REGISTRAR ABONO DE MAQUINARIA
========================================================= */

export const abonarMaquinaria =
  async (
    horaMaquinariaId,
    datos
  ) => {
    const response =
      await api.post(
        `/egresos/maquinaria/${horaMaquinariaId}`,
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
   PAGAR SALDO TOTAL DE MAQUINARIA

   IMPORTANTE:
   El backend toma automáticamente TODO el saldo pendiente.

   No enviamos valor.
========================================================= */

export const pagarSaldoMaquinaria =
  async (
    horaMaquinariaId,
    datos
  ) => {
    const response =
      await api.post(
        `/egresos/maquinaria/${horaMaquinariaId}`,
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
   HISTORIAL DE PAGOS DE MAQUINARIA
========================================================= */

export const obtenerPagosMaquinaria =
  async (
    horaMaquinariaId
  ) => {
    const response =
      await api.get(
        `/egresos/maquinaria/${horaMaquinariaId}`
      );

    return response.data;
  };

/* =========================================================
   EDITAR ABONO DE MAQUINARIA

   ABONO
   ✅ Editar

   PAGO TOTAL
   ❌ No editar
========================================================= */

export const editarAbonoMaquinaria =
  async (
    egresoId,
    datos
  ) => {
    const response =
      await api.put(
        `/egresos/maquinaria/abonos/${egresoId}`,
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
   ELIMINAR MOVIMIENTO DE MAQUINARIA

   ABONO
   ✅ Eliminar

   PAGO TOTAL
   ✅ Eliminar
========================================================= */

export const eliminarMovimientoMaquinaria =
  async (
    egresoId
  ) => {
    const response =
      await api.delete(
        `/egresos/maquinaria/movimientos/${egresoId}`
      );

    return response.data;
  };