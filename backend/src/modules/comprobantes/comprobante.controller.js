import Pago from "../pagos/pago.model.js";
import Egreso from "../egresos/egreso.model.js";

/* =========================================================
   FUNCIONES AUXILIARES
========================================================= */

const escaparRegex = (texto = "") => {
  return String(texto).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
};

const fechaInicioUTC = (fecha) => {
  if (!fecha) {
    return null;
  }

  const date = new Date(
    `${fecha}T00:00:00.000Z`
  );

  return Number.isNaN(date.getTime())
    ? null
    : date;
};

const fechaFinUTC = (fecha) => {
  if (!fecha) {
    return null;
  }

  const date = new Date(
    `${fecha}T23:59:59.999Z`
  );

  return Number.isNaN(date.getTime())
    ? null
    : date;
};

const obtenerNombreCliente = (cliente) => {
  if (!cliente) {
    return "Cliente";
  }

  return [
    cliente.nombres,
    cliente.apellidos,
  ]
    .filter(Boolean)
    .join(" ")
    .trim() || "Cliente";
};

/* =========================================================
   NORMALIZAR PAGO
========================================================= */

const normalizarPago = (pago) => {
  const cliente =
    pago.cliente || {};

  const venta =
    pago.venta || {};

  const lote =
    venta.lote || {};

  const manzana =
    lote.manzana || {};

  const loteTexto =
    [
      manzana.codigo ||
        manzana.nombre,
      lote.codigo,
    ]
      .filter(Boolean)
      .join(" - ");

  return {
    _id:
      String(pago._id),

    origen:
      "Ingreso",

    tipoDocumento:
      "Recibo de caja",

    codigo:
      pago.codigo ||
      "—",

    fecha:
      pago.fechaPago,

    terceroNombre:
      obtenerNombreCliente(
        cliente
      ),

    terceroDocumento:
      cliente.documento ||
      "",

    concepto:
      venta.codigo
        ? `Pago recibido de la venta ${venta.codigo}${
            loteTexto
              ? ` - ${loteTexto}`
              : ""
          }`
        : "Pago recibido de cliente",

    valor:
      Number(
        pago.valorPago
      ) || 0,

    formaPago:
      pago.metodoPago ||
      "—",

    referencia:
      pago.referencia ||
      "",

    observaciones:
      pago.observaciones ||
      "",

    venta: {
      _id:
        venta._id ||
        null,

      codigo:
        venta.codigo ||
        "",

      lote: {
        _id:
          lote._id ||
          null,

        codigo:
          lote.codigo ||
          "",

        manzana: {
          _id:
            manzana._id ||
            null,

          codigo:
            manzana.codigo ||
            "",

          nombre:
            manzana.nombre ||
            "",
        },
      },
    },

    pagoId:
      pago._id,

    egresoId:
      null,
  };
};

/* =========================================================
   NORMALIZAR EGRESO
========================================================= */

const normalizarEgreso = (egreso) => {
  return {
    _id:
      String(egreso._id),

    origen:
      "Egreso",

    tipoDocumento:
      "Comprobante de egreso",

    codigo:
      egreso.codigo ||
      "—",

    fecha:
      egreso.fechaPago,

    terceroNombre:
      egreso.beneficiarioNombre ||
      "Beneficiario",

    terceroDocumento:
      egreso.beneficiarioDocumento ||
      "",

    concepto:
      egreso.concepto ||
      "Salida de dinero",

    valor:
      Number(
        egreso.valor
      ) || 0,

    formaPago:
      egreso.formaPago ||
      "—",

    referencia:
      egreso.referenciaPago ||
      "",

    observaciones:
      egreso.observaciones ||
      "",

    tipoEgreso:
      egreso.tipo ||
      "",

    tipoMovimiento:
      egreso.tipoMovimiento ||
      "",

    saldoAntes:
      Number(
        egreso.saldoAntes
      ) || 0,

    saldoDespues:
      Number(
        egreso.saldoDespues
      ) || 0,

    pagoId:
      null,

    egresoId:
      egreso._id,
  };
};

/* =========================================================
   LISTAR COMPROBANTES

   GET /api/comprobantes

   Filtros:

   ?movimiento=Ingreso
   ?movimiento=Egreso
   ?desde=2026-09-01
   ?hasta=2026-09-30
   ?buscar=PG-0001
========================================================= */

export const obtenerComprobantes =
  async (req, res) => {
    try {
      const {
        movimiento = "",
        desde = "",
        hasta = "",
        buscar = "",
      } = req.query;

      /* =====================================================
         VALIDAR MOVIMIENTO
      ===================================================== */

      if (
        movimiento &&
        ![
          "Ingreso",
          "Egreso",
        ].includes(
          movimiento
        )
      ) {
        return res.status(
          400
        ).json({
          message:
            "El tipo de movimiento no es válido",
        });
      }

      /* =====================================================
         FILTROS DE FECHA
      ===================================================== */

      const inicio =
        fechaInicioUTC(
          desde
        );

      const fin =
        fechaFinUTC(
          hasta
        );

      if (
        desde &&
        !inicio
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
        !fin
      ) {
        return res.status(
          400
        ).json({
          message:
            "La fecha final no es válida",
        });
      }

      const filtroFechaPago = {};

      if (inicio) {
        filtroFechaPago.$gte =
          inicio;
      }

      if (fin) {
        filtroFechaPago.$lte =
          fin;
      }

      /* =====================================================
         CONSULTAR PAGOS
      ===================================================== */

      let pagos = [];

      if (
        !movimiento ||
        movimiento ===
          "Ingreso"
      ) {
        const filtroPagos = {};

        if (
          Object.keys(
            filtroFechaPago
          ).length > 0
        ) {
          filtroPagos.fechaPago =
            filtroFechaPago;
        }

        pagos =
          await Pago.find(
            filtroPagos
          )
            .populate(
              "cliente",
              "nombres apellidos documento telefono"
            )
            .populate({
              path:
                "venta",

              select:
                "codigo fechaVenta lote",

              populate: {
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
            })
            .sort({
              fechaPago:
                -1,

              createdAt:
                -1,
            })
            .lean();
      }

      /* =====================================================
         CONSULTAR EGRESOS
      ===================================================== */

      let egresos = [];

      if (
        !movimiento ||
        movimiento ===
          "Egreso"
      ) {
        const filtroEgresos = {};

        if (
          Object.keys(
            filtroFechaPago
          ).length > 0
        ) {
          filtroEgresos.fechaPago =
            filtroFechaPago;
        }

        egresos =
          await Egreso.find(
            filtroEgresos
          )
            .sort({
              fechaPago:
                -1,

              createdAt:
                -1,
            })
            .lean();
      }

      /* =====================================================
         NORMALIZAR
      ===================================================== */

      let comprobantes = [
        ...pagos.map(
          normalizarPago
        ),

        ...egresos.map(
          normalizarEgreso
        ),
      ];

      /* =====================================================
         BÚSQUEDA
      ===================================================== */

      const texto =
        String(
          buscar ||
            ""
        )
          .trim()
          .toLowerCase();

      if (texto) {
        const expresion =
          new RegExp(
            escaparRegex(
              texto
            ),
            "i"
          );

        comprobantes =
          comprobantes.filter(
            (item) => {
              const contenido = [
                item.codigo,
                item.origen,
                item.tipoDocumento,
                item.terceroNombre,
                item.terceroDocumento,
                item.concepto,
                item.formaPago,
                item.referencia,
                item.tipoEgreso,
                item.tipoMovimiento,
              ]
                .filter(Boolean)
                .join(" ");

              return expresion.test(
                contenido
              );
            }
          );
      }

      /* =====================================================
         ORDENAR TODO JUNTO
      ===================================================== */

      comprobantes.sort(
        (a, b) => {
          const fechaA =
            new Date(
              a.fecha
            ).getTime();

          const fechaB =
            new Date(
              b.fecha
            ).getTime();

          return (
            fechaB -
            fechaA
          );
        }
      );

      /* =====================================================
         RESUMEN
      ===================================================== */

      const resumen =
        comprobantes.reduce(
          (
            acumulado,
            item
          ) => {
            const valor =
              Number(
                item.valor
              ) || 0;

            acumulado.totalDocumentos +=
              1;

            if (
              item.origen ===
              "Ingreso"
            ) {
              acumulado.totalIngresos +=
                valor;

              acumulado.cantidadIngresos +=
                1;
            }

            if (
              item.origen ===
              "Egreso"
            ) {
              acumulado.totalEgresos +=
                valor;

              acumulado.cantidadEgresos +=
                1;
            }

            return acumulado;
          },
          {
            totalDocumentos:
              0,

            cantidadIngresos:
              0,

            cantidadEgresos:
              0,

            totalIngresos:
              0,

            totalEgresos:
              0,
          }
        );

      resumen.balance =
        resumen.totalIngresos -
        resumen.totalEgresos;

      res.status(
        200
      ).json({
        comprobantes,

        resumen,
      });
    } catch (error) {
      console.error(
        "Error obteniendo comprobantes:",
        error
      );

      res.status(
        500
      ).json({
        message:
          "No fue posible obtener los comprobantes",
      });
    }
  };