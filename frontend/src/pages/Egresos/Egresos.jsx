import {
  BadgeDollarSign,
  CalendarDays,
  CircleDollarSign,
  Printer,
  Search,
  Tractor,
  WalletCards,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  obtenerEgresos,
} from "../../services/egreso.service";

import Toast from "../../components/ui/Toast";

import "./Egresos.css";

/* =========================================================
   FORMATEAR DINERO
========================================================= */

const formatearDinero =
  (
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
      Number(
        valor
      ) || 0
    );
  };

/* =========================================================
   FORMATEAR FECHA
========================================================= */

const formatearFecha =
  (
    fecha
  ) => {
    if (!fecha) {
      return "—";
    }

    const texto =
      String(
        fecha
      );

    if (
      /^\d{4}-\d{2}-\d{2}/.test(
        texto
      )
    ) {
      const [
        anio,
        mes,
        dia,
      ] =
        texto
          .slice(
            0,
            10
          )
          .split("-");

      return `${dia}/${mes}/${anio}`;
    }

    return "—";
  };

/* =========================================================
   ESCAPAR HTML
========================================================= */

const escaparHTML = (
  valor = ""
) => {
  return String(
    valor ?? ""
  )
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/* =========================================================
   COMPONENTE
========================================================= */

export default function Egresos() {

  /* =======================================================
     DATOS
  ======================================================= */

  const [
    egresos,
    setEgresos,
  ] = useState([]);

  const [
    resumen,
    setResumen,
  ] = useState({
    totalMovimientos: 0,
    totalEgresos: 0,
    totalComisiones: 0,
    totalMaquinaria: 0,
    totalOtros: 0,
  });

  const [
    cargando,
    setCargando,
  ] = useState(true);

  /* =======================================================
     FILTROS
  ======================================================= */

  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  const [
    tipo,
    setTipo,
  ] = useState("");

  const [
    tipoMovimiento,
    setTipoMovimiento,
  ] = useState("");

  const [
    desde,
    setDesde,
  ] = useState("");

  const [
    hasta,
    setHasta,
  ] = useState("");

  /* =======================================================
     TOAST
  ======================================================= */

  const [
    toast,
    setToast,
  ] = useState({
    visible: false,
    mensaje: "",
    tipo: "success",
  });

  const mostrarNotificacion =
    (
      mensaje,
      tipoToast = "success"
    ) => {
      setToast({
        visible: true,
        mensaje,
        tipo: tipoToast,
      });
    };

  /* =======================================================
     VENTANA DE IMPRESIÓN
  ======================================================= */

  const abrirVentanaImpresion =
    (
      titulo,
      contenido
    ) => {
      const ventana =
        window.open(
          "",
          "_blank",
          "width=1200,height=850"
        );

      if (!ventana) {
        mostrarNotificacion(
          "El navegador bloqueó la ventana de impresión.",
          "error"
        );

        return;
      }

      const rutaEstilos =
        `${window.location.origin}/styles/egresos-impresion.css`;

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
              ${escaparHTML(titulo)}
            </title>

            <link
              rel="stylesheet"
              href="${rutaEstilos}"
            />

          </head>

          <body>

            <div class="acciones">

              <button
                type="button"
                class="cerrar"
                onclick="window.close()"
              >
                Cerrar
              </button>

              <button
                type="button"
                class="imprimir"
                onclick="window.print()"
              >
                Imprimir
              </button>

            </div>

            <main class="reporte">
              ${contenido}
            </main>

          </body>

        </html>
      `);

      ventana.document.close();

      ventana.focus();
    };

  /* =======================================================
     IMPRIMIR REPORTE GENERAL
  ======================================================= */

  const imprimirGeneral =
    async () => {
      try {
        const datos =
          await obtenerEgresos(
            {}
          );

        const lista =
          Array.isArray(
            datos?.egresos
          )
            ? datos.egresos
            : [];

        if (
          lista.length ===
          0
        ) {
          mostrarNotificacion(
            "No hay egresos para imprimir.",
            "error"
          );

          return;
        }

        const total =
          lista.reduce(
            (
              acumulado,
              egreso
            ) =>
              acumulado +
              (
                Number(
                  egreso.valor
                ) || 0
              ),
            0
          );

        const filas =
          lista
            .map(
              (
                egreso
              ) => `
                <tr>

                  <td>
                    ${escaparHTML(
                      egreso.codigo ||
                      "—"
                    )}
                  </td>

                  <td>
                    ${escaparHTML(
                      formatearFecha(
                        egreso.fechaPago
                      )
                    )}
                  </td>

                  <td>
                    ${escaparHTML(
                      egreso.tipo ===
                      "Comision"
                        ? "Comisión"
                        : egreso.tipo ===
                          "HorasMaquinaria"
                        ? "Maquinaria"
                        : "Otro"
                    )}
                  </td>

                  <td>
                    ${escaparHTML(
                      egreso.tipoMovimiento ===
                      "Pago"
                        ? "Pago total"
                        : "Abono"
                    )}
                  </td>

                  <td class="nombre">
                    <strong>
                      ${escaparHTML(
                        egreso.beneficiarioNombre ||
                        "—"
                      )}
                    </strong>

                    <br />

                    <span>
                      ${escaparHTML(
                        egreso.beneficiarioDocumento ||
                        ""
                      )}
                    </span>
                  </td>

                  <td>
                    ${escaparHTML(
                      egreso.concepto ||
                      "—"
                    )}
                  </td>

                  <td>
                    ${escaparHTML(
                      egreso.formaPago ||
                      "—"
                    )}
                  </td>

                  <td>
                    ${escaparHTML(
                      egreso.referenciaPago ||
                      "—"
                    )}
                  </td>

                  <td class="dinero">
                    ${escaparHTML(
                      formatearDinero(
                        egreso.valor
                      )
                    )}
                  </td>

                </tr>
              `
            )
            .join("");

        const contenido = `
          <div class="reporte-header">

            <h1>
              LOTES VILLA MARÍA
            </h1>

            <h2>
              Reporte general de egresos
            </h2>

          </div>

          <div class="resumen-general">

            <div>
              <span>
                Movimientos
              </span>

              <strong>
                ${lista.length}
              </strong>
            </div>

            <div>
              <span>
                Total egresos
              </span>

              <strong>
                ${escaparHTML(
                  formatearDinero(
                    total
                  )
                )}
              </strong>
            </div>

            <div>
              <span>
                Comisiones
              </span>

              <strong>
                ${escaparHTML(
                  formatearDinero(
                    datos?.resumen
                      ?.totalComisiones
                  )
                )}
              </strong>
            </div>

            <div>
              <span>
                Maquinaria
              </span>

              <strong>
                ${escaparHTML(
                  formatearDinero(
                    datos?.resumen
                      ?.totalMaquinaria
                  )
                )}
              </strong>
            </div>

          </div>

          <table>

            <thead>

              <tr>
                <th>Egreso</th>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Movimiento</th>
                <th>Beneficiario</th>
                <th>Concepto</th>
                <th>Forma</th>
                <th>Referencia</th>
                <th>Valor</th>
              </tr>

            </thead>

            <tbody>
              ${filas}
            </tbody>

            <tfoot>

              <tr>

                <td colspan="8">
                  TOTAL EGRESOS
                </td>

                <td class="dinero">
                  ${escaparHTML(
                    formatearDinero(
                      total
                    )
                  )}
                </td>

              </tr>

            </tfoot>

          </table>
        `;

        abrirVentanaImpresion(
          "Reporte general de egresos",
          contenido
        );
      } catch (error) {
        console.error(
          "Error imprimiendo egresos:",
          error
        );

        mostrarNotificacion(
          "No fue posible generar el reporte de egresos.",
          "error"
        );
      }
    };

  /* =======================================================
     IMPRIMIR COMPROBANTE DE EGRESO
  ======================================================= */

  const imprimirEgreso =
    (
      egreso
    ) => {
      if (!egreso) {
        return;
      }

      const tipo =
        egreso.tipo ===
        "Comision"
          ? "Comisión"
          : egreso.tipo ===
            "HorasMaquinaria"
          ? "Maquinaria"
          : "Otro";

      const movimiento =
        egreso.tipoMovimiento ===
        "Pago"
          ? "Pago total"
          : "Abono";

      const contenido = `
        <div class="reporte-header">

          <h1>
            LOTES VILLA MARÍA
          </h1>

          <h2>
            Comprobante de egreso
          </h2>

        </div>

        <div class="comprobante-numero">

          <span>
            Comprobante
          </span>

          <strong>
            ${escaparHTML(
              egreso.codigo ||
              "—"
            )}
          </strong>

        </div>

        <div class="comprobante-grid">

          <div>
            <span>Fecha</span>

            <strong>
              ${escaparHTML(
                formatearFecha(
                  egreso.fechaPago
                )
              )}
            </strong>
          </div>

          <div>
            <span>Tipo</span>

            <strong>
              ${escaparHTML(
                tipo
              )}
            </strong>
          </div>

          <div>
            <span>Movimiento</span>

            <strong>
              ${escaparHTML(
                movimiento
              )}
            </strong>
          </div>

          <div>
            <span>Forma de pago</span>

            <strong>
              ${escaparHTML(
                egreso.formaPago ||
                "—"
              )}
            </strong>
          </div>

        </div>

        <div class="comprobante-seccion">

          <h3>
            Beneficiario
          </h3>

          <div class="comprobante-grid dos">

            <div>
              <span>Nombre</span>

              <strong>
                ${escaparHTML(
                  egreso.beneficiarioNombre ||
                  "—"
                )}
              </strong>
            </div>

            <div>
              <span>Documento</span>

              <strong>
                ${escaparHTML(
                  egreso.beneficiarioDocumento ||
                  "—"
                )}
              </strong>
            </div>

          </div>

        </div>

        <div class="comprobante-seccion">

          <h3>
            Detalle
          </h3>

          <div class="comprobante-detalle">

            <div>
              <span>
                Concepto
              </span>

              <strong>
                ${escaparHTML(
                  egreso.concepto ||
                  "—"
                )}
              </strong>
            </div>

            <div>
              <span>
                Referencia
              </span>

              <strong>
                ${escaparHTML(
                  egreso.referenciaPago ||
                  "—"
                )}
              </strong>
            </div>

            <div>
              <span>
                Observaciones
              </span>

              <strong>
                ${escaparHTML(
                  egreso.observaciones ||
                  "Sin observaciones"
                )}
              </strong>
            </div>

          </div>

        </div>

        <div class="comprobante-saldos">

          <div>

            <span>
              Saldo antes
            </span>

            <strong>
              ${escaparHTML(
                formatearDinero(
                  egreso.saldoAntes
                )
              )}
            </strong>

          </div>

          <div class="valor-principal">

            <span>
              Valor pagado
            </span>

            <strong>
              ${escaparHTML(
                formatearDinero(
                  egreso.valor
                )
              )}
            </strong>

          </div>

          <div>

            <span>
              Saldo después
            </span>

            <strong>
              ${escaparHTML(
                formatearDinero(
                  egreso.saldoDespues
                )
              )}
            </strong>

          </div>

        </div>

        <div class="firmas">

          <div>
            <span></span>
            <strong>
              Entregado por
            </strong>
          </div>

          <div>
            <span></span>
            <strong>
              Recibido por
            </strong>
          </div>

        </div>
      `;

      abrirVentanaImpresion(
        `Comprobante ${egreso.codigo}`,
        contenido
      );
    };

  /* =======================================================
     CARGAR EGRESOS
  ======================================================= */

  const cargarEgresos =
    useCallback(
      async () => {
        try {
          setCargando(
            true
          );

          const params =
            {};

          if (tipo) {
            params.tipo =
              tipo;
          }

          if (
            tipoMovimiento
          ) {
            params.tipoMovimiento =
              tipoMovimiento;
          }

          if (desde) {
            params.desde =
              desde;
          }

          if (hasta) {
            params.hasta =
              hasta;
          }

          const datos =
            await obtenerEgresos(
              params
            );

          setEgresos(
            Array.isArray(
              datos?.egresos
            )
              ? datos.egresos
              : []
          );

          setResumen({
            totalMovimientos:
              Number(
                datos?.resumen
                  ?.totalMovimientos
              ) || 0,

            totalEgresos:
              Number(
                datos?.resumen
                  ?.totalEgresos
              ) || 0,

            totalComisiones:
              Number(
                datos?.resumen
                  ?.totalComisiones
              ) || 0,

            totalMaquinaria:
              Number(
                datos?.resumen
                  ?.totalMaquinaria
              ) || 0,

            totalOtros:
              Number(
                datos?.resumen
                  ?.totalOtros
              ) || 0,
          });
        } catch (error) {
          console.error(
            "Error cargando egresos:",
            error
          );

          mostrarNotificacion(
            error?.response?.data
              ?.message ||
              "No fue posible cargar los egresos.",
            "error"
          );
        } finally {
          setCargando(
            false
          );
        }
      },
      [
        tipo,
        tipoMovimiento,
        desde,
        hasta,
      ]
    );

  useEffect(
    () => {
      cargarEgresos();
    },
    [
      cargarEgresos,
    ]
  );

  /* =======================================================
     FILTRO LOCAL DE BÚSQUEDA
  ======================================================= */

  const egresosFiltrados =
    useMemo(
      () => {
        const texto =
          busqueda
            .trim()
            .toLowerCase();

        if (!texto) {
          return egresos;
        }

        return egresos.filter(
          (
            egreso
          ) => {
            const contenido = [
              egreso.codigo,
              egreso.beneficiarioNombre,
              egreso.beneficiarioDocumento,
              egreso.concepto,
              egreso.formaPago,
              egreso.referenciaPago,
              egreso.tipo,
              egreso.tipoMovimiento,
              egreso.comision
                ?.codigo,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            return contenido.includes(
              texto
            );
          }
        );
      },
      [
        egresos,
        busqueda,
      ]
    );

  /* =======================================================
     LIMPIAR FILTROS
  ======================================================= */

  const limpiarFiltros =
    () => {
      setBusqueda("");
      setTipo("");
      setTipoMovimiento("");
      setDesde("");
      setHasta("");
    };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="egresos-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="egresos-header">

        <div>

          <span className="egresos-kicker">
            Tesorería
          </span>

          <h1>
            Egresos
          </h1>

          <p>
            Control de pagos y salidas de dinero de Villa María
          </p>

        </div>

        <div className="egresos-header-actions">

          <button
            type="button"
            className="egresos-refresh"
            onClick={
              cargarEgresos
            }
            disabled={
              cargando
            }
          >
            Actualizar
          </button>

          <button
            type="button"
            className="egresos-print"
            onClick={
              imprimirGeneral
            }
          >
            <Printer
              size={16}
            />

            Imprimir general
          </button>

        </div>

      </div>

      {/* =================================================
          ESTADÍSTICAS
      ================================================= */}

      <div className="egresos-stats">

        <div className="egresos-stat">

          <div className="egresos-stat-icon">
            <WalletCards
              size={20}
            />
          </div>

          <div>
            <span>
              Total egresos
            </span>

            <strong>
              {formatearDinero(
                resumen.totalEgresos
              )}
            </strong>

            <small>
              {
                resumen.totalMovimientos
              } movimientos
            </small>
          </div>

        </div>

        <div className="egresos-stat">

          <div className="egresos-stat-icon">
            <BadgeDollarSign
              size={20}
            />
          </div>

          <div>
            <span>
              Comisiones
            </span>

            <strong>
              {formatearDinero(
                resumen.totalComisiones
              )}
            </strong>

            <small>
              Pagos a vendedores
            </small>
          </div>

        </div>

        <div className="egresos-stat">

          <div className="egresos-stat-icon">
            <Tractor
              size={20}
            />
          </div>

          <div>
            <span>
              Maquinaria
            </span>

            <strong>
              {formatearDinero(
                resumen.totalMaquinaria
              )}
            </strong>

            <small>
              Horas y servicios
            </small>
          </div>

        </div>

        <div className="egresos-stat">

          <div className="egresos-stat-icon">
            <CircleDollarSign
              size={20}
            />
          </div>

          <div>
            <span>
              Otros gastos
            </span>

            <strong>
              {formatearDinero(
                resumen.totalOtros
              )}
            </strong>

            <small>
              Otros egresos
            </small>
          </div>

        </div>

      </div>

      {/* =================================================
          PANEL
      ================================================= */}

      <div className="egresos-panel">

        {/* ===============================================
            FILTROS
        =============================================== */}

        <div className="egresos-toolbar">

          <div className="egresos-search">

            <Search
              size={17}
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
              placeholder="Buscar egreso, beneficiario, documento, concepto..."
            />

          </div>

          <select
            value={
              tipo
            }
            onChange={
              (
                e
              ) =>
                setTipo(
                  e.target.value
                )
            }
          >
            <option value="">
              Todos los tipos
            </option>

            <option value="Comision">
              Comisiones
            </option>

            <option value="HorasMaquinaria">
              Maquinaria
            </option>

            <option value="Otro">
              Otros
            </option>
          </select>

          <select
            value={
              tipoMovimiento
            }
            onChange={
              (
                e
              ) =>
                setTipoMovimiento(
                  e.target.value
                )
            }
          >
            <option value="">
              Todos los movimientos
            </option>

            <option value="Abono">
              Abonos
            </option>

            <option value="Pago">
              Pagos
            </option>
          </select>

        </div>

        {/* ===============================================
            FECHAS
        =============================================== */}

        <div className="egresos-fechas">

          <div>

            <CalendarDays
              size={15}
            />

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

          <div>

            <CalendarDays
              size={15}
            />

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
            className="egresos-clear"
            onClick={
              limpiarFiltros
            }
          >
            Limpiar filtros
          </button>

        </div>

        {/* ===============================================
            TABLA
        =============================================== */}

        <div className="egresos-table-wrap">

          <table className="egresos-table">

            <thead>

              <tr>

                <th>
                  Egreso
                </th>

                <th>
                  Fecha
                </th>

                <th>
                  Tipo
                </th>

                <th>
                  Movimiento
                </th>

                <th>
                  Beneficiario
                </th>

                <th>
                  Concepto
                </th>

                <th>
                  Forma de pago
                </th>

                <th>
                  Referencia
                </th>

                <th>
                  Valor
                </th>

                <th>
                  Saldo después
                </th>

                <th>
                  Acciones
                </th>

              </tr>

            </thead>

            <tbody>

              {cargando ? (

                <tr>

                  <td
                    colSpan="11"
                    className="egresos-empty"
                  >
                    Cargando egresos...
                  </td>

                </tr>

              ) : egresosFiltrados.length ===
                0 ? (

                <tr>

                  <td
                    colSpan="11"
                    className="egresos-empty"
                  >
                    No hay egresos registrados.
                  </td>

                </tr>

              ) : (

                egresosFiltrados.map(
                  (
                    egreso
                  ) => (

                    <tr
                      key={
                        egreso._id
                      }
                    >

                      <td>
                        <span className="egresos-code">
                          {
                            egreso.codigo
                          }
                        </span>
                      </td>

                      <td>
                        {formatearFecha(
                          egreso.fechaPago
                        )}
                      </td>

                      <td>
                        <span
                          className={`egresos-type egresos-type-${String(
                            egreso.tipo
                          ).toLowerCase()}`}
                        >
                          {egreso.tipo ===
                          "Comision"
                            ? "Comisión"
                            : egreso.tipo ===
                              "HorasMaquinaria"
                            ? "Maquinaria"
                            : "Otro"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`egresos-movement ${
                            egreso.tipoMovimiento ===
                            "Pago"
                              ? "pago"
                              : "abono"
                          }`}
                        >
                          {egreso.tipoMovimiento ===
                          "Pago"
                            ? "Pago total"
                            : "Abono"}
                        </span>
                      </td>

                      <td className="egresos-beneficiary">

                        <strong>
                          {
                            egreso.beneficiarioNombre ||
                            "—"
                          }
                        </strong>

                        {egreso.beneficiarioDocumento && (
                          <span>
                            {
                              egreso.beneficiarioDocumento
                            }
                          </span>
                        )}

                      </td>

                      <td className="egresos-concept">
                        {
                          egreso.concepto ||
                          "—"
                        }
                      </td>

                      <td>
                        {
                          egreso.formaPago ||
                          "—"
                        }
                      </td>

                      <td>
                        {
                          egreso.referenciaPago ||
                          "—"
                        }
                      </td>

                      <td className="egresos-value">
                        {formatearDinero(
                          egreso.valor
                        )}
                      </td>

                      <td className="egresos-balance">
                        {formatearDinero(
                          egreso.saldoDespues
                        )}
                      </td>

                      <td>

                        <div className="egresos-actions">

                          <button
                            type="button"
                            className="egresos-print-one"
                            title="Imprimir comprobante"
                            onClick={() =>
                              imprimirEgreso(
                                egreso
                              )
                            }
                          >
                            <Printer
                              size={15}
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

        {/* ===============================================
            FOOTER
        =============================================== */}

        <div className="egresos-footer">

          <span>
            Mostrando{" "}
            <strong>
              {
                egresosFiltrados.length
              }
            </strong>{" "}
            de{" "}
            <strong>
              {
                egresos.length
              }
            </strong>{" "}
            movimientos
          </span>

          <strong>
            Total mostrado:{" "}
            {formatearDinero(
              egresosFiltrados.reduce(
                (
                  total,
                  egreso
                ) =>
                  total +
                  (
                    Number(
                      egreso.valor
                    ) || 0
                  ),
                0
              )
            )}
          </strong>

        </div>

      </div>

      <Toast
        visible={
          toast.visible
        }
        mensaje={
          toast.mensaje
        }
        tipo={
          toast.tipo
        }
        onClose={() =>
          setToast(
            (
              anterior
            ) => ({
              ...anterior,
              visible: false,
            })
          )
        }
      />

    </div>
  );
}