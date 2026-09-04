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

  const valor =
    new Date(
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

  const valor =
    new Date(
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

const obtenerNombreVendedor = (
  vendedor
) => {
  if (!vendedor) {
    return "Sin vendedor";
  }

  return (
    [
      vendedor.nombres,
      vendedor.apellidos,
    ]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    vendedor.nombre ||
    "Sin vendedor"
  );
};

/* =========================================================
   DATOS DE MANZANA
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
   ÁREA DEL LOTE

   Se dejan varias alternativas para soportar registros
   antiguos.
========================================================= */

const obtenerAreaLote = (
  lote
) => {
  return numero(
    lote?.area ??
      lote?.metros ??
      lote?.metrosCuadrados ??
      lote?.areaTotal ??
      0
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
        .get(ventaId)
        .push(cuota);
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
     CONTADO
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
     FINANCIADO
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
    cuotasVenta.length
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
     VENCIMIENTOS
  ======================================================= */

  const hoy =
    new Date();

  hoy.setHours(
    0,
    0,
    0,
    0
  );

  const cuotasPendientes =
    cuotasVenta.filter(
      (cuota) =>
        numero(
          cuota.saldoPendiente
        ) > 0
    );

  const cuotasVencidas =
    cuotasPendientes.filter(
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
    cuotasVencidas.reduce(
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

  return {
    totalPagado,

    saldoPendiente,

    cuotasPendientes:
      cuotasPendientes.length,

    cuotasVencidas:
      cuotasVencidas.length,

    valorVencido,

    estadoCartera,
  };
};

/* =========================================================
   INFORME:
   CLIENTES POR LOTES VENDIDOS

   GET /api/reportes/clientes-lotes-vendidos

   FILTROS:
   ?desde=
   &hasta=
   &buscar=
   &manzana=
   &vendedor=
   &estado=
========================================================= */

export const obtenerClientesLotesVendidos =
  async (
    req,
    res
  ) => {
    try {
      const {
        desde = "",
        hasta = "",
        buscar = "",
        manzana = "",
        vendedor = "",
        estado = "",
      } = req.query;

      /* =====================================================
         FILTRO BASE DE VENTAS
      ===================================================== */

      const filtroVenta = {};

      const filtroFecha =
        crearFiltroFecha(
          desde,
          hasta
        );

      if (filtroFecha) {
        filtroVenta.fechaVenta =
          filtroFecha;
      }

      /* =====================================================
         OBTENER VENTAS
      ===================================================== */

      const ventas =
        await Venta.find(
          filtroVenta
        )
          .populate(
            "cliente"
          )
          .populate(
            "vendedor"
          )
          .populate({
            path: "lote",

            populate: {
              path:
                "manzana",
            },
          })
          .sort({
            fechaVenta: -1,
            createdAt: -1,
          })
          .lean();

      /* =====================================================
         CUOTAS DE LAS VENTAS
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
         CONSTRUIR REGISTROS DEL INFORME
      ===================================================== */

      let registros =
        ventas.map(
          (venta) => {
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

            const cliente =
              venta.cliente;

            const lote =
              venta.lote;

            const manzanaVenta =
              lote?.manzana;

            const vendedorVenta =
              venta.vendedor;

            return {
              _id:
                venta._id,

              codigoVenta:
                venta.codigo ||
                "—",

              fechaVenta:
                venta.fechaVenta ||
                venta.createdAt,

              /* =====================
                 CLIENTE
              ===================== */

              cliente: {
                _id:
                  cliente?._id ||
                  null,

                nombre:
                  obtenerNombreCliente(
                    cliente
                  ),

                documento:
                  cliente
                    ?.documento ||
                  "",

                telefono:
                  cliente
                    ?.telefono ||
                  "",

                correo:
                  cliente
                    ?.correo ||
                  "",

                ciudad:
                  cliente
                    ?.ciudad ||
                  "",
              },

              /* =====================
                 MANZANA
              ===================== */

              manzana: {
                _id:
                  manzanaVenta
                    ?._id ||
                  null,

                codigo:
                  obtenerCodigoManzana(
                    manzanaVenta
                  ),
              },

              /* =====================
                 LOTE
              ===================== */

              lote: {
                _id:
                  lote?._id ||
                  null,

                codigo:
                  lote
                    ?.codigo ||
                  "—",

                tipo:
                  lote
                    ?.tipo ||
                  "",

                area:
                  obtenerAreaLote(
                    lote
                  ),
              },

              /* =====================
                 VENTA
              ===================== */

              formaPago:
                venta.formaPago ||
                "—",

              valorVenta:
                numero(
                  venta.valorVenta
                ),

              cuotaInicial:
                numero(
                  venta.cuotaInicial
                ),

              estadoVenta:
                venta.estado ||
                "Activa",

              /* =====================
                 CARTERA
              ===================== */

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

              /* =====================
                 VENDEDOR
              ===================== */

              vendedor: {
                _id:
                  vendedorVenta
                    ?._id ||
                  null,

                codigo:
                  vendedorVenta
                    ?.codigo ||
                  "",

                nombre:
                  obtenerNombreVendedor(
                    vendedorVenta
                  ),

                documento:
                  vendedorVenta
                    ?.documento ||
                  "",
              },
            };
          }
        );

      /* =====================================================
         FILTRO POR MANZANA
      ===================================================== */

      if (
        texto(manzana)
      ) {
        const filtroManzana =
          textoMinuscula(
            manzana
          );

        registros =
          registros.filter(
            (registro) => {
              return (
                textoMinuscula(
                  registro
                    .manzana
                    ._id
                ) ===
                  filtroManzana ||
                textoMinuscula(
                  registro
                    .manzana
                    .codigo
                ).includes(
                  filtroManzana
                )
              );
            }
          );
      }

      /* =====================================================
         FILTRO POR VENDEDOR
      ===================================================== */

      if (
        texto(vendedor)
      ) {
        const filtroVendedor =
          textoMinuscula(
            vendedor
          );

        registros =
          registros.filter(
            (registro) => {
              return (
                textoMinuscula(
                  registro
                    .vendedor
                    ._id
                ) ===
                  filtroVendedor ||
                textoMinuscula(
                  registro
                    .vendedor
                    .codigo
                ).includes(
                  filtroVendedor
                ) ||
                textoMinuscula(
                  registro
                    .vendedor
                    .nombre
                ).includes(
                  filtroVendedor
                )
              );
            }
          );
      }

      /* =====================================================
         FILTRO ESTADO DE CARTERA
      ===================================================== */

      if (
        texto(estado)
      ) {
        registros =
          registros.filter(
            (registro) =>
              textoMinuscula(
                registro.estadoCartera
              ) ===
              textoMinuscula(
                estado
              )
          );
      }

      /* =====================================================
         BUSCADOR GENERAL
      ===================================================== */

      if (
        texto(buscar)
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
                  .manzana
                  .codigo,

                registro
                  .lote
                  .codigo,

                registro
                  .lote
                  .tipo,

                registro
                  .vendedor
                  .codigo,

                registro
                  .vendedor
                  .nombre,

                registro
                  .vendedor
                  .documento,

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
         RESUMEN DEL INFORME
      ===================================================== */

      const clientesUnicos =
        new Set();

      registros.forEach(
        (registro) => {
          const identificador =
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

          clientesUnicos.add(
            identificador
          );
        }
      );

      const totalVendido =
        registros.reduce(
          (
            total,
            registro
          ) =>
            total +
            numero(
              registro.valorVenta
            ),
          0
        );

      const totalCuotaInicial =
        registros.reduce(
          (
            total,
            registro
          ) =>
            total +
            numero(
              registro.cuotaInicial
            ),
          0
        );

      const totalPagado =
        registros.reduce(
          (
            total,
            registro
          ) =>
            total +
            numero(
              registro.totalPagado
            ),
          0
        );

      const saldoPendiente =
        registros.reduce(
          (
            total,
            registro
          ) =>
            total +
            numero(
              registro.saldoPendiente
            ),
          0
        );

      const valorVencido =
        registros.reduce(
          (
            total,
            registro
          ) =>
            total +
            numero(
              registro.valorVencido
            ),
          0
        );

      const ventasPagadas =
        registros.filter(
          (registro) =>
            registro.estadoCartera ===
            "Pagada"
        ).length;

      const ventasPendientes =
        registros.filter(
          (registro) =>
            registro.estadoCartera ===
            "Pendiente"
        ).length;

      const ventasVencidas =
        registros.filter(
          (registro) =>
            registro.estadoCartera ===
            "Vencida"
        ).length;

      /* =====================================================
         RESPUESTA
      ===================================================== */

      return res.json({
        tipoReporte:
          "clientes-lotes-vendidos",

        titulo:
          "Informe de clientes por lotes vendidos",

        filtros: {
          desde,
          hasta,
          buscar,
          manzana,
          vendedor,
          estado,
        },

        resumen: {
          clientesCompradores:
            clientesUnicos.size,

          lotesVendidos:
            registros.length,

          totalVendido,

          totalCuotaInicial,

          totalPagado,

          saldoPendiente,

          valorVencido,

          ventasPagadas,

          ventasPendientes,

          ventasVencidas,
        },

        registros,
      });
    } catch (error) {
      console.error(
        "Error generando informe de clientes por lotes vendidos:",
        error
      );

      return res.status(
        500
      ).json({
        message:
          "No fue posible generar el informe de clientes por lotes vendidos.",

        error:
          error.message,
      });
    }
  };