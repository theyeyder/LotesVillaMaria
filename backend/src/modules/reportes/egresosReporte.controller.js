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

const textoMinuscula = (
  valor
) => {
  return texto(
    valor
  ).toLowerCase();
};

/* =========================================================
   FECHAS
========================================================= */

const inicioDia = (
  fecha
) => {
  if (!fecha) {
    return null;
  }

  const partes =
    String(
      fecha
    )
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
    String(
      fecha
    )
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
   REPORTE EGRESOS

   GET /api/reportes/egresos

   FILTROS:
   ?desde=
   &hasta=
   &buscar=
   &tipo=
   &tipoMovimiento=
   &formaPago=
========================================================= */

export const obtenerReporteEgresos =
  async (
    req,
    res
  ) => {
    try {
      const {
        desde = "",
        hasta = "",
        buscar = "",
        tipo = "",
        tipoMovimiento = "",
        formaPago = "",
      } = req.query;

      /* =====================================================
         FILTRO BASE
      ===================================================== */

      const filtro = {};

      /* =====================================================
         FECHAS
      ===================================================== */

      if (
        desde ||
        hasta
      ) {
        filtro.fechaPago = {};

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
            .status(
              400
            )
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
            .status(
              400
            )
            .json({
              message:
                "La fecha final no es válida.",
            });
        }

        if (
          fechaDesde
        ) {
          filtro.fechaPago.$gte =
            fechaDesde;
        }

        if (
          fechaHasta
        ) {
          filtro.fechaPago.$lte =
            fechaHasta;
        }
      }

      /* =====================================================
         TIPO
      ===================================================== */

      if (
        texto(
          tipo
        )
      ) {
        filtro.tipo =
          texto(
            tipo
          );
      }

      /* =====================================================
         MOVIMIENTO
      ===================================================== */

      if (
        texto(
          tipoMovimiento
        )
      ) {
        filtro.tipoMovimiento =
          texto(
            tipoMovimiento
          );
      }

      /* =====================================================
         FORMA DE PAGO
      ===================================================== */

      if (
        texto(
          formaPago
        )
      ) {
        filtro.formaPago =
          texto(
            formaPago
          );
      }

      /* =====================================================
         CONSULTAR EGRESOS
      ===================================================== */

      const egresos =
        await Egreso.find(
          filtro
        )
          .populate({
            path:
              "vendedor",

            select:
              "codigo nombres apellidos nombre documento telefono estado",
          })
          .populate({
            path:
              "comision",

            select:
              "codigo valorComision totalPagado saldoPendiente estado venta",

            populate: {
              path:
                "venta",

              select:
                "codigo cliente lote",

              populate: [
                {
                  path:
                    "cliente",

                  select:
                    "nombres apellidos nombre documento",
                },

                {
                  path:
                    "lote",

                  select:
                    "codigo numeroLote manzana",

                  populate: {
                    path:
                      "manzana",

                    select:
                      "codigo nombre",
                  },
                },
              ],
            },
          })
          .populate({
            path:
              "horaMaquinaria",

            select:
              "codigo operario totalMinutos valorHora valorPagar totalPagado saldoPendiente estadoPago fechaUltimoPago maquinaria",

            populate: {
              path:
                "maquinaria",

              select:
                "codigo nombre tipo",
            },
          })
          .sort({
            fechaPago:
              -1,

            createdAt:
              -1,
          })
          .lean();

      /* =====================================================
         CONSTRUIR REGISTROS
      ===================================================== */

      let registros =
        egresos.map(
          (
            egreso
          ) => {
            const comision =
              egreso.comision;

            const venta =
              comision?.venta;

            const lote =
              venta?.lote;

            const manzana =
              lote?.manzana;

            const hora =
              egreso.horaMaquinaria;

            const maquinaria =
              hora?.maquinaria;

            return {
              _id:
                egreso._id,

              codigo:
                egreso.codigo ||
                "—",

              fecha:
                egreso.fechaPago ||
                egreso.createdAt,

              tipo:
                egreso.tipo ||
                "Otro",

              tipoMovimiento:
                egreso.tipoMovimiento ||
                "—",

              beneficiario: {
                nombre:
                  egreso.beneficiarioNombre ||
                  "—",

                documento:
                  egreso.beneficiarioDocumento ||
                  "",
              },

              concepto:
                egreso.concepto ||
                "—",

              valor:
                numero(
                  egreso.valor
                ),

              saldoAntes:
                numero(
                  egreso.saldoAntes
                ),

              saldoDespues:
                numero(
                  egreso.saldoDespues
                ),

              formaPago:
                egreso.formaPago ||
                "—",

              referenciaPago:
                egreso.referenciaPago ||
                "",

              observaciones:
                egreso.observaciones ||
                "",

              vendedor: {
                _id:
                  egreso.vendedor?._id ||
                  null,

                codigo:
                  egreso.vendedor?.codigo ||
                  "",

                nombre:
                  [
                    egreso.vendedor?.nombres,
                    egreso.vendedor?.apellidos,
                  ]
                    .filter(Boolean)
                    .join(" ")
                    .trim() ||
                  egreso.vendedor?.nombre ||
                  "",

                documento:
                  egreso.vendedor?.documento ||
                  "",
              },

              comision: {
                _id:
                  comision?._id ||
                  null,

                codigo:
                  comision?.codigo ||
                  "",

                valorComision:
                  numero(
                    comision?.valorComision
                  ),

                totalPagado:
                  numero(
                    comision?.totalPagado
                  ),

                saldoPendiente:
                  numero(
                    comision?.saldoPendiente
                  ),

                estado:
                  comision?.estado ||
                  "",
              },

              venta: {
                _id:
                  venta?._id ||
                  null,

                codigo:
                  venta?.codigo ||
                  "",
              },

              manzana: {
                _id:
                  manzana?._id ||
                  null,

                codigo:
                  manzana?.codigo ||
                  manzana?.nombre ||
                  "",
              },

              lote: {
                _id:
                  lote?._id ||
                  null,

                codigo:
                  lote?.codigo ||
                  lote?.numeroLote ||
                  "",
              },

              maquinaria: {
                _id:
                  maquinaria?._id ||
                  null,

                codigo:
                  maquinaria?.codigo ||
                  "",

                nombre:
                  maquinaria?.nombre ||
                  maquinaria?.tipo ||
                  "",
              },

              horaMaquinaria: {
                _id:
                  hora?._id ||
                  null,

                codigo:
                  hora?.codigo ||
                  "",

                operario:
                  hora?.operario ||
                  "",

                valorPagar:
                  numero(
                    hora?.valorPagar
                  ),

                totalPagado:
                  numero(
                    hora?.totalPagado
                  ),

                saldoPendiente:
                  numero(
                    hora?.saldoPendiente
                  ),

                estadoPago:
                  hora?.estadoPago ||
                  "",
              },
            };
          }
        );

      /* =====================================================
         BUSCADOR
      ===================================================== */

      if (
        texto(
          buscar
        )
      ) {
        const busqueda =
          textoMinuscula(
            buscar
          );

        registros =
          registros.filter(
            (
              registro
            ) => {
              const campos = [
                registro.codigo,

                registro.tipo,

                registro.tipoMovimiento,

                registro.beneficiario.nombre,

                registro.beneficiario.documento,

                registro.concepto,

                registro.formaPago,

                registro.referenciaPago,

                registro.observaciones,

                registro.vendedor.codigo,

                registro.vendedor.nombre,

                registro.vendedor.documento,

                registro.comision.codigo,

                registro.venta.codigo,

                registro.manzana.codigo,

                registro.lote.codigo,

                registro.maquinaria.codigo,

                registro.maquinaria.nombre,

                registro.horaMaquinaria.operario,
              ];

              return campos.some(
                (
                  campo
                ) =>
                  textoMinuscula(
                    campo
                  ).includes(
                    busqueda
                  )
              );
            }
          );
      }

      /* =====================================================
         AGRUPAR POR TIPO
      ===================================================== */

      const mapaTipos =
        new Map();

      registros.forEach(
        (
          registro
        ) => {
          const clave =
            registro.tipo ||
            "Otro";

          if (
            !mapaTipos.has(
              clave
            )
          ) {
            mapaTipos.set(
              clave,
              {
                tipo:
                  clave,

                cantidadMovimientos:
                  0,

                cantidadAbonos:
                  0,

                cantidadPagos:
                  0,

                valorAbonos:
                  0,

                valorPagos:
                  0,

                totalEgresado:
                  0,
              }
            );
          }

          const grupo =
            mapaTipos.get(
              clave
            );

          const valor =
            numero(
              registro.valor
            );

          grupo.cantidadMovimientos +=
            1;

          grupo.totalEgresado +=
            valor;

          if (
            registro.tipoMovimiento ===
            "Abono"
          ) {
            grupo.cantidadAbonos +=
              1;

            grupo.valorAbonos +=
              valor;
          }

          if (
            registro.tipoMovimiento ===
            "Pago"
          ) {
            grupo.cantidadPagos +=
              1;

            grupo.valorPagos +=
              valor;
          }
        }
      );

      /* =====================================================
         RESUMEN POR TIPO
      ===================================================== */

      const tipos =
        Array.from(
          mapaTipos.values()
        )
          .map(
            (
              grupo
            ) => ({
              ...grupo,

              valorAbonos:
                Number(
                  grupo.valorAbonos.toFixed(
                    2
                  )
                ),

              valorPagos:
                Number(
                  grupo.valorPagos.toFixed(
                    2
                  )
                ),

              totalEgresado:
                Number(
                  grupo.totalEgresado.toFixed(
                    2
                  )
                ),
            })
          )
          .sort(
            (
              a,
              b
            ) =>
              b.totalEgresado -
              a.totalEgresado
          );

      /* =====================================================
         TOTALES
      ===================================================== */

      const totalEgresos =
        registros.reduce(
          (
            total,
            registro
          ) =>
            total +
            numero(
              registro.valor
            ),
          0
        );

      const totalComisiones =
        registros
          .filter(
            (
              registro
            ) =>
              registro.tipo ===
              "Comision"
          )
          .reduce(
            (
              total,
              registro
            ) =>
              total +
              numero(
                registro.valor
              ),
            0
          );

      const totalMaquinaria =
        registros
          .filter(
            (
              registro
            ) =>
              registro.tipo ===
              "HorasMaquinaria"
          )
          .reduce(
            (
              total,
              registro
            ) =>
              total +
              numero(
                registro.valor
              ),
            0
          );

      const totalOtros =
        registros
          .filter(
            (
              registro
            ) =>
              registro.tipo ===
              "Otro"
          )
          .reduce(
            (
              total,
              registro
            ) =>
              total +
              numero(
                registro.valor
              ),
            0
          );

      const valorAbonos =
        registros
          .filter(
            (
              registro
            ) =>
              registro.tipoMovimiento ===
              "Abono"
          )
          .reduce(
            (
              total,
              registro
            ) =>
              total +
              numero(
                registro.valor
              ),
            0
          );

      const valorPagos =
        registros
          .filter(
            (
              registro
            ) =>
              registro.tipoMovimiento ===
              "Pago"
          )
          .reduce(
            (
              total,
              registro
            ) =>
              total +
              numero(
                registro.valor
              ),
            0
          );

      /* =====================================================
         RESPUESTA
      ===================================================== */

      return res
        .status(
          200
        )
        .json({
          tipoReporte:
            "egresos",

          titulo:
            "Informe de egresos",

          filtros: {
            desde,
            hasta,
            buscar,
            tipo,
            tipoMovimiento,
            formaPago,
          },

          resumen: {
            movimientos:
              registros.length,

            totalEgresos:
              Number(
                totalEgresos.toFixed(
                  2
                )
              ),

            totalComisiones:
              Number(
                totalComisiones.toFixed(
                  2
                )
              ),

            totalMaquinaria:
              Number(
                totalMaquinaria.toFixed(
                  2
                )
              ),

            totalOtros:
              Number(
                totalOtros.toFixed(
                  2
                )
              ),

            cantidadAbonos:
              registros.filter(
                (
                  registro
                ) =>
                  registro.tipoMovimiento ===
                  "Abono"
              ).length,

            cantidadPagos:
              registros.filter(
                (
                  registro
                ) =>
                  registro.tipoMovimiento ===
                  "Pago"
              ).length,

            valorAbonos:
              Number(
                valorAbonos.toFixed(
                  2
                )
              ),

            valorPagos:
              Number(
                valorPagos.toFixed(
                  2
                )
              ),
          },

          tipos,

          registros,
        });
    } catch (
      error
    ) {
      console.error(
        "Error generando informe de egresos:",
        error
      );

      return res
        .status(
          500
        )
        .json({
          message:
            "No fue posible generar el informe de egresos.",

          error:
            error.message,
        });
    }
  };