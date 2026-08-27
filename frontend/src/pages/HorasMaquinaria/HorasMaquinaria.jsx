import { useEffect, useMemo, useState } from "react";
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
} from "../../services/horaMaquinaria.service";

import {
  obtenerMaquinarias,
} from "../../services/maquinaria.service";

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

  const local = new Date(
    hoy.getTime() -
      hoy.getTimezoneOffset() * 60000
  );

  return local
    .toISOString()
    .slice(0, 10);
};

const fechaUTC = (fecha) => {
  const date = new Date(fecha);

  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    )
  );
};

const obtenerRangos = (fechaReferencia) => {
  const referencia = new Date(
    `${fechaReferencia}T00:00:00.000Z`
  );

  const inicioDia = fechaUTC(referencia);

  const finDia = new Date(
    inicioDia.getTime() +
      24 * 60 * 60 * 1000 -
      1
  );

  const inicioSemana = new Date(inicioDia);

  const diaSemana = inicioSemana.getUTCDay();

  const diferencia =
    diaSemana === 0
      ? -6
      : 1 - diaSemana;

  inicioSemana.setUTCDate(
    inicioSemana.getUTCDate() + diferencia
  );

  const finSemana = new Date(
    inicioSemana.getTime() +
      7 * 24 * 60 * 60 * 1000 -
      1
  );

  const inicioMes = new Date(
    Date.UTC(
      referencia.getUTCFullYear(),
      referencia.getUTCMonth(),
      1
    )
  );

  const finMes = new Date(
    Date.UTC(
      referencia.getUTCFullYear(),
      referencia.getUTCMonth() + 1,
      1
    ) - 1
  );

  const inicioAnio = new Date(
    Date.UTC(
      referencia.getUTCFullYear(),
      0,
      1
    )
  );

  const finAnio = new Date(
    Date.UTC(
      referencia.getUTCFullYear() + 1,
      0,
      1
    ) - 1
  );

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

  const [filtroMaquinaria, setFiltroMaquinaria] =
    useState("");

  const [fechaReferencia, setFechaReferencia] =
    useState(obtenerFechaLocal());

  const [resumen, setResumen] = useState({
    dia: {
      totalMinutos: 0,
    },
    semana: {
      totalMinutos: 0,
    },
    mes: {
      totalMinutos: 0,
    },
    anio: {
      totalMinutos: 0,
    },
  });

  const [cargando, setCargando] = useState(true);
  const [cargandoResumen, setCargandoResumen] =
    useState(true);

  const [guardando, setGuardando] = useState(false);

  const [error, setError] = useState("");

  const [modalAbierto, setModalAbierto] =
    useState(false);

  const [registroEditar, setRegistroEditar] =
    useState(null);

  const [notificacion, setNotificacion] =
    useState({
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

  const cerrarNotificacion = () => {
    setNotificacion((prev) => ({
      ...prev,
      visible: false,
    }));
  };

  const cargarMaquinarias = async () => {
    try {
      const datos =
        await obtenerMaquinarias();

      setMaquinarias(
        Array.isArray(datos) ? datos : []
      );
    } catch (error) {
      console.error(
        "Error cargando maquinaria:",
        error
      );
    }
  };

  const cargarRegistros = async () => {
    try {
      setCargando(true);
      setError("");

      const params = {};

      if (filtroMaquinaria) {
        params.maquinaria =
          filtroMaquinaria;
      }

      const datos =
        await obtenerHorasMaquinaria(
          params
        );

      setRegistros(
        Array.isArray(datos) ? datos : []
      );
    } catch (error) {
      console.error(
        "Error cargando horas:",
        error
      );

      setError(
        error?.response?.data?.message ||
          "No fue posible cargar las horas trabajadas."
      );
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
        params.maquinaria =
          filtroMaquinaria;
      }

      const datos =
        await obtenerResumenHoras(
          params
        );

      setResumen({
        dia: {
          totalMinutos:
            datos?.dia?.totalMinutos || 0,
        },

        semana: {
          totalMinutos:
            datos?.semana?.totalMinutos ||
            0,
        },

        mes: {
          totalMinutos:
            datos?.mes?.totalMinutos || 0,
        },

        anio: {
          totalMinutos:
            datos?.anio?.totalMinutos ||
            0,
        },
      });
    } catch (error) {
      console.error(
        "Error cargando resumen:",
        error
      );

      mostrarNotificacion(
        error?.response?.data?.message ||
          "No fue posible calcular el resumen de horas.",
        "error"
      );
    } finally {
      setCargandoResumen(false);
    }
  };

  useEffect(() => {
    cargarMaquinarias();
  }, []);

  useEffect(() => {
    cargarRegistros();
  }, [filtroMaquinaria]);

  useEffect(() => {
    cargarResumen();
  }, [
    filtroMaquinaria,
    fechaReferencia,
  ]);

  const registrosFiltrados = useMemo(() => {
    const texto = busqueda
      .trim()
      .toLowerCase();

    if (!texto) {
      return registros;
    }

    return registros.filter(
      (registro) => {
        const maquinaNombre =
          registro.maquinaria?.nombre ||
          "";

        const maquinaCodigo =
          registro.maquinaria?.codigo ||
          "";

        const operario =
          registro.operario || "";

        const observaciones =
          registro.observaciones || "";

        const datos = [
          maquinaNombre,
          maquinaCodigo,
          operario,
          observaciones,
          registro.horaInicio,
          registro.horaFinal,
        ]
          .join(" ")
          .toLowerCase();

        return datos.includes(texto);
      }
    );
  }, [registros, busqueda]);

  const resumenOperarios = useMemo(() => {
    const rangos =
      obtenerRangos(fechaReferencia);

    const operarios = {};

    registrosFiltrados.forEach(
      (registro) => {
        const nombre =
          registro.operario?.trim() ||
          "Sin operario";

        if (!operarios[nombre]) {
          operarios[nombre] = {
            operario: nombre,
            dia: 0,
            semana: 0,
            mes: 0,
            anio: 0,
            total: 0,
          };
        }

        const minutos =
          Number(
            registro.totalMinutos
          ) || 0;

        const fechaRegistro =
          new Date(registro.fecha);

        operarios[nombre].total +=
          minutos;

        if (
          fechaRegistro >=
            rangos.inicioDia &&
          fechaRegistro <=
            rangos.finDia
        ) {
          operarios[nombre].dia +=
            minutos;
        }

        if (
          fechaRegistro >=
            rangos.inicioSemana &&
          fechaRegistro <=
            rangos.finSemana
        ) {
          operarios[nombre].semana +=
            minutos;
        }

        if (
          fechaRegistro >=
            rangos.inicioMes &&
          fechaRegistro <=
            rangos.finMes
        ) {
          operarios[nombre].mes +=
            minutos;
        }

        if (
          fechaRegistro >=
            rangos.inicioAnio &&
          fechaRegistro <=
            rangos.finAnio
        ) {
          operarios[nombre].anio +=
            minutos;
        }
      }
    );

    return Object.values(
      operarios
    ).sort((a, b) =>
      a.operario.localeCompare(
        b.operario,
        "es"
      )
    );
  }, [
    registrosFiltrados,
    fechaReferencia,
  ]);

  const totalOperarios = useMemo(() => {
    return resumenOperarios.reduce(
      (total, operario) => ({
        dia:
          total.dia +
          operario.dia,

        semana:
          total.semana +
          operario.semana,

        mes:
          total.mes +
          operario.mes,

        anio:
          total.anio +
          operario.anio,

        total:
          total.total +
          operario.total,
      }),
      {
        dia: 0,
        semana: 0,
        mes: 0,
        anio: 0,
        total: 0,
      }
    );
  }, [resumenOperarios]);

  const handleImprimir = () => {
    window.print();
  };

  const abrirNuevoRegistro = () => {
    setRegistroEditar(null);
    setModalAbierto(true);
  };

  const abrirEditarRegistro = (
    registro
  ) => {
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

  const guardarRegistro = async (
    datos
  ) => {
    try {
      setGuardando(true);

      if (registroEditar?._id) {
        const respuesta =
          await actualizarHoraMaquinaria(
            registroEditar._id,
            datos
          );

        mostrarNotificacion(
          respuesta?.message ||
            "Registro de horas actualizado correctamente"
        );
      } else {
        const respuesta =
          await crearHoraMaquinaria(
            datos
          );

        mostrarNotificacion(
          respuesta?.message ||
            "Horas de maquinaria registradas correctamente"
        );
      }

      await Promise.all([
        cargarRegistros(),
        cargarResumen(),
      ]);

      setModalAbierto(false);
      setRegistroEditar(null);
    } catch (error) {
      console.error(
        "Error guardando horas:",
        error
      );

      mostrarNotificacion(
        error?.response?.data?.message ||
          "No fue posible guardar el registro de horas.",
        "error"
      );
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (
    registro
  ) => {
    const maquina =
      registro.maquinaria?.nombre ||
      "la máquina";

    const fecha =
      formatearFecha(registro.fecha);

    const confirmar = window.confirm(
      `¿Está seguro de eliminar el registro de ${maquina} del ${fecha}?`
    );

    if (!confirmar) {
      return;
    }

    try {
      const respuesta =
        await eliminarHoraMaquinaria(
          registro._id
        );

      mostrarNotificacion(
        respuesta?.message ||
          "Registro de horas eliminado correctamente"
      );

      await Promise.all([
        cargarRegistros(),
        cargarResumen(),
      ]);
    } catch (error) {
      console.error(
        "Error eliminando registro:",
        error
      );

      mostrarNotificacion(
        error?.response?.data?.message ||
          "No fue posible eliminar el registro.",
        "error"
      );
    }
  };

  const actualizarTodo = async () => {
    await Promise.all([
      cargarRegistros(),
      cargarResumen(),
      cargarMaquinarias(),
    ]);
  };

  const maquinaSeleccionada =
    maquinarias.find(
      (maquina) =>
        maquina._id ===
        filtroMaquinaria
    );

  return (
    <section className="horas-page">
      <div className="horas-header">
        <div>
          <span className="horas-kicker">
            Control operativo
          </span>

          <h1>Horas trabajadas</h1>

          <p>
            Controla las jornadas y el
            tiempo trabajado por cada
            máquina.
          </p>
        </div>

        <div className="horas-header-actions">
          <button
            type="button"
            className="horas-print-button"
            onClick={handleImprimir}
          >
            <Printer size={18} />
            Imprimir
          </button>

          <button
            type="button"
            className="horas-new-button"
            onClick={abrirNuevoRegistro}
          >
            <Plus size={19} />
            Registrar horas
          </button>
        </div>
      </div>

      <div className="horas-print-header">
        <h1>Lotes Villa María</h1>

        <h2>
          Reporte de horas trabajadas de maquinaria
        </h2>

        <div className="horas-print-info">
          <p>
            <strong>Máquina:</strong>{" "}
            {maquinaSeleccionada
              ? `${maquinaSeleccionada.codigo} - ${maquinaSeleccionada.nombre}`
              : "Todas las máquinas"}
          </p>

          <p>
            <strong>Fecha de referencia:</strong>{" "}
            {fechaReferencia}
          </p>

          <p>
            <strong>Registros mostrados:</strong>{" "}
            {registrosFiltrados.length}
          </p>
        </div>
      </div>

      <div className="horas-summary-filter">
        <div className="horas-filter-group">
          <label>
            Máquina
          </label>

          <select
            value={filtroMaquinaria}
            onChange={(e) =>
              setFiltroMaquinaria(
                e.target.value
              )
            }
          >
            <option value="">
              Todas las máquinas
            </option>

            {maquinarias.map(
              (maquina) => (
                <option
                  key={maquina._id}
                  value={maquina._id}
                >
                  {maquina.codigo} -{" "}
                  {maquina.nombre}
                </option>
              )
            )}
          </select>
        </div>

        <div className="horas-filter-group">
          <label>
            Fecha de referencia
          </label>

          <input
            type="date"
            value={fechaReferencia}
            onChange={(e) =>
              setFechaReferencia(
                e.target.value
              )
            }
          />
        </div>

        {maquinaSeleccionada && (
          <div className="horas-selected-machine">
            <Tractor size={18} />

            <div>
              <span>
                Máquina seleccionada
              </span>

              <strong>
                {
                  maquinaSeleccionada.codigo
                }{" "}
                -{" "}
                {
                  maquinaSeleccionada.nombre
                }
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
            <span>
              Día
            </span>

            <strong>
              {cargandoResumen
                ? "..."
                : formatearMinutos(
                    resumen.dia
                      .totalMinutos
                  )}
            </strong>
          </div>
        </article>

        <article className="horas-stat-card">
          <div className="horas-stat-icon">
            <CalendarDays size={22} />
          </div>

          <div>
            <span>
              Semana
            </span>

            <strong>
              {cargandoResumen
                ? "..."
                : formatearMinutos(
                    resumen.semana
                      .totalMinutos
                  )}
            </strong>
          </div>
        </article>

        <article className="horas-stat-card">
          <div className="horas-stat-icon">
            <CalendarRange size={22} />
          </div>

          <div>
            <span>
              Mes
            </span>

            <strong>
              {cargandoResumen
                ? "..."
                : formatearMinutos(
                    resumen.mes
                      .totalMinutos
                  )}
            </strong>
          </div>
        </article>

        <article className="horas-stat-card">
          <div className="horas-stat-icon">
            <Calendar size={22} />
          </div>

          <div>
            <span>
              Año
            </span>

            <strong>
              {cargandoResumen
                ? "..."
                : formatearMinutos(
                    resumen.anio
                      .totalMinutos
                  )}
            </strong>
          </div>
        </article>
      </div>

      <div className="horas-print-operarios">
        <h3>
          Resumen de horas por operario
        </h3>

        <table>
          <thead>
            <tr>
              <th>Operario</th>
              <th>Día</th>
              <th>Semana</th>
              <th>Mes</th>
              <th>Año</th>
              <th>
                Total trabajado
              </th>
            </tr>
          </thead>

          <tbody>
            {resumenOperarios.map(
              (operario) => (
                <tr
                  key={
                    operario.operario
                  }
                >
                  <td>
                    {operario.operario}
                  </td>

                  <td>
                    {formatearMinutos(
                      operario.dia
                    )}
                  </td>

                  <td>
                    {formatearMinutos(
                      operario.semana
                    )}
                  </td>

                  <td>
                    {formatearMinutos(
                      operario.mes
                    )}
                  </td>

                  <td>
                    {formatearMinutos(
                      operario.anio
                    )}
                  </td>

                  <td>
                    <strong>
                      {formatearMinutos(
                        operario.total
                      )}
                    </strong>
                  </td>
                </tr>
              )
            )}

            <tr className="horas-print-total-row">
              <td>
                <strong>
                  TOTAL GENERAL
                </strong>
              </td>

              <td>
                <strong>
                  {formatearMinutos(
                    totalOperarios.dia
                  )}
                </strong>
              </td>

              <td>
                <strong>
                  {formatearMinutos(
                    totalOperarios.semana
                  )}
                </strong>
              </td>

              <td>
                <strong>
                  {formatearMinutos(
                    totalOperarios.mes
                  )}
                </strong>
              </td>

              <td>
                <strong>
                  {formatearMinutos(
                    totalOperarios.anio
                  )}
                </strong>
              </td>

              <td>
                <strong>
                  {formatearMinutos(
                    totalOperarios.total
                  )}
                </strong>
              </td>
            </tr>
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
              onChange={(e) =>
                setBusqueda(
                  e.target.value
                )
              }
              placeholder="Buscar por máquina, código, operario u observación..."
            />
          </div>

          <button
            type="button"
            className="horas-refresh-button"
            onClick={actualizarTodo}
            title="Actualizar registros"
          >
            <RefreshCw
              size={18}
              className={
                cargando
                  ? "horas-spin"
                  : ""
              }
            />
          </button>
        </div>

        {error && (
          <div className="horas-error">
            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={
                cargarRegistros
              }
            >
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
                <th>Inicio</th>
                <th>Final</th>
                <th>Total</th>
                <th>
                  Observaciones
                </th>
                <th className="horas-actions-title">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {cargando ? (
                <tr>
                  <td
                    colSpan="8"
                    className="horas-empty"
                  >
                    <RefreshCw
                      size={24}
                      className="horas-spin"
                    />

                    <span>
                      Cargando registros...
                    </span>
                  </td>
                </tr>
              ) : registrosFiltrados.length ===
                0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="horas-empty"
                  >
                    <Clock3 size={32} />

                    <strong>
                      No hay horas registradas
                    </strong>

                    <span>
                      Registra la primera
                      jornada de trabajo de
                      una máquina.
                    </span>
                  </td>
                </tr>
              ) : (
                registrosFiltrados.map(
                  (registro) => (
                    <tr
                      key={
                        registro._id
                      }
                    >
                      <td>
                        <div className="horas-machine-cell">
                          <div className="horas-machine-icon">
                            <Tractor
                              size={18}
                            />
                          </div>

                          <div>
                            <strong>
                              {
                                registro
                                  .maquinaria
                                  ?.codigo
                              }
                            </strong>

                            <span>
                              {
                                registro
                                  .maquinaria
                                  ?.nombre
                              }
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <strong className="horas-operario">
                          {
                            registro.operario
                          }
                        </strong>
                      </td>

                      <td>
                        {
                          formatearFecha(
                            registro.fecha
                          )
                        }
                      </td>

                      <td>
                        <span className="horas-time">
                          {
                            registro.horaInicio
                          }
                        </span>
                      </td>

                      <td>
                        <span className="horas-time">
                          {
                            registro.horaFinal
                          }
                        </span>
                      </td>

                      <td>
                        <span className="horas-total">
                          {formatearMinutos(
                            registro.totalMinutos
                          )}
                        </span>
                      </td>

                      <td>
                        {registro.observaciones ? (
                          <span className="horas-observacion">
                            {
                              registro.observaciones
                            }
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
                            onClick={() =>
                              abrirEditarRegistro(
                                registro
                              )
                            }
                            title="Editar registro"
                          >
                            <Pencil
                              size={17}
                            />
                          </button>

                          <button
                            type="button"
                            className="horas-action-button delete"
                            onClick={() =>
                              handleEliminar(
                                registro
                              )
                            }
                            title="Eliminar registro"
                          >
                            <Trash2
                              size={17}
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

        {!cargando && (
          <div className="horas-table-footer">
            Mostrando{" "}
            <strong>
              {
                registrosFiltrados.length
              }
            </strong>{" "}
            de{" "}
            <strong>
              {registros.length}
            </strong>{" "}
            registros
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
        visible={
          notificacion.visible
        }
        mensaje={
          notificacion.mensaje
        }
        tipo={notificacion.tipo}
        onClose={
          cerrarNotificacion
        }
      />
    </section>
  );
}