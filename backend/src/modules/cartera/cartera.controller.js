import Venta from "../ventas/venta.model.js";
import Cuota from "../cuotas/cuota.model.js";

/* =========================================================
   FUNCIONES AUXILIARES
========================================================= */

const escaparRegex = (texto = "") => {
  return String(texto).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
};

const obtenerInicioDia = (fecha) => {
  if (!fecha) {
    return null;
  }

  const date =
    new Date(
      `${fecha}T00:00:00.000Z`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
};

const obtenerFinDia = (fecha) => {
  if (!fecha) {
    return null;
  }

  const date =
    new Date(
      `${fecha}T23:59:59.999Z`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
};

const obtenerNombreCliente = (
  cliente
) => {
  if (!cliente) {
    return "Cliente";
  }

  const nombre = [
    cliente.nombres,
    cliente.apellidos,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    nombre ||
    cliente.nombre ||
    cliente.razonSocial ||
    "Cliente"
  );
};

const normalizarNumero = (
  valor
) => {
  const numero =
    Number(valor);

  return Number.isFinite(numero)
    ? numero
    : 0;
};

/* =========================================================
   OBTENER ID DE VENTA EN CUOTA
========================================================= */

const obtenerVentaIdCuota = (
  cuota
) => {
  if (!cuota?.venta) {
    return "";
  }

  if (
    typeof cuota.venta ===
    "object"
  ) {
    return String(
      cuota.venta._id ||
        ""
    );
  }

  return String(
    cuota.venta
  );
};

/* =========================================================
   LISTAR CARTERA

   GET /api/cartera

   FILTROS:

   ?buscar=juan
   ?estado=Pendiente
   ?estado=Pagada
   ?estado=Vencida
   ?desde=2026-09-01
   ?hasta=2026-09-30
========================================================= */

export const obtenerCartera =
  async (
    req,
    res
  ) => {
    try {
      const {
        buscar = "",
        estado = "",
        desde = "",
        hasta = "",
      } = req.query;

      /* =====================================================
         VALIDAR ESTADO DE CARTERA
      ===================================================== */

      const estadosPermitidos = [
        "",
        "Pendiente",
        "Pagada",
        "Vencida",
      ];

      if (
        !estadosPermitidos.includes(
          estado
        )
      ) {
        return res.status(
          400
        ).json({
          message:
            "El estado de cartera no es válido",
        });
      }

      /* =====================================================
         FILTRO DE FECHA DE VENTA
      ===================================================== */

      const filtroVentas = {};

      const fechaInicio =
        obtenerInicioDia(
          desde
        );

      const fechaFinal =
        obtenerFinDia(
          hasta
        );

      if (
        desde &&
        !fechaInicio
      ) {
        return res.status(
          400
        ).json({
          message:
            "La fecha inicial no es válida",
        });
      }

      if (
        hasta &&
        !fechaFinal
      ) {
        return res.status(
          400
        ).json({
          message:
            "La fecha final no es válida",
        });
      }

      if (
        fechaInicio ||
        fechaFinal
      ) {
        filtroVentas.fechaVenta =
          {};

        if (fechaInicio) {
          filtroVentas.fechaVenta.$gte =
            fechaInicio;
        }

        if (fechaFinal) {
          filtroVentas.fechaVenta.$lte =
            fechaFinal;
        }
      }

      /* =====================================================
         OBTENER VENTAS
      ===================================================== */

      const ventas =
        await Venta.find(
          filtroVentas
        )
          .populate(
            "cliente",
            "nombres apellidos nombre razonSocial documento telefono correo"
          )
          .populate({
            path:
              "lote",

            select:
              "codigo numeroLote manzana areaMetros estado",

            populate: {
              path:
                "manzana",

              select:
                "codigo nombre",
            },
          })
          .sort({
            fechaVenta:
              -1,

            createdAt:
              -1,
          })
          .lean();

      /* =====================================================
         OBTENER CUOTAS

         Las cuotas se consultan una sola vez.
      ===================================================== */

      const cuotas =
        await Cuota.find({})
          .sort({
            fechaVencimiento:
              1,

            numeroCuota:
              1,
          })
          .lean();

      /* =====================================================
         AGRUPAR CUOTAS POR VENTA
      ===================================================== */

      const cuotasPorVenta =
        new Map();

      for (
        const cuota of cuotas
      ) {
        const ventaId =
          obtenerVentaIdCuota(
            cuota
          );

        if (!ventaId) {
          continue;
        }

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
          .get(
            ventaId
          )
          .push(
            cuota
          );
      }

      /* =====================================================
         FECHA ACTUAL

         Se usa para determinar cuotas vencidas.
      ===================================================== */

      const ahora =
        new Date();

      const hoyUTC =
        new Date(
          Date.UTC(
            ahora.getUTCFullYear(),
            ahora.getUTCMonth(),
            ahora.getUTCDate()
          )
        );

      /* =====================================================
         CONSTRUIR CARTERA
      ===================================================== */

      let cartera =
        ventas.map(
          (
            venta
          ) => {
            const ventaId =
              String(
                venta._id
              );

            const cuotasVenta =
              cuotasPorVenta.get(
                ventaId
              ) || [];

            const valorVenta =
              Math.max(
                0,
                normalizarNumero(
                  venta.valorVenta
                )
              );

            const cuotaInicial =
              Math.max(
                0,
                normalizarNumero(
                  venta.cuotaInicial
                )
              );

            let totalPagado =
              0;

            let saldoPendiente =
              0;

            /* =================================================
               VENTA DE CONTADO
            ================================================= */

            if (
              venta.formaPago ===
              "Contado"
            ) {
              totalPagado =
                valorVenta;

              saldoPendiente =
                0;
            } else {
              /* ===============================================
                 VENTA FINANCIADA
              =============================================== */

              const pagadoCuotas =
                cuotasVenta.reduce(
                  (
                    total,
                    cuota
                  ) =>
                    total +
                    Math.max(
                      0,
                      normalizarNumero(
                        cuota.valorPagado
                      )
                    ),
                  0
                );

              const saldoCuotas =
                cuotasVenta.reduce(
                  (
                    total,
                    cuota
                  ) =>
                    total +
                    Math.max(
                      0,
                      normalizarNumero(
                        cuota.saldoPendiente
                      )
                    ),
                  0
                );

              totalPagado =
                Math.min(
                  valorVenta,
                  cuotaInicial +
                    pagadoCuotas
                );

              /*
                Si hay cuotas:
                usamos la suma real de sus saldos.

                Si es un registro antiguo sin cuotas:
                usamos saldoFinanciar o calculamos
                valorVenta - cuotaInicial.
              */

              if (
                cuotasVenta.length >
                0
              ) {
                saldoPendiente =
                  Math.max(
                    0,
                    saldoCuotas
                  );
              } else {
                const saldoVenta =
                  normalizarNumero(
                    venta.saldoFinanciar
                  );

                saldoPendiente =
                  Math.max(
                    0,
                    saldoVenta > 0
                      ? saldoVenta
                      : valorVenta -
                          cuotaInicial
                  );
              }
            }

            /* =================================================
               CUOTAS PENDIENTES
            ================================================= */

            const cuotasPendientes =
              cuotasVenta.filter(
                (
                  cuota
                ) =>
                  normalizarNumero(
                    cuota.saldoPendiente
                  ) >
                  0
              );

            /* =================================================
               CUOTAS VENCIDAS
            ================================================= */

            const cuotasVencidas =
              cuotasPendientes.filter(
                (
                  cuota
                ) => {
                  if (
                    !cuota.fechaVencimiento
                  ) {
                    return false;
                  }

                  const fecha =
                    new Date(
                      cuota.fechaVencimiento
                    );

                  if (
                    Number.isNaN(
                      fecha.getTime()
                    )
                  ) {
                    return false;
                  }

                  return (
                    fecha <
                    hoyUTC
                  );
                }
              );

            const valorVencido =
              cuotasVencidas.reduce(
                (
                  total,
                  cuota
                ) =>
                  total +
                  Math.max(
                    0,
                    normalizarNumero(
                      cuota.saldoPendiente
                    )
                  ),
                0
              );

            /* =================================================
               PRÓXIMO VENCIMIENTO

               Tomamos la primera cuota pendiente
               cuya fecha sea hoy o posterior.
            ================================================= */

            const proximasCuotas =
              cuotasPendientes
                .filter(
                  (
                    cuota
                  ) => {
                    if (
                      !cuota.fechaVencimiento
                    ) {
                      return false;
                    }

                    const fecha =
                      new Date(
                        cuota.fechaVencimiento
                      );

                    if (
                      Number.isNaN(
                        fecha.getTime()
                      )
                    ) {
                      return false;
                    }

                    return (
                      fecha >=
                      hoyUTC
                    );
                  }
                )
                .sort(
                  (
                    a,
                    b
                  ) =>
                    new Date(
                      a.fechaVencimiento
                    ) -
                    new Date(
                      b.fechaVencimiento
                    )
                );

            const proximaCuota =
              proximasCuotas[0] ||
              null;

            /* =================================================
               ESTADO DE CARTERA
            ================================================= */

            let estadoCartera =
              "Pendiente";

            if (
              saldoPendiente <=
              0
            ) {
              estadoCartera =
                "Pagada";
            } else if (
              cuotasVencidas.length >
              0
            ) {
              estadoCartera =
                "Vencida";
            }

            const porcentajePagado =
              valorVenta > 0
                ? Math.min(
                    100,
                    Math.max(
                      0,
                      (
                        totalPagado /
                        valorVenta
                      ) *
                        100
                    )
                  )
                : 0;

            const cliente =
              venta.cliente ||
              null;

            const lote =
              venta.lote ||
              null;

            const manzana =
              lote?.manzana ||
              null;

            return {
              _id:
                venta._id,

              ventaId:
                venta._id,

              codigoVenta:
                venta.codigo ||
                "—",

              fechaVenta:
                venta.fechaVenta,

              formaPago:
                venta.formaPago ||
                "—",

              estadoVenta:
                venta.estado ||
                "—",

              estadoCartera,

              cliente: {
                _id:
                  cliente?._id ||
                  null,

                nombre:
                  obtenerNombreCliente(
                    cliente
                  ),

                documento:
                  cliente?.documento ||
                  "",

                telefono:
                  cliente?.telefono ||
                  "",

                correo:
                  cliente?.correo ||
                  "",
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

                manzana: {
                  _id:
                    manzana?._id ||
                    null,

                  codigo:
                    manzana?.codigo ||
                    "",

                  nombre:
                    manzana?.nombre ||
                    "",
                },
              },

              valorVenta,

              cuotaInicial,

              totalPagado,

              saldoPendiente,

              porcentajePagado:
                Math.round(
                  porcentajePagado *
                    100
                ) /
                100,

              numeroCuotas:
                normalizarNumero(
                  venta.numeroCuotas
                ),

              cuotasPendientes:
                cuotasPendientes.length,

              cuotasVencidas:
                cuotasVencidas.length,

              valorVencido,

              proximoVencimiento:
                proximaCuota
                  ? {
                      cuotaId:
                        proximaCuota._id,

                      codigo:
                        proximaCuota.codigo ||
                        "",

                      numeroCuota:
                        proximaCuota.numeroCuota ||
                        0,

                      fechaVencimiento:
                        proximaCuota.fechaVencimiento,

                      saldoPendiente:
                        Math.max(
                          0,
                          normalizarNumero(
                            proximaCuota.saldoPendiente
                          )
                        ),
                    }
                  : null,
            };
          }
        );

      /* =====================================================
         FILTRO POR ESTADO
      ===================================================== */

      if (estado) {
        cartera =
          cartera.filter(
            (
              item
            ) =>
              item.estadoCartera ===
              estado
          );
      }

      /* =====================================================
         BÚSQUEDA
      ===================================================== */

      const textoBusqueda =
        String(
          buscar ||
            ""
        ).trim();

      if (
        textoBusqueda
      ) {
        const regex =
          new RegExp(
            escaparRegex(
              textoBusqueda
            ),
            "i"
          );

        cartera =
          cartera.filter(
            (
              item
            ) => {
              const contenido = [
                item.codigoVenta,

                item.cliente.nombre,

                item.cliente.documento,

                item.cliente.telefono,

                item.lote.codigo,

                item.lote.numeroLote,

                item.lote.manzana.codigo,

                item.lote.manzana.nombre,

                item.formaPago,

                item.estadoCartera,
              ]
                .filter(Boolean)
                .join(" ");

              return regex.test(
                contenido
              );
            }
          );
      }

      /* =====================================================
         ORDENAR

         Primero:
         - Vencidas
         - Pendientes
         - Pagadas

         Dentro del estado:
         mayor saldo primero.
      ===================================================== */

      const prioridadEstado = {
        Vencida:
          1,

        Pendiente:
          2,

        Pagada:
          3,
      };

      cartera.sort(
        (
          a,
          b
        ) => {
          const prioridadA =
            prioridadEstado[
              a.estadoCartera
            ] || 99;

          const prioridadB =
            prioridadEstado[
              b.estadoCartera
            ] || 99;

          if (
            prioridadA !==
            prioridadB
          ) {
            return (
              prioridadA -
              prioridadB
            );
          }

          return (
            b.saldoPendiente -
            a.saldoPendiente
          );
        }
      );

      /* =====================================================
         RESUMEN
      ===================================================== */

      const resumen =
        cartera.reduce(
          (
            acumulado,
            item
          ) => {
            acumulado.totalVentas +=
              item.valorVenta;

            acumulado.totalPagado +=
              item.totalPagado;

            acumulado.saldoPendiente +=
              item.saldoPendiente;

            acumulado.valorVencido +=
              item.valorVencido;

            acumulado.totalRegistros +=
              1;

            if (
              item.saldoPendiente >
              0
            ) {
              acumulado.ventasConSaldo +=
                1;
            }

            if (
              item.estadoCartera ===
              "Vencida"
            ) {
              acumulado.ventasVencidas +=
                1;
            }

            if (
              item.estadoCartera ===
              "Pagada"
            ) {
              acumulado.ventasPagadas +=
                1;
            }

            return acumulado;
          },

          {
            totalRegistros:
              0,

            ventasConSaldo:
              0,

            ventasVencidas:
              0,

            ventasPagadas:
              0,

            totalVentas:
              0,

            totalPagado:
              0,

            saldoPendiente:
              0,

            valorVencido:
              0,
          }
        );

      /* =====================================================
         CLIENTES CON DEUDA

         Un cliente puede tener más de una venta.
      ===================================================== */

      const clientesConDeuda =
        new Set(
          cartera
            .filter(
              (
                item
              ) =>
                item.saldoPendiente >
                0
            )
            .map(
              (
                item
              ) =>
                String(
                  item.cliente._id ||
                    item.cliente.documento ||
                    item.cliente.nombre
                )
            )
        );

      resumen.clientesConDeuda =
        clientesConDeuda.size;

      /* =====================================================
         RESPUESTA
      ===================================================== */

      res.status(
        200
      ).json({
        cartera,

        resumen,
      });
    } catch (error) {
      console.error(
        "Error obteniendo cartera:",
        error
      );

      res.status(
        500
      ).json({
        message:
          "No fue posible obtener la cartera",
      });
    }
  };