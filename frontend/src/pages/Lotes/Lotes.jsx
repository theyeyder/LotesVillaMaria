import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  Building2,
  ChevronRight,
  Edit3,
  LandPlot,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import "./Lotes.css";

import Toast from "../../components/ui/Toast";

import ManzanaModal from "./ManzanaModal";
import LoteModal from "./LoteModal";

import {
  obtenerManzanas,
  crearManzana,
  actualizarManzana,
  eliminarManzana,
} from "../../services/manzana.service";

import {
  obtenerLotes,
  crearLote,
  actualizarLote,
  eliminarLote,
} from "../../services/lote.service";

import {
  obtenerVentaActivaPorLote,
  anularVenta,
} from "../../services/venta.service";

/* =========================================================
   FORMATEADORES
========================================================= */

const formatearDinero = (valor = 0) => {
  return new Intl.NumberFormat(
    "es-CO",
    {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }
  ).format(Number(valor) || 0);
};

const formatearArea = (valor = 0) => {
  return Number(valor || 0).toLocaleString(
    "es-CO",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
};

/* =========================================================
   COMPONENTE
========================================================= */

export default function Lotes() {
  /* =========================
     DATOS
  ========================= */

  const [manzanas, setManzanas] = useState([]);
  const [lotes, setLotes] = useState([]);

  /* =========================
     CARGA
  ========================= */

  const [cargando, setCargando] = useState(true);
  const [guardandoManzana, setGuardandoManzana] = useState(false);
  const [guardandoLote, setGuardandoLote] = useState(false);

  /* =========================
     SELECCIÓN
  ========================= */

  const [manzanaSeleccionada, setManzanaSeleccionada] = useState("");

  /* =========================
     FILTROS
  ========================= */

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  /* =========================
     MODAL MANZANA
  ========================= */

  const [modalManzanaAbierto, setModalManzanaAbierto] = useState(false);
  const [manzanaEditar, setManzanaEditar] = useState(null);

  /* =========================
     MODAL LOTE
  ========================= */

  const [modalLoteAbierto, setModalLoteAbierto] = useState(false);
  const [loteEditar, setLoteEditar] = useState(null);

  /* =========================================================
     ANULACIÓN DE VENTA DESDE LOTES
  ========================================================= */

  const [modalAnulacionAbierto, setModalAnulacionAbierto] = useState(false);
  const [ventaParaAnular, setVentaParaAnular] = useState(null);
  const [lotePendienteEditar, setLotePendienteEditar] = useState(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState("");
  const [procesandoAnulacion, setProcesandoAnulacion] = useState(false);

  /* =========================
     NOTIFICACIÓN
  ========================= */

  const [notificacion, setNotificacion] = useState({
    visible: false,
    mensaje: "",
    tipo: "success",
  });

  const mostrarNotificacion = (mensaje, tipo = "success") => {
    setNotificacion({
      visible: true,
      mensaje,
      tipo,
    });
  };

  const cerrarNotificacion = () => {
    setNotificacion((prev) => ({
      ...prev,
      visible: false,
    }));
  };

  /* =======================================================
     CARGAR MANZANAS
  ======================================================= */

  const cargarManzanas = async () => {
    try {
      const datos = await obtenerManzanas();

      setManzanas(Array.isArray(datos) ? datos : []);
    } catch (error) {
      console.error("Error cargando manzanas:", error);

      mostrarNotificacion(
        error?.response?.data?.message ||
          "No fue posible cargar las manzanas.",
        "error"
      );
    }
  };

  /* =======================================================
     CARGAR LOTES (devuelve los datos)
  ======================================================= */

  const cargarLotes = async () => {
    try {
      setCargando(true);

      const datos = await obtenerLotes();

      const lista = Array.isArray(datos) ? datos : [];

      setLotes(lista);

      return lista;
    } catch (error) {
      console.error("Error cargando lotes:", error);

      mostrarNotificacion(
        error?.response?.data?.message ||
          "No fue posible cargar los lotes.",
        "error"
      );

      return [];
    } finally {
      setCargando(false);
    }
  };

  /* =======================================================
     CARGA INICIAL
  ======================================================= */

  useEffect(() => {
    const cargarTodo = async () => {
      await Promise.all([
        cargarManzanas(),
        cargarLotes(),
      ]);
    };

    cargarTodo();
  }, []);

  /* =======================================================
     SELECCIONAR PRIMERA MANZANA
  ======================================================= */

  useEffect(() => {
    if (!manzanaSeleccionada && manzanas.length > 0) {
      setManzanaSeleccionada(manzanas[0]._id);
    }
  }, [manzanas, manzanaSeleccionada]);

  /* =======================================================
     MANZANA ACTUAL
  ======================================================= */

  const manzanaActual = useMemo(() => {
    return manzanas.find(
      (manzana) => manzana._id === manzanaSeleccionada
    );
  }, [manzanas, manzanaSeleccionada]);

  /* =======================================================
     LOTES POR MANZANA
  ======================================================= */

  const lotesManzana = useMemo(() => {
    if (!manzanaSeleccionada) {
      return [];
    }

    return lotes.filter((lote) => {
      const idManzana = lote.manzana?._id || lote.manzana;

      return idManzana === manzanaSeleccionada;
    });
  }, [lotes, manzanaSeleccionada]);

  /* =======================================================
     FILTRO DE LOTES
  ======================================================= */

  const lotesFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return lotesManzana.filter((lote) => {
      const cumpleEstado = !filtroEstado || lote.estado === filtroEstado;

      if (!cumpleEstado) {
        return false;
      }

      if (!texto) {
        return true;
      }

      const datos = [
        lote.codigo,
        lote.numeroLote,
        lote.estado,
        lote.observaciones,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return datos.includes(texto);
    });
  }, [lotesManzana, busqueda, filtroEstado]);

  /* =======================================================
     ESTADÍSTICAS DE LA MANZANA
  ======================================================= */

  const estadisticas = useMemo(() => {
    return lotesManzana.reduce(
      (acc, lote) => {
        acc.total += 1;

        acc.valorTotal += Number(lote.valorLote) || 0;

        acc.areaTotal += Number(lote.areaM2) || 0;

        if (lote.estado === "Disponible") {
          acc.disponibles += 1;
        }

        if (lote.estado === "Reservado") {
          acc.reservados += 1;
        }

        if (lote.estado === "Vendido") {
          acc.vendidos += 1;
        }

        return acc;
      },
      {
        total: 0,
        disponibles: 0,
        reservados: 0,
        vendidos: 0,
        valorTotal: 0,
        areaTotal: 0,
      }
    );
  }, [lotesManzana]);

  /* =======================================================
     CANTIDAD LOTES POR MANZANA
  ======================================================= */

  const contarLotesManzana = (manzanaId) => {
    return lotes.filter((lote) => {
      const id = lote.manzana?._id || lote.manzana;

      return id === manzanaId;
    }).length;
  };

  /* =======================================================
     MODAL NUEVA MANZANA
  ======================================================= */

  const abrirNuevaManzana = () => {
    setManzanaEditar(null);
    setModalManzanaAbierto(true);
  };

  const abrirEditarManzana = (manzana, event) => {
    event?.stopPropagation();

    setManzanaEditar(manzana);
    setModalManzanaAbierto(true);
  };

  const cerrarModalManzana = () => {
    if (guardandoManzana) {
      return;
    }

    setModalManzanaAbierto(false);
    setManzanaEditar(null);
  };

  /* =======================================================
     GUARDAR MANZANA
  ======================================================= */

  const guardarManzana = async (datos) => {
    try {
      setGuardandoManzana(true);

      let respuesta;

      if (manzanaEditar?._id) {
        respuesta = await actualizarManzana(manzanaEditar._id, datos);
      } else {
        respuesta = await crearManzana(datos);
      }

      await cargarManzanas();

      setModalManzanaAbierto(false);
      setManzanaEditar(null);

      if (respuesta?.manzana?._id) {
        setManzanaSeleccionada(respuesta.manzana._id);
      }

      mostrarNotificacion(
        respuesta?.message ||
          (manzanaEditar
            ? "Manzana actualizada correctamente"
            : "Manzana creada correctamente")
      );
    } catch (error) {
      console.error("Error guardando manzana:", error);

      mostrarNotificacion(
        error?.response?.data?.message ||
          "No fue posible guardar la manzana.",
        "error"
      );
    } finally {
      setGuardandoManzana(false);
    }
  };

  /* =======================================================
     ELIMINAR MANZANA
  ======================================================= */

  const handleEliminarManzana = async (manzana, event) => {
    event?.stopPropagation();

    const cantidad = contarLotesManzana(manzana._id);

    if (cantidad > 0) {
      mostrarNotificacion(
        `No se puede eliminar ${manzana.nombre} porque contiene ${cantidad} lote${cantidad === 1 ? "" : "s"}.`,
        "error"
      );

      return;
    }

    const confirmar = window.confirm(
      `¿Está seguro de eliminar ${manzana.nombre}?`
    );

    if (!confirmar) {
      return;
    }

    try {
      const respuesta = await eliminarManzana(manzana._id);

      if (manzanaSeleccionada === manzana._id) {
        setManzanaSeleccionada("");
      }

      await cargarManzanas();

      mostrarNotificacion(
        respuesta?.message || "Manzana eliminada correctamente"
      );
    } catch (error) {
      console.error("Error eliminando manzana:", error);

      mostrarNotificacion(
        error?.response?.data?.message ||
          "No fue posible eliminar la manzana.",
        "error"
      );
    }
  };

  /* =======================================================
     NUEVO LOTE
  ======================================================= */

  const abrirNuevoLote = () => {
    if (!manzanaSeleccionada) {
      mostrarNotificacion(
        "Primero debe seleccionar una manzana.",
        "info"
      );

      return;
    }

    if (manzanaActual?.estado !== "Activa") {
      mostrarNotificacion(
        "No puede crear lotes dentro de una manzana inactiva.",
        "error"
      );

      return;
    }

    setLoteEditar(null);
    setModalLoteAbierto(true);
  };

  /* =======================================================
     EDITAR LOTE

     Disponible / Reservado:
     abre edición normalmente.

     Vendido:
     primero consulta la venta activa.
  ======================================================= */

  const abrirEditarLote = async (lote) => {
    /*
      Si NO está vendido,
      editamos normalmente.
    */

    if (lote.estado !== "Vendido") {
      setLoteEditar(lote);
      setModalLoteAbierto(true);
      return;
    }

    /*
      Si está vendido,
      debemos anular primero
      la venta relacionada.
    */

    try {
      setProcesandoAnulacion(true);

      const venta = await obtenerVentaActivaPorLote(lote._id);

      setVentaParaAnular(venta);
      setLotePendienteEditar(lote);
      setMotivoAnulacion("");
      setModalAnulacionAbierto(true);
    } catch (error) {
      console.error("Error consultando venta del lote:", error);

      mostrarNotificacion(
        error?.response?.data?.message ||
          "No fue posible consultar la venta asociada a este lote.",
        "error"
      );
    } finally {
      setProcesandoAnulacion(false);
    }
  };

  /* =========================================================
     CERRAR MODAL DE ANULACIÓN
  ========================================================= */

  const cerrarModalAnulacion = () => {
    if (procesandoAnulacion) {
      return;
    }

    setModalAnulacionAbierto(false);
    setVentaParaAnular(null);
    setLotePendienteEditar(null);
    setMotivoAnulacion("");
  };

  /* =========================================================
     NOMBRE DEL CLIENTE
  ========================================================= */

  const obtenerNombreVentaCliente = (cliente) => {
    if (!cliente) {
      return "Cliente";
    }

    return (
      [cliente.nombres, cliente.apellidos]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      cliente.nombre ||
      "Cliente"
    );
  };

  /* =========================================================
     ANULAR VENTA Y ABRIR EDICIÓN DEL LOTE
  ========================================================= */

  const confirmarAnulacionYEditar = async () => {
    const motivo = motivoAnulacion.trim();

    if (!motivo) {
      mostrarNotificacion(
        "Debe escribir el motivo de la anulación.",
        "error"
      );

      return;
    }

    if (motivo.length < 5) {
      mostrarNotificacion(
        "El motivo de anulación debe ser más descriptivo.",
        "error"
      );

      return;
    }

    if (!ventaParaAnular?._id || !lotePendienteEditar?._id) {
      mostrarNotificacion(
        "No fue posible identificar la venta o el lote.",
        "error"
      );

      return;
    }

    try {
      setProcesandoAnulacion(true);

      const respuesta = await anularVenta(
        ventaParaAnular._id,
        motivo
      );

      /*
        La venta ya fue anulada
        y el backend dejó el lote
        nuevamente Disponible.
      */

      const lotesActualizados = await cargarLotes();

      const loteActualizado = lotesActualizados.find(
        (lote) => lote._id === lotePendienteEditar._id
      );

      /*
        Cerramos modal de anulación.
      */

      setModalAnulacionAbierto(false);
      setVentaParaAnular(null);
      setMotivoAnulacion("");

      /*
        Abrimos inmediatamente
        la edición del lote.
      */

      setLoteEditar(
        loteActualizado || {
          ...lotePendienteEditar,
          estado: "Disponible",
        }
      );

      setLotePendienteEditar(null);
      setModalLoteAbierto(true);

      mostrarNotificacion(
        respuesta?.message ||
          "Venta anulada. Ya puede corregir los datos del lote."
      );
    } catch (error) {
      console.error("Error anulando venta:", error);

      mostrarNotificacion(
        error?.response?.data?.message ||
          "No fue posible anular la venta.",
        "error"
      );
    } finally {
      setProcesandoAnulacion(false);
    }
  };

  const cerrarModalLote = () => {
    if (guardandoLote) {
      return;
    }

    setModalLoteAbierto(false);
    setLoteEditar(null);
  };

  /* =======================================================
     GUARDAR LOTE
  ======================================================= */

  const guardarLote = async (datos) => {
    try {
      setGuardandoLote(true);

      let respuesta;

      if (loteEditar?._id) {
        respuesta = await actualizarLote(loteEditar._id, datos);
      } else {
        respuesta = await crearLote(datos);
      }

      await cargarLotes();

      setModalLoteAbierto(false);
      setLoteEditar(null);

      if (datos.manzana) {
        setManzanaSeleccionada(datos.manzana);
      }

      mostrarNotificacion(
        respuesta?.message ||
          (loteEditar
            ? "Lote actualizado correctamente"
            : "Lote creado correctamente")
      );
    } catch (error) {
      console.error("Error guardando lote:", error);

      mostrarNotificacion(
        error?.response?.data?.message ||
          "No fue posible guardar el lote.",
        "error"
      );
    } finally {
      setGuardandoLote(false);
    }
  };

  /* =======================================================
     ELIMINAR LOTE
  ======================================================= */

  const handleEliminarLote = async (lote) => {
    if (lote.estado === "Vendido") {
      mostrarNotificacion(
        "Un lote vendido no puede eliminarse.",
        "error"
      );

      return;
    }

    const confirmar = window.confirm(
      `¿Está seguro de eliminar el lote ${lote.codigo}?`
    );

    if (!confirmar) {
      return;
    }

    try {
      const respuesta = await eliminarLote(lote._id);

      await cargarLotes();

      mostrarNotificacion(
        respuesta?.message || "Lote eliminado correctamente"
      );
    } catch (error) {
      console.error("Error eliminando lote:", error);

      mostrarNotificacion(
        error?.response?.data?.message ||
          "No fue posible eliminar el lote.",
        "error"
      );
    }
  };

  /* =======================================================
     ACTUALIZAR
  ======================================================= */

  const actualizarTodo = async () => {
    await Promise.all([
      cargarManzanas(),
      cargarLotes(),
    ]);
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <section className="lotes-page">
      {/* =================================================
          CABECERA
      ================================================= */}

      <div className="lotes-header">
        <div>
          <span className="lotes-kicker">
            Gestión del proyecto
          </span>

          <h1>
            Manzanas y lotes
          </h1>

          <p>
            Organiza las manzanas,
            dimensiones, disponibilidad
            y valor general de cada lote.
          </p>
        </div>

        <div className="lotes-header-actions">
          <button
            type="button"
            className="lotes-secondary-action"
            onClick={abrirNuevaManzana}
          >
            <Building2 size={18} />

            Nueva manzana
          </button>

          <button
            type="button"
            className="lotes-primary-action"
            onClick={abrirNuevoLote}
          >
            <Plus size={19} />

            Nuevo lote
          </button>
        </div>
      </div>

      {/* =================================================
          MANZANAS
      ================================================= */}

      <div className="lotes-section-heading">
        <div>
          <span>
            Organización
          </span>

          <h2>
            Manzanas
          </h2>
        </div>

        <strong>
          {manzanas.length}{" "}
          {manzanas.length === 1
            ? "manzana"
            : "manzanas"}
        </strong>
      </div>

      {manzanas.length === 0 ? (
        <div className="manzanas-empty">
          <Building2 size={38} />

          <strong>
            No hay manzanas creadas
          </strong>

          <span>
            Cree la primera manzana para
            comenzar a registrar los lotes.
          </span>

          <button
            type="button"
            onClick={abrirNuevaManzana}
          >
            <Plus size={17} />
            Crear primera manzana
          </button>
        </div>
      ) : (
        <div className="manzanas-grid">
          {manzanas.map((manzana) => {
            const cantidad = contarLotesManzana(manzana._id);

            const activa = manzana._id === manzanaSeleccionada;

            return (
              <article
                key={manzana._id}
                className={`manzana-card ${
                  activa
                    ? "manzana-card-active"
                    : ""
                }`}
                onClick={() =>
                  setManzanaSeleccionada(manzana._id)
                }
              >
                <div className="manzana-card-top">
                  <div className="manzana-card-icon">
                    <Building2 size={20} />
                  </div>

                  <span
                    className={`manzana-status ${
                      manzana.estado === "Activa"
                        ? "activa"
                        : "inactiva"
                    }`}
                  >
                    {manzana.estado}
                  </span>
                </div>

                <span className="manzana-code">
                  {manzana.codigo}
                </span>

                <h3>
                  {manzana.nombre}
                </h3>

                <p>
                  {manzana.descripcion ||
                    "Sin descripción"}
                </p>

                <div className="manzana-card-bottom">
                  <div>
                    <strong>
                      {cantidad}
                    </strong>

                    <span>
                      {cantidad === 1
                        ? "lote"
                        : "lotes"}
                    </span>
                  </div>

                  <div className="manzana-card-actions">
                    <button
                      type="button"
                      title="Editar manzana"
                      onClick={(event) =>
                        abrirEditarManzana(
                          manzana,
                          event
                        )
                      }
                    >
                      <Edit3 size={16} />
                    </button>

                    <button
                      type="button"
                      className="delete"
                      title="Eliminar manzana"
                      onClick={(event) =>
                        handleEliminarManzana(
                          manzana,
                          event
                        )
                      }
                    >
                      <Trash2 size={16} />
                    </button>

                    <ChevronRight size={18} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* =================================================
          MANZANA SELECCIONADA
      ================================================= */}

      {manzanaActual && (
        <>
          <div className="lotes-current-heading">
            <div>
              <div className="lotes-current-title">
                <LandPlot size={22} />

                <div>
                  <span>
                    {manzanaActual.codigo}
                  </span>

                  <h2>
                    {manzanaActual.nombre}
                  </h2>
                </div>
              </div>

              <p>
                {manzanaActual.descripcion ||
                  "Lotes registrados dentro de esta manzana."}
              </p>
            </div>

            <button
              type="button"
              className="lotes-add-inside-button"
              onClick={abrirNuevoLote}
            >
              <Plus size={18} />
              Crear lote aquí
            </button>
          </div>

          {/* =============================================
              ESTADÍSTICAS
          ============================================= */}

          <div className="lotes-stats">
            <article className="lotes-stat">
              <span>
                Total lotes
              </span>

              <strong>
                {estadisticas.total}
              </strong>
            </article>

            <article className="lotes-stat disponible">
              <span>
                Disponibles
              </span>

              <strong>
                {estadisticas.disponibles}
              </strong>
            </article>

            <article className="lotes-stat reservado">
              <span>
                Reservados
              </span>

              <strong>
                {estadisticas.reservados}
              </strong>
            </article>

            <article className="lotes-stat vendido">
              <span>
                Vendidos
              </span>

              <strong>
                {estadisticas.vendidos}
              </strong>
            </article>

            <article className="lotes-stat valor">
              <span>
                Valor total
              </span>

              <strong>
                {formatearDinero(
                  estadisticas.valorTotal
                )}
              </strong>
            </article>
          </div>

          {/* =============================================
              PANEL LOTES
          ============================================= */}

          <div className="lotes-panel">
            <div className="lotes-toolbar">
              <div className="lotes-search">
                <Search size={18} />

                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) =>
                    setBusqueda(e.target.value)
                  }
                  placeholder="Buscar por código, número u observación..."
                />
              </div>

              <div className="lotes-toolbar-right">
                <select
                  value={filtroEstado}
                  onChange={(e) =>
                    setFiltroEstado(e.target.value)
                  }
                >
                  <option value="">
                    Todos los estados
                  </option>

                  <option value="Disponible">
                    Disponible
                  </option>

                  <option value="Reservado">
                    Reservado
                  </option>

                  <option value="Vendido">
                    Vendido
                  </option>
                </select>

                <button
                  type="button"
                  className="lotes-refresh-button"
                  onClick={actualizarTodo}
                  title="Actualizar"
                >
                  <RefreshCw
                    size={18}
                    className={
                      cargando
                        ? "lotes-spin"
                        : ""
                    }
                  />
                </button>
              </div>
            </div>

            {/* =============================================
                TABLA
            ============================================= */}

            <div className="lotes-table-wrapper">
              <table className="lotes-table">
                <thead>
                  <tr>
                    <th>Lote</th>
                    <th>Medidas</th>
                    <th>Área</th>
                    <th>Valor general</th>
                    <th>Estado</th>
                    <th>Observaciones</th>
                    <th className="lotes-actions-heading">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {cargando ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="lotes-empty"
                      >
                        <RefreshCw
                          size={25}
                          className="lotes-spin"
                        />

                        <span>
                          Cargando lotes...
                        </span>
                      </td>
                    </tr>
                  ) : lotesFiltrados.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="lotes-empty"
                      >
                        <LandPlot size={34} />

                        <strong>
                          No hay lotes
                        </strong>

                        <span>
                          No existen lotes
                          para los filtros
                          seleccionados.
                        </span>
                      </td>
                    </tr>
                  ) : (
                    lotesFiltrados.map((lote) => (
                      <tr key={lote._id}>
                        {/* LOTE */}

                        <td>
                          <div className="lote-main-cell">
                            <div className="lote-main-icon">
                              <LandPlot size={18} />
                            </div>

                            <div>
                              <strong>
                                {lote.codigo}
                              </strong>

                              <span>
                                Lote {lote.numeroLote}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* MEDIDAS */}

                        <td>
                          <div className="lote-medidas-table">
                            <span>
                              <strong>
                                Frente:
                              </strong>{" "}
                              {lote.frenteMetros} m{" "}
                              {lote.frenteCentimetros} cm
                            </span>

                            <span>
                              <strong>
                                Fondo:
                              </strong>{" "}
                              {lote.fondoMetros} m{" "}
                              {lote.fondoCentimetros} cm
                            </span>
                          </div>
                        </td>

                        {/* ÁREA */}

                        <td>
                          <strong className="lote-area-table">
                            {formatearArea(lote.areaM2)} m²
                          </strong>
                        </td>

                        {/* VALOR */}

                        <td>
                          <strong className="lote-value-table">
                            {formatearDinero(lote.valorLote)}
                          </strong>
                        </td>

                        {/* ESTADO */}

                        <td>
                          <span
                            className={`lote-status lote-status-${lote.estado.toLowerCase()}`}
                          >
                            {lote.estado}
                          </span>
                        </td>

                        {/* OBSERVACIÓN */}

                        <td>
                          {lote.observaciones ? (
                            <span className="lote-observation">
                              {lote.observaciones}
                            </span>
                          ) : (
                            <span className="lote-muted">
                              Sin observación
                            </span>
                          )}
                        </td>

                        {/* ACCIONES */}

                        <td>
                          <div className="lotes-actions">
                            <button
                              type="button"
                              className="edit"
                              title="Editar lote"
                              onClick={() =>
                                abrirEditarLote(lote)
                              }
                            >
                              <Edit3 size={16} />
                            </button>

                            <button
                              type="button"
                              className="delete"
                              title="Eliminar lote"
                              onClick={() =>
                                handleEliminarLote(lote)
                              }
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="lotes-table-footer">
              <span>
                Mostrando{" "}
                <strong>
                  {lotesFiltrados.length}
                </strong>{" "}
                de{" "}
                <strong>
                  {lotesManzana.length}
                </strong>{" "}
                lotes
              </span>

              <span>
                Área total:{" "}
                <strong>
                  {formatearArea(
                    estadisticas.areaTotal
                  )} m²
                </strong>
              </span>
            </div>
          </div>
        </>
      )}

      {/* =================================================
          MODAL MANZANA
      ================================================= */}

      <ManzanaModal
        abierto={modalManzanaAbierto}
        onCerrar={cerrarModalManzana}
        onGuardar={guardarManzana}
        manzanaEditar={manzanaEditar}
        guardando={guardandoManzana}
      />

      {/* =================================================
          MODAL LOTE
      ================================================= */}

      <LoteModal
        abierto={modalLoteAbierto}
        onCerrar={cerrarModalLote}
        onGuardar={guardarLote}
        loteEditar={loteEditar}
        guardando={guardandoLote}
        manzanas={manzanas}
        manzanaInicial={manzanaSeleccionada}
      />

      {/* =================================================
          ANULAR VENTA PARA EDITAR LOTE
      ================================================= */}

      {modalAnulacionAbierto && (
        <div className="lotes-modal-overlay">
          <div className="lotes-modal anulacion-lote-modal">

            {/* CABECERA */}

            <div className="lotes-modal-header">
              <div className="lotes-modal-title">
                <div className="anulacion-lote-icon">
                  <AlertTriangle size={21} />
                </div>

                <div>
                  <span className="lotes-modal-kicker">
                    Lote vendido
                  </span>

                  <h2>
                    Anular venta para editar
                  </h2>
                </div>
              </div>

              <button
                type="button"
                className="lotes-modal-close"
                onClick={cerrarModalAnulacion}
                disabled={procesandoAnulacion}
              >
                <X size={20} />
              </button>
            </div>

            {/* CUERPO */}

            <div className="lotes-modal-body">
              <div className="anulacion-lote-warning">
                <AlertTriangle size={22} />

                <div>
                  <strong>
                    Este lote ya tiene
                    una venta registrada
                  </strong>

                  <span>
                    Para modificar sus
                    datos primero debe
                    anularse la venta
                    asociada.
                  </span>
                </div>
              </div>

              <div className="anulacion-lote-info">
                <div>
                  <span>
                    Venta
                  </span>

                  <strong>
                    {ventaParaAnular?.codigo || "—"}
                  </strong>
                </div>

                <div>
                  <span>
                    Lote
                  </span>

                  <strong>
                    {lotePendienteEditar?.codigo || "—"}
                  </strong>
                </div>

                <div>
                  <span>
                    Cliente
                  </span>

                  <strong>
                    {obtenerNombreVentaCliente(
                      ventaParaAnular?.cliente
                    )}
                  </strong>
                </div>
              </div>

              <div className="lotes-field anulacion-lote-motivo">
                <label htmlFor="motivoAnulacionLote">
                  Motivo de anulación *
                </label>

                <textarea
                  id="motivoAnulacionLote"
                  value={motivoAnulacion}
                  onChange={(e) =>
                    setMotivoAnulacion(e.target.value)
                  }
                  rows="4"
                  maxLength={500}
                  placeholder="Ej. Se registraron incorrectamente las medidas del lote y deben corregirse."
                  disabled={procesandoAnulacion}
                />

                <small className="lotes-field-help">
                  Este motivo quedará
                  guardado en el historial
                  de la venta.
                </small>
              </div>

              <div className="anulacion-lote-after">
                <strong>
                  ¿Qué ocurrirá?
                </strong>

                <span>
                  La venta quedará como
                  Anulada, el lote volverá
                  a Disponible y se abrirá
                  automáticamente la
                  ventana para editarlo.
                </span>
              </div>
            </div>

            {/* BOTONES */}

            <div className="lotes-modal-footer">
              <button
                type="button"
                className="lotes-btn-secondary"
                onClick={cerrarModalAnulacion}
                disabled={procesandoAnulacion}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="anulacion-lote-button"
                onClick={confirmarAnulacionYEditar}
                disabled={procesandoAnulacion}
              >
                <AlertTriangle size={17} />

                {procesandoAnulacion
                  ? "Anulando..."
                  : "Anular venta y editar lote"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          NOTIFICACIÓN
      ================================================= */}

      <Toast
        visible={notificacion.visible}
        mensaje={notificacion.mensaje}
        tipo={notificacion.tipo}
        onClose={cerrarNotificacion}
      />
    </section>
  );
}