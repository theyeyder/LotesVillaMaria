import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Search,
  RefreshCw,
  WalletCards,
  CircleDollarSign,
  TriangleAlert,
  Users,
  Eye,
  Printer,
  X,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";

import Toast from "../../components/ui/Toast";

import {
  obtenerCartera,
} from "../../services/cartera.service";

import "./Cartera.css";

/* =========================================================
   DINERO
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
   FECHA
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
      timeZone: "UTC",
    }
  );
};

/* =========================================================
   COMPONENTE
========================================================= */

export default function Cartera({
  search = "",
}) {
  const [
    registros,
    setRegistros,
  ] = useState([]);

  const [
    resumenBackend,
    setResumenBackend,
  ] = useState({
    totalRegistros: 0,
    clientesConDeuda: 0,
    ventasConSaldo: 0,
    ventasVencidas: 0,
    ventasPagadas: 0,

    totalVentas: 0,
    totalPagado: 0,
    saldoPendiente: 0,
    valorVencido: 0,
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
    estado,
    setEstado,
  ] = useState("");

  const [
    desde,
    setDesde,
  ] = useState("");

  const [
    hasta,
    setHasta,
  ] = useState("");

  /* =========================================================
     DETALLE
  ========================================================= */

  const [
    registroSeleccionado,
    setRegistroSeleccionado,
  ] = useState(null);

  const [
    modalDetalleAbierto,
    setModalDetalleAbierto,
  ] = useState(false);

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
     TOAST
  ========================================================= */

  const [
    notificacion,
    setNotificacion,
  ] = useState({
    visible: false,
    mensaje: "",
    tipo: "success",
  });

  const mostrarNotificacion = (
    mensaje,
    tipo = "success"
  ) => {
    setNotificacion({
      visible: true,
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

          visible: false,
        })
      );
    };

  /* =========================================================
     CARGAR CARTERA

     Estado y fechas sí se envían al backend.

     La búsqueda se hace localmente para no hacer una petición
     por cada tecla.
  ========================================================= */

  const cargarCartera =
    async () => {
      try {
        setCargando(
          true
        );

        setError(
          ""
        );

        const datos =
          await obtenerCartera({
            estado,
            desde,
            hasta,
          });

        setRegistros(
          Array.isArray(
            datos?.cartera
          )
            ? datos.cartera
            : []
        );

        setResumenBackend({
          totalRegistros:
            Number(
              datos?.resumen
                ?.totalRegistros
            ) || 0,

          clientesConDeuda:
            Number(
              datos?.resumen
                ?.clientesConDeuda
            ) || 0,

          ventasConSaldo:
            Number(
              datos?.resumen
                ?.ventasConSaldo
            ) || 0,

          ventasVencidas:
            Number(
              datos?.resumen
                ?.ventasVencidas
            ) || 0,

          ventasPagadas:
            Number(
              datos?.resumen
                ?.ventasPagadas
            ) || 0,

          totalVentas:
            Number(
              datos?.resumen
                ?.totalVentas
            ) || 0,

          totalPagado:
            Number(
              datos?.resumen
                ?.totalPagado
            ) || 0,

          saldoPendiente:
            Number(
              datos?.resumen
                ?.saldoPendiente
            ) || 0,

          valorVencido:
            Number(
              datos?.resumen
                ?.valorVencido
            ) || 0,
        });
      } catch (error) {
        console.error(
          "Error cargando cartera:",
          error
        );

        const mensaje =
          error?.response
            ?.data
            ?.message ||
          "No fue posible cargar la cartera.";

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

  useEffect(
    () => {
      cargarCartera();
    },
    [
      estado,
      desde,
      hasta,
    ]
  );

  /* =========================================================
     BÚSQUEDA LOCAL
  ========================================================= */

  const registrosFiltrados =
    useMemo(
      () => {
        const texto =
          [
            search,
            busqueda,
          ]
            .filter(Boolean)
            .join(" ")
            .trim()
            .toLowerCase();

        if (!texto) {
          return registros;
        }

        return registros.filter(
          (
            registro
          ) => {
            const contenido = [
              registro.codigoVenta,

              registro.cliente
                ?.nombre,

              registro.cliente
                ?.documento,

              registro.cliente
                ?.telefono,

              registro.lote
                ?.codigo,

              registro.lote
                ?.numeroLote,

              registro.lote
                ?.manzana
                ?.codigo,

              registro.lote
                ?.manzana
                ?.nombre,

              registro.formaPago,

              registro.estadoCartera,
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
        registros,
        busqueda,
        search,
      ]
    );

  /* =========================================================
     RESUMEN FILTRADO

     Así las tarjetas también cambian cuando escribimos
     en el buscador.
  ========================================================= */

  const resumen =
    useMemo(
      () => {
        const acumulado =
          registrosFiltrados.reduce(
            (
              total,
              registro
            ) => {
              total.totalRegistros +=
                1;

              total.totalVentas +=
                Number(
                  registro.valorVenta
                ) || 0;

              total.totalPagado +=
                Number(
                  registro.totalPagado
                ) || 0;

              total.saldoPendiente +=
                Number(
                  registro.saldoPendiente
                ) || 0;

              total.valorVencido +=
                Number(
                  registro.valorVencido
                ) || 0;

              if (
                Number(
                  registro.saldoPendiente
                ) > 0
              ) {
                total.ventasConSaldo +=
                  1;
              }

              if (
                registro.estadoCartera ===
                "Vencida"
              ) {
                total.ventasVencidas +=
                  1;
              }

              if (
                registro.estadoCartera ===
                "Pagada"
              ) {
                total.ventasPagadas +=
                  1;
              }

              return total;
            },
            {
              totalRegistros: 0,
              ventasConSaldo: 0,
              ventasVencidas: 0,
              ventasPagadas: 0,

              totalVentas: 0,
              totalPagado: 0,
              saldoPendiente: 0,
              valorVencido: 0,
            }
          );

        const clientes =
          new Set(
            registrosFiltrados
              .filter(
                (
                  registro
                ) =>
                  Number(
                    registro.saldoPendiente
                  ) > 0
              )
              .map(
                (
                  registro
                ) =>
                  String(
                    registro.cliente
                      ?._id ||
                      registro.cliente
                        ?.documento ||
                      registro.cliente
                        ?.nombre
                  )
              )
          );

        acumulado.clientesConDeuda =
          clientes.size;

        return acumulado;
      },
      [
        registrosFiltrados,
      ]
    );

  /* =========================================================
     PAGINACIÓN
  ========================================================= */

  const totalPaginas =
    Math.max(
      1,
      Math.ceil(
        registrosFiltrados.length /
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

  const registrosPaginados =
    registrosFiltrados.slice(
      indiceInicial,
      indiceFinal
    );

  useEffect(
    () => {
      setPaginaActual(
        1
      );
    },
    [
      busqueda,
      search,
      estado,
      desde,
      hasta,
    ]
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
     LIMPIAR
  ========================================================= */

  const limpiarFiltros =
    () => {
      setBusqueda(
        ""
      );

      setEstado(
        ""
      );

      setDesde(
        ""
      );

      setHasta(
        ""
      );
    };

  /* =========================================================
     DETALLE
  ========================================================= */

  const abrirDetalle = (
    registro
  ) => {
    setRegistroSeleccionado(
      registro
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

      setRegistroSeleccionado(
        null
      );
    };

  /* =========================================================
     OBTENER ESTILOS
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
        .join("");
    };

  /* =========================================================
     IMPRIMIR REPORTE
  ========================================================= */

  const imprimirReporte =
    () => {
      if (
        registrosFiltrados.length ===
        0
      ) {
        mostrarNotificacion(
          "No hay registros de cartera para imprimir.",
          "error"
        );

        return;
      }

      const filas =
        registrosFiltrados
          .map(
            (
              registro
            ) => `
              <tr>

                <td>
                  ${registro.codigoVenta || "—"}
                </td>

                <td>
                  ${registro.cliente?.nombre || "—"}
                  <br />
                  <small>
                    ${registro.cliente?.documento || ""}
                  </small>
                </td>

                <td>
                  ${
                    registro.lote?.manzana?.codigo ||
                    registro.lote?.manzana?.nombre ||
                    "—"
                  }
                  -
                  ${registro.lote?.codigo || "—"}
                </td>

                <td>
                  ${formatearDinero(
                    registro.valorVenta
                  )}
                </td>

                <td>
                  ${formatearDinero(
                    registro.totalPagado
                  )}
                </td>

                <td>
                  ${formatearDinero(
                    registro.saldoPendiente
                  )}
                </td>

                <td>
                  ${registro.cuotasVencidas || 0}
                </td>

                <td>
                  ${formatearDinero(
                    registro.valorVencido
                  )}
                </td>

                <td>
                  ${
                    registro.proximoVencimiento
                      ? formatearFecha(
                          registro
                            .proximoVencimiento
                            .fechaVencimiento
                        )
                      : "—"
                  }
                </td>

                <td>
                  ${registro.estadoCartera || "—"}
                </td>

              </tr>
            `
          )
          .join("");

      const ventana =
        window.open(
          "",
          "_blank",
          "width=1250,height=850"
        );

      if (!ventana) {
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
              Reporte de cartera
            </title>

            ${obtenerEstilos()}

          </head>

          <body class="cartera-print-window">

            <div class="cartera-print-actions">

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

            <main class="cartera-reporte">

              <header class="cartera-reporte-header">

                <h1>
                  LOTES VILLA MARÍA
                </h1>

                <h2>
                  Reporte de cartera
                </h2>

                <div class="cartera-reporte-filtros">

                  <span>
                    Estado
                    <strong>
                      ${estado || "Todos"}
                    </strong>
                  </span>

                  <span>
                    Desde
                    <strong>
                      ${desde ? formatearFecha(desde) : "Todas"}
                    </strong>
                  </span>

                  <span>
                    Hasta
                    <strong>
                      ${hasta ? formatearFecha(hasta) : "Todas"}
                    </strong>
                  </span>

                  <span>
                    Registros
                    <strong>
                      ${resumen.totalRegistros}
                    </strong>
                  </span>

                </div>

              </header>

              <section class="cartera-reporte-resumen">

                <div>
                  <span>
                    Total vendido
                  </span>

                  <strong>
                    ${formatearDinero(
                      resumen.totalVentas
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Total pagado
                  </span>

                  <strong>
                    ${formatearDinero(
                      resumen.totalPagado
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Saldo pendiente
                  </span>

                  <strong>
                    ${formatearDinero(
                      resumen.saldoPendiente
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Valor vencido
                  </span>

                  <strong>
                    ${formatearDinero(
                      resumen.valorVencido
                    )}
                  </strong>
                </div>

              </section>

              <table class="cartera-reporte-tabla">

                <thead>

                  <tr>
                    <th>Venta</th>
                    <th>Cliente</th>
                    <th>Lote</th>
                    <th>Valor venta</th>
                    <th>Pagado</th>
                    <th>Saldo</th>
                    <th>Cuotas vencidas</th>
                    <th>Valor vencido</th>
                    <th>Próximo vencimiento</th>
                    <th>Estado</th>
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
    <section className="cartera-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="cartera-header">

        <div>

          <span className="cartera-kicker">
            Cuentas por cobrar
          </span>

          <h1>
            Cartera
          </h1>

          <p>
            Controla los saldos pendientes, cuotas vencidas y próximos vencimientos de los clientes.
          </p>

        </div>

        <div className="cartera-header-actions">

          <button
            type="button"
            className="cartera-print-button"
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
            className="cartera-refresh-button"
            onClick={
              cargarCartera
            }
            disabled={
              cargando
            }
          >
            <RefreshCw
              size={18}
              className={
                cargando
                  ? "cartera-spin"
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

      <div className="cartera-stats">

        <article className="cartera-stat-card">

          <div className="cartera-stat-icon ventas">
            <WalletCards
              size={22}
            />
          </div>

          <div>
            <span>
              Total vendido
            </span>

            <strong>
              {formatearDinero(
                resumen.totalVentas
              )}
            </strong>

            <small>
              {resumen.totalRegistros} venta(s)
            </small>
          </div>

        </article>

        <article className="cartera-stat-card">

          <div className="cartera-stat-icon pagado">
            <CheckCircle2
              size={22}
            />
          </div>

          <div>
            <span>
              Total pagado
            </span>

            <strong>
              {formatearDinero(
                resumen.totalPagado
              )}
            </strong>

            <small>
              Dinero recibido
            </small>
          </div>

        </article>

        <article className="cartera-stat-card">

          <div className="cartera-stat-icon saldo">
            <CircleDollarSign
              size={22}
            />
          </div>

          <div>
            <span>
              Saldo pendiente
            </span>

            <strong>
              {formatearDinero(
                resumen.saldoPendiente
              )}
            </strong>

            <small>
              {resumen.ventasConSaldo} venta(s) con saldo
            </small>
          </div>

        </article>

        <article className="cartera-stat-card">

          <div className="cartera-stat-icon vencido">
            <TriangleAlert
              size={22}
            />
          </div>

          <div>
            <span>
              Valor vencido
            </span>

            <strong>
              {formatearDinero(
                resumen.valorVencido
              )}
            </strong>

            <small>
              {resumen.ventasVencidas} venta(s) vencida(s)
            </small>
          </div>

        </article>

        <article className="cartera-stat-card">

          <div className="cartera-stat-icon clientes">
            <Users
              size={22}
            />
          </div>

          <div>
            <span>
              Clientes con deuda
            </span>

            <strong>
              {resumen.clientesConDeuda || 0}
            </strong>

            <small>
              Clientes con saldo pendiente
            </small>
          </div>

        </article>

      </div>

      {/* =====================================================
          FILTROS
      ===================================================== */}

      <div className="cartera-filtros">

        <div className="cartera-search">

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
            placeholder="Buscar cliente, documento, venta, manzana o lote..."
          />

        </div>

        <div className="cartera-filter-field">

          <label>
            Estado
          </label>

          <select
            value={
              estado
            }
            onChange={
              (
                e
              ) =>
                setEstado(
                  e.target.value
                )
            }
          >
            <option value="">
              Todos
            </option>

            <option value="Pendiente">
              Pendiente
            </option>

            <option value="Vencida">
              Vencida
            </option>

            <option value="Pagada">
              Pagada
            </option>
          </select>

        </div>

        <div className="cartera-filter-field">

          <label>
            Venta desde
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

        <div className="cartera-filter-field">

          <label>
            Venta hasta
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
          className="cartera-clear-button"
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

      <div className="cartera-panel">

        {error && (

          <div className="cartera-error">

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={
                cargarCartera
              }
            >
              Reintentar
            </button>

          </div>

        )}

        <div className="cartera-table-wrapper">

          <table className="cartera-table">

            <thead>

              <tr>

                <th>
                  Venta
                </th>

                <th>
                  Cliente
                </th>

                <th>
                  Lote
                </th>

                <th>
                  Valor venta
                </th>

                <th>
                  Pagado
                </th>

                <th>
                  Saldo
                </th>

                <th>
                  Vencidas
                </th>

                <th>
                  Valor vencido
                </th>

                <th>
                  Próximo vencimiento
                </th>

                <th>
                  Estado
                </th>

                <th className="cartera-actions-title">
                  Acciones
                </th>

              </tr>

            </thead>

            <tbody>

              {cargando ? (

                <tr>

                  <td
                    colSpan="11"
                    className="cartera-empty"
                  >

                    <RefreshCw
                      size={25}
                      className="cartera-spin"
                    />

                    <span>
                      Cargando cartera...
                    </span>

                  </td>

                </tr>

              ) : registrosPaginados.length ===
                0 ? (

                <tr>

                  <td
                    colSpan="11"
                    className="cartera-empty"
                  >

                    <WalletCards
                      size={34}
                    />

                    <strong>
                      No hay registros
                    </strong>

                    <span>
                      No encontramos cartera con los filtros seleccionados.
                    </span>

                  </td>

                </tr>

              ) : (

                registrosPaginados.map(
                  (
                    registro
                  ) => (

                    <tr
                      key={
                        registro._id
                      }
                    >

                      {/* VENTA */}

                      <td>

                        <div className="cartera-venta">

                          <strong>
                            {
                              registro.codigoVenta
                            }
                          </strong>

                          <span>
                            {formatearFecha(
                              registro.fechaVenta
                            )}
                          </span>

                        </div>

                      </td>

                      {/* CLIENTE */}

                      <td>

                        <div className="cartera-cliente">

                          <strong>
                            {
                              registro.cliente
                                ?.nombre
                            }
                          </strong>

                          <span>
                            {
                              registro.cliente
                                ?.documento ||
                              "Sin documento"
                            }
                          </span>

                        </div>

                      </td>

                      {/* LOTE */}

                      <td>

                        <div className="cartera-lote">

                          <strong>
                            {
                              registro.lote
                                ?.manzana
                                ?.codigo ||
                              registro.lote
                                ?.manzana
                                ?.nombre ||
                              "—"
                            }
                          </strong>

                          <span>
                            Lote{" "}
                            {
                              registro.lote
                                ?.codigo ||
                              "—"
                            }
                          </span>

                        </div>

                      </td>

                      {/* VALOR */}

                      <td>

                        <strong className="cartera-money">
                          {formatearDinero(
                            registro.valorVenta
                          )}
                        </strong>

                      </td>

                      {/* PAGADO */}

                      <td>

                        <strong className="cartera-money pagado">
                          {formatearDinero(
                            registro.totalPagado
                          )}
                        </strong>

                      </td>

                      {/* SALDO */}

                      <td>

                        <strong className="cartera-money saldo">
                          {formatearDinero(
                            registro.saldoPendiente
                          )}
                        </strong>

                      </td>

                      {/* CUOTAS VENCIDAS */}

                      <td>

                        {Number(
                          registro.cuotasVencidas
                        ) > 0 ? (

                          <span className="cartera-vencidas-badge">
                            {
                              registro.cuotasVencidas
                            }
                          </span>

                        ) : (

                          <span className="cartera-muted">
                            0
                          </span>

                        )}

                      </td>

                      {/* VALOR VENCIDO */}

                      <td>

                        {Number(
                          registro.valorVencido
                        ) > 0 ? (

                          <strong className="cartera-money vencido">
                            {formatearDinero(
                              registro.valorVencido
                            )}
                          </strong>

                        ) : (

                          <span className="cartera-muted">
                            —
                          </span>

                        )}

                      </td>

                      {/* PRÓXIMO VENCIMIENTO */}

                      <td>

                        {registro.proximoVencimiento ? (

                          <div className="cartera-proximo">

                            <CalendarDays
                              size={14}
                            />

                            <div>

                              <strong>
                                {formatearFecha(
                                  registro
                                    .proximoVencimiento
                                    .fechaVencimiento
                                )}
                              </strong>

                              <span>
                                {formatearDinero(
                                  registro
                                    .proximoVencimiento
                                    .saldoPendiente
                                )}
                              </span>

                            </div>

                          </div>

                        ) : (

                          <span className="cartera-muted">
                            —
                          </span>

                        )}

                      </td>

                      {/* ESTADO */}

                      <td>

                        <span
                          className={`cartera-estado ${String(
                            registro.estadoCartera ||
                              ""
                          ).toLowerCase()}`}
                        >
                          {
                            registro.estadoCartera
                          }
                        </span>

                      </td>

                      {/* ACCIONES */}

                      <td>

                        <div className="cartera-actions">

                          <button
                            type="button"
                            title="Ver detalle"
                            onClick={() =>
                              abrirDetalle(
                                registro
                              )
                            }
                          >
                            <Eye
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
            PAGINACIÓN
        =================================================== */}

        {!cargando && (

          <div className="cartera-table-footer">

            <div className="cartera-pagination-info">

              {registrosFiltrados.length ===
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
                      registrosFiltrados.length
                    )}
                  </strong>{" "}
                  de{" "}
                  <strong>
                    {
                      registrosFiltrados.length
                    }
                  </strong>{" "}
                  registros
                </span>

              )}

            </div>

            <div className="cartera-pagination">

              <button
                type="button"
                onClick={() =>
                  setPaginaActual(
                    (
                      pagina
                    ) =>
                      Math.max(
                        1,
                        pagina -
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
                        totalPaginas,
                        pagina +
                          1
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
        registroSeleccionado && (

        <div className="cartera-modal-backdrop">

          <div className="cartera-modal">

            <div className="cartera-modal-header">

              <div>

                <span>
                  {
                    registroSeleccionado.codigoVenta
                  }
                </span>

                <h2>
                  Detalle de cartera
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

            <div className="cartera-modal-body">

              {/* ESTADO */}

              <div className="cartera-modal-status">

                <span
                  className={`cartera-estado ${String(
                    registroSeleccionado.estadoCartera
                  ).toLowerCase()}`}
                >
                  {
                    registroSeleccionado.estadoCartera
                  }
                </span>

                <strong>
                  {formatearDinero(
                    registroSeleccionado.saldoPendiente
                  )}
                </strong>

              </div>

              {/* CLIENTE */}

              <div className="cartera-modal-section">

                <h3>
                  Cliente
                </h3>

                <div className="cartera-detail-grid">

                  <div>
                    <span>
                      Nombre
                    </span>

                    <strong>
                      {
                        registroSeleccionado.cliente
                          ?.nombre
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Documento
                    </span>

                    <strong>
                      {
                        registroSeleccionado.cliente
                          ?.documento ||
                        "—"
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Teléfono
                    </span>

                    <strong>
                      {
                        registroSeleccionado.cliente
                          ?.telefono ||
                        "—"
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Correo
                    </span>

                    <strong>
                      {
                        registroSeleccionado.cliente
                          ?.correo ||
                        "—"
                      }
                    </strong>
                  </div>

                </div>

              </div>

              {/* VENTA */}

              <div className="cartera-modal-section">

                <h3>
                  Venta
                </h3>

                <div className="cartera-detail-grid">

                  <div>
                    <span>
                      Código
                    </span>

                    <strong>
                      {
                        registroSeleccionado.codigoVenta
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Fecha
                    </span>

                    <strong>
                      {formatearFecha(
                        registroSeleccionado.fechaVenta
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Forma de pago
                    </span>

                    <strong>
                      {
                        registroSeleccionado.formaPago
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Estado venta
                    </span>

                    <strong>
                      {
                        registroSeleccionado.estadoVenta
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Manzana
                    </span>

                    <strong>
                      {
                        registroSeleccionado.lote
                          ?.manzana
                          ?.codigo ||
                        registroSeleccionado.lote
                          ?.manzana
                          ?.nombre ||
                        "—"
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Lote
                    </span>

                    <strong>
                      {
                        registroSeleccionado.lote
                          ?.codigo ||
                        "—"
                      }
                    </strong>
                  </div>

                </div>

              </div>

              {/* FINANCIERO */}

              <div className="cartera-modal-section">

                <h3>
                  Estado financiero
                </h3>

                <div className="cartera-finance-grid">

                  <div>
                    <span>
                      Valor venta
                    </span>

                    <strong>
                      {formatearDinero(
                        registroSeleccionado.valorVenta
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Cuota inicial
                    </span>

                    <strong>
                      {formatearDinero(
                        registroSeleccionado.cuotaInicial
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Total pagado
                    </span>

                    <strong className="pagado">
                      {formatearDinero(
                        registroSeleccionado.totalPagado
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Saldo pendiente
                    </span>

                    <strong className="saldo">
                      {formatearDinero(
                        registroSeleccionado.saldoPendiente
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Cuotas pendientes
                    </span>

                    <strong>
                      {
                        registroSeleccionado.cuotasPendientes
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Cuotas vencidas
                    </span>

                    <strong className="vencido">
                      {
                        registroSeleccionado.cuotasVencidas
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Valor vencido
                    </span>

                    <strong className="vencido">
                      {formatearDinero(
                        registroSeleccionado.valorVencido
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Progreso pagado
                    </span>

                    <strong>
                      {Math.round(
                        Number(
                          registroSeleccionado.porcentajePagado
                        ) || 0
                      )}
                      %
                    </strong>
                  </div>

                </div>

              </div>

              {/* PRÓXIMO VENCIMIENTO */}

              <div className="cartera-modal-section">

                <h3>
                  Próximo vencimiento
                </h3>

                {registroSeleccionado.proximoVencimiento ? (

                  <div className="cartera-proximo-detalle">

                    <CalendarDays
                      size={21}
                    />

                    <div>

                      <span>
                        {
                          registroSeleccionado
                            .proximoVencimiento
                            .codigo ||
                          `Cuota ${registroSeleccionado.proximoVencimiento.numeroCuota}`
                        }
                      </span>

                      <strong>
                        {formatearFecha(
                          registroSeleccionado
                            .proximoVencimiento
                            .fechaVencimiento
                        )}
                      </strong>

                      <small>
                        Saldo:{" "}
                        {formatearDinero(
                          registroSeleccionado
                            .proximoVencimiento
                            .saldoPendiente
                        )}
                      </small>

                    </div>

                  </div>

                ) : (

                  <div className="cartera-sin-vencimiento">
                    No tiene próximos vencimientos pendientes.
                  </div>

                )}

              </div>

            </div>

            <div className="cartera-modal-footer">

              <button
                type="button"
                onClick={
                  cerrarDetalle
                }
              >
                Cerrar
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