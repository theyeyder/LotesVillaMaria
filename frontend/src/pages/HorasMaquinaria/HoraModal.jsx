import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Banknote,
  Clock3,
  Moon,
  Save,
  Sun,
  Sunset,
  Tractor,
  UserRound,
  X,
} from "lucide-react";

/* =========================================================
   TURNOS INICIALES
========================================================= */

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

/* =========================================================
   ESTADO INICIAL
========================================================= */

const estadoInicial = {
  maquinaria: "",

  operario: "",

  fecha: "",

  valorHora: "",

  observaciones: "",

  turnos:
    crearTurnosIniciales(),
};

/* =========================================================
   CONVERTIR HORA A MINUTOS
========================================================= */

const convertirHoraAMinutos = (
  hora
) => {
  if (
    !hora ||
    !hora.includes(":")
  ) {
    return null;
  }

  const [
    horas,
    minutos,
  ] = hora
    .split(":")
    .map(Number);

  if (
    Number.isNaN(
      horas
    ) ||
    Number.isNaN(
      minutos
    )
  ) {
    return null;
  }

  return (
    horas * 60 +
    minutos
  );
};

/* =========================================================
   CALCULAR MINUTOS DE UN TURNO
========================================================= */

const calcularMinutosTurno = (
  horaInicio,
  horaFinal,
  periodo
) => {
  const inicio =
    convertirHoraAMinutos(
      horaInicio
    );

  let final =
    convertirHoraAMinutos(
      horaFinal
    );

  if (
    inicio === null ||
    final === null
  ) {
    return 0;
  }

  /*
    El turno noche puede terminar
    después de medianoche.

    Ejemplo:
    19:00 → 02:00
    =
    7 horas
  */

  if (
    periodo ===
      "Noche" &&
    final <= inicio
  ) {
    final +=
      24 * 60;
  }

  /*
    Mañana y tarde no pueden
    terminar antes de comenzar.
  */

  if (
    periodo !==
      "Noche" &&
    final <= inicio
  ) {
    return 0;
  }

  return Math.max(
    0,
    final -
      inicio
  );
};

/* =========================================================
   FORMATEAR MINUTOS

   455 minutos
   →
   7 h 35 min
========================================================= */

const formatearMinutos = (
  minutos = 0
) => {
  const valor =
    Number(
      minutos
    ) || 0;

  const horas =
    Math.floor(
      valor / 60
    );

  const resto =
    valor % 60;

  if (
    valor === 0
  ) {
    return "0 h";
  }

  if (
    resto === 0
  ) {
    return `${horas} h`;
  }

  return `${horas} h ${resto} min`;
};

/* =========================================================
   HORAS DECIMALES

   7 h 30 min
   =
   7.50 horas

   Se usa solamente como referencia
   matemática para el pago.
========================================================= */

const convertirMinutosAHoras =
  (
    minutos = 0
  ) => {
    return (
      Number(
        minutos
      ) || 0
    ) / 60;
  };

/* =========================================================
   FORMATO DINERO
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
    Number(
      valor
    ) || 0
  );
};

/* =========================================================
   FECHA LOCAL
========================================================= */

const obtenerFechaLocal = () => {
  const hoy =
    new Date();

  return new Date(
    hoy.getTime() -
      hoy.getTimezoneOffset() *
        60000
  )
    .toISOString()
    .slice(
      0,
      10
    );
};

/* =========================================================
   ICONO SEGÚN TURNO
========================================================= */

const obtenerIconoTurno = (
  periodo
) => {
  if (
    periodo ===
    "Mañana"
  ) {
    return Sun;
  }

  if (
    periodo ===
    "Tarde"
  ) {
    return Sunset;
  }

  return Moon;
};

/* =========================================================
   NORMALIZAR NOMBRE
========================================================= */

const normalizarNombre = (
  nombre = ""
) => {
  return String(
    nombre
  )
    .trim()
    .replace(
      /\s+/g,
      " "
    );
};

/* =========================================================
   COMPONENTE
========================================================= */

export default function HoraModal({
  abierto,
  onCerrar,
  onGuardar,
  registroEditar,
  guardando,
  maquinarias = [],
}) {
  const [
    form,
    setForm,
  ] = useState(
    estadoInicial
  );

  /* =======================================================
     CARGAR DATOS
  ======================================================= */

  useEffect(() => {
    if (
      !abierto
    ) {
      return;
    }

    /* =========================
       EDITAR
    ========================= */

    if (
      registroEditar
    ) {
      const turnosExistentes =
        crearTurnosIniciales().map(
          (
            turnoBase
          ) => {
            const encontrado =
              registroEditar.turnos?.find(
                (
                  turno
                ) =>
                  turno.periodo ===
                  turnoBase.periodo
              );

            if (
              !encontrado
            ) {
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
          registroEditar.maquinaria
            ?._id ||
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
                .slice(
                  0,
                  10
                )
            : obtenerFechaLocal(),

        valorHora:
          registroEditar.valorHora !==
            undefined &&
          registroEditar.valorHora !==
            null
            ? String(
                registroEditar.valorHora
              )
            : "",

        observaciones:
          registroEditar.observaciones ||
          "",

        turnos:
          turnosExistentes,
      });

      return;
    }

    /* =========================
       NUEVO REGISTRO
    ========================= */

    setForm({
      ...estadoInicial,

      fecha:
        obtenerFechaLocal(),

      turnos:
        crearTurnosIniciales(),
    });
  }, [
    registroEditar,
    abierto,
  ]);

  /* =======================================================
     TURNOS CALCULADOS
  ======================================================= */

  const turnosCalculados =
    useMemo(() => {
      return form.turnos.map(
        (
          turno
        ) => ({
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
    }, [
      form.turnos,
    ]);

  /* =======================================================
     TOTAL MINUTOS
  ======================================================= */

  const totalMinutos =
    useMemo(() => {
      return turnosCalculados.reduce(
        (
          total,
          turno
        ) =>
          total +
          turno.totalMinutos,
        0
      );
    }, [
      turnosCalculados,
    ]);

  /* =======================================================
     HORAS DECIMALES
  ======================================================= */

  const horasDecimales =
    useMemo(() => {
      return convertirMinutosAHoras(
        totalMinutos
      );
    }, [
      totalMinutos,
    ]);

  /* =======================================================
     VALOR DE LA HORA
  ======================================================= */

  const valorHora =
    Number(
      form.valorHora
    ) || 0;

  /* =======================================================
     VALOR A PAGAR

     Incluye los minutos.

     Ejemplo:

     7 h 35 min
     =
     455 min

     455 / 60
     =
     7.583333 h

     × $45.000
     =
     $341.250
  ======================================================= */

  const valorPagar =
    useMemo(() => {
      if (
        totalMinutos <=
          0 ||
        valorHora <= 0
      ) {
        return 0;
      }

      return Math.round(
        (
          totalMinutos /
          60
        ) *
          valorHora
      );
    }, [
      totalMinutos,
      valorHora,
    ]);

  /* =======================================================
     DETECTAR CAMBIO DE NOMBRE

     Solo se usa para mostrar aviso.
     El cambio masivo real lo hace
     el backend.
  ======================================================= */

  const nombreOperarioCambio =
    useMemo(() => {
      if (
        !registroEditar
      ) {
        return false;
      }

      const anterior =
        normalizarNombre(
          registroEditar.operario
        ).toLocaleLowerCase(
          "es"
        );

      const nuevo =
        normalizarNombre(
          form.operario
        ).toLocaleLowerCase(
          "es"
        );

      return (
        Boolean(
          anterior
        ) &&
        Boolean(
          nuevo
        ) &&
        anterior !==
          nuevo
      );
    }, [
      registroEditar,
      form.operario,
    ]);

  /* =======================================================
     CAMBIOS GENERALES
  ======================================================= */

  const handleChange =
    (
      e
    ) => {
      const {
        name,
        value,
      } = e.target;

      setForm(
        (
          prev
        ) => ({
          ...prev,

          [name]:
            value,
        })
      );
    };

  /* =======================================================
     VALOR HORA

     Solo números.
  ======================================================= */

  const handleValorHoraChange =
    (
      e
    ) => {
      const limpio =
        e.target.value.replace(
          /\D/g,
          ""
        );

      setForm(
        (
          prev
        ) => ({
          ...prev,

          valorHora:
            limpio,
        })
      );
    };

  /* =======================================================
     ACTIVAR / DESACTIVAR TURNO
  ======================================================= */

  const toggleTurno =
    (
      periodo
    ) => {
      setForm(
        (
          prev
        ) => ({
          ...prev,

          turnos:
            prev.turnos.map(
              (
                turno
              ) => {
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
        })
      );
    };

  /* =======================================================
     CAMBIAR HORARIOS
  ======================================================= */

  const cambiarHoraTurno =
    (
      periodo,
      campo,
      valor
    ) => {
      setForm(
        (
          prev
        ) => ({
          ...prev,

          turnos:
            prev.turnos.map(
              (
                turno
              ) =>
                turno.periodo ===
                periodo
                  ? {
                      ...turno,

                      [campo]:
                        valor,
                    }
                  : turno
            ),
        })
      );
    };

  /* =======================================================
     GUARDAR
  ======================================================= */

  const handleSubmit =
    async (
      e
    ) => {
      e.preventDefault();

      /* =========================
         MÁQUINA
      ========================= */

      if (
        !form.maquinaria
      ) {
        alert(
          "Debe seleccionar una máquina"
        );

        return;
      }

      /* =========================
         OPERARIO
      ========================= */

      if (
        !form.operario.trim()
      ) {
        alert(
          "El operario es obligatorio"
        );

        return;
      }

      /* =========================
         FECHA
      ========================= */

      if (
        !form.fecha
      ) {
        alert(
          "La fecha es obligatoria"
        );

        return;
      }

      /* =========================
         VALOR HORA
      ========================= */

      if (
        !Number.isFinite(
          valorHora
        ) ||
        valorHora <= 0
      ) {
        alert(
          "El valor de la hora debe ser mayor que cero"
        );

        return;
      }

      /* =========================
         TURNOS
      ========================= */

      const activos =
        form.turnos.filter(
          (
            turno
          ) =>
            turno.activo
        );

      if (
        activos.length ===
        0
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

        if (
          minutos <= 0
        ) {
          alert(
            `El horario del turno ${turno.periodo} no es válido`
          );

          return;
        }
      }

      /* =========================
         ENVIAR
      ========================= */

      await onGuardar({
        maquinaria:
          form.maquinaria,

        operario:
          normalizarNombre(
            form.operario
          ),

        fecha:
          form.fecha,

        /*
          NUEVO CAMPO
        */

        valorHora,

        /*
          El backend vuelve a calcular
          totalMinutos y valorPagar.
          No confiamos solamente en
          estos cálculos visuales.
        */

        observaciones:
          form.observaciones.trim(),

        turnos:
          form.turnos,
      });
    };

  if (
    !abierto
  ) {
    return null;
  }

  return (
    <div className="horas-modal-overlay">

      <div className="horas-modal horas-modal-turnos">

        {/* =========================================
            CABECERA
        ========================================= */}

        <div className="horas-modal-header">

          <div className="horas-modal-title">

            <div className="horas-modal-icon">
              <Clock3
                size={20}
              />
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
            onClick={
              onCerrar
            }
            disabled={
              guardando
            }
          >
            <X
              size={20}
            />
          </button>

        </div>

        {/* =========================================
            FORMULARIO
        ========================================= */}

        <form
          onSubmit={
            handleSubmit
          }
        >

          <div className="horas-modal-body">

            <div className="horas-form-grid">

              {/* ===================================
                  MÁQUINA
              =================================== */}

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
                        (
                          maquina
                        ) =>
                          maquina.estado ===
                            "Activa" ||
                          maquina._id ===
                            form.maquinaria
                      )
                      .map(
                        (
                          maquina
                        ) => (
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

              {/* ===================================
                  OPERARIO
              =================================== */}

              <div className="horas-field">

                <label htmlFor="operario">
                  Operario *
                </label>

                <div className="horas-input-with-icon">

                  <UserRound
                    size={17}
                  />

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

              </div>

              {/* ===================================
                  FECHA
              =================================== */}

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

              {/* ===================================
                  VALOR DE LA HORA
              =================================== */}

              <div className="horas-field horas-field-full">

                <label htmlFor="valorHora">
                  Valor de la hora *
                </label>

                <div className="horas-money-input">

                  <span>
                    $
                  </span>

                  <input
                    id="valorHora"
                    type="text"
                    inputMode="numeric"
                    name="valorHora"
                    value={
                      form.valorHora
                    }
                    onChange={
                      handleValorHoraChange
                    }
                    placeholder="Ej. 45000"
                    autoComplete="off"
                  />

                </div>

                <small className="horas-money-help">

                  {form.valorHora
                    ? `Valor registrado: ${formatearDinero(
                        form.valorHora
                      )} por hora`
                    : "Ingrese el valor pagado por una hora de trabajo"}

                </small>

              </div>

            </div>

            {/* =====================================
                AVISO CAMBIO OPERARIO
            ===================================== */}

            {nombreOperarioCambio && (
              <div className="horas-operario-change-warning">

                <UserRound
                  size={19}
                />

                <div>

                  <strong>
                    Cambio de nombre del operario
                  </strong>

                  <span>
                    Al guardar, el nombre{" "}
                    <b>
                      {
                        registroEditar.operario
                      }
                    </b>{" "}
                    se cambiará a{" "}
                    <b>
                      {
                        normalizarNombre(
                          form.operario
                        )
                      }
                    </b>{" "}
                    en todos los registros anteriores
                    de este operario.
                  </span>

                </div>

              </div>
            )}

            {/* =====================================
                TURNOS
            ===================================== */}

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
                  (
                    turno
                  ) => {
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

                        {/* =========================
                            CABECERA TURNO
                        ========================= */}

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

                        {/* =========================
                            CONTENIDO TURNO
                        ========================= */}

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
                                onChange={
                                  (
                                    e
                                  ) =>
                                    cambiarHoraTurno(
                                      turno.periodo,
                                      "horaInicio",
                                      e.target.value
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
                                onChange={
                                  (
                                    e
                                  ) =>
                                    cambiarHoraTurno(
                                      turno.periodo,
                                      "horaFinal",
                                      e.target.value
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

            {/* =====================================
                RESUMEN ECONÓMICO
            ===================================== */}

            <div className="horas-payment-summary">

              {/* HORAS REALIZADAS */}

              <div className="horas-payment-card horas-payment-hours">

                <div className="horas-payment-icon">
                  <Clock3
                    size={22}
                  />
                </div>

                <div>

                  <span>
                    Horas realizadas
                  </span>

                  <strong>
                    {formatearMinutos(
                      totalMinutos
                    )}
                  </strong>

                  <small>
                    {totalMinutos >
                    0
                      ? `${horasDecimales.toLocaleString(
                          "es-CO",
                          {
                            minimumFractionDigits:
                              2,

                            maximumFractionDigits:
                              4,
                          }
                        )} horas para cálculo`
                      : "Sin horas registradas"}
                  </small>

                </div>

              </div>

              {/* VALOR HORA */}

              <div className="horas-payment-card">

                <div className="horas-payment-icon">
                  <Banknote
                    size={22}
                  />
                </div>

                <div>

                  <span>
                    Valor de la hora
                  </span>

                  <strong>
                    {formatearDinero(
                      valorHora
                    )}
                  </strong>

                  <small>
                    Tarifa registrada
                  </small>

                </div>

              </div>

              {/* VALOR A PAGAR */}

              <div className="horas-payment-card horas-payment-total">

                <div className="horas-payment-icon">
                  <Banknote
                    size={22}
                  />
                </div>

                <div>

                  <span>
                    Valor a pagar
                  </span>

                  <strong>
                    {formatearDinero(
                      valorPagar
                    )}
                  </strong>

                  <small>
                    Incluye horas y minutos trabajados
                  </small>

                </div>

              </div>

            </div>

            {/* =====================================
                CÁLCULO EXPLICATIVO
            ===================================== */}

            {totalMinutos >
              0 &&
              valorHora >
                0 && (
                <div className="horas-payment-calculation">

                  <span>
                    Cálculo:
                  </span>

                  <strong>
                    {formatearMinutos(
                      totalMinutos
                    )}{" "}
                    ×{" "}
                    {formatearDinero(
                      valorHora
                    )}
                    /hora
                  </strong>

                  <span>
                    =
                  </span>

                  <b>
                    {formatearDinero(
                      valorPagar
                    )}
                  </b>

                </div>
              )}

            {/* =====================================
                OBSERVACIONES
            ===================================== */}

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

          {/* =========================================
              PIE
          ========================================= */}

          <div className="horas-modal-footer">

            <button
              type="button"
              className="horas-btn-secondary"
              onClick={
                onCerrar
              }
              disabled={
                guardando
              }
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="horas-btn-primary"
              disabled={
                guardando
              }
            >
              <Save
                size={18}
              />

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