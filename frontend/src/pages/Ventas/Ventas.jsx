import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Ban,
  CalendarDays,
  CheckCircle2,
  Edit3,
  LandPlot,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  UserRound,
  WalletCards,
} from "lucide-react";

import "./Ventas.css";

import Toast from "../../components/ui/Toast";
import VentaModal from "./VentaModal";
import "./Ventas.css";
import {
  obtenerVentas,
  crearVenta,
  actualizarVenta,
  anularVenta,
} from "../../services/venta.service";

import {
  obtenerClientes,
} from "../../services/cliente.service";

import {
  obtenerManzanas,
} from "../../services/manzana.service";

import {
  obtenerLotes,
} from "../../services/lote.service";



/* =========================================================
   FORMATEADORES
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

const formatearFecha = (
  fecha
) => {
  if (!fecha) {
    return "—";
  }

  const date = new Date(
    fecha
  );

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
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "UTC",
    }
  );
};

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
   COMPONENTE
========================================================= */

export default function Ventas() {
  /* =======================================================
     DATOS
  ======================================================= */

  const [
    ventas,
    setVentas,
  ] = useState([]);

  const [
    clientes,
    setClientes,
  ] = useState([]);

  const [
    manzanas,
    setManzanas,
  ] = useState([]);

  const [
    lotes,
    setLotes,
  ] = useState([]);

  /* =======================================================
     ESTADOS
  ======================================================= */

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    modalAbierto,
    setModalAbierto,
  ] = useState(false);

  const [
    ventaEditar,
    setVentaEditar,
  ] = useState(null);

  /* =======================================================
     ESTADOS DE ANULACIÓN
  ======================================================= */

  const [ventaParaAnular, setVentaParaAnular] = useState(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState("");
  const [anulandoVenta, setAnulandoVenta] = useState(false);

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
    filtroFormaPago,
    setFiltroFormaPago,
  ] = useState("");

  /* =======================================================
     PAGINACIÓN
  ======================================================= */

  const [
    paginaActual,
    setPaginaActual,
  ] = useState(1);

  const VENTAS_POR_PAGINA = 8;

  /* =======================================================
     NOTIFICACIONES
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
     CARGAR VENTAS
  ======================================================= */

  const cargarVentas =
    async () => {
      try {
        const datos =
          await obtenerVentas();

        setVentas(
          Array.isArray(datos)
            ? datos
            : []
        );
      } catch (error) {
        console.error(
          "Error cargando ventas:",
          error
        );

        mostrarNotificacion(
          error?.response?.data
            ?.message ||
            "No fue posible cargar las ventas.",
          "error"
        );
      }
    };

  /* =======================================================
     CARGAR CLIENTES
  ======================================================= */

  const cargarClientes =
    async () => {
      try {
        const datos =
          await obtenerClientes();

        /*
          Por si el servicio devuelve:
          [...]
          o:
          { clientes: [...] }
        */

        if (
          Array.isArray(datos)
        ) {
          setClientes(datos);

          return;
        }

        setClientes(
          Array.isArray(
            datos?.clientes
          )
            ? datos.clientes
            : []
        );
      } catch (error) {
        console.error(
          "Error cargando clientes:",
          error
        );

        mostrarNotificacion(
          "No fue posible cargar los clientes.",
          "error"
        );
      }
    };

  /* =======================================================
     CARGAR MANZANAS
  ======================================================= */

  const cargarManzanas =
    async () => {
      try {
        const datos =
          await obtenerManzanas();

        setManzanas(
          Array.isArray(datos)
            ? datos
            : []
        );
      } catch (error) {
        console.error(
          "Error cargando manzanas:",
          error
        );

        mostrarNotificacion(
          "No fue posible cargar las manzanas.",
          "error"
        );
      }
    };

  /* =======================================================
     CARGAR LOTES
  ======================================================= */

  const cargarLotes =
    async () => {
      try {
        const datos =
          await obtenerLotes();

        setLotes(
          Array.isArray(datos)
            ? datos
            : []
        );
      } catch (error) {
        console.error(
          "Error cargando lotes:",
          error
        );

        mostrarNotificacion(
          "No fue posible cargar los lotes.",
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
          cargarVentas(),
          cargarClientes(),
          cargarManzanas(),
          cargarLotes(),
        ]);
      } finally {
        setCargando(false);
      }
    };

  useEffect(() => {
    cargarTodo();
  }, []);

  /* =======================================================
     FILTRAR VENTAS
  ======================================================= */

  const ventasFiltradas =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      return ventas.filter(
        (venta) => {
          if (
            filtroEstado &&
            venta.estado !==
              filtroEstado
          ) {
            return false;
          }

          if (
            filtroFormaPago &&
            venta.formaPago !==
              filtroFormaPago
          ) {
            return false;
          }

          if (!texto) {
            return true;
          }

          const cliente =
            obtenerNombreCliente(
              venta.cliente
            );

          const documento =
            venta.cliente
              ?.documento ||
            "";

          const lote =
            venta.lote;

          const manzana =
            lote?.manzana;

          const contenido = [
            venta.codigo,
            cliente,
            documento,
            lote?.codigo,
            lote?.numeroLote,
            manzana?.codigo,
            manzana?.nombre,
            venta.estado,
            venta.formaPago,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return contenido.includes(
            texto
          );
        }
      );
    }, [
      ventas,
      busqueda,
      filtroEstado,
      filtroFormaPago,
    ]);

  /* =======================================================
     ESTADÍSTICAS

     IMPORTANTE:
     Las ventas ANULADAS se conservan como historial,
     pero NO cuentan en los totales comerciales.
  ======================================================= */

  const estadisticas =
    useMemo(() => {
      return ventas.reduce(
        (acc, venta) => {
          /* =========================
             ANULADAS
             Solo historial
          ========================= */

          if (
            venta.estado ===
            "Anulada"
          ) {
            acc.anuladas += 1;

            return acc;
          }

          /* =========================
             VENTA VÁLIDA
          ========================= */

          acc.total += 1;

          acc.valorVentas +=
            Number(
              venta.valorVenta
            ) || 0;

          acc.iniciales +=
            Number(
              venta.cuotaInicial
            ) || 0;

          acc.saldo +=
            Number(
              venta.saldoFinanciar
            ) || 0;

          /* =========================
             ESTADOS
          ========================= */

          if (
            venta.estado ===
            "Activa"
          ) {
            acc.activas += 1;
          }

          if (
            venta.estado ===
            "Pagada"
          ) {
            acc.pagadas += 1;
          }

          return acc;
        },
        {
          total: 0,
          activas: 0,
          pagadas: 0,
          anuladas: 0,

          valorVentas: 0,
          iniciales: 0,
          saldo: 0,
        }
      );
    }, [ventas]);

  /* =======================================================
     PAGINACIÓN
  ======================================================= */

  const totalPaginas =
    Math.max(
      1,
      Math.ceil(
        ventasFiltradas.length /
          VENTAS_POR_PAGINA
      )
    );

  const indiceInicial =
    (paginaActual - 1) *
    VENTAS_POR_PAGINA;

  const ventasPaginadas =
    ventasFiltradas.slice(
      indiceInicial,
      indiceInicial +
        VENTAS_POR_PAGINA
    );

  useEffect(() => {
    setPaginaActual(1);
  }, [
    busqueda,
    filtroEstado,
    filtroFormaPago,
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
     NUEVA VENTA
  ======================================================= */

  const abrirNuevaVenta =
    () => {
      const disponibles =
        lotes.filter(
          (lote) =>
            lote.estado ===
            "Disponible"
        );

      if (
        clientes.length === 0
      ) {
        mostrarNotificacion(
          "Debe registrar al menos un cliente antes de crear una venta.",
          "info"
        );

        return;
      }

      if (
        disponibles.length === 0
      ) {
        mostrarNotificacion(
          "No hay lotes disponibles para vender.",
          "info"
        );

        return;
      }

      setVentaEditar(null);

      setModalAbierto(true);
    };

  /* =======================================================
     EDITAR
  ======================================================= */

  const abrirEditarVenta = (
    venta
  ) => {
    if (
      venta.estado ===
      "Anulada"
    ) {
      mostrarNotificacion(
        "Una venta anulada no puede modificarse.",
        "info"
      );

      return;
    }

    setVentaEditar(venta);

    setModalAbierto(true);
  };

  /* =======================================================
     CERRAR MODAL
  ======================================================= */

  const cerrarModal =
    () => {
      if (guardando) {
        return;
      }

      setModalAbierto(false);

      setVentaEditar(null);
    };

  /* =======================================================
     GUARDAR
  ======================================================= */

  const guardarVenta =
    async (datos) => {
      try {
        setGuardando(true);

        let respuesta;

        if (
          ventaEditar?._id
        ) {
          respuesta =
            await actualizarVenta(
              ventaEditar._id,
              datos
            );
        } else {
          respuesta =
            await crearVenta(
              datos
            );
        }

        /*
          Volvemos a consultar ventas
          y lotes porque el lote puede
          haber cambiado a Vendido.
        */

        await Promise.all([
          cargarVentas(),
          cargarLotes(),
        ]);

        setModalAbierto(
          false
        );

        setVentaEditar(
          null
        );

        mostrarNotificacion(
          respuesta?.message ||
            (ventaEditar
              ? "Venta actualizada correctamente."
              : "Venta registrada correctamente.")
        );
      } catch (error) {
        console.error(
          "Error guardando venta:",
          error
        );

        mostrarNotificacion(
          error?.response?.data
            ?.message ||
            "No fue posible guardar la venta.",
          "error"
        );
      } finally {
        setGuardando(false);
      }
    };

  /* =======================================================
     ABRIR VENTANA DE ANULACIÓN
  ======================================================= */

  const handleAnularVenta = (venta) => {
    if (venta.estado === "Anulada") {
      mostrarNotificacion(
        "Esta venta ya se encuentra anulada.",
        "info"
      );

      return;
    }

    setVentaParaAnular(venta);
    setMotivoAnulacion("");
  };

  /* =======================================================
     CERRAR VENTANA
  ======================================================= */

  const cerrarAnulacionVenta = () => {
    if (anulandoVenta) return;

    setVentaParaAnular(null);
    setMotivoAnulacion("");
  };

  /* =======================================================
     CONFIRMAR ANULACIÓN
  ======================================================= */

  const confirmarAnulacionVenta = async () => {
    const motivo = motivoAnulacion.trim();

    if (motivo.length < 5) {
      mostrarNotificacion(
        "Debe escribir un motivo de anulación de mínimo 5 caracteres.",
        "error"
      );

      return;
    }

    if (!ventaParaAnular?._id) {
      return;
    }

    try {
      setAnulandoVenta(true);

      const respuesta = await anularVenta(
        ventaParaAnular._id,
        motivo
      );

      mostrarNotificacion(
        respuesta?.message ||
          "Venta anulada correctamente.",
        "success"
      );

      setVentaParaAnular(null);
      setMotivoAnulacion("");

      await cargarTodo();
    } catch (error) {
      console.error(
        "Error anulando venta:",
        error
      );

      mostrarNotificacion(
        error?.response?.data?.message ||
          "No fue posible anular la venta.",
        "error"
      );
    } finally {
      setAnulandoVenta(false);
    }
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <section className="ventas-page">

      {/* =================================================
          CABECERA
      ================================================= */}

      <div className="ventas-header">
        <div>
          <span className="ventas-kicker">
            Gestión comercial
          </span>

          <h1>
            Ventas de lotes
          </h1>

          <p>
            Registra compradores,
            lotes vendidos, valores,
            cuota inicial y
            financiación.
          </p>
        </div>

        <div className="ventas-header-actions">
          <button
            type="button"
            className="ventas-refresh"
            onClick={
              cargarTodo
            }
            title="Actualizar información"
          >
            <RefreshCw
              size={18}
              className={
                cargando
                  ? "ventas-spin"
                  : ""
              }
            />

            Actualizar
          </button>

          <button
            type="button"
            className="ventas-new-button"
            onClick={
              abrirNuevaVenta
            }
          >
            <Plus size={19} />

            Nueva venta
          </button>
        </div>
      </div>

      {/* =================================================
          ESTADÍSTICAS
      ================================================= */}

      <div className="ventas-stats">
        <article className="ventas-stat-card">
          <div className="ventas-stat-icon">
            <ShoppingCart
              size={20}
            />
          </div>

          <div>
            <span>
              Total ventas
            </span>

            <strong>
              {estadisticas.total}
            </strong>
          </div>
        </article>

        <article className="ventas-stat-card activa">
          <div className="ventas-stat-icon">
            <WalletCards
              size={20}
            />
          </div>

          <div>
            <span>
              Activas
            </span>

            <strong>
              {estadisticas.activas}
            </strong>
          </div>
        </article>

        <article className="ventas-stat-card pagada">
          <div className="ventas-stat-icon">
            <CheckCircle2
              size={20}
            />
          </div>

          <div>
            <span>
              Pagadas
            </span>

            <strong>
              {estadisticas.pagadas}
            </strong>
          </div>
        </article>

        <article className="ventas-stat-card valor">
          <div className="ventas-stat-icon">
            $
          </div>

          <div>
            <span>
              Valor vendido
            </span>

            <strong>
              {formatearDinero(
                estadisticas.valorVentas
              )}
            </strong>
          </div>
        </article>

        <article className="ventas-stat-card saldo">
          <div className="ventas-stat-icon">
            $
          </div>

          <div>
            <span>
              Saldo financiado
            </span>

            <strong>
              {formatearDinero(
                estadisticas.saldo
              )}
            </strong>
          </div>
        </article>
      </div>

      {/* =================================================
          PANEL
      ================================================= */}

      <div className="ventas-panel">

        {/* =============================================
            FILTROS
        ============================================= */}

        <div className="ventas-toolbar">
          <div className="ventas-search">
            <Search size={18} />

            <input
              type="text"
              value={busqueda}
              onChange={(e) =>
                setBusqueda(
                  e.target.value
                )
              }
              placeholder="Buscar por venta, cliente, documento, lote o manzana..."
            />
          </div>

          <div className="ventas-filters">
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
                Todos los estados
              </option>

              <option value="Activa">
                Activa
              </option>

              <option value="Pagada">
                Pagada
              </option>

              <option value="Anulada">
                Anulada
              </option>
            </select>

            <select
              value={
                filtroFormaPago
              }
              onChange={(e) =>
                setFiltroFormaPago(
                  e.target.value
                )
              }
            >
              <option value="">
                Todas las formas
              </option>

              <option value="Contado">
                Contado
              </option>

              <option value="Financiado">
                Financiado
              </option>
            </select>
          </div>
        </div>

        {/* =================================================
            TABLA
        ================================================= */}

        <div className="ventas-table-wrapper">
          <table className="ventas-table">
            <thead>
              <tr>
                <th>Venta</th>
                <th>Cliente</th>
                <th>Lote</th>
                <th>Fecha</th>
                <th>Valor venta</th>
                <th>Inicial</th>
                <th>Saldo</th>
                <th>Pago</th>
                <th>Estado</th>
                <th className="ventas-th-actions">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {cargando ? (
                <tr>
                  <td
                    colSpan="10"
                    className="ventas-empty"
                  >
                    <RefreshCw
                      size={27}
                      className="ventas-spin"
                    />

                    <strong>
                      Cargando ventas...
                    </strong>
                  </td>
                </tr>
              ) : ventasPaginadas.length ===
                0 ? (
                <tr>
                  <td
                    colSpan="10"
                    className="ventas-empty"
                  >
                    <ShoppingCart
                      size={38}
                    />

                    <strong>
                      No hay ventas
                    </strong>

                    <span>
                      No existen registros
                      para los filtros
                      seleccionados.
                    </span>
                  </td>
                </tr>
              ) : (
                ventasPaginadas.map(
                  (venta) => {
                    const cliente =
                      venta.cliente;

                    const lote =
                      venta.lote;

                    const manzana =
                      lote?.manzana;

                    return (
                      <tr
                        key={
                          venta._id
                        }
                        className={
                          venta.estado ===
                          "Anulada"
                            ? "venta-row-anulada"
                            : ""
                        }
                      >

                        {/* =====================
                            VENTA
                        ===================== */}

                        <td>
                          <div className="venta-code-cell">
                            <div className="venta-code-icon">
                              <ShoppingCart
                                size={17}
                              />
                            </div>

                            <div>
                              <strong>
                                {
                                  venta.codigo
                                }
                              </strong>

                              <span>
                                Venta
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* =====================
                            CLIENTE
                        ===================== */}

                        <td>
                          <div className="venta-cliente-cell">
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

                        {/* =====================
                            LOTE
                        ===================== */}

                        <td>
                          <div className="venta-lote-cell">
                            <LandPlot
                              size={16}
                            />

                            <div>
                              <strong>
                                {lote?.codigo ||
                                  "—"}
                              </strong>

                              <span>
                                {manzana?.nombre ||
                                  "Sin manzana"}

                                {lote?.numeroLote
                                  ? ` · Lote ${lote.numeroLote}`
                                  : ""}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* =====================
                            FECHA
                        ===================== */}

                        <td>
                          <div className="venta-fecha-cell">
                            <CalendarDays
                              size={15}
                            />

                            <span>
                              {formatearFecha(
                                venta.fechaVenta
                              )}
                            </span>
                          </div>
                        </td>

                        {/* =====================
                            VALOR
                        ===================== */}

                        <td>
                          <strong className="venta-money">
                            {formatearDinero(
                              venta.valorVenta
                            )}
                          </strong>
                        </td>

                        {/* =====================
                            INICIAL
                        ===================== */}

                        <td>
                          <span className="venta-money-secondary">
                            {formatearDinero(
                              venta.cuotaInicial
                            )}
                          </span>
                        </td>

                        {/* =====================
                            SALDO
                        ===================== */}

                        <td>
                          <strong
                            className={`venta-saldo ${
                              Number(
                                venta.saldoFinanciar
                              ) === 0
                                ? "venta-saldo-cero"
                                : ""
                            }`}
                          >
                            {formatearDinero(
                              venta.saldoFinanciar
                            )}
                          </strong>
                        </td>

                        {/* =====================
                            FORMA DE PAGO
                        ===================== */}

                        <td>
                          <div className="venta-pago-cell">
                            <strong>
                              {
                                venta.formaPago
                              }
                            </strong>

                            {venta.formaPago ===
                              "Financiado" && (
                              <span>
                                {
                                  venta.numeroCuotas
                                }{" "}
                                cuotas ·{" "}
                                {formatearDinero(
                                  venta.valorCuota
                                )}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* =====================
                            ESTADO
                        ===================== */}

                        <td>
                          <span
                            className={`venta-status venta-status-${String(
                              venta.estado
                            ).toLowerCase()}`}
                          >
                            {
                              venta.estado
                            }
                          </span>
                        </td>

                        {/* =====================
                            ACCIONES
                        ===================== */}

                        <td>
                          <div className="ventas-actions">

                            <button
                              type="button"
                              className="edit"
                              title={
                                venta.estado ===
                                "Anulada"
                                  ? "Venta anulada"
                                  : "Editar venta"
                              }
                              disabled={
                                venta.estado ===
                                "Anulada"
                              }
                              onClick={() =>
                                abrirEditarVenta(
                                  venta
                                )
                              }
                            >
                              <Edit3
                                size={16}
                              />
                            </button>

                            <button
                              type="button"
                              className="anular"
                              title={
                                venta.estado ===
                                "Anulada"
                                  ? "Venta anulada"
                                  : "Anular venta"
                              }
                              disabled={
                                venta.estado ===
                                "Anulada"
                              }
                              onClick={() =>
                                handleAnularVenta(
                                  venta
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
            PIE / PAGINACIÓN
        ================================================= */}

        <div className="ventas-table-footer">
          <div>
            Mostrando{" "}
            <strong>
              {ventasFiltradas.length}
            </strong>{" "}
            de{" "}
            <strong>
              {ventas.length}
            </strong>{" "}
            ventas
          </div>

          <div className="ventas-pagination">
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
          MODAL
      ================================================= */}

      <VentaModal
        abierto={
          modalAbierto
        }
        onCerrar={
          cerrarModal
        }
        onGuardar={
          guardarVenta
        }
        ventaEditar={
          ventaEditar
        }
        guardando={
          guardando
        }
        clientes={
          clientes
        }
        manzanas={
          manzanas
        }
        lotes={
          lotes
        }
      />

      {/* =====================================================
          MODAL ANULAR VENTA
      ===================================================== */}

      {ventaParaAnular && (
        <div
          className="venta-anular-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              cerrarAnulacionVenta();
            }
          }}
        >
          <div className="venta-anular-modal">

            {/* CABECERA */}

            <div className="venta-anular-header">
              <div className="venta-anular-icon">
                !
              </div>

              <div>
                <span>ANULACIÓN DE VENTA</span>

                <h3>
                  ¿Desea anular esta venta?
                </h3>
              </div>

              <button
                type="button"
                className="venta-anular-close"
                onClick={cerrarAnulacionVenta}
                disabled={anulandoVenta}
              >
                ×
              </button>
            </div>

            {/* ADVERTENCIA */}

            <div className="venta-anular-warning">
              Esta acción dejará la venta como
              <strong> Anulada</strong> y liberará el lote
              asociado.
            </div>

            {/* INFORMACIÓN DE LA VENTA */}

            <div className="venta-anular-info">

              <div>
                <span>Venta</span>

                <strong>
                  {ventaParaAnular.codigo || "—"}
                </strong>
              </div>

              <div>
                <span>Cliente</span>

                <strong>
                  {[
                    ventaParaAnular.cliente?.nombres,
                    ventaParaAnular.cliente?.apellidos,
                  ]
                    .filter(Boolean)
                    .join(" ") || "—"}
                </strong>
              </div>

              <div>
                <span>Lote</span>

                <strong>
                  {ventaParaAnular.lote?.codigo || "—"}
                </strong>
              </div>

            </div>

            {/* MOTIVO */}

            <div className="venta-anular-field">
              <label>
                Motivo de la anulación *
              </label>

              <textarea
                value={motivoAnulacion}
                onChange={(e) =>
                  setMotivoAnulacion(
                    e.target.value
                  )
                }
                placeholder="Escriba por qué se está anulando esta venta..."
                maxLength={300}
                disabled={anulandoVenta}
                autoFocus
              />

              <div className="venta-anular-counter">
                <span>
                  Mínimo 5 caracteres
                </span>

                <span>
                  {motivoAnulacion.length}/300
                </span>
              </div>
            </div>

            {/* QUÉ PASARÁ */}

            <div className="venta-anular-after">
              <strong>
                Al confirmar:
              </strong>

              <span>
                • La venta quedará anulada.
              </span>

              <span>
                • Las cuotas quedarán anuladas.
              </span>

              <span>
                • El lote volverá a estar disponible.
              </span>
            </div>

            {/* BOTONES */}

            <div className="venta-anular-actions">

              <button
                type="button"
                className="venta-anular-cancel"
                onClick={cerrarAnulacionVenta}
                disabled={anulandoVenta}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="venta-anular-confirm"
                onClick={confirmarAnulacionVenta}
                disabled={
                  anulandoVenta ||
                  motivoAnulacion.trim().length < 5
                }
              >
                {anulandoVenta
                  ? "Anulando..."
                  : "Confirmar anulación"}
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