import Venta from "../ventas/venta.model.js";
import Cuota from "../cuotas/cuota.model.js";

/* =========================================================
   HELPERS
========================================================= */

const numero = (valor) => {
  const resultado = Number(valor);

  return Number.isFinite(resultado)
    ? resultado
    : 0;
};

const texto = (valor) => {
  return String(valor ?? "")
    .trim();
};

const textoMinuscula = (valor) => {
  return texto(valor)
    .toLowerCase();
};

/* =========================================================
   FECHAS
========================================================= */

const inicioDia = (fecha) => {
  if (!fecha) {
    return null;
  }

  const valor = new Date(
    `${fecha}T00:00:00.000`
  );

  return Number.isNaN(
    valor.getTime()
  )
    ? null
    : valor;
};

const finDia = (fecha) => {
  if (!fecha) {
    return null;
  }

  const valor = new Date(
    `${fecha}T23:59:59.999`
  );

  return Number.isNaN(
    valor.getTime()
  )
    ? null
    : valor;
};

const crearFiltroFecha = (
  desde,
  hasta
) => {
  const filtro = {};

  const fechaDesde =
    inicioDia(desde);

  const fechaHasta =
    finDia(hasta);

  if (fechaDesde) {
    filtro.$gte =
      fechaDesde;
  }

  if (fechaHasta) {
    filtro.$lte =
      fechaHasta;
  }

  return Object.keys(
    filtro
  ).length
    ? filtro
    : null;
};

/* =========================================================
   NOMBRES
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
   AGRUPAR CUOTAS POR VENTA
========================================================= */

const agruparCuotasPorVenta = (
  cuotas
) => {
  const mapa =
    new Map();

  cuotas.forEach(
    (cuota) => {
      const ventaId =
        String(
          cuota?.venta?._id ||
          cuota?.venta ||
          ""
        );

      if (!ventaId) {
        return;
      }

      if (
        !mapa.has(
          ventaId
        )
      ) {
        mapa.set(
          ventaId,
          []
        );
      }

      mapa
        .get(
          ventaId
        )
        .push(
          cuota
        );
    }
  );

  return mapa;
};

/* =========================================================
   CALCULAR CARTERA DE UNA VENTA
========================================================= */

const calcularCarteraVenta = (
  venta,
  cuotasVenta
) => {
  const valorVenta =
    numero(
      venta.valorVenta
    );

  const cuotaInicial =
    numero(
      venta.cuotaInicial
    );

  const formaPago =
    textoMinuscula(
      venta.formaPago
    );

  /* =======================================================
     VENTA DE CONTADO
  ======================================================= */

  if (
    formaPago ===
    "contado"
  ) {
    return {
      totalPagado:
        valorVenta,

      saldoPendiente:
        0,

      cuotasPendientes:
        0,

      cuotasVencidas:
        0,

      valorVencido:
        0,

      estadoCartera:
        "Pagada",
    };
  }

  /* =======================================================
     VENTA FINANCIADA
  ======================================================= */

  const totalPagadoCuotas =
    cuotasVenta.reduce(
      (
        total,
        cuota
      ) =>
        total +
        numero(
          cuota.valorPagado
        ),
      0
    );

  const totalPagado =
    Math.min(
      valorVenta,
      cuotaInicial +
        totalPagadoCuotas
    );

  let saldoPendiente =
    0;

  if (
    cuotasVenta.length >
    0
  ) {
    saldoPendiente =
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
  } else {
    saldoPendiente =
      numero(
        venta.saldoFinanciar
      );

    if (
      saldoPendiente <=
      0
    ) {
      saldoPendiente =
        Math.max(
          0,
          valorVenta -
            cuotaInicial
        );
    }
  }

  saldoPendiente =
    Math.max(
      0,
      saldoPendiente
    );

  /* =======================================================
     CUOTAS PENDIENTES
  ======================================================= */

  const cuotasPendientesLista =
    cuotasVenta.filter(
      (cuota) =>
        numero(
          cuota.saldoPendiente
        ) > 0
    );

  /* =======================================================
     CUOTAS VENCIDAS
  ======================================================= */

  const hoy =
    new Date();

  hoy.setHours(
    0,
    0,
    0,
    0
  );

  const cuotasVencidasLista =
    cuotasPendientesLista.filter(
      (cuota) => {
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

        fecha.setHours(
          0,
          0,
          0,
          0
        );

        return (
          fecha <
          hoy
        );
      }
    );

  const valorVencido =
    cuotasVencidasLista.reduce(
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

  /* =======================================================
     ESTADO
  ======================================================= */

  let estadoCartera =
    "Pendiente";

  if (
    saldoPendiente <=
    0
  ) {
    estadoCartera =
      "Pagada";
  } else if (
    cuotasVencidasLista.length >
    0
  ) {
    estadoCartera =
      "Vencida";
  }

  return {
    totalPagado,

    saldoPendiente,

    cuotasPendientes:
      cuotasPendientesLista.length,

    cuotasVencidas:
      cuotasVencidasLista.length,

    valorVencido,

    estadoCartera,
  };
};

/* =========================================================
   INFORME:
   CARTERA POR CLIENTE

   GET /api/reportes/cartera-clientes

   FILTROS:
   ?desde=
   &hasta=
   &buscar=
   &cliente=
   &estado=
========================================================= */

export const obtenerReporteCarteraClientes =
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
        estado = "",
      } = req.query;

      /* =====================================================
         FILTRO DE VENTAS
      ===================================================== */

      const filtroVenta = {};

      const filtroFecha =
        crearFiltroFecha(
          desde,
          hasta
        );

      if (
        filtroFecha
      ) {
        filtroVenta.fechaVenta =
          filtroFecha;
      }

      /* =====================================================
         CONSULTAR VENTAS
      ===================================================== */

      const ventas =
        await Venta.find(
          filtroVenta
        )
          .populate({
            path:
              "cliente",

            select:
              "nombres apellidos nombre documento telefono correo ciudad",
          })
          .populate({
            path:
              "vendedor",

            select:
              "codigo nombres apellidos nombre documento",
          })
          .populate({
            path:
              "lote",

            select:
              "codigo numeroLote tipoLote areaM2 valorLote estado manzana",

            populate: {
              path:
                "manzana",

              select:
                "codigo nombre",
            },
          })
          .sort({
            fechaVenta: -1,
            createdAt: -1,
          })
          .lean();

      /* =====================================================
         CONSULTAR CUOTAS
      ===================================================== */

      const idsVentas =
        ventas.map(
          (venta) =>
            venta._id
        );

      const cuotas =
        idsVentas.length
          ? await Cuota.find({
              venta: {
                $in:
                  idsVentas,
              },
            })
              .sort({
                fechaVencimiento:
                  1,
              })
              .lean()
          : [];

      const cuotasPorVenta =
        agruparCuotasPorVenta(
          cuotas
        );

      /* =====================================================
         DETALLE DE VENTAS
      ===================================================== */

      let registros =
        ventas.map(
          (venta) => {
            const clienteVenta =
              venta.cliente;

            const lote =
              venta.lote;

            const manzana =
              lote?.manzana;

            const cuotasVenta =
              cuotasPorVenta.get(
                String(
                  venta._id
                )
              ) || [];

            const cartera =
              calcularCarteraVenta(
                venta,
                cuotasVenta
              );

            return {
              _id:
                venta._id,

              codigoVenta:
                venta.codigo ||
                "—",

              fechaVenta:
                venta.fechaVenta ||
                venta.createdAt,

              cliente: {
                _id:
                  clienteVenta?._id ||
                  null,

                nombre:
                  obtenerNombreCliente(
                    clienteVenta
                  ),

                documento:
                  clienteVenta?.documento ||
                  "",

                telefono:
                  clienteVenta?.telefono ||
                  "",

                correo:
                  clienteVenta?.correo ||
                  "",

                ciudad:
                  clienteVenta?.ciudad ||
                  "",
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

              valorVenta:
                numero(
                  venta.valorVenta
                ),

              cuotaInicial:
                numero(
                  venta.cuotaInicial
                ),

              formaPago:
                venta.formaPago ||
                "—",

              numeroCuotas:
                numero(
                  venta.numeroCuotas
                ),

              estadoVenta:
                venta.estado ||
                "Activa",

              totalPagado:
                cartera.totalPagado,

              saldoPendiente:
                cartera.saldoPendiente,

              cuotasPendientes:
                cartera.cuotasPendientes,

              cuotasVencidas:
                cartera.cuotasVencidas,

              valorVencido:
                cartera.valorVencido,

              estadoCartera:
                cartera.estadoCartera,
            };
          }
        );

      /* =====================================================
         FILTRO POR CLIENTE
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
            (registro) => {
              return (
                textoMinuscula(
                  registro.cliente._id
                ) ===
                  filtroCliente ||

                textoMinuscula(
                  registro.cliente.documento
                ) ===
                  filtroCliente ||

                textoMinuscula(
                  registro.cliente.nombre
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
            (registro) => {
              const campos = [
                registro.codigoVenta,

                registro.cliente.nombre,
                registro.cliente.documento,
                registro.cliente.telefono,
                registro.cliente.ciudad,

                registro.manzana.codigo,

                registro.lote.codigo,
                registro.lote.numeroLote,
                registro.lote.tipo,

                registro.formaPago,

                registro.estadoVenta,

                registro.estadoCartera,
              ];

              return campos.some(
                (campo) =>
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
        (registro) => {
          const clave =
            String(
              registro.cliente._id ||
              registro.cliente.documento ||
              registro.cliente.nombre
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

                cantidadVentas:
                  0,

                lotesComprados:
                  0,

                valorComprado:
                  0,

                totalCuotaInicial:
                  0,

                totalPagado:
                  0,

                saldoPendiente:
                  0,

                cuotasPendientes:
                  0,

                cuotasVencidas:
                  0,

                valorVencido:
                  0,

                estadoCartera:
                  "Pagada",
              }
            );
          }

          const grupo =
            mapaClientes.get(
              clave
            );

          grupo.cantidadVentas +=
            1;

          grupo.lotesComprados +=
            1;

          grupo.valorComprado +=
            numero(
              registro.valorVenta
            );

          grupo.totalCuotaInicial +=
            numero(
              registro.cuotaInicial
            );

          grupo.totalPagado +=
            numero(
              registro.totalPagado
            );

          grupo.saldoPendiente +=
            numero(
              registro.saldoPendiente
            );

          grupo.cuotasPendientes +=
            numero(
              registro.cuotasPendientes
            );

          grupo.cuotasVencidas +=
            numero(
              registro.cuotasVencidas
            );

          grupo.valorVencido +=
            numero(
              registro.valorVencido
            );
        }
      );

      let clientes =
        Array.from(
          mapaClientes.values()
        ).map(
          (grupo) => {
            let estadoCartera =
              "Pagada";

            if (
              grupo.saldoPendiente >
              0
            ) {
              estadoCartera =
                grupo.valorVencido >
                0
                  ? "Vencida"
                  : "Pendiente";
            }

            return {
              ...grupo,

              estadoCartera,
            };
          }
        );

      /* =====================================================
         FILTRO ESTADO DE CARTERA
      ===================================================== */

      if (
        texto(
          estado
        )
      ) {
        const estadoFiltro =
          textoMinuscula(
            estado
          );

        clientes =
          clientes.filter(
            (item) =>
              textoMinuscula(
                item.estadoCartera
              ) ===
              estadoFiltro
          );

        const clientesPermitidos =
          new Set(
            clientes.map(
              (item) =>
                String(
                  item.cliente._id ||
                  item.cliente.documento ||
                  item.cliente.nombre
                )
            )
          );

        registros =
          registros.filter(
            (registro) =>
              clientesPermitidos.has(
                String(
                  registro.cliente._id ||
                  registro.cliente.documento ||
                  registro.cliente.nombre
                )
              )
          );
      }

      /* =====================================================
         ORDENAR CLIENTES
      ===================================================== */

      clientes.sort(
        (
          a,
          b
        ) => {
          if (
            b.valorVencido !==
            a.valorVencido
          ) {
            return (
              b.valorVencido -
              a.valorVencido
            );
          }

          if (
            b.saldoPendiente !==
            a.saldoPendiente
          ) {
            return (
              b.saldoPendiente -
              a.saldoPendiente
            );
          }

          return String(
            a.cliente.nombre
          ).localeCompare(
            String(
              b.cliente.nombre
            ),
            "es"
          );
        }
      );

      /* =====================================================
         RESUMEN GENERAL
      ===================================================== */

      const clientesConCartera =
        clientes.filter(
          (item) =>
            numero(
              item.saldoPendiente
            ) > 0
        ).length;

      const clientesVencidos =
        clientes.filter(
          (item) =>
            numero(
              item.valorVencido
            ) > 0
        ).length;

      const totalComprado =
        clientes.reduce(
          (
            total,
            item
          ) =>
            total +
            numero(
              item.valorComprado
            ),
          0
        );

      const totalPagado =
        clientes.reduce(
          (
            total,
            item
          ) =>
            total +
            numero(
              item.totalPagado
            ),
          0
        );

      const saldoPendiente =
        clientes.reduce(
          (
            total,
            item
          ) =>
            total +
            numero(
              item.saldoPendiente
            ),
          0
        );

      const valorVencido =
        clientes.reduce(
          (
            total,
            item
          ) =>
            total +
            numero(
              item.valorVencido
            ),
          0
        );

      const cuotasPendientes =
        clientes.reduce(
          (
            total,
            item
          ) =>
            total +
            numero(
              item.cuotasPendientes
            ),
          0
        );

      const cuotasVencidas =
        clientes.reduce(
          (
            total,
            item
          ) =>
            total +
            numero(
              item.cuotasVencidas
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
            "cartera-clientes",

          titulo:
            "Informe de cartera por cliente",

          filtros: {
            desde,
            hasta,
            buscar,
            cliente,
            estado,
          },

          resumen: {
            clientes:
              clientes.length,

            clientesConCartera,

            clientesVencidos,

            totalVentas:
              registros.length,

            totalComprado,

            totalPagado,

            saldoPendiente,

            valorVencido,

            cuotasPendientes,

            cuotasVencidas,
          },

          clientes,

          registros,
        });
    } catch (
      error
    ) {
      console.error(
        "Error generando informe de cartera por cliente:",
        error
      );

      return res
        .status(
          500
        )
        .json({
          message:
            "No fue posible generar el informe de cartera por cliente.",

          error:
            error.message,
        });
    }
  };