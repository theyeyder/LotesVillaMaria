import Venta from "../ventas/venta.model.js";
import Pago from "../pagos/pago.model.js";
import Cuota from "../cuotas/cuota.model.js";
import Egreso from "../egresos/egreso.model.js";

/* =========================================================
   HELPERS
========================================================= */

const numero = (valor) => {
  const resultado =
    Number(valor);

  return Number.isFinite(
    resultado
  )
    ? resultado
    : 0;
};

const texto = (valor) => {
  return String(
    valor ?? ""
  ).trim();
};

/* =========================================================
   FECHAS
========================================================= */

const convertirFecha = (
  valor
) => {
  if (!valor) {
    return null;
  }

  const fecha =
    new Date(valor);

  return Number.isNaN(
    fecha.getTime()
  )
    ? null
    : fecha;
};

const inicioDia = (
  fecha
) => {
  if (!fecha) {
    return null;
  }

  const partes =
    String(fecha)
      .split("-")
      .map(Number);

  if (
    partes.length !== 3 ||
    partes.some(
      (valor) =>
        !Number.isFinite(
          valor
        )
    )
  ) {
    return null;
  }

  const [
    year,
    month,
    day,
  ] = partes;

  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      0,
      0,
      0,
      0
    )
  );
};

const finDia = (
  fecha
) => {
  if (!fecha) {
    return null;
  }

  const partes =
    String(fecha)
      .split("-")
      .map(Number);

  if (
    partes.length !== 3 ||
    partes.some(
      (valor) =>
        !Number.isFinite(
          valor
        )
    )
  ) {
    return null;
  }

  const [
    year,
    month,
    day,
  ] = partes;

  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      23,
      59,
      59,
      999
    )
  );
};

/* =========================================================
   FECHA DENTRO DEL PERIODO
========================================================= */

const fechaEnRango = (
  valor,
  desde,
  hasta
) => {
  const fecha =
    convertirFecha(
      valor
    );

  if (!fecha) {
    return false;
  }

  if (
    desde &&
    fecha < desde
  ) {
    return false;
  }

  if (
    hasta &&
    fecha > hasta
  ) {
    return false;
  }

  return true;
};

/* =========================================================
   CLAVE DEL MES
========================================================= */

const obtenerClaveMes = (
  valor
) => {
  const fecha =
    convertirFecha(
      valor
    );

  if (!fecha) {
    return null;
  }

  const year =
    fecha.getUTCFullYear();

  const month =
    String(
      fecha.getUTCMonth() +
        1
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}`;
};

/* =========================================================
   NOMBRE DEL MES
========================================================= */

const nombreMes = (
  clave
) => {
  if (!clave) {
    return "—";
  }

  const [
    year,
    month,
  ] = clave
    .split("-")
    .map(Number);

  const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  return `${meses[
    month - 1
  ] || "Mes"} ${year}`;
};

/* =========================================================
   REPORTE RESUMEN FINANCIERO

   GET /api/reportes/resumen-financiero

   FILTROS:
   ?desde=
   &hasta=

   IMPORTANTE:
   - Ventas, recaudo y egresos respetan el rango.
   - Cartera y cartera vencida representan
     la situación ACTUAL.
========================================================= */

export const obtenerResumenFinanciero =
  async (
    req,
    res
  ) => {
    try {
      const {
        desde = "",
        hasta = "",
      } = req.query;

      /* =====================================================
         VALIDAR FECHAS
      ===================================================== */

      const fechaDesde =
        inicioDia(
          desde
        );

      const fechaHasta =
        finDia(
          hasta
        );

      if (
        desde &&
        !fechaDesde
      ) {
        return res
          .status(400)
          .json({
            message:
              "La fecha inicial no es válida.",
          });
      }

      if (
        hasta &&
        !fechaHasta
      ) {
        return res
          .status(400)
          .json({
            message:
              "La fecha final no es válida.",
          });
      }

      if (
        fechaDesde &&
        fechaHasta &&
        fechaDesde >
          fechaHasta
      ) {
        return res
          .status(400)
          .json({
            message:
              "La fecha inicial no puede ser posterior a la fecha final.",
          });
      }

      /* =====================================================
         CONSULTAS
      ===================================================== */

      const [
        ventas,
        pagos,
        cuotas,
        egresos,
      ] =
        await Promise.all([
          Venta.find({})
            .select(
              "codigo valorVenta cuotaInicial saldoFinanciar tipoVenta estado fechaVenta createdAt"
            )
            .lean(),

          Pago.find({
            $or: [
              {
                estado: {
                  $exists:
                    false,
                },
              },
              {
                estado:
                  "Aplicado",
              },
            ],
          })
            .select(
              "codigo venta cliente valorPago fechaPago estado metodoPago createdAt"
            )
            .lean(),

          Cuota.find({})
            .select(
              "codigo venta numeroCuota valorCuota valorPagado saldoPendiente fechaVencimiento estado createdAt"
            )
            .lean(),

          Egreso.find({})
            .select(
              "codigo tipo tipoMovimiento valor fechaPago formaPago createdAt"
            )
            .lean(),
        ]);

      /* =====================================================
         VENTAS DEL PERIODO
      ===================================================== */

      const ventasPeriodo =
        ventas.filter(
          (venta) => {
            const fechaVenta =
              venta.fechaVenta ||
              venta.createdAt;

            if (
              !fechaDesde &&
              !fechaHasta
            ) {
              return true;
            }

            return fechaEnRango(
              fechaVenta,
              fechaDesde,
              fechaHasta
            );
          }
        );

      /* =====================================================
         PAGOS DEL PERIODO
      ===================================================== */

      const pagosPeriodo =
        pagos.filter(
          (pago) => {
            const fechaPago =
              pago.fechaPago ||
              pago.createdAt;

            if (
              !fechaDesde &&
              !fechaHasta
            ) {
              return true;
            }

            return fechaEnRango(
              fechaPago,
              fechaDesde,
              fechaHasta
            );
          }
        );

      /* =====================================================
         EGRESOS DEL PERIODO
      ===================================================== */

      const egresosPeriodo =
        egresos.filter(
          (egreso) => {
            const fechaEgreso =
              egreso.fechaPago ||
              egreso.createdAt;

            if (
              !fechaDesde &&
              !fechaHasta
            ) {
              return true;
            }

            return fechaEnRango(
              fechaEgreso,
              fechaDesde,
              fechaHasta
            );
          }
        );

      /* =====================================================
         TOTALES VENTAS
      ===================================================== */

      const totalVentas =
        ventasPeriodo.reduce(
          (
            total,
            venta
          ) =>
            total +
            numero(
              venta.valorVenta
            ),
          0
        );

      const ventasContado =
        ventasPeriodo.filter(
          (venta) =>
            texto(
              venta.tipoVenta
            ).toLowerCase() ===
            "contado"
        );

      const ventasFinanciadas =
        ventasPeriodo.filter(
          (venta) =>
            texto(
              venta.tipoVenta
            ).toLowerCase() !==
            "contado"
        );

      const valorVentasContado =
        ventasContado.reduce(
          (
            total,
            venta
          ) =>
            total +
            numero(
              venta.valorVenta
            ),
          0
        );

      const valorVentasFinanciadas =
        ventasFinanciadas.reduce(
          (
            total,
            venta
          ) =>
            total +
            numero(
              venta.valorVenta
            ),
          0
        );

      /* =====================================================
         TOTAL RECAUDO
      ===================================================== */

      const totalRecaudo =
        pagosPeriodo.reduce(
          (
            total,
            pago
          ) =>
            total +
            numero(
              pago.valorPago
            ),
          0
        );

      /* =====================================================
         TOTAL EGRESOS
      ===================================================== */

      const totalEgresos =
        egresosPeriodo.reduce(
          (
            total,
            egreso
          ) =>
            total +
            numero(
              egreso.valor
            ),
          0
        );

      const egresosComisiones =
        egresosPeriodo
          .filter(
            (egreso) =>
              egreso.tipo ===
              "Comision"
          )
          .reduce(
            (
              total,
              egreso
            ) =>
              total +
              numero(
                egreso.valor
              ),
            0
          );

      const egresosMaquinaria =
        egresosPeriodo
          .filter(
            (egreso) =>
              egreso.tipo ===
              "HorasMaquinaria"
          )
          .reduce(
            (
              total,
              egreso
            ) =>
              total +
              numero(
                egreso.valor
              ),
            0
          );

      const egresosOtros =
        egresosPeriodo
          .filter(
            (egreso) =>
              egreso.tipo ===
              "Otro"
          )
          .reduce(
            (
              total,
              egreso
            ) =>
              total +
              numero(
                egreso.valor
              ),
            0
          );

      /* =====================================================
         CUOTAS AGRUPADAS POR VENTA
      ===================================================== */

      const cuotasPorVenta =
        new Map();

      cuotas.forEach(
        (cuota) => {
          if (!cuota.venta) {
            return;
          }

          const ventaId =
            String(
              cuota.venta
            );

          if (
            !cuotasPorVenta.has(
              ventaId
            )
          ) {
            cuotasPorVenta.set(
              ventaId,
              []
            );
          }

          cuotasPorVenta
            .get(ventaId)
            .push(cuota);
        }
      );

      /* =====================================================
         CARTERA ACTUAL
      ===================================================== */

      let carteraActual =
        0;

      let carteraVencida =
        0;

      let cuotasPendientes =
        0;

      let cuotasVencidas =
        0;

      let clientesConCartera =
        0;

      let ventasConCartera =
        0;

      const ahora =
        new Date();

      ventas.forEach(
        (venta) => {
          if (
            venta.estado ===
            "Pagada"
          ) {
            return;
          }

          const ventaId =
            String(
              venta._id
            );

          const cuotasVenta =
            cuotasPorVenta.get(
              ventaId
            ) || [];

          let saldoVenta =
            0;

          if (
            cuotasVenta.length >
            0
          ) {
            saldoVenta =
              cuotasVenta.reduce(
                (
                  total,
                  cuota
                ) =>
                  total +
                  numero(
                    cuota.saldoPendiente
                  ),
                0
              );

            cuotasVenta.forEach(
              (cuota) => {
                const saldo =
                  numero(
                    cuota.saldoPendiente
                  );

                if (
                  saldo <= 0
                ) {
                  return;
                }

                cuotasPendientes +=
                  1;

                const vencimiento =
                  convertirFecha(
                    cuota.fechaVencimiento
                  );

                if (
                  vencimiento &&
                  vencimiento <
                    ahora
                ) {
                  carteraVencida +=
                    saldo;

                  cuotasVencidas +=
                    1;
                }
              }
            );
          } else {
            saldoVenta =
              numero(
                venta.saldoFinanciar
              );
          }

          if (
            saldoVenta >
            0
          ) {
            carteraActual +=
              saldoVenta;

            ventasConCartera +=
              1;
          }
        }
      );

      /*
        En este reporte no usamos "clientesConCartera"
        todavía porque Venta fue consultada sin populate
        de cliente. Lo dejamos en 0 para no inventar datos.
      */

      clientesConCartera =
        0;

      /* =====================================================
         FLUJO NETO
      ===================================================== */

      const flujoNeto =
        totalRecaudo -
        totalEgresos;

      /* =====================================================
         DIFERENCIA VENTAS VS RECAUDO
      ===================================================== */

      const diferenciaVentasRecaudo =
        totalVentas -
        totalRecaudo;

      /* =====================================================
         EVOLUCIÓN MENSUAL
      ===================================================== */

      const mapaMeses =
        new Map();

      const asegurarMes = (
        clave
      ) => {
        if (!clave) {
          return null;
        }

        if (
          !mapaMeses.has(
            clave
          )
        ) {
          mapaMeses.set(
            clave,
            {
              clave,

              periodo:
                nombreMes(
                  clave
                ),

              cantidadVentas:
                0,

              ventas:
                0,

              cantidadPagos:
                0,

              recaudo:
                0,

              cantidadEgresos:
                0,

              egresos:
                0,

              flujoNeto:
                0,
            }
          );
        }

        return mapaMeses.get(
          clave
        );
      };

      /* =====================================================
         VENTAS POR MES
      ===================================================== */

      ventasPeriodo.forEach(
        (venta) => {
          const clave =
            obtenerClaveMes(
              venta.fechaVenta ||
                venta.createdAt
            );

          const mes =
            asegurarMes(
              clave
            );

          if (!mes) {
            return;
          }

          mes.cantidadVentas +=
            1;

          mes.ventas +=
            numero(
              venta.valorVenta
            );
        }
      );

      /* =====================================================
         RECAUDO POR MES
      ===================================================== */

      pagosPeriodo.forEach(
        (pago) => {
          const clave =
            obtenerClaveMes(
              pago.fechaPago ||
                pago.createdAt
            );

          const mes =
            asegurarMes(
              clave
            );

          if (!mes) {
            return;
          }

          mes.cantidadPagos +=
            1;

          mes.recaudo +=
            numero(
              pago.valorPago
            );
        }
      );

      /* =====================================================
         EGRESOS POR MES
      ===================================================== */

      egresosPeriodo.forEach(
        (egreso) => {
          const clave =
            obtenerClaveMes(
              egreso.fechaPago ||
                egreso.createdAt
            );

          const mes =
            asegurarMes(
              clave
            );

          if (!mes) {
            return;
          }

          mes.cantidadEgresos +=
            1;

          mes.egresos +=
            numero(
              egreso.valor
            );
        }
      );

      /* =====================================================
         FINALIZAR MESES
      ===================================================== */

      const periodos =
        Array.from(
          mapaMeses.values()
        )
          .map(
            (mes) => ({
              ...mes,

              ventas:
                Number(
                  mes.ventas.toFixed(
                    2
                  )
                ),

              recaudo:
                Number(
                  mes.recaudo.toFixed(
                    2
                  )
                ),

              egresos:
                Number(
                  mes.egresos.toFixed(
                    2
                  )
                ),

              flujoNeto:
                Number(
                  (
                    mes.recaudo -
                    mes.egresos
                  ).toFixed(
                    2
                  )
                ),
            })
          )
          .sort(
            (a, b) =>
              String(
                b.clave
              ).localeCompare(
                String(
                  a.clave
                )
              )
          );

      /* =====================================================
         COMPOSICIÓN EGRESOS
      ===================================================== */

      const composicionEgresos = [
        {
          tipo:
            "Comisiones",

          codigo:
            "Comision",

          cantidad:
            egresosPeriodo.filter(
              (egreso) =>
                egreso.tipo ===
                "Comision"
            ).length,

          valor:
            Number(
              egresosComisiones.toFixed(
                2
              )
            ),
        },

        {
          tipo:
            "Horas de maquinaria",

          codigo:
            "HorasMaquinaria",

          cantidad:
            egresosPeriodo.filter(
              (egreso) =>
                egreso.tipo ===
                "HorasMaquinaria"
            ).length,

          valor:
            Number(
              egresosMaquinaria.toFixed(
                2
              )
            ),
        },

        {
          tipo:
            "Otros",

          codigo:
            "Otro",

          cantidad:
            egresosPeriodo.filter(
              (egreso) =>
                egreso.tipo ===
                "Otro"
            ).length,

          valor:
            Number(
              egresosOtros.toFixed(
                2
              )
            ),
        },
      ];

      /* =====================================================
         RESPUESTA
      ===================================================== */

      return res
        .status(200)
        .json({
          tipoReporte:
            "resumen-financiero",

          titulo:
            "Resumen financiero",

          filtros: {
            desde,
            hasta,
          },

          nota:
            "El rango de fechas aplica a ventas, recaudo y egresos. La cartera y cartera vencida corresponden al estado actual.",

          resumen: {
            cantidadVentas:
              ventasPeriodo.length,

            totalVentas:
              Number(
                totalVentas.toFixed(
                  2
                )
              ),

            ventasContado:
              ventasContado.length,

            valorVentasContado:
              Number(
                valorVentasContado.toFixed(
                  2
                )
              ),

            ventasFinanciadas:
              ventasFinanciadas.length,

            valorVentasFinanciadas:
              Number(
                valorVentasFinanciadas.toFixed(
                  2
                )
              ),

            cantidadPagos:
              pagosPeriodo.length,

            totalRecaudo:
              Number(
                totalRecaudo.toFixed(
                  2
                )
              ),

            carteraActual:
              Number(
                carteraActual.toFixed(
                  2
                )
              ),

            carteraVencida:
              Number(
                carteraVencida.toFixed(
                  2
                )
              ),

            ventasConCartera,

            clientesConCartera,

            cuotasPendientes,

            cuotasVencidas,

            cantidadEgresos:
              egresosPeriodo.length,

            totalEgresos:
              Number(
                totalEgresos.toFixed(
                  2
                )
              ),

            egresosComisiones:
              Number(
                egresosComisiones.toFixed(
                  2
                )
              ),

            egresosMaquinaria:
              Number(
                egresosMaquinaria.toFixed(
                  2
                )
              ),

            egresosOtros:
              Number(
                egresosOtros.toFixed(
                  2
                )
              ),

            flujoNeto:
              Number(
                flujoNeto.toFixed(
                  2
                )
              ),

            diferenciaVentasRecaudo:
              Number(
                diferenciaVentasRecaudo.toFixed(
                  2
                )
              ),
          },

          periodos,

          composicionEgresos,
        });
    } catch (
      error
    ) {
      console.error(
        "Error generando resumen financiero:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "No fue posible generar el resumen financiero.",

          error:
            error.message,
        });
    }
  };