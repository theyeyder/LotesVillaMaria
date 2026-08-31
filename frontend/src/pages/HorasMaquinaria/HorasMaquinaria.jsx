import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Clock3,
  CalendarDays,
  CalendarRange,
  Calendar,
  Tractor,
  RefreshCw,
  Printer,
} from "lucide-react";

import HoraModal from "./HoraModal";
import Toast from "../../components/ui/Toast";
import "./HorasMaquinaria.css";

import {
  obtenerHorasMaquinaria,
  crearHoraMaquinaria,
  actualizarHoraMaquinaria,
  eliminarHoraMaquinaria,
  obtenerResumenHoras,
  obtenerResumenOperarios,
} from "../../services/horaMaquinaria.service";

import { obtenerMaquinarias } from "../../services/maquinaria.service";

const formatearMinutos = (minutos = 0) => {
  const valor = Number(minutos) || 0;

  const horas = Math.floor(valor / 60);
  const resto = valor % 60;

  if (horas === 0 && resto === 0) {
    return "0 h";
  }

  if (resto === 0) {
    return `${horas} h`;
  }

  return `${horas} h ${resto} min`;
};

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

const formatearFecha = (fecha) => {
  if (!fecha) {
    return "";
  }

  const date = new Date(fecha);

  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
};

const obtenerFechaLocal = () => {
  const hoy = new Date();

  const local = new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000);

  return local.toISOString().slice(0, 10);
};

const fechaUTC = (fecha) => {
  const date = new Date(fecha);

  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const obtenerRangos = (fechaReferencia) => {
  const referencia = new Date(`${fechaReferencia}T00:00:00.000Z`);

  const inicioDia = fechaUTC(referencia);

  const finDia = new Date(inicioDia.getTime() + 24 * 60 * 60 * 1000 - 1);

  const inicioSemana = new Date(inicioDia);

  const diaSemana = inicioSemana.getUTCDay();

  const diferencia = diaSemana === 0 ? -6 : 1 - diaSemana;

  inicioSemana.setUTCDate(inicioSemana.getUTCDate() + diferencia);

  const finSemana = new Date(inicioSemana.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);

  const inicioMes = new Date(Date.UTC(referencia.getUTCFullYear(), referencia.getUTCMonth(), 1));

  const finMes = new Date(Date.UTC(referencia.getUTCFullYear(), referencia.getUTCMonth() + 1, 1) - 1);

  const inicioAnio = new Date(Date.UTC(referencia.getUTCFullYear(), 0, 1));

  const finAnio = new Date(Date.UTC(referencia.getUTCFullYear() + 1, 0, 1) - 1);

  return {
    inicioDia,
    finDia,
    inicioSemana,
    finSemana,
    inicioMes,
    finMes,
    inicioAnio,
    finAnio,
  };
};

export default function HorasMaquinaria() {
  const [registros, setRegistros] = useState([]);
  const [maquinarias, setMaquinarias] = useState([]);

  const [busqueda, setBusqueda] = useState("");

  const [filtroMaquinaria, setFiltroMaquinaria] = useState("");

  const [fechaReferencia, setFechaReferencia] = useState(obtenerFechaLocal());

  const [resumen, setResumen] = useState({
    dia: {
      totalMinutos: 0,
      valorPagar: 0,
    },

    semana: {
      totalMinutos: 0,
      valorPagar: 0,
    },

    mes: {
      totalMinutos: 0,
      valorPagar: 0,
    },

    anio: {
      totalMinutos: 0,
      valorPagar: 0,
    },
  });

  const [resumenOperarios, setResumenOperarios] = useState([]);

  const [totalOperarios, setTotalOperarios] = useState({
    dia: 0,
    valorDia: 0,

    semana: 0,
    valorSemana: 0,

    mes: 0,
    valorMes: 0,

    anio: 0,
    valorAnio: 0,

    total: 0,
    valorTotal: 0,
  });

  const [cargando, setCargando] = useState(true);
  const [cargandoResumen, setCargandoResumen] = useState(true);

  const [guardando, setGuardando] = useState(false);

  const [error, setError] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);

  const [registroEditar, setRegistroEditar] = useState(null);

  const [notificacion, setNotificacion] = useState({
    visible: false,
    mensaje: "",
    tipo: "success",
  });

  const [paginaActual, setPaginaActual] = useState(1);

  const REGISTROS_POR_PAGINA = 5;

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

  const cargarMaquinarias = async () => {
    try {
      const datos = await obtenerMaquinarias();

      setMaquinarias(Array.isArray(datos) ? datos : []);
    } catch (error) {
      console.error("Error cargando maquinaria:", error);
    }
  };

  const cargarRegistros = async () => {
    try {
      setCargando(true);
      setError("");

      const params = {};

      if (filtroMaquinaria) {
        params.maquinaria = filtroMaquinaria;
      }

      if (fechaReferencia) {
        params.fechaInicio = fechaReferencia;

        params.fechaFinal = fechaReferencia;
      }

      const datos = await obtenerHorasMaquinaria(params);

      setRegistros(Array.isArray(datos) ? datos : []);
    } catch (error) {
      console.error("Error cargando horas:", error);

      setError(error?.response?.data?.message || "No fue posible cargar las horas trabajadas.");
    } finally {
      setCargando(false);
    }
  };

  const cargarResumen = async () => {
    try {
      setCargandoResumen(true);

      const params = {
        fecha: fechaReferencia,
      };

      if (filtroMaquinaria) {
        params.maquinaria = filtroMaquinaria;
      }

      const datos = await obtenerResumenHoras(params);

      setResumen({
        dia: {
          totalMinutos:
            datos?.dia?.totalMinutos || 0,

          valorPagar:
            datos?.dia?.valorPagar || 0,
        },

        semana: {
          totalMinutos:
            datos?.semana?.totalMinutos || 0,

          valorPagar:
            datos?.semana?.valorPagar || 0,
        },

        mes: {
          totalMinutos:
            datos?.mes?.totalMinutos || 0,

          valorPagar:
            datos?.mes?.valorPagar || 0,
        },

        anio: {
          totalMinutos:
            datos?.anio?.totalMinutos || 0,

          valorPagar:
            datos?.anio?.valorPagar || 0,
        },
      });
    } catch (error) {
      console.error("Error cargando resumen:", error);

      mostrarNotificacion(
        error?.response?.data?.message || "No fue posible calcular el resumen de horas.",
        "error"
      );
    } finally {
      setCargandoResumen(false);
    }
  };

  const cargarResumenOperarios = async () => {
    try {
      const params = {
        fecha: fechaReferencia,
      };

      if (filtroMaquinaria) {
        params.maquinaria = filtroMaquinaria;
      }

      const datos = await obtenerResumenOperarios(params);

      setResumenOperarios(Array.isArray(datos?.operarios) ? datos.operarios : []);
      setTotalOperarios(
        datos?.totalGeneral || {
          dia: 0,
          valorDia: 0,

          semana: 0,
          valorSemana: 0,

          mes: 0,
          valorMes: 0,

          anio: 0,
          valorAnio: 0,

          total: 0,
          valorTotal: 0,
        }
      );
    } catch (error) {
      console.error("Error cargando resumen por operario:", error);
    }
  };

  useEffect(() => {
    cargarMaquinarias();
  }, []);

  useEffect(() => {
    cargarRegistros();
  }, [filtroMaquinaria, fechaReferencia]);

  useEffect(() => {
    cargarResumen();
  }, [filtroMaquinaria, fechaReferencia]);

  useEffect(() => {
    cargarResumenOperarios();
  }, [filtroMaquinaria, fechaReferencia]);

  const registrosFiltrados = (() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) {
      return registros;
    }

    return registros.filter((registro) => {
      const maquinaNombre = registro.maquinaria?.nombre || "";

      const maquinaCodigo = registro.maquinaria?.codigo || "";

      const operario = registro.operario || "";

      const observaciones = registro.observaciones || "";

      const datos = [maquinaNombre, maquinaCodigo, operario, observaciones]
        .join(" ")
        .toLowerCase();

      return datos.includes(texto);
    });
  })();

  const totalPaginas = Math.max(
    1,
    Math.ceil(registrosFiltrados.length / REGISTROS_POR_PAGINA)
  );

  const indiceInicial = (paginaActual - 1) * REGISTROS_POR_PAGINA;

  const indiceFinal = indiceInicial + REGISTROS_POR_PAGINA;

  const registrosPaginados = registrosFiltrados.slice(indiceInicial, indiceFinal);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroMaquinaria, fechaReferencia]);

  useEffect(() => {
    if (paginaActual > totalPaginas) {
      setPaginaActual(totalPaginas);
    }
  }, [paginaActual, totalPaginas]);

  // ============================================================
  // handleImprimir - VERSIÓN CON INYECCIÓN AUTOMÁTICA DE ESTILOS
  // ============================================================
  const handleImprimir = () => {
    const encabezado = document.querySelector(".horas-print-header");
    const resumen = document.querySelector(".horas-print-operarios");
    const detalle = document.querySelector(".horas-print-detalle");

    if (!encabezado || !resumen || !detalle) {
      mostrarNotificacion("No fue posible generar el reporte.", "error");
      return;
    }

    /*
      Tomamos todos los CSS que actualmente
      tiene cargados nuestra aplicación.

      Esto incluye HorasMaquinaria.css.
    */
    const estilos = Array.from(
      document.head.querySelectorAll('link[rel="stylesheet"], style')
    )
      .map((elemento) => {
        if (elemento.tagName === "LINK") {
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
      })
      .join("");

    const ventanaImpresion = window.open("", "_blank", "width=1250,height=850");

    if (!ventanaImpresion) {
      mostrarNotificacion(
        "El navegador bloqueó la ventana de impresión. Permita las ventanas emergentes.",
        "error"
      );

      return;
    }

    ventanaImpresion.document.write(`
      <!DOCTYPE html>

      <html lang="es">
        <head>
          <meta charset="UTF-8" />

          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />

          <title>
            Reporte de horas - Lotes Villa María
          </title>

          ${estilos}
        </head>

        <body class="horas-reporte-window">

          <div class="acciones-impresion">

            <button
              type="button"
              class="btn-cerrar"
              onclick="window.close()"
            >
              Cerrar
            </button>

            <button
              type="button"
              class="btn-imprimir"
              onclick="window.print()"
            >
              Imprimir reporte
            </button>

          </div>

          <main class="reporte-contenedor">

            ${encabezado.outerHTML}

            ${resumen.outerHTML}

            ${detalle.outerHTML}

          </main>

        </body>
      </html>
    `);

    ventanaImpresion.document.close();

    ventanaImpresion.focus();
  };

  const abrirNuevoRegistro = () => {
    setRegistroEditar(null);
    setModalAbierto(true);
  };

  const abrirEditarRegistro = (registro) => {
    setRegistroEditar(registro);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    if (guardando) {
      return;
    }

    setModalAbierto(false);
    setRegistroEditar(null);
  };

  const guardarRegistro = async (datos) => {
    try {
      setGuardando(true);

      if (registroEditar?._id) {
        const respuesta = await actualizarHoraMaquinaria(registroEditar._id, datos);

        mostrarNotificacion(respuesta?.message || "Registro de horas actualizado correctamente");
      } else {
        const respuesta = await crearHoraMaquinaria(datos);

        mostrarNotificacion(respuesta?.message || "Horas de maquinaria registradas correctamente");
      }

      await Promise.all([
        cargarRegistros(),
        cargarResumen(),
        cargarResumenOperarios(),
      ]);

      setModalAbierto(false);
      setRegistroEditar(null);
    } catch (error) {
      console.error("Error guardando horas:", error);

      mostrarNotificacion(
        error?.response?.data?.message || "No fue posible guardar el registro de horas.",
        "error"
      );
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (registro) => {
    const maquina = registro.maquinaria?.nombre || "la máquina";

    const fecha = formatearFecha(registro.fecha);

    const confirmar = window.confirm(
      `¿Está seguro de eliminar el registro de ${maquina} del ${fecha}?`
    );

    if (!confirmar) {
      return;
    }

    try {
      const respuesta = await eliminarHoraMaquinaria(registro._id);

      mostrarNotificacion(respuesta?.message || "Registro de horas eliminado correctamente");

      await Promise.all([
        cargarRegistros(),
        cargarResumen(),
        cargarResumenOperarios(),
      ]);
    } catch (error) {
      console.error("Error eliminando registro:", error);

      mostrarNotificacion(
        error?.response?.data?.message || "No fue posible eliminar el registro.",
        "error"
      );
    }
  };

  const actualizarTodo = async () => {
    await Promise.all([
      cargarRegistros(),
      cargarResumen(),
      cargarMaquinarias(),
      cargarResumenOperarios(),
    ]);
  };

  const maquinaSeleccionada = maquinarias.find((maquina) => maquina._id === filtroMaquinaria);

  return (
    <section className="horas-page">
      <div className="horas-header">
        <div>
          <span className="horas-kicker">Control operativo</span>

          <h1>Horas trabajadas</h1>

          <p>Controla las jornadas y el tiempo trabajado por cada máquina.</p>
        </div>

        <div className="horas-header-actions">
          <button type="button" className="horas-print-button" onClick={handleImprimir}>
            <Printer size={18} />
            Imprimir
          </button>

          <button type="button" className="horas-new-button" onClick={abrirNuevoRegistro}>
            <Plus size={19} />
            Registrar horas
          </button>
        </div>
      </div>

      {/* ============================================ */}
      {/* ENCABEZADO PARA IMPRESIÓN */}
      {/* ============================================ */}
      <div className="horas-print-header">
        <h1>Lotes Villa María</h1>

        <h2>Reporte de horas trabajadas de maquinaria</h2>

        <div className="horas-print-info">
          <p>
            <strong>Máquina:</strong>{" "}
            {maquinaSeleccionada
              ? `${maquinaSeleccionada.codigo} - ${maquinaSeleccionada.nombre}`
              : "Todas las máquinas"}
          </p>

          <p>
            <strong>Fecha de referencia:</strong>{" "}
            {formatearFecha(`${fechaReferencia}T00:00:00.000Z`)}
          </p>

          <p>
            <strong>Registros mostrados:</strong> {registrosFiltrados.length}
          </p>
        </div>
      </div>

      <div className="horas-summary-filter">
        <div className="horas-filter-group">
          <label>Máquina</label>

          <select
            value={filtroMaquinaria}
            onChange={(e) => setFiltroMaquinaria(e.target.value)}
          >
            <option value="">Todas las máquinas</option>

            {maquinarias.map((maquina) => (
              <option key={maquina._id} value={maquina._id}>
                {maquina.codigo} - {maquina.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="horas-filter-group">
          <label>Fecha de referencia</label>

          <input
            type="date"
            value={fechaReferencia}
            onChange={(e) => setFechaReferencia(e.target.value)}
          />
        </div>

        {maquinaSeleccionada && (
          <div className="horas-selected-machine">
            <Tractor size={18} />

            <div>
              <span>Máquina seleccionada</span>

              <strong>
                {maquinaSeleccionada.codigo} - {maquinaSeleccionada.nombre}
              </strong>
            </div>
          </div>
        )}
      </div>

      <div className="horas-stats">
        <article className="horas-stat-card">
          <div className="horas-stat-icon">
            <Clock3 size={22} />
          </div>

          <div>
            <span>Día</span>

            <strong>
              {cargandoResumen ? "..." : formatearMinutos(resumen.dia.totalMinutos)}
            </strong>
          </div>
        </article>

        <article className="horas-stat-card">
          <div className="horas-stat-icon">
            <CalendarDays size={22} />
          </div>

          <div>
            <span>Semana</span>

            <strong>
              {cargandoResumen ? "..." : formatearMinutos(resumen.semana.totalMinutos)}
            </strong>
          </div>
        </article>

        <article className="horas-stat-card">
          <div className="horas-stat-icon">
            <CalendarRange size={22} />
          </div>

          <div>
            <span>Mes</span>

            <strong>
              {cargandoResumen ? "..." : formatearMinutos(resumen.mes.totalMinutos)}
            </strong>
          </div>
        </article>

        <article className="horas-stat-card">
          <div className="horas-stat-icon">
            <Calendar size={22} />
          </div>

          <div>
            <span>Año</span>

            <strong>
              {cargandoResumen ? "..." : formatearMinutos(resumen.anio.totalMinutos)}
            </strong>
          </div>
        </article>
      </div>

      {/* ============================================ */}
      {/* RESUMEN POR OPERARIO PARA IMPRESIÓN */}
      {/* ============================================ */}
      <div className="horas-print-operarios">
        <h3>Resumen de horas por operario</h3>

        <table className="horas-print-table horas-print-table-resumen">
          <thead>
            <tr>
              <th>Operario</th>
              <th>Día</th>
              <th>Semana</th>
              <th>Mes</th>
              <th>Año</th>
              <th>Total trabajado</th>
              <th>Total a pagar</th>
            </tr>
          </thead>

          <tbody>
            {resumenOperarios.map((operario) => (
              <tr key={operario.operario}>
                <td>{operario.operario}</td>

                <td>{formatearMinutos(operario.dia)}</td>

                <td>{formatearMinutos(operario.semana)}</td>

                <td>{formatearMinutos(operario.mes)}</td>

                <td>{formatearMinutos(operario.anio)}</td>

                <td>
                  <strong>{formatearMinutos(operario.total)}</strong>
                </td>

                <td>
                  <strong>{formatearDinero(operario.valorTotal)}</strong>
                </td>
              </tr>
            ))}

            <tr className="horas-print-total-row">
              <td>
                <strong>TOTAL GENERAL</strong>
              </td>

              <td>
                <strong>{formatearMinutos(totalOperarios.dia)}</strong>
              </td>

              <td>
                <strong>{formatearMinutos(totalOperarios.semana)}</strong>
              </td>

              <td>
                <strong>{formatearMinutos(totalOperarios.mes)}</strong>
              </td>

              <td>
                <strong>{formatearMinutos(totalOperarios.anio)}</strong>
              </td>

              <td>
                <strong>{formatearMinutos(totalOperarios.total)}</strong>
              </td>

              <td>
                <strong>{formatearDinero(totalOperarios.valorTotal)}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ============================================ */}
      {/* DETALLE DE JORNADAS PARA IMPRESIÓN */}
      {/* ============================================ */}
      <div className="horas-print-detalle">
        <h3>Detalle de jornadas</h3>

        <table className="horas-print-table horas-print-table-detalle">
          <thead>
            <tr>
              <th>Máquina</th>
              <th>Operario</th>
              <th>Fecha</th>
              <th>Mañana</th>
              <th>Tarde</th>
              <th>Noche</th>
              <th>Horas realizadas</th>
              <th>Valor hora</th>
              <th>Valor a pagar</th>
              <th>Observación</th>
            </tr>
          </thead>

          <tbody>
            {registrosFiltrados.map((registro) => (
              <tr key={registro._id}>
                <td>
                  <div className="print-maquina">
                    <strong>{registro.maquinaria?.codigo}</strong>
                    <span>{registro.maquinaria?.nombre}</span>
                  </div>
                </td>

                <td>
                  <strong className="print-operario">{registro.operario}</strong>
                </td>

                <td>{formatearFecha(registro.fecha)}</td>

                {["Mañana", "Tarde", "Noche"].map((periodo) => {
                  const turno = registro.turnos?.find((item) => item.periodo === periodo);

                  return (
                    <td key={periodo}>
                      {turno?.activo ? (
                        <div className="print-turno">
                          <strong>
                            {turno.horaInicio} - {turno.horaFinal}
                          </strong>
                          <span>{formatearMinutos(turno.totalMinutos)}</span>
                        </div>
                      ) : (
                        <span className="print-sin-turno">—</span>
                      )}
                    </td>
                  );
                })}

                {/* HORAS REALIZADAS */}

                <td>
                  <span className="print-total-horas">
                    {formatearMinutos(
                      registro.totalMinutos
                    )}
                  </span>
                </td>

                {/* VALOR HORA */}

                <td>
                  {Number(
                    registro.valorHora
                  ) > 0
                    ? formatearDinero(
                        registro.valorHora
                      )
                    : "—"}
                </td>

                {/* VALOR A PAGAR */}

                <td>
                  <strong>
                    {Number(
                      registro.valorPagar
                    ) > 0
                      ? formatearDinero(
                          registro.valorPagar
                        )
                      : "—"}
                  </strong>
                </td>

                {/* OBSERVACIÓN */}

                <td>
                  {registro.observaciones ||
                    "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="horas-panel">
        <div className="horas-toolbar">
          <div className="horas-search">
            <Search size={19} />

            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por máquina, código, operario u observación..."
            />
          </div>

          <button
            type="button"
            className="horas-refresh-button"
            onClick={actualizarTodo}
            title="Actualizar registros"
          >
            <RefreshCw size={18} className={cargando ? "horas-spin" : ""} />
          </button>
        </div>

        {error && (
          <div className="horas-error">
            <span>{error}</span>

            <button type="button" onClick={cargarRegistros}>
              Reintentar
            </button>
          </div>
        )}

        <div className="horas-table-wrapper">
          <table className="horas-table">
            <thead>
              <tr>
                <th>Máquina</th>
                <th>Operario</th>
                <th>Fecha</th>
                <th>Mañana</th>
                <th>Tarde</th>
                <th>Noche</th>
                <th>Horas realizadas</th>
                <th>Valor hora</th>
                <th>Valor a pagar</th>
                <th>Observaciones</th>
                <th className="horas-actions-title">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan="11" className="horas-empty">
                    <RefreshCw size={24} className="horas-spin" />

                    <span>Cargando registros...</span>
                  </td>
                </tr>
              ) : registrosPaginados.length === 0 ? (
                <tr>
                  <td colSpan="11" className="horas-empty">
                    <Clock3 size={32} />

                    <strong>No hay horas registradas</strong>

                    <span>Registra la primera jornada de trabajo de una máquina.</span>
                  </td>
                </tr>
              ) : (
                registrosPaginados.map((registro) => (
                  <tr key={registro._id}>
                    <td>
                      <div className="horas-machine-cell">
                        <div className="horas-machine-icon">
                          <Tractor size={18} />
                        </div>

                        <div>
                          <strong>{registro.maquinaria?.codigo}</strong>

                          <span>{registro.maquinaria?.nombre}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <strong className="horas-operario">{registro.operario}</strong>
                    </td>

                    <td>{formatearFecha(registro.fecha)}</td>

                    {["Mañana", "Tarde", "Noche"].map((periodo) => {
                      const turno = registro.turnos?.find((item) => item.periodo === periodo);

                      return (
                        <td key={periodo}>
                          {turno?.activo ? (
                            <div className="horas-turno-table">
                              <strong>
                                {turno.horaInicio} - {turno.horaFinal}
                              </strong>
                              <span>{formatearMinutos(turno.totalMinutos)}</span>
                            </div>
                          ) : (
                            <span className="horas-muted">—</span>
                          )}
                        </td>
                      );
                    })}

                    {/* HORAS REALIZADAS */}

                    <td>
                      <span className="horas-total">
                        {formatearMinutos(
                          registro.totalMinutos
                        )}
                      </span>
                    </td>

                    {/* VALOR HORA */}

                    <td>
                      {Number(
                        registro.valorHora
                      ) > 0 ? (
                        <strong className="horas-valor-hora">
                          {formatearDinero(
                            registro.valorHora
                          )}
                        </strong>
                      ) : (
                        <span className="horas-muted">
                          —
                        </span>
                      )}
                    </td>

                    {/* VALOR A PAGAR */}

                    <td>
                      {Number(
                        registro.valorPagar
                      ) > 0 ? (
                        <strong className="horas-valor-pagar">
                          {formatearDinero(
                            registro.valorPagar
                          )}
                        </strong>
                      ) : (
                        <span className="horas-muted">
                          —
                        </span>
                      )}
                    </td>

                    {/* OBSERVACIONES */}

                    <td>
                      {registro.observaciones ? (
                        <span className="horas-observacion">
                          {registro.observaciones}
                        </span>
                      ) : (
                        <span className="horas-muted">
                          Sin observación
                        </span>
                      )}
                    </td>

                    <td>
                      <div className="horas-actions">
                        <button
                          type="button"
                          className="horas-action-button edit"
                          onClick={() => abrirEditarRegistro(registro)}
                          title="Editar registro"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          className="horas-action-button delete"
                          onClick={() => handleEliminar(registro)}
                          title="Eliminar registro"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!cargando && (
          <div className="horas-table-footer">
            <div className="horas-pagination-info">
              {registrosFiltrados.length === 0 ? (
                <span>No hay registros</span>
              ) : (
                <span>
                  Mostrando <strong>{indiceInicial + 1}</strong> -{" "}
                  <strong>{Math.min(indiceFinal, registrosFiltrados.length)}</strong> de{" "}
                  <strong>{registrosFiltrados.length}</strong> registros
                </span>
              )}
            </div>

            <div className="horas-pagination">
              <button
                type="button"
                onClick={() => setPaginaActual((pagina) => Math.max(pagina - 1, 1))}
                disabled={paginaActual === 1}
              >
                Anterior
              </button>

              <span className="horas-pagination-current">
                Página <strong>{paginaActual}</strong> de <strong>{totalPaginas}</strong>
              </span>

              <button
                type="button"
                onClick={() => setPaginaActual((pagina) => Math.min(pagina + 1, totalPaginas))}
                disabled={paginaActual === totalPaginas}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      <HoraModal
        abierto={modalAbierto}
        onCerrar={cerrarModal}
        onGuardar={guardarRegistro}
        registroEditar={registroEditar}
        guardando={guardando}
        maquinarias={maquinarias}
      />

      <Toast
        visible={notificacion.visible}
        mensaje={notificacion.mensaje}
        tipo={notificacion.tipo}
        onClose={cerrarNotificacion}
      />
    </section>
  );
}