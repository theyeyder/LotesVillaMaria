import Pago from "../pagos/pago.model.js";

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
   PAGOS VIGENTES

   SISTEMA NUEVO:
   - Pago sin estado = válido

   SISTEMA ANTERIOR:
   - Aplicado = válido
   - Anulado = no cuenta
========================================================= */

const condicionPagoVigente = {
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
};

/* =========================================================
   FECHAS UTC
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
    partes.length !==
      3 ||
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
    partes.length !==
      3 ||
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
   NOMBRE CLIENTE
========================================================= */

const obtenerNombreCliente = (
  cliente
) => {
  if (!cliente) {
    return "—";
  }

  return (
    [
      cliente.nombres,
      cliente.apellidos,
    ]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    cliente.nombre ||
    "—"
  );
};

/* =========================================================
   MANZANA
========================================================= */

const obtenerCodigoManzana = (
  manzana
) => {
  return (
    manzana?.codigo ||
    manzana?.nombre ||
    "—"
  );
};

/* =========================================================
   INFORME:
   RECAUDO POR CLIENTE

   GET /api/reportes/recaudo-clientes

   FILTROS:
   ?desde=
   &hasta=
   &buscar=
   &cliente=
   &metodo=
========================================================= */

export const obtenerReporteRecaudoClientes =
  async (
    req,
    res
  ) => {
    try {
      const {
        desde = "",
        hasta = "",
        buscar = "",
        cliente = "",
        metodo = "",
      } = req.query;

      /* =====================================================
         FILTRO BASE
      ===================================================== */

      const filtro = {
        ...condicionPagoVigente,
      };

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
          filtro
            .fechaPago
            .$gte =
            fechaDesde;
        }

        if (
          fechaHasta
        ) {
          filtro
            .fechaPago
            .$lte =
            fechaHasta;
        }
      }

      /* =====================================================
         MÉTODO
      ===================================================== */

      if (
        texto(
          metodo
        )
      ) {
        filtro.metodoPago =
          texto(
            metodo
          );
      }

      /* =====================================================
         OBTENER PAGOS
      ===================================================== */

      const pagos =
        await Pago.find(
          filtro
        )
          .setOptions({
            strictQuery:
              false,
          })
          .populate({
            path:
              "cliente",

            select:
              "nombres apellidos nombre documento telefono correo ciudad",
          })
          .populate({
            path:
              "venta",

            select:
              "codigo fechaVenta valorVenta formaPago estado lote cliente",

            populate: {
              path:
                "lote",

              select:
                "codigo numeroLote tipoLote areaM2 valorLote manzana",

              populate: {
                path:
                  "manzana",

                select:
                  "codigo nombre",
              },
            },
          })
          .populate({
            path:
              "aplicaciones.cuota",

            select:
              "codigo numeroCuota fechaVencimiento valorCuota valorPagado saldoPendiente estado",
          })
          .sort({
            fechaPago:
              -1,

            createdAt:
              -1,
          })
          .lean();

      /* =====================================================
         CONSTRUIR DETALLE
      ===================================================== */

      let registros =
        pagos.map(
          (
            pago
          ) => {
            const clientePago =
              pago.cliente;

            const venta =
              pago.venta;

            const lote =
              venta?.lote;

            const manzana =
              lote?.manzana;

            return {
              _id:
                pago._id,

              codigoPago:
                pago.codigo ||
                "—",

              fechaPago:
                pago.fechaPago ||
                pago.createdAt,

              cliente: {
                _id:
                  clientePago?._id ||
                  null,

                nombre:
                  obtenerNombreCliente(
                    clientePago
                  ),

                documento:
                  clientePago?.documento ||
                  "",

                telefono:
                  clientePago?.telefono ||
                  "",

                correo:
                  clientePago?.correo ||
                  "",

                ciudad:
                  clientePago?.ciudad ||
                  "",
              },

              venta: {
                _id:
                  venta?._id ||
                  null,

                codigo:
                  venta?.codigo ||
                  "—",

                fechaVenta:
                  venta?.fechaVenta ||
                  null,

                valorVenta:
                  numero(
                    venta?.valorVenta
                  ),

                formaPago:
                  venta?.formaPago ||
                  "—",

                estado:
                  venta?.estado ||
                  "—",
              },

              manzana: {
                _id:
                  manzana?._id ||
                  null,

                codigo:
                  obtenerCodigoManzana(
                    manzana
                  ),
              },

              lote: {
                _id:
                  lote?._id ||
                  null,

                codigo:
                  lote?.codigo ||
                  lote?.numeroLote ||
                  "—",

                numeroLote:
                  lote?.numeroLote ||
                  "",

                tipo:
                  lote?.tipoLote ||
                  "",

                areaM2:
                  numero(
                    lote?.areaM2
                  ),
              },

              metodoPago:
                pago.metodoPago ||
                "—",

              referencia:
                pago.referencia ||
                "",

              valorPago:
                numero(
                  pago.valorPago
                ),

              cuotasAplicadas:
                Array.isArray(
                  pago.aplicaciones
                )
                  ? pago
                      .aplicaciones
                      .length
                  : 0,

              aplicaciones:
                Array.isArray(
                  pago.aplicaciones
                )
                  ? pago.aplicaciones.map(
                      (
                        aplicacion
                      ) => ({
                        cuota:
                          aplicacion
                            ?.cuota
                            ?.codigo ||
                          "",

                        numeroCuota:
                          numero(
                            aplicacion
                              ?.numeroCuota ||
                            aplicacion
                              ?.cuota
                              ?.numeroCuota
                          ),

                        valorAplicado:
                          numero(
                            aplicacion
                              ?.valorAplicado
                          ),
                      })
                    )
                  : [],

              observaciones:
                pago.observaciones ||
                "",
            };
          }
        );

      /* =====================================================
         FILTRO CLIENTE
      ===================================================== */

      if (
        texto(
          cliente
        )
      ) {
        const filtroCliente =
          textoMinuscula(
            cliente
          );

        registros =
          registros.filter(
            (
              registro
            ) => {
              return (
                textoMinuscula(
                  registro
                    .cliente
                    ._id
                ) ===
                  filtroCliente ||

                textoMinuscula(
                  registro
                    .cliente
                    .documento
                ) ===
                  filtroCliente ||

                textoMinuscula(
                  registro
                    .cliente
                    .nombre
                ).includes(
                  filtroCliente
                )
              );
            }
          );
      }

      /* =====================================================
         BUSCADOR GENERAL
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
                registro.codigoPago,

                registro
                  .cliente
                  .nombre,

                registro
                  .cliente
                  .documento,

                registro
                  .cliente
                  .telefono,

                registro
                  .cliente
                  .ciudad,

                registro
                  .venta
                  .codigo,

                registro
                  .manzana
                  .codigo,

                registro
                  .lote
                  .codigo,

                registro
                  .lote
                  .numeroLote,

                registro.metodoPago,

                registro.referencia,

                registro.observaciones,
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
         AGRUPAR POR CLIENTE
      ===================================================== */

      const mapaClientes =
        new Map();

      registros.forEach(
        (
          registro
        ) => {
          const clave =
            String(
              registro
                .cliente
                ._id ||
              registro
                .cliente
                .documento ||
              registro
                .cliente
                .nombre
            );

          if (
            !mapaClientes.has(
              clave
            )
          ) {
            mapaClientes.set(
              clave,
              {
                cliente:
                  registro.cliente,

                cantidadPagos:
                  0,

                totalRecaudado:
                  0,

                ventas:
                  new Set(),

                lotes:
                  new Set(),

                efectivo:
                  0,

                transferencia:
                  0,

                consignacion:
                  0,

                pse:
                  0,

                otro:
                  0,

                ultimoPago:
                  null,

                ultimoPagoCodigo:
                  "",
              }
            );
          }

          const grupo =
            mapaClientes.get(
              clave
            );

          const valor =
            numero(
              registro.valorPago
            );

          grupo.cantidadPagos +=
            1;

          grupo.totalRecaudado +=
            valor;

          if (
            registro.venta._id
          ) {
            grupo.ventas.add(
              String(
                registro.venta._id
              )
            );
          }

          if (
            registro.lote._id
          ) {
            grupo.lotes.add(
              String(
                registro.lote._id
              )
            );
          }

          /* =================================================
             MÉTODO DE PAGO
          ================================================= */

          if (
            registro.metodoPago ===
            "Efectivo"
          ) {
            grupo.efectivo +=
              valor;
          } else if (
            registro.metodoPago ===
            "Transferencia"
          ) {
            grupo.transferencia +=
              valor;
          } else if (
            registro.metodoPago ===
            "Consignación"
          ) {
            grupo.consignacion +=
              valor;
          } else if (
            registro.metodoPago ===
            "PSE"
          ) {
            grupo.pse +=
              valor;
          } else {
            grupo.otro +=
              valor;
          }

          /* =================================================
             ÚLTIMO PAGO
          ================================================= */

          const fechaPago =
            registro.fechaPago
              ? new Date(
                  registro.fechaPago
                )
              : null;

          const fechaActual =
            grupo.ultimoPago
              ? new Date(
                  grupo.ultimoPago
                )
              : null;

          if (
            fechaPago &&
            !Number.isNaN(
              fechaPago.getTime()
            ) &&
            (
              !fechaActual ||
              Number.isNaN(
                fechaActual.getTime()
              ) ||
              fechaPago >
                fechaActual
            )
          ) {
            grupo.ultimoPago =
              registro.fechaPago;

            grupo.ultimoPagoCodigo =
              registro.codigoPago;
          }
        }
      );

      /* =====================================================
         CONVERTIR RESUMEN CLIENTES
      ===================================================== */

      const clientes =
        Array.from(
          mapaClientes.values()
        )
          .map(
            (
              grupo
            ) => ({
              cliente:
                grupo.cliente,

              cantidadPagos:
                grupo.cantidadPagos,

              cantidadVentas:
                grupo.ventas.size,

              cantidadLotes:
                grupo.lotes.size,

              totalRecaudado:
                Number(
                  grupo
                    .totalRecaudado
                    .toFixed(
                      2
                    )
                ),

              efectivo:
                Number(
                  grupo
                    .efectivo
                    .toFixed(
                      2
                    )
                ),

              transferencia:
                Number(
                  grupo
                    .transferencia
                    .toFixed(
                      2
                    )
                ),

              consignacion:
                Number(
                  grupo
                    .consignacion
                    .toFixed(
                      2
                    )
                ),

              pse:
                Number(
                  grupo
                    .pse
                    .toFixed(
                      2
                    )
                ),

              otro:
                Number(
                  grupo
                    .otro
                    .toFixed(
                      2
                    )
                ),

              ultimoPago:
                grupo.ultimoPago,

              ultimoPagoCodigo:
                grupo.ultimoPagoCodigo,
            })
          )
          .sort(
            (
              a,
              b
            ) =>
              b.totalRecaudado -
              a.totalRecaudado
          );

      /* =====================================================
         RESUMEN GENERAL
      ===================================================== */

      const totalRecaudado =
        registros.reduce(
          (
            total,
            registro
          ) =>
            total +
            numero(
              registro.valorPago
            ),
          0
        );

      const efectivo =
        registros
          .filter(
            (
              registro
            ) =>
              registro.metodoPago ===
              "Efectivo"
          )
          .reduce(
            (
              total,
              registro
            ) =>
              total +
              numero(
                registro.valorPago
              ),
            0
          );

      const transferencia =
        registros
          .filter(
            (
              registro
            ) =>
              registro.metodoPago ===
              "Transferencia"
          )
          .reduce(
            (
              total,
              registro
            ) =>
              total +
              numero(
                registro.valorPago
              ),
            0
          );

      const consignacion =
        registros
          .filter(
            (
              registro
            ) =>
              registro.metodoPago ===
              "Consignación"
          )
          .reduce(
            (
              total,
              registro
            ) =>
              total +
              numero(
                registro.valorPago
              ),
            0
          );

      const pse =
        registros
          .filter(
            (
              registro
            ) =>
              registro.metodoPago ===
              "PSE"
          )
          .reduce(
            (
              total,
              registro
            ) =>
              total +
              numero(
                registro.valorPago
              ),
            0
          );

      const otro =
        registros
          .filter(
            (
              registro
            ) =>
              ![
                "Efectivo",
                "Transferencia",
                "Consignación",
                "PSE",
              ].includes(
                registro.metodoPago
              )
          )
          .reduce(
            (
              total,
              registro
            ) =>
              total +
              numero(
                registro.valorPago
              ),
            0
          );

      const ventasUnicas =
        new Set(
          registros
            .map(
              (
                registro
              ) =>
                registro
                  .venta
                  ._id
            )
            .filter(Boolean)
            .map(String)
        );

      const lotesUnicos =
        new Set(
          registros
            .map(
              (
                registro
              ) =>
                registro
                  .lote
                  ._id
            )
            .filter(Boolean)
            .map(String)
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
            "recaudo-clientes",

          titulo:
            "Informe de recaudo por cliente",

          filtros: {
            desde,
            hasta,
            buscar,
            cliente,
            metodo,
          },

          resumen: {
            clientes:
              clientes.length,

            totalPagos:
              registros.length,

            ventasAsociadas:
              ventasUnicas.size,

            lotesAsociados:
              lotesUnicos.size,

            totalRecaudado:
              Number(
                totalRecaudado.toFixed(
                  2
                )
              ),

            efectivo:
              Number(
                efectivo.toFixed(
                  2
                )
              ),

            transferencia:
              Number(
                transferencia.toFixed(
                  2
                )
              ),

            consignacion:
              Number(
                consignacion.toFixed(
                  2
                )
              ),

            pse:
              Number(
                pse.toFixed(
                  2
                )
              ),

            otro:
              Number(
                otro.toFixed(
                  2
                )
              ),
          },

          clientes,

          registros,
        });
    } catch (
      error
    ) {
      console.error(
        "Error generando informe de recaudo por cliente:",
        error
      );

      return res
        .status(
          500
        )
        .json({
          message:
            "No fue posible generar el informe de recaudo por cliente.",

          error:
            error.message,
        });
    }
  };