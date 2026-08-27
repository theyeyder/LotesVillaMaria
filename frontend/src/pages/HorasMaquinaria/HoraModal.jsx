import { useEffect, useMemo, useState } from "react";
import {
  Save,
  X,
  Clock3,
  Tractor,
  Sun,
  Sunset,
  Moon,
} from "lucide-react";

const crearTurnosIniciales = () => [
  {
    periodo: "Mañana",
    activo: false,
    horaInicio: "",
    horaFinal: "",
  },
  {
    periodo: "Tarde",
    activo: false,
    horaInicio: "",
    horaFinal: "",
  },
  {
    periodo: "Noche",
    activo: false,
    horaInicio: "",
    horaFinal: "",
  },
];

const estadoInicial = {
  maquinaria: "",
  operario: "",
  fecha: "",
  observaciones: "",
  turnos: crearTurnosIniciales(),
};

/* ==========================================
   FUNCIONES DE HORAS
========================================== */

const convertirHoraAMinutos = (hora) => {
  if (!hora || !hora.includes(":")) {
    return null;
  }

  const [horas, minutos] = hora
    .split(":")
    .map(Number);

  if (
    Number.isNaN(horas) ||
    Number.isNaN(minutos)
  ) {
    return null;
  }

  return horas * 60 + minutos;
};

const calcularMinutosTurno = (
  horaInicio,
  horaFinal,
  periodo
) => {
  const inicio =
    convertirHoraAMinutos(horaInicio);

  let final =
    convertirHoraAMinutos(horaFinal);

  if (
    inicio === null ||
    final === null
  ) {
    return 0;
  }

  /*
    El turno noche puede terminar
    después de la medianoche.

    Ejemplo:
    19:00 - 02:00 = 7 horas
  */
  if (
    periodo === "Noche" &&
    final <= inicio
  ) {
    final += 24 * 60;
  }

  if (
    periodo !== "Noche" &&
    final <= inicio
  ) {
    return 0;
  }

  return Math.max(
    0,
    final - inicio
  );
};

const formatearMinutos = (minutos = 0) => {
  const valor = Number(minutos) || 0;

  const horas =
    Math.floor(valor / 60);

  const resto =
    valor % 60;

  if (valor === 0) {
    return "0 h";
  }

  if (resto === 0) {
    return `${horas} h`;
  }

  return `${horas} h ${resto} min`;
};

const obtenerFechaLocal = () => {
  const hoy = new Date();

  return new Date(
    hoy.getTime() -
      hoy.getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 10);
};

const obtenerIconoTurno = (periodo) => {
  if (periodo === "Mañana") {
    return Sun;
  }

  if (periodo === "Tarde") {
    return Sunset;
  }

  return Moon;
};

/* ==========================================
   COMPONENTE
========================================== */

export default function HoraModal({
  abierto,
  onCerrar,
  onGuardar,
  registroEditar,
  guardando,
  maquinarias = [],
}) {
  const [form, setForm] =
    useState(estadoInicial);

  useEffect(() => {
    if (registroEditar) {
      const turnosExistentes =
        crearTurnosIniciales().map(
          (turnoBase) => {
            const encontrado =
              registroEditar.turnos?.find(
                (turno) =>
                  turno.periodo ===
                  turnoBase.periodo
              );

            if (!encontrado) {
              return turnoBase;
            }

            return {
              periodo:
                turnoBase.periodo,

              activo:
                Boolean(
                  encontrado.activo
                ),

              horaInicio:
                encontrado.horaInicio ||
                "",

              horaFinal:
                encontrado.horaFinal ||
                "",
            };
          }
        );

      setForm({
        maquinaria:
          registroEditar.maquinaria?._id ||
          registroEditar.maquinaria ||
          "",

        operario:
          registroEditar.operario ||
          "",

        fecha:
          registroEditar.fecha
            ? new Date(
                registroEditar.fecha
              )
                .toISOString()
                .slice(0, 10)
            : obtenerFechaLocal(),

        observaciones:
          registroEditar.observaciones ||
          "",

        turnos:
          turnosExistentes,
      });
    } else {
      setForm({
        ...estadoInicial,

        fecha:
          obtenerFechaLocal(),

        turnos:
          crearTurnosIniciales(),
      });
    }
  }, [
    registroEditar,
    abierto,
  ]);

  /* ==========================================
     TOTALES
  ========================================== */

  const turnosCalculados =
    useMemo(() => {
      return form.turnos.map(
        (turno) => ({
          ...turno,

          totalMinutos:
            turno.activo
              ? calcularMinutosTurno(
                  turno.horaInicio,
                  turno.horaFinal,
                  turno.periodo
                )
              : 0,
        })
      );
    }, [form.turnos]);

  const totalMinutos =
    useMemo(() => {
      return turnosCalculados.reduce(
        (total, turno) =>
          total +
          turno.totalMinutos,
        0
      );
    }, [turnosCalculados]);

  /* ==========================================
     CAMBIOS GENERALES
  ========================================== */

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* ==========================================
     ACTIVAR / DESACTIVAR TURNO
  ========================================== */

  const toggleTurno = (periodo) => {
    setForm((prev) => ({
      ...prev,

      turnos:
        prev.turnos.map(
          (turno) => {
            if (
              turno.periodo !==
              periodo
            ) {
              return turno;
            }

            const nuevoActivo =
              !turno.activo;

            return {
              ...turno,

              activo:
                nuevoActivo,

              horaInicio:
                nuevoActivo
                  ? turno.horaInicio
                  : "",

              horaFinal:
                nuevoActivo
                  ? turno.horaFinal
                  : "",
            };
          }
        ),
    }));
  };

  /* ==========================================
     CAMBIAR HORARIOS
  ========================================== */

  const cambiarHoraTurno = (
    periodo,
    campo,
    valor
  ) => {
    setForm((prev) => ({
      ...prev,

      turnos:
        prev.turnos.map(
          (turno) =>
            turno.periodo ===
            periodo
              ? {
                  ...turno,
                  [campo]:
                    valor,
                }
              : turno
        ),
    }));
  };

  /* ==========================================
     GUARDAR
  ========================================== */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.maquinaria) {
      alert(
        "Debe seleccionar una máquina"
      );
      return;
    }

    if (!form.operario.trim()) {
      alert(
        "El operario es obligatorio"
      );
      return;
    }

    if (!form.fecha) {
      alert(
        "La fecha es obligatoria"
      );
      return;
    }

    const activos =
      form.turnos.filter(
        (turno) =>
          turno.activo
      );

    if (
      activos.length === 0
    ) {
      alert(
        "Debe activar al menos un turno"
      );
      return;
    }

    for (
      const turno of activos
    ) {
      if (
        !turno.horaInicio ||
        !turno.horaFinal
      ) {
        alert(
          `Complete la hora de inicio y final del turno ${turno.periodo}`
        );
        return;
      }

      const minutos =
        calcularMinutosTurno(
          turno.horaInicio,
          turno.horaFinal,
          turno.periodo
        );

      if (minutos <= 0) {
        alert(
          `El horario del turno ${turno.periodo} no es válido`
        );
        return;
      }
    }

    await onGuardar({
      maquinaria:
        form.maquinaria,

      operario:
        form.operario,

      fecha:
        form.fecha,

      observaciones:
        form.observaciones,

      turnos:
        form.turnos,
    });
  };

  if (!abierto) {
    return null;
  }

  return (
    <div className="horas-modal-overlay">
      <div className="horas-modal horas-modal-turnos">
        <div className="horas-modal-header">
          <div className="horas-modal-title">
            <div className="horas-modal-icon">
              <Clock3 size={20} />
            </div>

            <div>
              <span className="horas-modal-kicker">
                {registroEditar
                  ? "Actualizar jornada"
                  : "Nuevo registro"}
              </span>

              <h2>
                {registroEditar
                  ? "Editar horas trabajadas"
                  : "Registrar horas trabajadas"}
              </h2>
            </div>
          </div>

          <button
            type="button"
            className="horas-modal-close"
            onClick={onCerrar}
            disabled={guardando}
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
        >
          <div className="horas-modal-body">
            <div className="horas-form-grid">
              {/* MÁQUINA */}

              <div className="horas-field horas-field-full">
                <label htmlFor="maquinaria">
                  Máquina *
                </label>

                <div className="horas-select-with-icon">
                  <Tractor
                    size={18}
                  />

                  <select
                    id="maquinaria"
                    name="maquinaria"
                    value={
                      form.maquinaria
                    }
                    onChange={
                      handleChange
                    }
                  >
                    <option value="">
                      Seleccione una máquina
                    </option>

                    {maquinarias
                      .filter(
                        (maquina) =>
                          maquina.estado ===
                            "Activa" ||
                          maquina._id ===
                            form.maquinaria
                      )
                      .map(
                        (maquina) => (
                          <option
                            key={
                              maquina._id
                            }
                            value={
                              maquina._id
                            }
                          >
                            {
                              maquina.codigo
                            }{" "}
                            -{" "}
                            {
                              maquina.nombre
                            }
                          </option>
                        )
                      )}
                  </select>
                </div>
              </div>

              {/* OPERARIO */}

              <div className="horas-field">
                <label htmlFor="operario">
                  Operario *
                </label>

                <input
                  id="operario"
                  type="text"
                  name="operario"
                  value={
                    form.operario
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Ej. Juan Pérez"
                  autoComplete="off"
                />
              </div>

              {/* FECHA */}

              <div className="horas-field">
                <label htmlFor="fecha">
                  Fecha *
                </label>

                <input
                  id="fecha"
                  type="date"
                  name="fecha"
                  value={
                    form.fecha
                  }
                  onChange={
                    handleChange
                  }
                />
              </div>
            </div>

            {/* =========================
                TURNOS
            ========================== */}

            <div className="horas-turnos-section">
              <div className="horas-turnos-title">
                <div>
                  <span>
                    Jornada laboral
                  </span>

                  <h3>
                    Seleccione los turnos trabajados
                  </h3>
                </div>

                <small>
                  Puede activar uno o varios turnos
                </small>
              </div>

              <div className="horas-turnos-list">
                {turnosCalculados.map(
                  (turno) => {
                    const Icon =
                      obtenerIconoTurno(
                        turno.periodo
                      );

                    return (
                      <div
                        key={
                          turno.periodo
                        }
                        className={`horas-turno-card ${
                          turno.activo
                            ? "horas-turno-card-active"
                            : ""
                        }`}
                      >
                        <div className="horas-turno-header">
                          <div className="horas-turno-name">
                            <div className="horas-turno-icon">
                              <Icon
                                size={18}
                              />
                            </div>

                            <div>
                              <strong>
                                {
                                  turno.periodo
                                }
                              </strong>

                              <span>
                                {turno.activo
                                  ? "Turno activo"
                                  : "No trabajado"}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            className={`horas-turno-toggle ${
                              turno.activo
                                ? "active"
                                : ""
                            }`}
                            onClick={() =>
                              toggleTurno(
                                turno.periodo
                              )
                            }
                          >
                            <span />

                            {turno.activo
                              ? "Activo"
                              : "Activar"}
                          </button>
                        </div>

                        {turno.activo && (
                          <div className="horas-turno-content">
                            <div className="horas-turno-field">
                              <label>
                                Hora inicio
                              </label>

                              <input
                                type="time"
                                value={
                                  turno.horaInicio
                                }
                                onChange={(
                                  e
                                ) =>
                                  cambiarHoraTurno(
                                    turno.periodo,
                                    "horaInicio",
                                    e
                                      .target
                                      .value
                                  )
                                }
                              />
                            </div>

                            <div className="horas-turno-field">
                              <label>
                                Hora final
                              </label>

                              <input
                                type="time"
                                value={
                                  turno.horaFinal
                                }
                                onChange={(
                                  e
                                ) =>
                                  cambiarHoraTurno(
                                    turno.periodo,
                                    "horaFinal",
                                    e
                                      .target
                                      .value
                                  )
                                }
                              />
                            </div>

                            <div className="horas-turno-total">
                              <span>
                                Total
                              </span>

                              <strong>
                                {formatearMinutos(
                                  turno.totalMinutos
                                )}
                              </strong>
                            </div>

                            {turno.periodo ===
                              "Noche" && (
                              <small className="horas-turno-night-help">
                                Puede terminar al día siguiente.
                                Ejemplo: 19:00 - 02:00.
                              </small>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            {/* TOTAL GENERAL */}

            <div className="horas-total-preview horas-total-preview-general">
              <div>
                <span>
                  Total de horas trabajadas del día
                </span>

                <strong>
                  {formatearMinutos(
                    totalMinutos
                  )}
                </strong>

                <small>
                  Suma automática de los turnos activos
                </small>
              </div>

              <Clock3
                size={27}
              />
            </div>

            {/* OBSERVACIONES */}

            <div className="horas-field horas-observaciones-field">
              <label htmlFor="observaciones">
                Observaciones
              </label>

              <textarea
                id="observaciones"
                name="observaciones"
                value={
                  form.observaciones
                }
                onChange={
                  handleChange
                }
                placeholder="Información adicional del trabajo realizado"
                rows="3"
              />
            </div>
          </div>

          <div className="horas-modal-footer">
            <button
              type="button"
              className="horas-btn-secondary"
              onClick={onCerrar}
              disabled={guardando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="horas-btn-primary"
              disabled={guardando}
            >
              <Save size={18} />

              {guardando
                ? "Guardando..."
                : registroEditar
                ? "Actualizar registro"
                : "Guardar registro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}