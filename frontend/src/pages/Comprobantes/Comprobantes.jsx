import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Search,
  RefreshCw,
  ArrowDownCircle,
  ArrowUpCircle,
  WalletCards,
  Printer,
  Eye,
  X,
  CalendarDays,
} from "lucide-react";

import Toast from "../../components/ui/Toast";

import {
  obtenerComprobantes,
} from "../../services/comprobante.service";

import "./Comprobantes.css";

/* =========================================================
   FORMATEAR DINERO
========================================================= */

const formatearDinero = (
  valor = 0
) => {
  return new Intl.NumberFormat(
    "es-CO",
    {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }
  ).format(
    Number(valor) || 0
  );
};

/* =========================================================
   FORMATEAR FECHA
========================================================= */

const formatearFecha = (
  fecha
) => {
  if (!fecha) {
    return "—";
  }

  const texto =
    String(fecha);

  const coincidencia =
    texto.match(
      /^(\d{4})-(\d{2})-(\d{2})/
    );

  if (coincidencia) {
    const [
      ,
      anio,
      mes,
      dia,
    ] = coincidencia;

    return `${dia}/${mes}/${anio}`;
  }

  const date =
    new Date(fecha);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleDateString(
    "es-CO",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );
};

/* =========================================================
   FECHA LOCAL
========================================================= */

const obtenerFechaLocal = () => {
  const hoy =
    new Date();

  const local =
    new Date(
      hoy.getTime() -
        hoy.getTimezoneOffset() *
          60000
    );

  return local
    .toISOString()
    .slice(
      0,
      10
    );
};

/* =========================================================
   MES ACTUAL
========================================================= */

const obtenerInicioMesActual =
  () => {
    const hoy =
      new Date();

    const local =
      new Date(
        hoy.getTime() -
          hoy.getTimezoneOffset() *
            60000
      );

    const anio =
      local.getFullYear();

    const mes =
      String(
        local.getMonth() +
          1
      ).padStart(
        2,
        "0"
      );

    return `${anio}-${mes}-01`;
  };

/* =========================================================
   COMPONENTE
========================================================= */

export default function Comprobantes() {
  const [
    comprobantes,
    setComprobantes,
  ] = useState([]);

  const [
    resumen,
    setResumen,
  ] = useState({
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

    balance:
      0,
  });

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  /* =========================================================
     FILTROS
  ========================================================= */

  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  const [
    movimiento,
    setMovimiento,
  ] = useState("");

  const [
    desde,
    setDesde,
  ] = useState(
    obtenerInicioMesActual()
  );

  const [
    hasta,
    setHasta,
  ] = useState(
    obtenerFechaLocal()
  );

  /* =========================================================
     DETALLE
  ========================================================= */

  const [
    comprobanteSeleccionado,
    setComprobanteSeleccionado,
  ] = useState(null);

  const [
    modalDetalleAbierto,
    setModalDetalleAbierto,
  ] = useState(false);

  /* =========================================================
     TOAST
  ========================================================= */

  const [
    notificacion,
    setNotificacion,
  ] = useState({
    visible:
      false,

    mensaje:
      "",

    tipo:
      "success",
  });

  /* =========================================================
     PAGINACIÓN
  ========================================================= */

  const [
    paginaActual,
    setPaginaActual,
  ] = useState(1);

  const REGISTROS_POR_PAGINA =
    8;

  /* =========================================================
     NOTIFICACIONES
  ========================================================= */

  const mostrarNotificacion = (
    mensaje,
    tipo = "success"
  ) => {
    setNotificacion({
      visible:
        true,

      mensaje,

      tipo,
    });
  };

  const cerrarNotificacion =
    () => {
      setNotificacion(
        (
          anterior
        ) => ({
          ...anterior,

          visible:
            false,
        })
      );
    };

  /* =========================================================
     CARGAR COMPROBANTES
  ========================================================= */

  const cargarComprobantes =
    async () => {
      try {
        setCargando(
          true
        );

        setError(
          ""
        );

        const datos =
          await obtenerComprobantes({
            movimiento,

            desde,

            hasta,
          });

        setComprobantes(
          Array.isArray(
            datos?.comprobantes
          )
            ? datos.comprobantes
            : []
        );

        setResumen({
          totalDocumentos:
            Number(
              datos
                ?.resumen
                ?.totalDocumentos
            ) || 0,

          cantidadIngresos:
            Number(
              datos
                ?.resumen
                ?.cantidadIngresos
            ) || 0,

          cantidadEgresos:
            Number(
              datos
                ?.resumen
                ?.cantidadEgresos
            ) || 0,

          totalIngresos:
            Number(
              datos
                ?.resumen
                ?.totalIngresos
            ) || 0,

          totalEgresos:
            Number(
              datos
                ?.resumen
                ?.totalEgresos
            ) || 0,

          balance:
            Number(
              datos
                ?.resumen
                ?.balance
            ) || 0,
        });
      } catch (error) {
        console.error(
          "Error cargando comprobantes:",
          error
        );

        const mensaje =
          error?.response
            ?.data
            ?.message ||
          "No fue posible cargar los comprobantes.";

        setError(
          mensaje
        );

        mostrarNotificacion(
          mensaje,
          "error"
        );
      } finally {
        setCargando(
          false
        );
      }
    };

  /* =========================================================
     EFECTOS
  ========================================================= */

  useEffect(
    () => {
      cargarComprobantes();
    },
    [
      movimiento,
      desde,
      hasta,
    ]
  );

  useEffect(
    () => {
      setPaginaActual(
        1
      );
    },
    [
      busqueda,
      movimiento,
      desde,
      hasta,
    ]
  );

  /* =========================================================
     FILTRO LOCAL DE BÚSQUEDA

     Así no hacemos petición por cada tecla.
  ========================================================= */

  const comprobantesFiltrados =
    useMemo(
      () => {
        const texto =
          String(
            busqueda ||
              ""
          )
            .trim()
            .toLowerCase();

        if (
          !texto
        ) {
          return comprobantes;
        }

        return comprobantes.filter(
          (
            comprobante
          ) => {
            const contenido = [
              comprobante.codigo,
              comprobante.origen,
              comprobante.tipoDocumento,
              comprobante.terceroNombre,
              comprobante.terceroDocumento,
              comprobante.concepto,
              comprobante.formaPago,
              comprobante.referencia,
              comprobante.tipoEgreso,
              comprobante.tipoMovimiento,
            ]
              .filter(
                Boolean
              )
              .join(
                " "
              )
              .toLowerCase();

            return contenido.includes(
              texto
            );
          }
        );
      },
      [
        comprobantes,
        busqueda,
      ]
    );

  /* =========================================================
     RESUMEN FILTRADO

     Este resumen también responde a la búsqueda local.
  ========================================================= */

  const resumenFiltrado =
    useMemo(
      () => {
        return comprobantesFiltrados.reduce(
          (
            acumulado,
            comprobante
          ) => {
            const valor =
              Number(
                comprobante.valor
              ) || 0;

            acumulado.totalDocumentos +=
              1;

            if (
              comprobante.origen ===
              "Ingreso"
            ) {
              acumulado.cantidadIngresos +=
                1;

              acumulado.totalIngresos +=
                valor;
            }

            if (
              comprobante.origen ===
              "Egreso"
            ) {
              acumulado.cantidadEgresos +=
                1;

              acumulado.totalEgresos +=
                valor;
            }

            acumulado.balance =
              acumulado.totalIngresos -
              acumulado.totalEgresos;

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

            balance:
              0,
          }
        );
      },
      [
        comprobantesFiltrados,
      ]
    );

  /* =========================================================
     PAGINACIÓN
  ========================================================= */

  const totalPaginas =
    Math.max(
      1,
      Math.ceil(
        comprobantesFiltrados.length /
          REGISTROS_POR_PAGINA
      )
    );

  const indiceInicial =
    (
      paginaActual -
      1
    ) *
    REGISTROS_POR_PAGINA;

  const indiceFinal =
    indiceInicial +
    REGISTROS_POR_PAGINA;

  const comprobantesPaginados =
    comprobantesFiltrados.slice(
      indiceInicial,
      indiceFinal
    );

  useEffect(
    () => {
      if (
        paginaActual >
        totalPaginas
      ) {
        setPaginaActual(
          totalPaginas
        );
      }
    },
    [
      paginaActual,
      totalPaginas,
    ]
  );

  /* =========================================================
     LIMPIAR FILTROS
  ========================================================= */

  const limpiarFiltros =
    () => {
      setBusqueda(
        ""
      );

      setMovimiento(
        ""
      );

      setDesde(
        obtenerInicioMesActual()
      );

      setHasta(
        obtenerFechaLocal()
      );
    };

  /* =========================================================
     ABRIR DETALLE
  ========================================================= */

  const abrirDetalle = (
    comprobante
  ) => {
    setComprobanteSeleccionado(
      comprobante
    );

    setModalDetalleAbierto(
      true
    );
  };

  const cerrarDetalle =
    () => {
      setModalDetalleAbierto(
        false
      );

      setComprobanteSeleccionado(
        null
      );
    };

  /* =========================================================
     GENERAR HTML DE COMPROBANTE INDIVIDUAL
  ========================================================= */

  const generarHtmlComprobante =
    (
      comprobante
    ) => {
      const esIngreso =
        comprobante.origen ===
        "Ingreso";

      return `
        <section class="comprobante-documento">

          <header class="comprobante-documento-header">

            <div>
              <h1>
                LOTES VILLA MARÍA
              </h1>

              <p>
                ${
                  esIngreso
                    ? "RECIBO DE CAJA"
                    : "COMPROBANTE DE EGRESO"
                }
              </p>
            </div>

            <div class="comprobante-documento-codigo">
              <span>
                ${
                  esIngreso
                    ? "Ingreso"
                    : "Egreso"
                }
              </span>

              <strong>
                ${
                  comprobante.codigo ||
                  "—"
                }
              </strong>
            </div>

          </header>

          <div class="comprobante-documento-info">

            <div>
              <span>Fecha</span>

              <strong>
                ${formatearFecha(
                  comprobante.fecha
                )}
              </strong>
            </div>

            <div>
              <span>
                ${
                  esIngreso
                    ? "Recibido de"
                    : "Pagado a"
                }
              </span>

              <strong>
                ${
                  comprobante.terceroNombre ||
                  "—"
                }
              </strong>
            </div>

            <div>
              <span>Documento</span>

              <strong>
                ${
                  comprobante.terceroDocumento ||
                  "—"
                }
              </strong>
            </div>

            <div>
              <span>Forma de pago</span>

              <strong>
                ${
                  comprobante.formaPago ||
                  "—"
                }
              </strong>
            </div>

          </div>

          <div class="comprobante-documento-concepto">

            <span>
              Concepto
            </span>

            <strong>
              ${
                comprobante.concepto ||
                "—"
              }
            </strong>

          </div>

          <div class="comprobante-documento-valor">

            <span>
              Valor
            </span>

            <strong>
              ${formatearDinero(
                comprobante.valor
              )}
            </strong>

          </div>

          <div class="comprobante-documento-secundario">

            <div>
              <span>
                Referencia
              </span>

              <strong>
                ${
                  comprobante.referencia ||
                  "—"
                }
              </strong>
            </div>

            ${
              !esIngreso
                ? `
                  <div>
                    <span>
                      Movimiento
                    </span>

                    <strong>
                      ${
                        comprobante.tipoMovimiento ===
                        "Pago"
                          ? "Pago total"
                          : comprobante.tipoMovimiento ||
                            "—"
                      }
                    </strong>
                  </div>
                `
                : ""
            }

          </div>

          ${
            comprobante.observaciones
              ? `
                <div class="comprobante-documento-observaciones">

                  <span>
                    Observaciones
                  </span>

                  <p>
                    ${comprobante.observaciones}
                  </p>

                </div>
              `
              : ""
          }

          <footer class="comprobante-documento-footer">

            <div>
              <span>
                Entregado / recibido por
              </span>

              <div class="firma-linea"></div>
            </div>

            <div>
              <span>
                Elaborado por
              </span>

              <div class="firma-linea"></div>
            </div>

          </footer>

        </section>
      `;
    };

  /* =========================================================
     OBTENER ESTILOS DE LA APP
  ========================================================= */

  const obtenerEstilos =
    () => {
      return Array.from(
        document.head.querySelectorAll(
          'link[rel="stylesheet"], style'
        )
      )
        .map(
          (
            elemento
          ) => {
            if (
              elemento.tagName ===
              "LINK"
            ) {
              return `
                <link
                  rel="stylesheet"
                  href="${elemento.href}"
                />
              `;
            }

            return `
              <style>
                ${elemento.textContent}
              </style>
            `;
          }
        )
        .join(
          ""
        );
    };

  /* =========================================================
     IMPRIMIR INDIVIDUAL
  ========================================================= */

  const imprimirComprobante =
    (
      comprobante
    ) => {
      const ventana =
        window.open(
          "",
          "_blank",
          "width=950,height=820"
        );

      if (
        !ventana
      ) {
        mostrarNotificacion(
          "El navegador bloqueó la ventana de impresión.",
          "error"
        );

        return;
      }

      ventana.document.write(`
        <!DOCTYPE html>

        <html lang="es">

          <head>

            <meta charset="UTF-8" />

            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0"
            />

            <title>
              ${
                comprobante.codigo ||
                "Comprobante"
              }
            </title>

            ${obtenerEstilos()}

          </head>

          <body class="comprobantes-print-window">

            <div class="comprobantes-print-actions">

              <button
                type="button"
                onclick="window.close()"
              >
                Cerrar
              </button>

              <button
                type="button"
                class="principal"
                onclick="window.print()"
              >
                Imprimir
              </button>

            </div>

            <main class="comprobantes-print-contenedor">

              ${generarHtmlComprobante(
                comprobante
              )}

            </main>

          </body>

        </html>
      `);

      ventana.document.close();

      ventana.focus();
    };

  /* =========================================================
     IMPRIMIR REPORTE GENERAL
  ========================================================= */

  const imprimirReporte =
    () => {
      if (
        comprobantesFiltrados.length ===
        0
      ) {
        mostrarNotificacion(
          "No hay comprobantes para imprimir.",
          "error"
        );

        return;
      }

      const filas =
        comprobantesFiltrados
          .map(
            (
              comprobante
            ) => `
              <tr>

                <td>
                  ${
                    comprobante.codigo ||
                    "—"
                  }
                </td>

                <td>
                  ${formatearFecha(
                    comprobante.fecha
                  )}
                </td>

                <td>
                  ${
                    comprobante.origen ||
                    "—"
                  }
                </td>

                <td>
                  ${
                    comprobante.terceroNombre ||
                    "—"
                  }
                </td>

                <td>
                  ${
                    comprobante.concepto ||
                    "—"
                  }
                </td>

                <td>
                  ${
                    comprobante.formaPago ||
                    "—"
                  }
                </td>

                <td class="dinero">
                  ${formatearDinero(
                    comprobante.valor
                  )}
                </td>

              </tr>
            `
          )
          .join(
            ""
          );

      const ventana =
        window.open(
          "",
          "_blank",
          "width=1200,height=850"
        );

      if (
        !ventana
      ) {
        mostrarNotificacion(
          "El navegador bloqueó la ventana de impresión.",
          "error"
        );

        return;
      }

      ventana.document.write(`
        <!DOCTYPE html>

        <html lang="es">

          <head>

            <meta charset="UTF-8" />

            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0"
            />

            <title>
              Reporte de comprobantes
            </title>

            ${obtenerEstilos()}

          </head>

          <body class="comprobantes-print-window">

            <div class="comprobantes-print-actions">

              <button
                type="button"
                onclick="window.close()"
              >
                Cerrar
              </button>

              <button
                type="button"
                class="principal"
                onclick="window.print()"
              >
                Imprimir reporte
              </button>

            </div>

            <main class="comprobantes-reporte">

              <header class="comprobantes-reporte-header">

                <h1>
                  LOTES VILLA MARÍA
                </h1>

                <h2>
                  Reporte de comprobantes
                </h2>

                <div class="comprobantes-reporte-filtros">

                  <span>
                    Movimiento:
                    <strong>
                      ${
                        movimiento ||
                        "Todos"
                      }
                    </strong>
                  </span>

                  <span>
                    Desde:
                    <strong>
                      ${formatearFecha(
                        desde
                      )}
                    </strong>
                  </span>

                  <span>
                    Hasta:
                    <strong>
                      ${formatearFecha(
                        hasta
                      )}
                    </strong>
                  </span>

                  <span>
                    Documentos:
                    <strong>
                      ${
                        resumenFiltrado.totalDocumentos
                      }
                    </strong>
                  </span>

                </div>

              </header>

              <section class="comprobantes-reporte-resumen">

                <div>
                  <span>
                    Ingresos
                  </span>

                  <strong>
                    ${formatearDinero(
                      resumenFiltrado.totalIngresos
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Egresos
                  </span>

                  <strong>
                    ${formatearDinero(
                      resumenFiltrado.totalEgresos
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Balance
                  </span>

                  <strong>
                    ${formatearDinero(
                      resumenFiltrado.balance
                    )}
                  </strong>
                </div>

              </section>

              <table class="comprobantes-reporte-tabla">

                <thead>

                  <tr>
                    <th>Código</th>
                    <th>Fecha</th>
                    <th>Movimiento</th>
                    <th>Tercero</th>
                    <th>Concepto</th>
                    <th>Forma</th>
                    <th>Valor</th>
                  </tr>

                </thead>

                <tbody>
                  ${filas}
                </tbody>

              </table>

            </main>

          </body>

        </html>
      `);

      ventana.document.close();

      ventana.focus();
    };

  return (
    <section className="comprobantes-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="comprobantes-header">

        <div>

          <span className="comprobantes-kicker">
            Control financiero
          </span>

          <h1>
            Comprobantes
          </h1>

          <p>
            Consulta los ingresos recibidos y los egresos realizados por Lotes Villa María.
          </p>

        </div>

        <div className="comprobantes-header-actions">

          <button
            type="button"
            className="comprobantes-print-button"
            onClick={
              imprimirReporte
            }
          >
            <Printer
              size={18}
            />

            Imprimir reporte
          </button>

          <button
            type="button"
            className="comprobantes-refresh-button"
            onClick={
              cargarComprobantes
            }
            disabled={
              cargando
            }
          >
            <RefreshCw
              size={18}
              className={
                cargando
                  ? "comprobantes-spin"
                  : ""
              }
            />

            Actualizar
          </button>

        </div>

      </div>

      {/* =====================================================
          ESTADÍSTICAS
      ===================================================== */}

      <div className="comprobantes-stats">

        <article className="comprobantes-stat-card ingresos">

          <div className="comprobantes-stat-icon">
            <ArrowDownCircle
              size={22}
            />
          </div>

          <div>
            <span>
              Ingresos
            </span>

            <strong>
              {formatearDinero(
                resumenFiltrado.totalIngresos
              )}
            </strong>

            <small>
              {
                resumenFiltrado.cantidadIngresos
              }{" "}
              movimiento(s)
            </small>
          </div>

        </article>

        <article className="comprobantes-stat-card egresos">

          <div className="comprobantes-stat-icon">
            <ArrowUpCircle
              size={22}
            />
          </div>

          <div>
            <span>
              Egresos
            </span>

            <strong>
              {formatearDinero(
                resumenFiltrado.totalEgresos
              )}
            </strong>

            <small>
              {
                resumenFiltrado.cantidadEgresos
              }{" "}
              movimiento(s)
            </small>
          </div>

        </article>

        <article className="comprobantes-stat-card balance">

          <div className="comprobantes-stat-icon">
            <WalletCards
              size={22}
            />
          </div>

          <div>
            <span>
              Balance
            </span>

            <strong>
              {formatearDinero(
                resumenFiltrado.balance
              )}
            </strong>

            <small>
              Ingresos - egresos
            </small>
          </div>

        </article>

        <article className="comprobantes-stat-card documentos">

          <div className="comprobantes-stat-icon">
            <CalendarDays
              size={22}
            />
          </div>

          <div>
            <span>
              Documentos
            </span>

            <strong>
              {
                resumenFiltrado.totalDocumentos
              }
            </strong>

            <small>
              Comprobantes encontrados
            </small>
          </div>

        </article>

      </div>

      {/* =====================================================
          FILTROS
      ===================================================== */}

      <div className="comprobantes-filtros">

        <div className="comprobantes-search">

          <Search
            size={18}
          />

          <input
            type="text"
            value={
              busqueda
            }
            onChange={
              (
                e
              ) =>
                setBusqueda(
                  e.target.value
                )
            }
            placeholder="Buscar por código, persona, documento, concepto..."
          />

        </div>

        <div className="comprobantes-filter-field">

          <label>
            Movimiento
          </label>

          <select
            value={
              movimiento
            }
            onChange={
              (
                e
              ) =>
                setMovimiento(
                  e.target.value
                )
            }
          >
            <option value="">
              Todos
            </option>

            <option value="Ingreso">
              Ingresos
            </option>

            <option value="Egreso">
              Egresos
            </option>
          </select>

        </div>

        <div className="comprobantes-filter-field">

          <label>
            Desde
          </label>

          <input
            type="date"
            value={
              desde
            }
            onChange={
              (
                e
              ) =>
                setDesde(
                  e.target.value
                )
            }
          />

        </div>

        <div className="comprobantes-filter-field">

          <label>
            Hasta
          </label>

          <input
            type="date"
            value={
              hasta
            }
            onChange={
              (
                e
              ) =>
                setHasta(
                  e.target.value
                )
            }
          />

        </div>

        <button
          type="button"
          className="comprobantes-clear-button"
          onClick={
            limpiarFiltros
          }
        >
          Limpiar
        </button>

      </div>

      {/* =====================================================
          TABLA
      ===================================================== */}

      <div className="comprobantes-panel">

        {error && (
          <div className="comprobantes-error">

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={
                cargarComprobantes
              }
            >
              Reintentar
            </button>

          </div>
        )}

        <div className="comprobantes-table-wrapper">

          <table className="comprobantes-table">

            <thead>

              <tr>
                <th>
                  Código
                </th>

                <th>
                  Fecha
                </th>

                <th>
                  Movimiento
                </th>

                <th>
                  Documento
                </th>

                <th>
                  Tercero
                </th>

                <th>
                  Concepto
                </th>

                <th>
                  Forma de pago
                </th>

                <th>
                  Valor
                </th>

                <th className="comprobantes-actions-title">
                  Acciones
                </th>
              </tr>

            </thead>

            <tbody>

              {cargando ? (

                <tr>

                  <td
                    colSpan="9"
                    className="comprobantes-empty"
                  >
                    <RefreshCw
                      size={25}
                      className="comprobantes-spin"
                    />

                    <span>
                      Cargando comprobantes...
                    </span>
                  </td>

                </tr>

              ) : comprobantesPaginados.length ===
                0 ? (

                <tr>

                  <td
                    colSpan="9"
                    className="comprobantes-empty"
                  >
                    <WalletCards
                      size={34}
                    />

                    <strong>
                      No hay comprobantes
                    </strong>

                    <span>
                      No encontramos movimientos con los filtros seleccionados.
                    </span>
                  </td>

                </tr>

              ) : (

                comprobantesPaginados.map(
                  (
                    comprobante
                  ) => (

                    <tr
                      key={`${comprobante.origen}-${comprobante._id}`}
                    >

                      <td>

                        <strong className="comprobantes-codigo">
                          {
                            comprobante.codigo
                          }
                        </strong>

                      </td>

                      <td>
                        {formatearFecha(
                          comprobante.fecha
                        )}
                      </td>

                      <td>

                        <span
                          className={`comprobantes-movimiento ${comprobante.origen.toLowerCase()}`}
                        >
                          {comprobante.origen ===
                          "Ingreso" ? (
                            <ArrowDownCircle
                              size={14}
                            />
                          ) : (
                            <ArrowUpCircle
                              size={14}
                            />
                          )}

                          {
                            comprobante.origen
                          }
                        </span>

                      </td>

                      <td>

                        <span className="comprobantes-tipo-documento">
                          {
                            comprobante.tipoDocumento
                          }
                        </span>

                      </td>

                      <td>

                        <div className="comprobantes-tercero">

                          <strong>
                            {
                              comprobante.terceroNombre
                            }
                          </strong>

                          <span>
                            {
                              comprobante.terceroDocumento ||
                              "Sin documento"
                            }
                          </span>

                        </div>

                      </td>

                      <td>

                        <span className="comprobantes-concepto">
                          {
                            comprobante.concepto
                          }
                        </span>

                      </td>

                      <td>
                        {
                          comprobante.formaPago ||
                          "—"
                        }
                      </td>

                      <td>

                        <strong
                          className={`comprobantes-valor ${comprobante.origen.toLowerCase()}`}
                        >
                          {comprobante.origen ===
                          "Ingreso"
                            ? "+"
                            : "-"}

                          {formatearDinero(
                            comprobante.valor
                          )}
                        </strong>

                      </td>

                      <td>

                        <div className="comprobantes-actions">

                          <button
                            type="button"
                            className="view"
                            title="Ver detalle"
                            onClick={() =>
                              abrirDetalle(
                                comprobante
                              )
                            }
                          >
                            <Eye
                              size={16}
                            />
                          </button>

                          <button
                            type="button"
                            className="print"
                            title="Imprimir comprobante"
                            onClick={() =>
                              imprimirComprobante(
                                comprobante
                              )
                            }
                          >
                            <Printer
                              size={16}
                            />
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

        {/* ===================================================
            FOOTER / PAGINACIÓN
        =================================================== */}

        {!cargando && (

          <div className="comprobantes-table-footer">

            <div className="comprobantes-pagination-info">

              {comprobantesFiltrados.length ===
              0 ? (
                <span>
                  No hay registros
                </span>
              ) : (
                <span>
                  Mostrando{" "}
                  <strong>
                    {
                      indiceInicial +
                      1
                    }
                  </strong>{" "}
                  -{" "}
                  <strong>
                    {Math.min(
                      indiceFinal,
                      comprobantesFiltrados.length
                    )}
                  </strong>{" "}
                  de{" "}
                  <strong>
                    {
                      comprobantesFiltrados.length
                    }
                  </strong>{" "}
                  comprobantes
                </span>
              )}

            </div>

            <div className="comprobantes-pagination">

              <button
                type="button"
                onClick={() =>
                  setPaginaActual(
                    (
                      pagina
                    ) =>
                      Math.max(
                        pagina -
                          1,
                        1
                      )
                  )
                }
                disabled={
                  paginaActual ===
                  1
                }
              >
                Anterior
              </button>

              <span>
                Página{" "}
                <strong>
                  {
                    paginaActual
                  }
                </strong>{" "}
                de{" "}
                <strong>
                  {
                    totalPaginas
                  }
                </strong>
              </span>

              <button
                type="button"
                onClick={() =>
                  setPaginaActual(
                    (
                      pagina
                    ) =>
                      Math.min(
                        pagina +
                          1,
                        totalPaginas
                      )
                  )
                }
                disabled={
                  paginaActual ===
                  totalPaginas
                }
              >
                Siguiente
              </button>

            </div>

          </div>

        )}

      </div>

      {/* =====================================================
          MODAL DETALLE
      ===================================================== */}

      {modalDetalleAbierto &&
        comprobanteSeleccionado && (

        <div className="comprobantes-modal-backdrop">

          <div className="comprobantes-modal">

            <div className="comprobantes-modal-header">

              <div>

                <span>
                  {
                    comprobanteSeleccionado.codigo
                  }
                </span>

                <h2>
                  {
                    comprobanteSeleccionado.tipoDocumento
                  }
                </h2>

              </div>

              <button
                type="button"
                onClick={
                  cerrarDetalle
                }
              >
                <X
                  size={19}
                />
              </button>

            </div>

            <div className="comprobantes-modal-body">

              <div className="comprobantes-modal-movimiento">

                <span
                  className={`comprobantes-movimiento ${comprobanteSeleccionado.origen.toLowerCase()}`}
                >
                  {
                    comprobanteSeleccionado.origen
                  }
                </span>

                <strong>
                  {formatearDinero(
                    comprobanteSeleccionado.valor
                  )}
                </strong>

              </div>

              <div className="comprobantes-detalle-grid">

                <div>
                  <span>
                    Fecha
                  </span>

                  <strong>
                    {formatearFecha(
                      comprobanteSeleccionado.fecha
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Tercero
                  </span>

                  <strong>
                    {
                      comprobanteSeleccionado.terceroNombre
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Documento
                  </span>

                  <strong>
                    {
                      comprobanteSeleccionado.terceroDocumento ||
                      "—"
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Forma de pago
                  </span>

                  <strong>
                    {
                      comprobanteSeleccionado.formaPago ||
                      "—"
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Referencia
                  </span>

                  <strong>
                    {
                      comprobanteSeleccionado.referencia ||
                      "—"
                    }
                  </strong>
                </div>

                {comprobanteSeleccionado.origen ===
                  "Egreso" && (

                  <div>
                    <span>
                      Movimiento
                    </span>

                    <strong>
                      {comprobanteSeleccionado.tipoMovimiento ===
                      "Pago"
                        ? "Pago total"
                        : comprobanteSeleccionado.tipoMovimiento ||
                          "—"}
                    </strong>
                  </div>

                )}

              </div>

              <div className="comprobantes-detalle-concepto">

                <span>
                  Concepto
                </span>

                <p>
                  {
                    comprobanteSeleccionado.concepto ||
                    "—"
                  }
                </p>

              </div>

              {comprobanteSeleccionado.observaciones && (

                <div className="comprobantes-detalle-concepto">

                  <span>
                    Observaciones
                  </span>

                  <p>
                    {
                      comprobanteSeleccionado.observaciones
                    }
                  </p>

                </div>

              )}

            </div>

            <div className="comprobantes-modal-footer">

              <button
                type="button"
                className="cerrar"
                onClick={
                  cerrarDetalle
                }
              >
                Cerrar
              </button>

              <button
                type="button"
                className="imprimir"
                onClick={() =>
                  imprimirComprobante(
                    comprobanteSeleccionado
                  )
                }
              >
                <Printer
                  size={16}
                />

                Imprimir
              </button>

            </div>

          </div>

        </div>

      )}

      <Toast
        visible={
          notificacion.visible
        }
        mensaje={
          notificacion.mensaje
        }
        tipo={
          notificacion.tipo
        }
        onClose={
          cerrarNotificacion
        }
      />

    </section>
  );
}