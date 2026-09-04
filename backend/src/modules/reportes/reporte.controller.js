import Venta from "../ventas/venta.model.js";
import Pago from "../pagos/pago.model.js";
import Cuota from "../cuotas/cuota.model.js";
import Egreso from "../egresos/egreso.model.js";
import Lote from "../lotes/lote.model.js";

/* =========================================================
   HELPERS
========================================================= */

const numero = (valor) => {
  const resultado = Number(valor);

  return Number.isFinite(resultado)
    ? resultado
    : 0;
};

const escaparRegex = (texto = "") => {
  return String(texto).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
};

const inicioDia = (fecha) => {
  if (!fecha) {
    return null;
  }

  const date = new Date(
    `${fecha}T00:00:00.000`
  );

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;
};

const finDia = (fecha) => {
  if (!fecha) {
    return null;
  }

  const date = new Date(
    `${fecha}T23:59:59.999`
  );

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;
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

const obtenerNombreCliente = (
  cliente
) => {
  if (!cliente) {
    return "—";
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
    "—"
  );
};

const obtenerNombreTercero = (
  egreso
) => {
  return (
    egreso?.beneficiarioNombre ||
    egreso?.nombreBeneficiario ||
    [
      egreso?.vendedor?.nombres,
      egreso?.vendedor?.apellidos,
    ]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    "—"
  );
};

/* =========================================================
   VALOR DE PAGO

   Se dejan varios nombres compatibles para soportar
   registros existentes.
========================================================= */

const obtenerValorPago = (
  pago
) => {
  return numero(
    pago?.valorPago ??
      pago?.valor ??
      pago?.monto ??
      pago?.totalPagado ??
      0
  );
};

const obtenerFechaPago = (
  pago
) => {
  return (
    pago?.fechaPago ||
    pago?.fecha ||
    pago?.createdAt
  );
};

/* =========================================================
   CARTERA
========================================================= */

const construirCartera = (
  ventas,
  cuotas
) => {
  const cuotasPorVenta =
    new Map();

  for (
    const cuota
    of cuotas
  ) {
    const ventaId =
      String(
        cuota?.venta?._id ||
          cuota?.venta ||
          ""
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
      .get(ventaId)
      .push(cuota);
  }

  const hoy =
    new Date();

  hoy.setHours(
    0,
    0,
    0,
    0
  );

  return ventas.map(
    (venta) => {
      const ventaId =
        String(
          venta._id
        );

      const cuotasVenta =
        cuotasPorVenta.get(
          ventaId
        ) || [];

      const valorVenta =
        numero(
          venta.valorVenta
        );

      const cuotaInicial =
        numero(
          venta.cuotaInicial
        );

      const formaPago =
        String(
          venta.formaPago ||
            ""
        ).toLowerCase();

      let totalPagado = 0;
      let saldoPendiente = 0;

      if (
        formaPago ===
        "contado"
      ) {
        totalPagado =
          valorVenta;

        saldoPendiente =
          0;
      } else {
        const pagadoCuotas =
          cuotasVenta.reduce(
            (
              acumulado,
              cuota
            ) =>
              acumulado +
              numero(
                cuota.valorPagado
              ),
            0
          );

        totalPagado =
          Math.min(
            valorVenta,
            cuotaInicial +
              pagadoCuotas
          );

        if (
          cuotasVenta.length >
          0
        ) {
          saldoPendiente =
            cuotasVenta.reduce(
              (
                acumulado,
                cuota
              ) =>
                acumulado +
                numero(
                  cuota.saldoPendiente
                ),
              0
            );
        } else {
          saldoPendiente =
            Math.max(
              0,
              numero(
                venta.saldoFinanciar
              ) ||
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
              fecha < hoy
            );
          }
        );

      const valorVencido =
        cuotasVencidas.reduce(
          (
            acumulado,
            cuota
          ) =>
            acumulado +
            numero(
              cuota.saldoPendiente
            ),
          0
        );

      let estadoCartera =
        "Pendiente";

      if (
        saldoPendiente <= 0
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
        _id:
          venta._id,

        codigo:
          venta.codigo,

        fechaVenta:
          venta.fechaVenta,

        cliente: {
          _id:
            venta.cliente?._id,

          nombre:
            obtenerNombreCliente(
              venta.cliente
            ),

          documento:
            venta.cliente
              ?.documento ||
            "",
        },

        lote: {
          _id:
            venta.lote?._id,

          codigo:
            venta.lote
              ?.codigo ||
            "",

          manzana:
            venta.lote
              ?.manzana
              ?.codigo ||
            venta.lote
              ?.manzana
              ?.nombre ||
            "",
        },

        formaPago:
          venta.formaPago,

        valorVenta,

        cuotaInicial,

        totalPagado,

        saldoPendiente,

        cuotasPendientes:
          cuotasPendientes.length,

        cuotasVencidas:
          cuotasVencidas.length,

        valorVencido,

        estadoCartera,
      };
    }
  );
};

/* =========================================================
   GET /api/reportes

   Query:
   ?desde=2026-09-01
   &hasta=2026-09-30
   &buscar=cliente
========================================================= */

export const obtenerReporteGeneral =
  async (
    req,
    res
  ) => {
    try {
      const {
        desde = "",
        hasta = "",
        buscar = "",
      } = req.query;

      const filtroFecha =
        crearFiltroFecha(
          desde,
          hasta
        );

      /* =====================================================
         VENTAS
      ===================================================== */

      const filtroVenta = {};

      if (filtroFecha) {
        filtroVenta.fechaVenta =
          filtroFecha;
      }

      let ventas =
        await Venta.find(
          filtroVenta
        )
          .populate(
            "cliente"
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
         CUOTAS

         Para calcular correctamente el saldo de las ventas
         encontradas.
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
                $in: idsVentas,
              },
            })
              .sort({
                fechaVencimiento:
                  1,
              })
              .lean()
          : [];

      /* =====================================================
         PAGOS
      ===================================================== */

      const filtroPago = {};

      if (filtroFecha) {
        /*
         * Algunos registros pueden manejar fechaPago y
         * otros fecha/createdAt. Primero intentamos fechaPago.
         */
        filtroPago.fechaPago =
          filtroFecha;
      }

      let pagos =
        await Pago.find(
          filtroPago
        )
          .populate(
            "cliente"
          )
          .populate({
            path: "venta",
            populate: {
              path:
                "lote",
              populate: {
                path:
                  "manzana",
              },
            },
          })
          .sort({
            fechaPago: -1,
            createdAt: -1,
          })
          .lean();

      /* =====================================================
         EGRESOS
      ===================================================== */

      const filtroEgreso = {};

      if (filtroFecha) {
        filtroEgreso.fechaPago =
          filtroFecha;
      }

      let egresos =
        await Egreso.find(
          filtroEgreso
        )
          .populate(
            "vendedor"
          )
          .populate(
            "comision"
          )
          .populate({
            path:
              "horaMaquinaria",
            populate: {
              path:
                "maquinaria",
            },
          })
          .sort({
            fechaPago: -1,
            createdAt: -1,
          })
          .lean();

      /* =====================================================
         LOTES
      ===================================================== */

      let lotes =
        await Lote.find()
          .populate(
            "manzana"
          )
          .sort({
            createdAt: -1,
          })
          .lean();

      /* =====================================================
         BUSCADOR GENERAL
      ===================================================== */

      const textoBuscar =
        String(
          buscar
        )
          .trim()
          .toLowerCase();

      if (textoBuscar) {
        const coincide = (
          ...valores
        ) => {
          return valores.some(
            (valor) =>
              String(
                valor || ""
              )
                .toLowerCase()
                .includes(
                  textoBuscar
                )
          );
        };

        ventas =
          ventas.filter(
            (venta) =>
              coincide(
                venta.codigo,
                obtenerNombreCliente(
                  venta.cliente
                ),
                venta.cliente
                  ?.documento,
                venta.lote
                  ?.codigo,
                venta.lote
                  ?.manzana
                  ?.codigo,
                venta.lote
                  ?.manzana
                  ?.nombre
              )
          );

        pagos =
          pagos.filter(
            (pago) =>
              coincide(
                pago.codigo,
                obtenerNombreCliente(
                  pago.cliente
                ),
                pago.cliente
                  ?.documento,
                pago.venta
                  ?.codigo,
                pago.venta
                  ?.lote
                  ?.codigo
              )
          );

        egresos =
          egresos.filter(
            (egreso) =>
              coincide(
                egreso.codigo,
                egreso.tipo,
                egreso.tipoMovimiento,
                egreso.concepto,
                obtenerNombreTercero(
                  egreso
                ),
                egreso
                  .beneficiarioDocumento,
                egreso
                  .referenciaPago
              )
          );

        lotes =
          lotes.filter(
            (lote) =>
              coincide(
                lote.codigo,
                lote.estado,
                lote.manzana
                  ?.codigo,
                lote.manzana
                  ?.nombre
              )
          );
      }

      /* =====================================================
         CARTERA
      ===================================================== */

      const cartera =
        construirCartera(
          ventas,
          cuotas
        );

      /* =====================================================
         NORMALIZAR PAGOS
      ===================================================== */

      const pagosReporte =
        pagos.map(
          (pago) => ({
            _id:
              pago._id,

            codigo:
              pago.codigo,

            fecha:
              obtenerFechaPago(
                pago
              ),

            cliente: {
              _id:
                pago.cliente
                  ?._id,

              nombre:
                obtenerNombreCliente(
                  pago.cliente
                ),

              documento:
                pago.cliente
                  ?.documento ||
                "",
            },

            venta:
              pago.venta
                ?.codigo ||
              "",

            lote:
              pago.venta
                ?.lote
                ?.codigo ||
              "",

            manzana:
              pago.venta
                ?.lote
                ?.manzana
                ?.codigo ||
              pago.venta
                ?.lote
                ?.manzana
                ?.nombre ||
              "",

            valor:
              obtenerValorPago(
                pago
              ),

            formaPago:
              pago.formaPago ||
              "",

            referenciaPago:
              pago.referenciaPago ||
              "",
          })
        );

      /* =====================================================
         NORMALIZAR EGRESOS
      ===================================================== */

      const egresosReporte =
        egresos.map(
          (egreso) => ({
            _id:
              egreso._id,

            codigo:
              egreso.codigo,

            fecha:
              egreso.fechaPago ||
              egreso.createdAt,

            tipo:
              egreso.tipo,

            tipoMovimiento:
              egreso.tipoMovimiento,

            beneficiario:
              obtenerNombreTercero(
                egreso
              ),

            documento:
              egreso
                .beneficiarioDocumento ||
              "",

            concepto:
              egreso.concepto ||
              "",

            valor:
              numero(
                egreso.valor
              ),

            formaPago:
              egreso.formaPago ||
              "",

            referenciaPago:
              egreso.referenciaPago ||
              "",
          })
        );

      /* =====================================================
         NORMALIZAR VENTAS
      ===================================================== */

      const ventasReporte =
        ventas.map(
          (venta) => ({
            _id:
              venta._id,

            codigo:
              venta.codigo,

            fecha:
              venta.fechaVenta,

            cliente: {
              _id:
                venta.cliente
                  ?._id,

              nombre:
                obtenerNombreCliente(
                  venta.cliente
                ),

              documento:
                venta.cliente
                  ?.documento ||
                "",
            },

            lote:
              venta.lote
                ?.codigo ||
              "",

            manzana:
              venta.lote
                ?.manzana
                ?.codigo ||
              venta.lote
                ?.manzana
                ?.nombre ||
              "",

            formaPago:
              venta.formaPago,

            valorVenta:
              numero(
                venta.valorVenta
              ),

            cuotaInicial:
              numero(
                venta.cuotaInicial
              ),

            estado:
              venta.estado,
          })
        );

      /* =====================================================
         NORMALIZAR LOTES
      ===================================================== */

      const lotesReporte =
        lotes.map(
          (lote) => ({
            _id:
              lote._id,

            codigo:
              lote.codigo,

            manzana:
              lote.manzana
                ?.codigo ||
              lote.manzana
                ?.nombre ||
              "",

            estado:
              lote.estado,

            tipo:
              lote.tipo,

            area:
              numero(
                lote.area
              ),

            valor:
              numero(
                lote.valor ||
                  lote.valorLote
              ),
          })
        );

      /* =====================================================
         RESUMEN FINANCIERO
      ===================================================== */

      const totalVendido =
        ventasReporte.reduce(
          (
            acumulado,
            venta
          ) =>
            acumulado +
            numero(
              venta.valorVenta
            ),
          0
        );

      const totalRecaudado =
        pagosReporte.reduce(
          (
            acumulado,
            pago
          ) =>
            acumulado +
            numero(
              pago.valor
            ),
          0
        );

      const carteraPendiente =
        cartera.reduce(
          (
            acumulado,
            registro
          ) =>
            acumulado +
            numero(
              registro.saldoPendiente
            ),
          0
        );

      const carteraVencida =
        cartera.reduce(
          (
            acumulado,
            registro
          ) =>
            acumulado +
            numero(
              registro.valorVencido
            ),
          0
        );

      const totalEgresos =
        egresosReporte.reduce(
          (
            acumulado,
            egreso
          ) =>
            acumulado +
            numero(
              egreso.valor
            ),
          0
        );

      const balance =
        totalRecaudado -
        totalEgresos;

      const lotesDisponibles =
        lotesReporte.filter(
          (lote) =>
            String(
              lote.estado
            ).toLowerCase() ===
            "disponible"
        ).length;

      const lotesVendidos =
        lotesReporte.filter(
          (lote) =>
            String(
              lote.estado
            ).toLowerCase() ===
            "vendido"
        ).length;

      const ventasConSaldo =
        cartera.filter(
          (registro) =>
            numero(
              registro.saldoPendiente
            ) > 0
        ).length;

      const ventasVencidas =
        cartera.filter(
          (registro) =>
            registro.estadoCartera ===
            "Vencida"
        ).length;

      /* =====================================================
         RESPUESTA
      ===================================================== */

      return res.json({
        filtros: {
          desde:
            desde || "",
          hasta:
            hasta || "",
          buscar:
            buscar || "",
        },

        resumen: {
          totalVendido,
          totalRecaudado,
          carteraPendiente,
          carteraVencida,
          totalEgresos,
          balance,

          cantidadVentas:
            ventasReporte.length,

          cantidadPagos:
            pagosReporte.length,

          cantidadEgresos:
            egresosReporte.length,

          ventasConSaldo,

          ventasVencidas,

          lotesDisponibles,

          lotesVendidos,

          totalLotes:
            lotesReporte.length,
        },

        ventas:
          ventasReporte,

        pagos:
          pagosReporte,

        cartera,

        egresos:
          egresosReporte,

        lotes:
          lotesReporte,
      });
    } catch (error) {
      console.error(
        "Error obteniendo reporte general:",
        error
      );

      return res.status(
        500
      ).json({
        message:
          "No fue posible generar el reporte general.",
        error:
          error.message,
      });
    }
  };