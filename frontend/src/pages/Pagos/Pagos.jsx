import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  Ban,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Eye,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
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
  anularPago,
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
   CLIENTE
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
========================================================= */

const resumenInicial = {
  totalPagos: 0,
  totalRecibido: 0,

  efectivo: 0,
  transferencia: 0,
  consignacion: 0,
  pse: 0,
  otro: 0,

  anulados: 0,
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
     ANULACIÓN
  ======================================================= */

  const [
    pagoParaAnular,
    setPagoParaAnular,
  ] = useState(null);

  const [
    motivoAnulacion,
    setMotivoAnulacion,
  ] = useState("");

  const [
    anulando,
    setAnulando,
  ] = useState(false);

  /* =======================================================
     FILTROS
  ======================================================= */

  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  const [
    filtroEstado,
    setFiltroEstado,
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

  const PAGOS_POR_PAGINA = 10;

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
          visible: false,
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
          Array.isArray(datos)
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
        setCargando(true);

        await Promise.all([
          cargarPagos(),
          cargarResumen(),
        ]);
      } finally {
        setCargando(false);
      }
    };

  useEffect(() => {
    cargarTodo();
  }, []);

  /* =======================================================
     FILTRAR PAGOS
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
             ESTADO
          ===================== */

          if (
            filtroEstado &&
            pago.estado !==
              filtroEstado
          ) {
            return false;
          }

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

          if (fechaInicio) {
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

          if (fechaFinal) {
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

            manzana?.nombre,

            pago.metodoPago,

            pago.referencia,

            pago.estado,
          ]
            .filter(
              (dato) =>
                dato !==
                  undefined &&
                dato !== null
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
      filtroEstado,
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
    (paginaActual - 1) *
    PAGOS_POR_PAGINA;

  const pagosPaginados =
    pagosFiltrados.slice(
      indiceInicial,
      indiceInicial +
        PAGOS_POR_PAGINA
    );

  useEffect(() => {
    setPaginaActual(1);
  }, [
    busqueda,
    filtroEstado,
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
      setBusqueda("");
      setFiltroEstado("");
      setFiltroMetodo("");
      setFechaInicio("");
      setFechaFinal("");
      setPaginaActual(1);
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
     ABRIR ANULACIÓN
  ======================================================= */

  const abrirAnulacion =
    (pago) => {
      if (
        pago.estado ===
        "Anulado"
      ) {
        mostrarNotificacion(
          "Este pago ya se encuentra anulado.",
          "info"
        );

        return;
      }

      setPagoParaAnular(
        pago
      );

      setMotivoAnulacion(
        ""
      );
    };

  /* =======================================================
     CERRAR ANULACIÓN
  ======================================================= */

  const cerrarAnulacion =
    () => {
      if (anulando) {
        return;
      }

      setPagoParaAnular(
        null
      );

      setMotivoAnulacion(
        ""
      );
    };

  /* =======================================================
     CONFIRMAR ANULACIÓN
  ======================================================= */

  const confirmarAnulacion =
    async () => {
      const motivo =
        motivoAnulacion.trim();

      if (!motivo) {
        mostrarNotificacion(
          "Debe escribir el motivo de la anulación.",
          "error"
        );

        return;
      }

      if (
        motivo.length < 5
      ) {
        mostrarNotificacion(
          "El motivo de anulación debe ser más descriptivo.",
          "error"
        );

        return;
      }

      if (
        !pagoParaAnular?._id
      ) {
        return;
      }

      try {
        setAnulando(true);

        const respuesta =
          await anularPago(
            pagoParaAnular._id,
            motivo
          );

        setPagoParaAnular(
          null
        );

        setMotivoAnulacion(
          ""
        );

        setPagoDetalle(
          null
        );

        await cargarTodo();

        mostrarNotificacion(
          respuesta?.message ||
            "Pago anulado correctamente."
        );
      } catch (error) {
        console.error(
          "Error anulando pago:",
          error
        );

        mostrarNotificacion(
          error?.response?.data
            ?.message ||
            "No fue posible anular el pago.",
          "error"
        );
      } finally {
        setAnulando(false);
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
            <Plus size={18} />

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
              Pagos aplicados
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
              Transferencias
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

        <article className="pagos-stat anulados">
          <div className="pagos-stat-icon">
            <Ban size={20} />
          </div>

          <div>
            <span>
              Anulados
            </span>

            <strong>
              {
                resumen.anulados
              }
            </strong>

            <small>
              Solo historial
            </small>
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
            <Search size={18} />

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
              Estado
            </label>

            <select
              value={
                filtroEstado
              }
              onChange={(e) =>
                setFiltroEstado(
                  e.target.value
                )
              }
            >
              <option value="">
                Todos
              </option>

              <option value="Aplicado">
                Aplicado
              </option>

              <option value="Anulado">
                Anulado
              </option>
            </select>
          </div>

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
                <th>Pago</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Venta</th>
                <th>Método</th>
                <th>Referencia</th>
                <th>Valor</th>
                <th>Aplicación</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {cargando ? (
                <tr>
                  <td
                    colSpan="10"
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
                    colSpan="10"
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
                        className={
                          pago.estado ===
                          "Anulado"
                            ? "pago-row-anulado"
                            : ""
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
                              ?.length || 0}{" "}
                            cuota
                            {(pago.aplicaciones
                              ?.length ||
                              0) === 1
                              ? ""
                              : "s"}
                          </span>
                        </td>

                        {/* ESTADO */}

                        <td>
                          <span
                            className={`pago-status pago-status-${String(
                              pago.estado
                            ).toLowerCase()}`}
                          >
                            {
                              pago.estado
                            }
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
                              className="cancel"
                              title={
                                pago.estado ===
                                "Anulado"
                                  ? "Pago ya anulado"
                                  : "Anular pago"
                              }
                              onClick={() =>
                                abrirAnulacion(
                                  pago
                                )
                              }
                            >
                              <Ban
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
              {pagos.length}
            </strong>{" "}
            pagos
          </span>

          <div className="pagos-pagination">
            <button
              type="button"
              disabled={
                paginaActual === 1
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
                {paginaActual}
              </strong>{" "}
              de{" "}
              <strong>
                {totalPaginas}
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
        <div className="pagos-modal-overlay">
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
                    {pagoDetalle.codigo}
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
                <X size={20} />
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

              {pagoDetalle.estado ===
                "Anulado" && (
                <div className="pago-detail-cancelled">
                  <AlertTriangle
                    size={20}
                  />

                  <div>
                    <strong>
                      Pago anulado
                    </strong>

                    <span>
                      {pagoDetalle.motivoAnulacion ||
                        "Sin motivo registrado"}
                    </span>

                    <small>
                      {formatearFecha(
                        pagoDetalle.fechaAnulacion
                      )}
                    </small>
                  </div>
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

              {pagoDetalle.estado !==
                "Anulado" && (
                <button
                  type="button"
                  className="pagos-btn-danger"
                  onClick={() => {
                    const pago =
                      pagoDetalle;

                    cerrarDetalle();

                    abrirAnulacion(
                      pago
                    );
                  }}
                >
                  <Ban
                    size={16}
                  />

                  Anular pago
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          MODAL ANULACIÓN
      ================================================= */}

      {pagoParaAnular && (
        <div className="pagos-modal-overlay">
          <div className="pagos-modal pago-cancel-modal">

            <div className="pagos-modal-header">
              <div className="pagos-modal-title">
                <div className="pago-cancel-icon">
                  <AlertTriangle
                    size={21}
                  />
                </div>

                <div>
                  <span className="pagos-modal-kicker">
                    Corrección
                  </span>

                  <h2>
                    Anular pago
                  </h2>
                </div>
              </div>

              <button
                type="button"
                className="pagos-modal-close"
                onClick={
                  cerrarAnulacion
                }
                disabled={
                  anulando
                }
              >
                <X size={20} />
              </button>
            </div>

            <div className="pagos-modal-body">

              <div className="pago-cancel-warning">
                <AlertTriangle
                  size={21}
                />

                <div>
                  <strong>
                    Esta acción recalculará la cartera
                  </strong>

                  <span>
                    El pago quedará como Anulado y
                    las cuotas afectadas volverán a
                    calcular su valor pagado y saldo.
                  </span>
                </div>
              </div>

              <div className="pago-cancel-info">
                <div>
                  <span>
                    Pago
                  </span>

                  <strong>
                    {
                      pagoParaAnular.codigo
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Cliente
                  </span>

                  <strong>
                    {obtenerNombreCliente(
                      pagoParaAnular.cliente
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Valor
                  </span>

                  <strong>
                    {formatearDinero(
                      pagoParaAnular.valorPago
                    )}
                  </strong>
                </div>
              </div>

              <div className="pagos-field pago-field-full pago-cancel-reason">
                <label>
                  Motivo de anulación *
                </label>

                <textarea
                  value={
                    motivoAnulacion
                  }
                  onChange={(e) =>
                    setMotivoAnulacion(
                      e.target.value
                    )
                  }
                  rows="4"
                  maxLength={500}
                  placeholder="Ej. El pago fue registrado dos veces por error."
                  disabled={
                    anulando
                  }
                />

                <small>
                  Este motivo quedará guardado
                  permanentemente en el historial.
                </small>
              </div>
            </div>

            <div className="pagos-modal-footer">
              <button
                type="button"
                className="pagos-btn-secondary"
                onClick={
                  cerrarAnulacion
                }
                disabled={
                  anulando
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className="pagos-btn-danger"
                onClick={
                  confirmarAnulacion
                }
                disabled={
                  anulando
                }
              >
                <Ban
                  size={16}
                />

                {anulando
                  ? "Anulando..."
                  : "Anular pago"}
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