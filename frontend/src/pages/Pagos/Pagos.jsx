import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  CreditCard,
  Eye,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";

import "./Pagos.css";

import Toast from "../../components/ui/Toast";
import PagoModal from "./PagoModal";

import {
  obtenerPagos,
  obtenerResumenPagos,
  eliminarPago,
} from "../../services/pago.service";

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
   NOMBRE CLIENTE
========================================================= */

const obtenerNombreCliente = (
  cliente
) => {
  if (!cliente) {
    return "Sin cliente";
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

/* =========================================================
   RESUMEN INICIAL

   Ya NO existe:
   - anulados
========================================================= */

const resumenInicial = {
  totalPagos: 0,
  totalRecibido: 0,

  efectivo: 0,
  transferencia: 0,
  consignacion: 0,
  pse: 0,
  otro: 0,
};

/* =========================================================
   COMPONENTE
========================================================= */

export default function Pagos() {
  /* =======================================================
     DATOS
  ======================================================= */

  const [
    pagos,
    setPagos,
  ] = useState([]);

  const [
    resumen,
    setResumen,
  ] = useState(
    resumenInicial
  );

  /* =======================================================
     CARGA
  ======================================================= */

  const [
    cargando,
    setCargando,
  ] = useState(true);

  /* =======================================================
     MODAL NUEVO PAGO
  ======================================================= */

  const [
    modalPagoAbierto,
    setModalPagoAbierto,
  ] = useState(false);

  /* =======================================================
     DETALLE
  ======================================================= */

  const [
    pagoDetalle,
    setPagoDetalle,
  ] = useState(null);

  /* =======================================================
     ELIMINAR PAGO
  ======================================================= */

  const [
    pagoParaEliminar,
    setPagoParaEliminar,
  ] = useState(null);

  const [
    eliminandoPago,
    setEliminandoPago,
  ] = useState(false);

  /* =======================================================
     FILTROS
  ======================================================= */

  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  const [
    filtroMetodo,
    setFiltroMetodo,
  ] = useState("");

  const [
    fechaInicio,
    setFechaInicio,
  ] = useState("");

  const [
    fechaFinal,
    setFechaFinal,
  ] = useState("");

  /* =======================================================
     PAGINACIÓN
  ======================================================= */

  const [
    paginaActual,
    setPaginaActual,
  ] = useState(1);

  const PAGOS_POR_PAGINA =
    10;

  /* =======================================================
     TOAST
  ======================================================= */

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
        (prev) => ({
          ...prev,

          visible:
            false,
        })
      );
    };

  /* =======================================================
     CARGAR PAGOS
  ======================================================= */

  const cargarPagos =
    async () => {
      try {
        const datos =
          await obtenerPagos();

        const lista =
          Array.isArray(
            datos
          )
            ? datos
            : [];

        setPagos(
          lista
        );

        return lista;
      } catch (error) {
        console.error(
          "Error cargando pagos:",
          error
        );

        mostrarNotificacion(
          error?.response?.data
            ?.message ||
            "No fue posible cargar los pagos.",
          "error"
        );

        return [];
      }
    };

  /* =======================================================
     CARGAR RESUMEN
  ======================================================= */

  const cargarResumen =
    async () => {
      try {
        const datos =
          await obtenerResumenPagos();

        setResumen({
          ...resumenInicial,

          ...(datos || {}),
        });
      } catch (error) {
        console.error(
          "Error cargando resumen:",
          error
        );

        mostrarNotificacion(
          error?.response?.data
            ?.message ||
            "No fue posible cargar el resumen de pagos.",
          "error"
        );
      }
    };

  /* =======================================================
     CARGAR TODO
  ======================================================= */

  const cargarTodo =
    async () => {
      try {
        setCargando(
          true
        );

        await Promise.all([
          cargarPagos(),
          cargarResumen(),
        ]);
      } finally {
        setCargando(
          false
        );
      }
    };

  useEffect(() => {
    cargarTodo();
  }, []);

  /* =======================================================
     FILTRAR PAGOS

     Ya NO filtramos por estado porque todos los pagos
     que existen son pagos válidos.
  ======================================================= */

  const pagosFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      return pagos.filter(
        (pago) => {
          const cliente =
            pago.cliente;

          const venta =
            pago.venta;

          const lote =
            venta?.lote;

          const manzana =
            lote?.manzana;

          /* =====================
             MÉTODO
          ===================== */

          if (
            filtroMetodo &&
            pago.metodoPago !==
              filtroMetodo
          ) {
            return false;
          }

          /* =====================
             FECHA DESDE
          ===================== */

          if (
            fechaInicio
          ) {
            const fechaPago =
              new Date(
                pago.fechaPago
              );

            const inicio =
              new Date(
                `${fechaInicio}T00:00:00Z`
              );

            if (
              fechaPago <
              inicio
            ) {
              return false;
            }
          }

          /* =====================
             FECHA HASTA
          ===================== */

          if (
            fechaFinal
          ) {
            const fechaPago =
              new Date(
                pago.fechaPago
              );

            const final =
              new Date(
                `${fechaFinal}T23:59:59Z`
              );

            if (
              fechaPago >
              final
            ) {
              return false;
            }
          }

          /* =====================
             BÚSQUEDA
          ===================== */

          if (!texto) {
            return true;
          }

          const contenido = [
            pago.codigo,

            obtenerNombreCliente(
              cliente
            ),

            cliente?.documento,

            venta?.codigo,

            lote?.codigo,

            manzana?.codigo,

            manzana?.nombre,

            pago.metodoPago,

            pago.referencia,
          ]
            .filter(
              (dato) =>
                dato !==
                  undefined &&
                dato !==
                  null
            )
            .join(" ")
            .toLowerCase();

          return contenido.includes(
            texto
          );
        }
      );
    }, [
      pagos,
      busqueda,
      filtroMetodo,
      fechaInicio,
      fechaFinal,
    ]);

  /* =======================================================
     PAGINACIÓN
  ======================================================= */

  const totalPaginas =
    Math.max(
      1,
      Math.ceil(
        pagosFiltrados.length /
          PAGOS_POR_PAGINA
      )
    );

  const indiceInicial =
    (
      paginaActual -
      1
    ) *
    PAGOS_POR_PAGINA;

  const pagosPaginados =
    pagosFiltrados.slice(
      indiceInicial,
      indiceInicial +
        PAGOS_POR_PAGINA
    );

  useEffect(() => {
    setPaginaActual(
      1
    );
  }, [
    busqueda,
    filtroMetodo,
    fechaInicio,
    fechaFinal,
  ]);

  useEffect(() => {
    if (
      paginaActual >
      totalPaginas
    ) {
      setPaginaActual(
        totalPaginas
      );
    }
  }, [
    paginaActual,
    totalPaginas,
  ]);

  /* =======================================================
     LIMPIAR FILTROS
  ======================================================= */

  const limpiarFiltros =
    () => {
      setBusqueda(
        ""
      );

      setFiltroMetodo(
        ""
      );

      setFechaInicio(
        ""
      );

      setFechaFinal(
        ""
      );

      setPaginaActual(
        1
      );
    };

  /* =======================================================
     PAGO GUARDADO
  ======================================================= */

  const handlePagoGuardado =
    async (
      respuesta
    ) => {
      await cargarTodo();

      mostrarNotificacion(
        respuesta?.message ||
          "Pago registrado correctamente."
      );
    };

  /* =======================================================
     DETALLE
  ======================================================= */

  const abrirDetalle =
    (pago) => {
      setPagoDetalle(
        pago
      );
    };

  const cerrarDetalle =
    () => {
      setPagoDetalle(
        null
      );
    };

  /* =======================================================
     ABRIR ELIMINACIÓN
  ======================================================= */

  const abrirEliminarPago =
    (pago) => {
      setPagoParaEliminar(
        pago
      );
    };

  /* =======================================================
     CERRAR ELIMINACIÓN
  ======================================================= */

  const cerrarEliminarPago =
    () => {
      if (
        eliminandoPago
      ) {
        return;
      }

      setPagoParaEliminar(
        null
      );
    };

  /* =======================================================
     ELIMINAR PAGO

     El backend:
     - elimina el pago definitivamente
     - recalcula cuotas
     - devuelve el dinero al saldo pendiente
     - recalcula la venta
  ======================================================= */

  const confirmarEliminarPago =
    async () => {
      if (
        !pagoParaEliminar?._id
      ) {
        return;
      }

      try {
        setEliminandoPago(
          true
        );

        const respuesta =
          await eliminarPago(
            pagoParaEliminar._id
          );

        setPagoParaEliminar(
          null
        );

        setPagoDetalle(
          null
        );

        await cargarTodo();

        mostrarNotificacion(
          respuesta?.message ||
            "Pago eliminado correctamente.",
          "success"
        );
      } catch (error) {
        console.error(
          "Error eliminando pago:",
          error
        );

        mostrarNotificacion(
          error?.response?.data
            ?.message ||
            "No fue posible eliminar el pago.",
          "error"
        );
      } finally {
        setEliminandoPago(
          false
        );
      }
    };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <section className="pagos-page">

      {/* =================================================
          ENCABEZADO
      ================================================= */}

      <div className="pagos-header">

        <div>
          <span className="pagos-kicker">
            Cartera
          </span>

          <h1>
            Pagos
          </h1>

          <p>
            Registra abonos de clientes,
            consulta el historial y controla
            el dinero recibido por las ventas
            financiadas.
          </p>
        </div>

        <div className="pagos-header-actions">

          <button
            type="button"
            className="pagos-refresh-button"
            onClick={
              cargarTodo
            }
            disabled={
              cargando
            }
          >
            <RefreshCw
              size={17}
              className={
                cargando
                  ? "pagos-spin"
                  : ""
              }
            />

            Actualizar
          </button>

          <button
            type="button"
            className="pagos-new-button"
            onClick={() =>
              setModalPagoAbierto(
                true
              )
            }
          >
            <Plus
              size={18}
            />

            Nuevo pago
          </button>

        </div>
      </div>

      {/* =================================================
          ESTADÍSTICAS
      ================================================= */}

      <div className="pagos-stats">

        <article className="pagos-stat">
          <div className="pagos-stat-icon">
            <ReceiptText
              size={20}
            />
          </div>

          <div>
            <span>
              Total pagos
            </span>

            <strong>
              {
                resumen.totalPagos
              }
            </strong>
          </div>
        </article>

        <article className="pagos-stat recibido">
          <div className="pagos-stat-icon">
            <WalletCards
              size={20}
            />
          </div>

          <div>
            <span>
              Total recibido
            </span>

            <strong>
              {formatearDinero(
                resumen.totalRecibido
              )}
            </strong>
          </div>
        </article>

        <article className="pagos-stat efectivo">
          <div className="pagos-stat-icon">
            $
          </div>

          <div>
            <span>
              Efectivo
            </span>

            <strong>
              {formatearDinero(
                resumen.efectivo
              )}
            </strong>
          </div>
        </article>

        <article className="pagos-stat transferencia">
          <div className="pagos-stat-icon">
            <CreditCard
              size={20}
            />
          </div>

          <div>
            <span>
              Transferencias + PSE
            </span>

            <strong>
              {formatearDinero(
                Number(
                  resumen.transferencia
                ) +
                  Number(
                    resumen.pse
                  )
              )}
            </strong>
          </div>
        </article>

      </div>

      {/* =================================================
          MÉTODOS
      ================================================= */}

      <div className="pagos-method-summary">

        <div>
          <span>
            Transferencia
          </span>

          <strong>
            {formatearDinero(
              resumen.transferencia
            )}
          </strong>
        </div>

        <div>
          <span>
            Consignación
          </span>

          <strong>
            {formatearDinero(
              resumen.consignacion
            )}
          </strong>
        </div>

        <div>
          <span>
            PSE
          </span>

          <strong>
            {formatearDinero(
              resumen.pse
            )}
          </strong>
        </div>

        <div>
          <span>
            Otro
          </span>

          <strong>
            {formatearDinero(
              resumen.otro
            )}
          </strong>
        </div>

      </div>

      {/* =================================================
          PANEL
      ================================================= */}

      <div className="pagos-panel">

        {/* =============================================
            BUSCADOR
        ============================================= */}

        <div className="pagos-toolbar">

          <div className="pagos-search">

            <Search
              size={18}
            />

            <input
              type="text"
              value={
                busqueda
              }
              onChange={(e) =>
                setBusqueda(
                  e.target.value
                )
              }
              placeholder="Buscar pago, cliente, documento, venta o lote..."
            />

          </div>

          <button
            type="button"
            className="pagos-clear-button"
            onClick={
              limpiarFiltros
            }
          >
            Limpiar filtros
          </button>

        </div>

        {/* =============================================
            FILTROS
        ============================================= */}

        <div className="pagos-filters">

          <div className="pagos-filter-field">

            <label>
              Método
            </label>

            <select
              value={
                filtroMetodo
              }
              onChange={(e) =>
                setFiltroMetodo(
                  e.target.value
                )
              }
            >
              <option value="">
                Todos
              </option>

              <option value="Efectivo">
                Efectivo
              </option>

              <option value="Transferencia">
                Transferencia
              </option>

              <option value="Consignación">
                Consignación
              </option>

              <option value="PSE">
                PSE
              </option>

              <option value="Otro">
                Otro
              </option>
            </select>

          </div>

          <div className="pagos-filter-field">

            <label>
              Desde
            </label>

            <input
              type="date"
              value={
                fechaInicio
              }
              onChange={(e) =>
                setFechaInicio(
                  e.target.value
                )
              }
            />

          </div>

          <div className="pagos-filter-field">

            <label>
              Hasta
            </label>

            <input
              type="date"
              value={
                fechaFinal
              }
              onChange={(e) =>
                setFechaFinal(
                  e.target.value
                )
              }
            />

          </div>

        </div>

        {/* =================================================
            TABLA
        ================================================= */}

        <div className="pagos-table-wrapper">

          <table className="pagos-table">

            <thead>
              <tr>
                <th>
                  Pago
                </th>

                <th>
                  Fecha
                </th>

                <th>
                  Cliente
                </th>

                <th>
                  Venta
                </th>

                <th>
                  Método
                </th>

                <th>
                  Referencia
                </th>

                <th>
                  Valor
                </th>

                <th>
                  Aplicación
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
                    colSpan="9"
                    className="pagos-empty"
                  >
                    <RefreshCw
                      size={28}
                      className="pagos-spin"
                    />

                    <strong>
                      Cargando pagos...
                    </strong>
                  </td>
                </tr>
              ) : pagosPaginados.length ===
                0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="pagos-empty"
                  >
                    <WalletCards
                      size={38}
                    />

                    <strong>
                      No hay pagos
                    </strong>

                    <span>
                      No existen pagos para
                      los filtros seleccionados.
                    </span>
                  </td>
                </tr>
              ) : (
                pagosPaginados.map(
                  (pago) => {
                    const cliente =
                      pago.cliente;

                    const venta =
                      pago.venta;

                    const lote =
                      venta?.lote;

                    return (
                      <tr
                        key={
                          pago._id
                        }
                      >

                        {/* PAGO */}

                        <td>
                          <strong className="pago-code">
                            {pago.codigo ||
                              "—"}
                          </strong>
                        </td>

                        {/* FECHA */}

                        <td>
                          <div className="pago-date-cell">

                            <CalendarDays
                              size={15}
                            />

                            {formatearFecha(
                              pago.fechaPago
                            )}

                          </div>
                        </td>

                        {/* CLIENTE */}

                        <td>
                          <div className="pago-client-cell">

                            <UserRound
                              size={16}
                            />

                            <div>
                              <strong>
                                {obtenerNombreCliente(
                                  cliente
                                )}
                              </strong>

                              <span>
                                {cliente?.documento ||
                                  "Sin documento"}
                              </span>
                            </div>

                          </div>
                        </td>

                        {/* VENTA */}

                        <td>
                          <div className="pago-sale-cell">

                            <strong>
                              {venta?.codigo ||
                                "—"}
                            </strong>

                            <span>
                              {lote?.codigo ||
                                "Sin lote"}
                            </span>

                          </div>
                        </td>

                        {/* MÉTODO */}

                        <td>
                          <span className="pago-method">
                            {pago.metodoPago}
                          </span>
                        </td>

                        {/* REFERENCIA */}

                        <td>
                          <span className="pago-reference">
                            {pago.referencia ||
                              "—"}
                          </span>
                        </td>

                        {/* VALOR */}

                        <td>
                          <strong className="pago-value">
                            {formatearDinero(
                              pago.valorPago
                            )}
                          </strong>
                        </td>

                        {/* APLICACIÓN */}

                        <td>
                          <span className="pago-aplications">
                            {pago.aplicaciones
                              ?.length ||
                              0}{" "}
                            cuota
                            {(pago.aplicaciones
                              ?.length ||
                              0) === 1
                              ? ""
                              : "s"}
                          </span>
                        </td>

                        {/* ACCIONES */}

                        <td>
                          <div className="pagos-actions">

                            <button
                              type="button"
                              className="view"
                              title="Ver detalle"
                              onClick={() =>
                                abrirDetalle(
                                  pago
                                )
                              }
                            >
                              <Eye
                                size={16}
                              />
                            </button>

                            <button
                              type="button"
                              className="delete"
                              title="Eliminar pago"
                              onClick={() =>
                                abrirEliminarPago(
                                  pago
                                )
                              }
                            >
                              <Trash2
                                size={16}
                              />
                            </button>

                          </div>
                        </td>

                      </tr>
                    );
                  }
                )
              )}

            </tbody>
          </table>
        </div>

        {/* =================================================
            PIE
        ================================================= */}

        <div className="pagos-table-footer">

          <span>
            Mostrando{" "}
            <strong>
              {
                pagosFiltrados.length
              }
            </strong>{" "}
            de{" "}
            <strong>
              {
                pagos.length
              }
            </strong>{" "}
            pagos
          </span>

          <div className="pagos-pagination">

            <button
              type="button"
              disabled={
                paginaActual ===
                1
              }
              onClick={() =>
                setPaginaActual(
                  (pagina) =>
                    Math.max(
                      1,
                      pagina - 1
                    )
                )
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
              disabled={
                paginaActual ===
                totalPaginas
              }
              onClick={() =>
                setPaginaActual(
                  (pagina) =>
                    Math.min(
                      totalPaginas,
                      pagina + 1
                    )
                )
              }
            >
              Siguiente
            </button>

          </div>
        </div>
      </div>

      {/* =================================================
          MODAL NUEVO PAGO
      ================================================= */}

      <PagoModal
        abierto={
          modalPagoAbierto
        }
        onClose={() =>
          setModalPagoAbierto(
            false
          )
        }
        onGuardado={
          handlePagoGuardado
        }
      />

      {/* =================================================
          MODAL DETALLE
      ================================================= */}

      {pagoDetalle && (
        <div
          className="pagos-modal-overlay"
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              cerrarDetalle();
            }
          }}
        >
          <div className="pagos-modal pago-detail-modal">

            <div className="pagos-modal-header">

              <div className="pagos-modal-title">

                <div className="pagos-modal-icon">
                  <ReceiptText
                    size={21}
                  />
                </div>

                <div>
                  <span className="pagos-modal-kicker">
                    Comprobante
                  </span>

                  <h2>
                    {
                      pagoDetalle.codigo
                    }
                  </h2>
                </div>

              </div>

              <button
                type="button"
                className="pagos-modal-close"
                onClick={
                  cerrarDetalle
                }
              >
                <X
                  size={20}
                />
              </button>

            </div>

            <div className="pagos-modal-body">

              <div className="pago-detail-summary">

                <div>
                  <span>
                    Cliente
                  </span>

                  <strong>
                    {obtenerNombreCliente(
                      pagoDetalle.cliente
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Venta
                  </span>

                  <strong>
                    {pagoDetalle.venta
                      ?.codigo ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>
                    Fecha
                  </span>

                  <strong>
                    {formatearFecha(
                      pagoDetalle.fechaPago
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Valor recibido
                  </span>

                  <strong>
                    {formatearDinero(
                      pagoDetalle.valorPago
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Método
                  </span>

                  <strong>
                    {
                      pagoDetalle.metodoPago
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Referencia
                  </span>

                  <strong>
                    {pagoDetalle.referencia ||
                      "—"}
                  </strong>
                </div>

              </div>

              <div className="pago-detail-section">

                <h3>
                  Distribución del pago
                </h3>

                {pagoDetalle.aplicaciones
                  ?.length > 0 ? (
                  <div className="pago-detail-applications">

                    {pagoDetalle.aplicaciones.map(
                      (
                        aplicacion,
                        index
                      ) => {
                        const cuota =
                          aplicacion.cuota;

                        return (
                          <div
                            className="pago-detail-application"
                            key={
                              cuota?._id ||
                              `${pagoDetalle._id}-${index}`
                            }
                          >

                            <div>
                              <span>
                                Cuota
                              </span>

                              <strong>
                                {String(
                                  aplicacion.numeroCuota
                                ).padStart(
                                  2,
                                  "0"
                                )}
                              </strong>
                            </div>

                            <div>
                              <span>
                                Vencimiento
                              </span>

                              <strong>
                                {formatearFecha(
                                  cuota?.fechaVencimiento
                                )}
                              </strong>
                            </div>

                            <div>
                              <span>
                                Aplicado
                              </span>

                              <strong className="pago-detail-applied">
                                {formatearDinero(
                                  aplicacion.valorAplicado
                                )}
                              </strong>
                            </div>

                          </div>
                        );
                      }
                    )}

                  </div>
                ) : (
                  <span>
                    Sin aplicaciones registradas.
                  </span>
                )}

              </div>

              {pagoDetalle.observaciones && (
                <div className="pago-detail-note">

                  <span>
                    Observaciones
                  </span>

                  <p>
                    {
                      pagoDetalle.observaciones
                    }
                  </p>

                </div>
              )}

            </div>

            <div className="pagos-modal-footer">

              <button
                type="button"
                className="pagos-btn-secondary"
                onClick={
                  cerrarDetalle
                }
              >
                Cerrar
              </button>

              <button
                type="button"
                className="pagos-btn-danger"
                onClick={() => {
                  const pago =
                    pagoDetalle;

                  cerrarDetalle();

                  abrirEliminarPago(
                    pago
                  );
                }}
              >
                <Trash2
                  size={16}
                />

                Eliminar pago
              </button>

            </div>

          </div>
        </div>
      )}

      {/* =================================================
          MODAL ELIMINAR PAGO
      ================================================= */}

      {pagoParaEliminar && (
        <div
          className="pagos-modal-overlay"
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              cerrarEliminarPago();
            }
          }}
        >
          <div className="pagos-modal pago-delete-modal">

            {/* CABECERA */}

            <div className="pagos-modal-header">

              <div className="pagos-modal-title">

                <div className="pago-delete-icon">
                  <Trash2
                    size={21}
                  />
                </div>

                <div>
                  <span className="pagos-modal-kicker">
                    Eliminar registro
                  </span>

                  <h2>
                    Eliminar pago
                  </h2>
                </div>

              </div>

              <button
                type="button"
                className="pagos-modal-close"
                onClick={
                  cerrarEliminarPago
                }
                disabled={
                  eliminandoPago
                }
              >
                <X
                  size={20}
                />
              </button>

            </div>

            {/* CUERPO */}

            <div className="pagos-modal-body">

              <div className="pago-delete-warning">

                <Trash2
                  size={21}
                />

                <div>
                  <strong>
                    ¿Desea eliminar este pago?
                  </strong>

                  <span>
                    Esta acción eliminará definitivamente
                    el registro y recalculará la cartera
                    de la venta.
                  </span>
                </div>

              </div>

              <div className="pago-delete-info">

                <div>
                  <span>
                    Pago
                  </span>

                  <strong>
                    {pagoParaEliminar.codigo ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>
                    Cliente
                  </span>

                  <strong>
                    {obtenerNombreCliente(
                      pagoParaEliminar.cliente
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Valor
                  </span>

                  <strong>
                    {formatearDinero(
                      pagoParaEliminar.valorPago
                    )}
                  </strong>
                </div>

              </div>

              <div className="pago-delete-after">

                <strong>
                  Al eliminar:
                </strong>

                <span>
                  • El pago desaparecerá definitivamente.
                </span>

                <span>
                  • Se recalcularán las cuotas afectadas.
                </span>

                <span>
                  • El valor del pago volverá al saldo pendiente.
                </span>

                <span>
                  • La venta volverá a Activa si nuevamente queda saldo.
                </span>

              </div>

            </div>

            {/* BOTONES */}

            <div className="pagos-modal-footer">

              <button
                type="button"
                className="pagos-btn-secondary"
                onClick={
                  cerrarEliminarPago
                }
                disabled={
                  eliminandoPago
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className="pagos-btn-danger"
                onClick={
                  confirmarEliminarPago
                }
                disabled={
                  eliminandoPago
                }
              >
                <Trash2
                  size={16}
                />

                {eliminandoPago
                  ? "Eliminando..."
                  : "Eliminar pago"}
              </button>

            </div>

          </div>
        </div>
      )}

      {/* =================================================
          TOAST
      ================================================= */}

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