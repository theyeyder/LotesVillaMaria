import Venta from "../ventas/venta.model.js";

/* =========================================================
   HELPERS
========================================================= */

const numero = (valor) => {
  const resultado = Number(valor);
  return Number.isFinite(resultado) ? resultado : 0;
};

const texto = (valor) => String(valor ?? "").trim();

const textoMinuscula = (valor) =>
  texto(valor).toLowerCase();

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

const obtenerNombreCompleto = (
  persona,
  valorDefecto = "—"
) => {
  if (!persona) {
    return valorDefecto;
  }

  return (
    [
      persona.nombres,
      persona.apellidos,
    ]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    persona.nombre ||
    valorDefecto
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
   VENTAS POR VENDEDOR

   GET /api/reportes/ventas-vendedor
========================================================= */

export const obtenerReporteVentasVendedor =
  async (
    req,
    res
  ) => {
    try {
      const {
        desde = "",
        hasta = "",
        buscar = "",
        vendedor = "",
        estado = "",
      } = req.query;

      /* =====================================================
         FILTRO BASE
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

      if (
        texto(estado)
      ) {
        filtroVenta.estado =
          texto(estado);
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
              "vendedor",

            select:
              "codigo nombres apellidos documento telefono correo estado valorComision",
          })
          .populate({
            path:
              "cliente",

            select:
              "nombres apellidos nombre documento telefono ciudad",
          })
          .populate({
            path:
              "lote",

            select:
              "codigo numeroLote tipoLote frenteMetros frenteCentimetros fondoMetros fondoCentimetros areaM2 valorLote estado manzana",

            populate: {
              path:
                "manzana",

              select:
                "codigo nombre areaM2 estado",
            },
          })
          .sort({
            fechaVenta: -1,
            createdAt: -1,
          })
          .lean();

      /* =====================================================
         CONSTRUIR DETALLE
      ===================================================== */

      let registros =
        ventas.map(
          (venta) => {
            const vendedorVenta =
              venta.vendedor;

            const cliente =
              venta.cliente;

            const lote =
              venta.lote;

            const manzana =
              lote?.manzana;

            return {
              _id:
                venta._id,

              codigoVenta:
                venta.codigo ||
                "—",

              fechaVenta:
                venta.fechaVenta ||
                venta.createdAt,

              vendedor: {
                _id:
                  vendedorVenta?._id ||
                  null,

                codigo:
                  vendedorVenta?.codigo ||
                  "",

                nombre:
                  obtenerNombreCompleto(
                    vendedorVenta,
                    "Sin vendedor"
                  ),

                documento:
                  vendedorVenta?.documento ||
                  "",

                telefono:
                  vendedorVenta?.telefono ||
                  "",

                estado:
                  vendedorVenta?.estado ||
                  "",
              },

              cliente: {
                _id:
                  cliente?._id ||
                  null,

                nombre:
                  obtenerNombreCompleto(
                    cliente
                  ),

                documento:
                  cliente?.documento ||
                  "",

                telefono:
                  cliente?.telefono ||
                  "",

                ciudad:
                  cliente?.ciudad ||
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

                frenteMetros:
                  numero(
                    lote?.frenteMetros
                  ),

                frenteCentimetros:
                  numero(
                    lote?.frenteCentimetros
                  ),

                fondoMetros:
                  numero(
                    lote?.fondoMetros
                  ),

                fondoCentimetros:
                  numero(
                    lote?.fondoCentimetros
                  ),

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

              saldoFinanciar:
                numero(
                  venta.saldoFinanciar
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

              valorComision:
                numero(
                  venta.valorComision
                ),
            };
          }
        );

      /* =====================================================
         FILTRO VENDEDOR
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
                  registro.vendedor._id
                ) ===
                  filtroVendedor ||

                textoMinuscula(
                  registro.vendedor.codigo
                ) ===
                  filtroVendedor ||

                textoMinuscula(
                  registro.vendedor.nombre
                ).includes(
                  filtroVendedor
                )
              );
            }
          );
      }

      /* =====================================================
         BUSCADOR
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

                registro.vendedor.codigo,
                registro.vendedor.nombre,
                registro.vendedor.documento,

                registro.cliente.nombre,
                registro.cliente.documento,

                registro.manzana.codigo,

                registro.lote.codigo,
                registro.lote.numeroLote,
                registro.lote.tipo,

                registro.formaPago,
                registro.estadoVenta,
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
         AGRUPAR POR VENDEDOR
      ===================================================== */

      const mapaVendedores =
        new Map();

      registros.forEach(
        (registro) => {
          const clave =
            String(
              registro.vendedor._id ||
              registro.vendedor.codigo ||
              registro.vendedor.nombre ||
              "sin-vendedor"
            );

          if (
            !mapaVendedores.has(
              clave
            )
          ) {
            mapaVendedores.set(
              clave,
              {
                vendedor:
                  registro.vendedor,

                cantidadVentas:
                  0,

                totalVendido:
                  0,

                totalCuotaInicial:
                  0,

                totalSaldoFinanciar:
                  0,

                comisionesGeneradas:
                  0,

                ventasActivas:
                  0,

                ventasPagadas:
                  0,
              }
            );
          }

          const grupo =
            mapaVendedores.get(
              clave
            );

          grupo.cantidadVentas +=
            1;

          grupo.totalVendido +=
            numero(
              registro.valorVenta
            );

          grupo.totalCuotaInicial +=
            numero(
              registro.cuotaInicial
            );

          grupo.totalSaldoFinanciar +=
            numero(
              registro.saldoFinanciar
            );

          grupo.comisionesGeneradas +=
            numero(
              registro.valorComision
            );

          if (
            registro.estadoVenta ===
            "Pagada"
          ) {
            grupo.ventasPagadas +=
              1;
          } else {
            grupo.ventasActivas +=
              1;
          }
        }
      );

      const vendedores =
        Array.from(
          mapaVendedores.values()
        )
          .map(
            (grupo) => ({
              ...grupo,

              promedioVenta:
                grupo.cantidadVentas >
                0
                  ? grupo.totalVendido /
                    grupo.cantidadVentas
                  : 0,
            })
          )
          .sort(
            (a, b) =>
              b.totalVendido -
              a.totalVendido
          );

      /* =====================================================
         RESUMEN
      ===================================================== */

      const vendedoresUnicos =
        new Set(
          registros.map(
            (registro) =>
              String(
                registro.vendedor._id ||
                registro.vendedor.codigo ||
                registro.vendedor.nombre ||
                "sin-vendedor"
              )
          )
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

      const totalSaldoFinanciar =
        registros.reduce(
          (
            total,
            registro
          ) =>
            total +
            numero(
              registro.saldoFinanciar
            ),
          0
        );

      const totalComisiones =
        registros.reduce(
          (
            total,
            registro
          ) =>
            total +
            numero(
              registro.valorComision
            ),
          0
        );

      const ventasPagadas =
        registros.filter(
          (registro) =>
            registro.estadoVenta ===
            "Pagada"
        ).length;

      const ventasActivas =
        registros.filter(
          (registro) =>
            registro.estadoVenta ===
            "Activa"
        ).length;

      const promedioVenta =
        registros.length >
        0
          ? totalVendido /
            registros.length
          : 0;

      /* =====================================================
         RESPUESTA
      ===================================================== */

      return res
        .status(
          200
        )
        .json({
          tipoReporte:
            "ventas-vendedor",

          titulo:
            "Informe de ventas por vendedor",

          filtros: {
            desde,
            hasta,
            buscar,
            vendedor,
            estado,
          },

          resumen: {
            vendedores:
              vendedoresUnicos.size,

            totalVentas:
              registros.length,

            totalVendido,

            promedioVenta,

            totalCuotaInicial,

            totalSaldoFinanciar,

            totalComisiones,

            ventasActivas,

            ventasPagadas,
          },

          vendedores,

          registros,
        });
    } catch (error) {
      console.error(
        "Error generando informe de ventas por vendedor:",
        error
      );

      return res
        .status(
          500
        )
        .json({
          message:
            "No fue posible generar el informe de ventas por vendedor.",

          error:
            error.message,
        });
    }
  };