import Comision from "../comisiones/comision.model.js";

/* =========================================================
   UTILIDADES
========================================================= */

const numero = (
  valor = 0
) => {
  const resultado =
    Number(valor);

  return Number.isFinite(
    resultado
  )
    ? resultado
    : 0;
};

/* =========================================================
   TEXTO
========================================================= */

const texto = (
  valor = ""
) => {
  return String(
    valor ?? ""
  ).trim();
};

/* =========================================================
   NORMALIZAR TEXTO
========================================================= */

const normalizarTexto = (
  valor = ""
) => {
  return texto(valor)
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    );
};

/* =========================================================
   FECHA INICIO DEL DÍA
========================================================= */

const inicioDia = (
  fecha
) => {
  if (!fecha) {
    return null;
  }

  const date =
    new Date(
      `${fecha}T00:00:00.000`
    );

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;
};

/* =========================================================
   FECHA FIN DEL DÍA
========================================================= */

const finDia = (
  fecha
) => {
  if (!fecha) {
    return null;
  }

  const date =
    new Date(
      `${fecha}T23:59:59.999`
    );

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;
};

/* =========================================================
   FILTRO DE FECHA
========================================================= */

const crearFiltroFecha = (
  desde,
  hasta
) => {
  const filtro = {};

  const fechaDesde =
    inicioDia(
      desde
    );

  const fechaHasta =
    finDia(
      hasta
    );

  if (
    fechaDesde
  ) {
    filtro.$gte =
      fechaDesde;
  }

  if (
    fechaHasta
  ) {
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
   OBTENER NOMBRE

   Se deja flexible para soportar registros antiguos que
   puedan tener "nombre" o registros nuevos con
   "nombres" + "apellidos".
========================================================= */

const obtenerNombre = (
  persona
) => {
  if (!persona) {
    return "—";
  }

  if (
    texto(
      persona.nombre
    )
  ) {
    return texto(
      persona.nombre
    );
  }

  const nombreCompleto =
    [
      persona.nombres,
      persona.apellidos,
    ]
      .map(
        texto
      )
      .filter(
        Boolean
      )
      .join(" ");

  return (
    nombreCompleto ||
    "—"
  );
};

/* =========================================================
   CÓDIGO DE MANZANA
========================================================= */

const obtenerCodigoManzana = (
  lote
) => {
  const manzana =
    lote?.manzana;

  if (!manzana) {
    return "—";
  }

  if (
    typeof manzana ===
    "string"
  ) {
    return manzana;
  }

  return (
    texto(
      manzana.codigo
    ) ||
    texto(
      manzana.nombre
    ) ||
    "—"
  );
};

/* =========================================================
   ÁREA DEL LOTE

   Soporta posibles datos antiguos.
========================================================= */

const obtenerAreaLote = (
  lote
) => {
  if (!lote) {
    return 0;
  }

  return numero(
    lote.area ??
      lote.metros ??
      lote.metrosCuadrados ??
      lote.areaTotal ??
      0
  );
};

/* =========================================================
   ESTADO CALCULADO

   Se usa el estado guardado en la comisión, pero si un
   registro antiguo no lo tiene se reconstruye por valores.
========================================================= */

const obtenerEstadoComision = ({
  estado,
  valorComision,
  totalPagado,
  saldoPendiente,
}) => {
  const estadoGuardado =
    texto(
      estado
    );

  if (
    [
      "Pendiente",
      "Abonada",
      "Pagada",
    ].includes(
      estadoGuardado
    )
  ) {
    return estadoGuardado;
  }

  const generado =
    numero(
      valorComision
    );

  const pagado =
    numero(
      totalPagado
    );

  const saldo =
    numero(
      saldoPendiente
    );

  if (
    saldo <= 0 &&
    generado > 0
  ) {
    return "Pagada";
  }

  if (
    pagado > 0
  ) {
    return "Abonada";
  }

  return "Pendiente";
};

/* =========================================================
   INFORME DE COMISIONES

   GET /api/reportes/comisiones

   Filtros:
   ?desde=2026-09-01
   &hasta=2026-09-30
   &buscar=laura
   &vendedor=<id>
   &estado=Pendiente
========================================================= */

export const obtenerReporteComisiones =
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
         FILTRO MONGOOSE
      ===================================================== */

      const filtro = {};

      const filtroFecha =
        crearFiltroFecha(
          desde,
          hasta
        );

      if (
        filtroFecha
      ) {
        filtro.fechaGeneracion =
          filtroFecha;
      }

      /* =====================================================
         CONSULTAR COMISIONES

         Populamos las referencias para que el frontend no
         tenga que consultar venta, vendedor, cliente y lote
         por separado.
      ===================================================== */

      const comisiones =
        await Comision.find(
          filtro
        )
          .populate({
            path:
              "venta",

            select:
              "codigo fechaVenta valorVenta formaPago estado",
          })
          .populate({
            path:
              "vendedor",

            select:
              "codigo nombres apellidos nombre documento telefono correo",
          })
          .populate({
            path:
              "cliente",

            select:
              "nombres apellidos nombre documento telefono correo ciudad",
          })
          .populate({
            path:
              "lote",

            select:
              "codigo tipo area metros metrosCuadrados areaTotal manzana",

            populate: {
              path:
                "manzana",

              select:
                "codigo nombre",
            },
          })
          .sort({
            fechaGeneracion:
              -1,

            createdAt:
              -1,
          })
          .lean();

      /* =====================================================
         CONSTRUIR REGISTROS
      ===================================================== */

      let registros =
        comisiones.map(
          (
            comision
          ) => {
            const valorComision =
              numero(
                comision.valorComision
              );

            const totalPagado =
              numero(
                comision.totalPagado
              );

            /*
             * Preferimos el saldo almacenado.
             * Si no existe, lo reconstruimos.
             */

            const saldoPendiente =
              comision.saldoPendiente !==
              undefined
                ? Math.max(
                    0,
                    numero(
                      comision.saldoPendiente
                    )
                  )
                : Math.max(
                    0,
                    valorComision -
                      totalPagado
                  );

            const estadoComision =
              obtenerEstadoComision({
                estado:
                  comision.estado,

                valorComision,

                totalPagado,

                saldoPendiente,
              });

            const nombreVendedor =
              obtenerNombre(
                comision.vendedor
              );

            const nombreCliente =
              obtenerNombre(
                comision.cliente
              );

            return {
              _id:
                comision._id,

              codigo:
                texto(
                  comision.codigo
                ) ||
                "—",

              fechaGeneracion:
                comision.fechaGeneracion ||
                comision.createdAt ||
                null,

              fechaUltimoPago:
                comision.fechaUltimoPago ||
                null,

              /* =============================================
                 VENTA
              ============================================= */

              venta: {
                _id:
                  comision.venta
                    ?._id ||
                  null,

                codigo:
                  texto(
                    comision.venta
                      ?.codigo
                  ) ||
                  "—",

                fecha:
                  comision.venta
                    ?.fechaVenta ||
                  null,

                valorVenta:
                  numero(
                    comision.venta
                      ?.valorVenta
                  ),

                formaPago:
                  texto(
                    comision.venta
                      ?.formaPago
                  ) ||
                  "—",

                estado:
                  texto(
                    comision.venta
                      ?.estado
                  ) ||
                  "—",
              },

              /* =============================================
                 VENDEDOR
              ============================================= */

              vendedor: {
                _id:
                  comision.vendedor
                    ?._id ||
                  null,

                codigo:
                  texto(
                    comision.vendedor
                      ?.codigo
                  ) ||
                  "—",

                nombre:
                  nombreVendedor,

                documento:
                  texto(
                    comision.vendedor
                      ?.documento
                  ) ||
                  "—",

                telefono:
                  texto(
                    comision.vendedor
                      ?.telefono
                  ) ||
                  "—",
              },

              /* =============================================
                 CLIENTE
              ============================================= */

              cliente: {
                _id:
                  comision.cliente
                    ?._id ||
                  null,

                nombre:
                  nombreCliente,

                documento:
                  texto(
                    comision.cliente
                      ?.documento
                  ) ||
                  "—",

                telefono:
                  texto(
                    comision.cliente
                      ?.telefono
                  ) ||
                  "—",
              },

              /* =============================================
                 LOTE
              ============================================= */

              manzana: {
                _id:
                  comision.lote
                    ?.manzana
                    ?._id ||
                  null,

                codigo:
                  obtenerCodigoManzana(
                    comision.lote
                  ),
              },

              lote: {
                _id:
                  comision.lote
                    ?._id ||
                  null,

                codigo:
                  texto(
                    comision.lote
                      ?.codigo
                  ) ||
                  "—",

                tipo:
                  texto(
                    comision.lote
                      ?.tipo
                  ) ||
                  "—",

                area:
                  obtenerAreaLote(
                    comision.lote
                  ),
              },

              /* =============================================
                 VALORES
              ============================================= */

              valorComision,

              totalPagado,

              saldoPendiente,

              porcentajePagado:
                valorComision >
                0
                  ? Math.min(
                      100,
                      (
                        totalPagado /
                        valorComision
                      ) *
                        100
                    )
                  : 0,

              estado:
                estadoComision,

              observaciones:
                texto(
                  comision.observaciones
                ),
            };
          }
        );

      /* =====================================================
         FILTRO POR VENDEDOR
      ===================================================== */

      if (
        texto(
          vendedor
        )
      ) {
        const valorVendedor =
          normalizarTexto(
            vendedor
          );

        registros =
          registros.filter(
            (
              registro
            ) => {
              const posiblesValores = [
                registro.vendedor
                  ?._id,

                registro.vendedor
                  ?.codigo,

                registro.vendedor
                  ?.nombre,

                registro.vendedor
                  ?.documento,
              ];

              return posiblesValores.some(
                (
                  valor
                ) =>
                  normalizarTexto(
                    valor
                  ) ===
                  valorVendedor
              );
            }
          );
      }

      /* =====================================================
         FILTRO ESTADO
      ===================================================== */

      if (
        texto(
          estado
        )
      ) {
        const estadoBuscado =
          normalizarTexto(
            estado
          );

        registros =
          registros.filter(
            (
              registro
            ) =>
              normalizarTexto(
                registro.estado
              ) ===
              estadoBuscado
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
          normalizarTexto(
            buscar
          );

        registros =
          registros.filter(
            (
              registro
            ) => {
              const campos = [
                registro.codigo,

                registro.venta
                  ?.codigo,

                registro.vendedor
                  ?.codigo,

                registro.vendedor
                  ?.nombre,

                registro.vendedor
                  ?.documento,

                registro.cliente
                  ?.nombre,

                registro.cliente
                  ?.documento,

                registro.manzana
                  ?.codigo,

                registro.lote
                  ?.codigo,

                registro.lote
                  ?.tipo,

                registro.estado,

                registro.observaciones,
              ];

              return campos.some(
                (
                  campo
                ) =>
                  normalizarTexto(
                    campo
                  ).includes(
                    busqueda
                  )
              );
            }
          );
      }

      /* =====================================================
         RESUMEN
      ===================================================== */

      const vendedoresUnicos =
        new Set();

      const lotesUnicos =
        new Set();

      registros.forEach(
        (
          registro
        ) => {
          const vendedorId =
            registro.vendedor
              ?._id;

          if (
            vendedorId
          ) {
            vendedoresUnicos.add(
              String(
                vendedorId
              )
            );
          }

          const loteId =
            registro.lote
              ?._id;

          if (
            loteId
          ) {
            lotesUnicos.add(
              String(
                loteId
              )
            );
          }
        }
      );

      const totalGenerado =
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

      const comisionesPendientes =
        registros.filter(
          (
            registro
          ) =>
            registro.estado ===
            "Pendiente"
        ).length;

      const comisionesAbonadas =
        registros.filter(
          (
            registro
          ) =>
            registro.estado ===
            "Abonada"
        ).length;

      const comisionesPagadas =
        registros.filter(
          (
            registro
          ) =>
            registro.estado ===
            "Pagada"
        ).length;

      /* =====================================================
         RESUMEN POR VENDEDOR

         Esto será útil posteriormente si queremos mostrar
         una tabla consolidada adicional dentro del mismo
         informe.
      ===================================================== */

      const mapaVendedores =
        new Map();

      registros.forEach(
        (
          registro
        ) => {
          const clave =
            String(
              registro.vendedor
                ?._id ||
                registro.vendedor
                  ?.codigo ||
                registro.vendedor
                  ?.nombre ||
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
                vendedor: {
                  ...registro.vendedor,
                },

                lotesVendidos:
                  0,

                comisionesGeneradas:
                  0,

                totalGenerado:
                  0,

                totalPagado:
                  0,

                saldoPendiente:
                  0,

                pendientes:
                  0,

                abonadas:
                  0,

                pagadas:
                  0,
              }
            );
          }

          const acumulado =
            mapaVendedores.get(
              clave
            );

          acumulado.lotesVendidos +=
            1;

          acumulado.comisionesGeneradas +=
            1;

          acumulado.totalGenerado +=
            numero(
              registro.valorComision
            );

          acumulado.totalPagado +=
            numero(
              registro.totalPagado
            );

          acumulado.saldoPendiente +=
            numero(
              registro.saldoPendiente
            );

          if (
            registro.estado ===
            "Pendiente"
          ) {
            acumulado.pendientes +=
              1;
          }

          if (
            registro.estado ===
            "Abonada"
          ) {
            acumulado.abonadas +=
              1;
          }

          if (
            registro.estado ===
            "Pagada"
          ) {
            acumulado.pagadas +=
              1;
          }
        }
      );

      const resumenVendedores =
        Array.from(
          mapaVendedores.values()
        ).sort(
          (
            a,
            b
          ) =>
            b.totalGenerado -
            a.totalGenerado
        );

      /* =====================================================
         RESPUESTA
      ===================================================== */

      return res.json({
        tipoReporte:
          "comisiones",

        titulo:
          "Informe de comisiones",

        filtros: {
          desde:
            texto(
              desde
            ),

          hasta:
            texto(
              hasta
            ),

          buscar:
            texto(
              buscar
            ),

          vendedor:
            texto(
              vendedor
            ),

          estado:
            texto(
              estado
            ),
        },

        resumen: {
          vendedores:
            vendedoresUnicos.size,

          lotesVendidos:
            lotesUnicos.size,

          comisionesGeneradas:
            registros.length,

          totalGenerado,

          totalPagado,

          saldoPendiente,

          comisionesPendientes,

          comisionesAbonadas,

          comisionesPagadas,

          porcentajePagado:
            totalGenerado >
            0
              ? Math.min(
                  100,
                  (
                    totalPagado /
                    totalGenerado
                  ) *
                    100
                )
              : 0,
        },

        resumenVendedores,

        registros,
      });
    } catch (error) {
      console.error(
        "Error generando informe de comisiones:",
        error
      );

      return res.status(
        500
      ).json({
        message:
          "No fue posible generar el informe de comisiones.",

        error:
          error.message,
      });
    }
  };