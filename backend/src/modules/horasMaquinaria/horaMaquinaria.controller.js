import mongoose from "mongoose";

import HoraMaquinaria from "./horaMaquinaria.model.js";
import Maquinaria from "../maquinaria/maquinaria.model.js";

/* =========================================================
   FUNCIONES AUXILIARES
========================================================= */

const convertirHoraAMinutos = (hora) => {
  if (!hora || !hora.includes(":")) {
    throw new Error("Formato de hora inválido");
  }

  const [horas, minutos] = hora.split(":").map(Number);

  if (
    Number.isNaN(horas) ||
    Number.isNaN(minutos) ||
    horas < 0 ||
    horas > 23 ||
    minutos < 0 ||
    minutos > 59
  ) {
    throw new Error("Formato de hora inválido");
  }

  return horas * 60 + minutos;
};

const calcularMinutosTurno = (
  horaInicio,
  horaFinal,
  periodo
) => {
  const inicio = convertirHoraAMinutos(horaInicio);
  let final = convertirHoraAMinutos(horaFinal);

  /*
    Para el turno Noche permitimos cruzar medianoche.

    Ejemplo:
    19:00 → 02:00

    02:00 pertenece al día siguiente.
  */
  if (periodo === "Noche" && final <= inicio) {
    final += 24 * 60;
  }

  /*
    Para mañana y tarde la hora final
    debe ser mayor que la hora inicial.
  */
  if (periodo !== "Noche" && final <= inicio) {
    throw new Error(
      `En el turno ${periodo}, la hora final debe ser mayor que la hora de inicio`
    );
  }

  const total = final - inicio;

  if (total <= 0) {
    throw new Error(
      `El horario del turno ${periodo} no es válido`
    );
  }

  if (total > 24 * 60) {
    throw new Error(
      `El turno ${periodo} no puede superar 24 horas`
    );
  }

  return total;
};

const procesarTurnos = (turnos = []) => {
  const periodosPermitidos = [
    "Mañana",
    "Tarde",
    "Noche",
  ];

  const turnosProcesados =
    periodosPermitidos.map((periodo) => {
      const turnoRecibido =
        turnos.find(
          (turno) =>
            turno.periodo === periodo
        ) || {};

      const activo =
        Boolean(turnoRecibido.activo);

      /*
        Si el turno está apagado,
        no necesitamos horas.
      */
      if (!activo) {
        return {
          periodo,
          activo: false,
          horaInicio: "",
          horaFinal: "",
          totalMinutos: 0,
        };
      }

      const horaInicio =
        turnoRecibido.horaInicio || "";

      const horaFinal =
        turnoRecibido.horaFinal || "";

      if (!horaInicio || !horaFinal) {
        throw new Error(
          `Debe registrar hora de inicio y hora final para el turno ${periodo}`
        );
      }

      const totalMinutos =
        calcularMinutosTurno(
          horaInicio,
          horaFinal,
          periodo
        );

      return {
        periodo,
        activo: true,
        horaInicio,
        horaFinal,
        totalMinutos,
      };
    });

  const turnosActivos =
    turnosProcesados.filter(
      (turno) => turno.activo
    );

  if (turnosActivos.length === 0) {
    throw new Error(
      "Debe activar al menos un turno: mañana, tarde o noche"
    );
  }

  const totalMinutos =
    turnosProcesados.reduce(
      (total, turno) =>
        total + turno.totalMinutos,
      0
    );

  return {
    turnosProcesados,
    totalMinutos,
  };
};

const convertirFecha = (fecha) => {
  return new Date(
    `${fecha}T00:00:00.000Z`
  );
};

const inicioDiaUTC = (fecha) => {
  const date = new Date(fecha);

  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    )
  );
};

const finDiaUTC = (fecha) => {
  const inicio = inicioDiaUTC(fecha);

  return new Date(
    inicio.getTime() +
      24 * 60 * 60 * 1000 -
      1
  );
};

const obtenerInicioSemana = (fecha) => {
  const date = inicioDiaUTC(fecha);

  const diaSemana =
    date.getUTCDay();

  const diferencia =
    diaSemana === 0
      ? -6
      : 1 - diaSemana;

  date.setUTCDate(
    date.getUTCDate() +
      diferencia
  );

  return date;
};

const obtenerFinSemana = (fecha) => {
  const inicio =
    obtenerInicioSemana(fecha);

  return new Date(
    inicio.getTime() +
      7 * 24 * 60 * 60 * 1000 -
      1
  );
};

const obtenerInicioMes = (fecha) => {
  const date = new Date(fecha);

  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      1
    )
  );
};

const obtenerFinMes = (fecha) => {
  const date = new Date(fecha);

  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      1
    ) - 1
  );
};

const obtenerInicioAnio = (fecha) => {
  const date = new Date(fecha);

  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      0,
      1
    )
  );
};

const obtenerFinAnio = (fecha) => {
  const date = new Date(fecha);

  return new Date(
    Date.UTC(
      date.getUTCFullYear() + 1,
      0,
      1
    ) - 1
  );
};

const sumarMinutos = async ({
  maquinaria,
  fechaInicio,
  fechaFinal,
}) => {
  const filtro = {
    fecha: {
      $gte: fechaInicio,
      $lte: fechaFinal,
    },
  };

  if (maquinaria) {
    if (
      !mongoose.Types.ObjectId.isValid(
        maquinaria
      )
    ) {
      return 0;
    }

    filtro.maquinaria =
      new mongoose.Types.ObjectId(
        maquinaria
      );
  }

  const resultado =
    await HoraMaquinaria.aggregate([
      {
        $match: filtro,
      },
      {
        $group: {
          _id: null,

          totalMinutos: {
            $sum: "$totalMinutos",
          },
        },
      },
    ]);

  return resultado.length
    ? resultado[0].totalMinutos
    : 0;
};

/* =========================================================
   LISTAR REGISTROS
========================================================= */

export const obtenerHorasMaquinaria =
  async (req, res) => {
    try {
      const {
        maquinaria = "",
        operario = "",
        fechaInicio = "",
        fechaFinal = "",
      } = req.query;

      const filtro = {};

      if (maquinaria) {
        filtro.maquinaria =
          maquinaria;
      }

      if (operario.trim()) {
        filtro.operario = {
          $regex:
            operario.trim(),
          $options: "i",
        };
      }

      if (
        fechaInicio ||
        fechaFinal
      ) {
        filtro.fecha = {};

        if (fechaInicio) {
          filtro.fecha.$gte =
            convertirFecha(
              fechaInicio
            );
        }

        if (fechaFinal) {
          filtro.fecha.$lte =
            finDiaUTC(
              convertirFecha(
                fechaFinal
              )
            );
        }
      }

      const registros =
        await HoraMaquinaria.find(
          filtro
        )
          .populate(
            "maquinaria",
            "nombre codigo tipo placa marca modelo"
          )
          .sort({
            fecha: -1,
            createdAt: -1,
          });

      res.status(200).json(
        registros
      );
    } catch (error) {
      console.error(
        "Error al obtener horas:",
        error
      );

      res.status(500).json({
        message:
          "Error al obtener las horas trabajadas",
      });
    }
  };

/* =========================================================
   OBTENER REGISTRO
========================================================= */

export const obtenerHoraMaquinariaPorId =
  async (req, res) => {
    try {
      const registro =
        await HoraMaquinaria.findById(
          req.params.id
        ).populate(
          "maquinaria",
          "nombre codigo tipo placa marca modelo"
        );

      if (!registro) {
        return res.status(404).json({
          message:
            "Registro de horas no encontrado",
        });
      }

      res.status(200).json(
        registro
      );
    } catch (error) {
      console.error(
        "Error al obtener registro:",
        error
      );

      res.status(500).json({
        message:
          "Error al obtener el registro",
      });
    }
  };

/* =========================================================
   CREAR REGISTRO
========================================================= */

export const crearHoraMaquinaria =
  async (req, res) => {
    try {
      const {
        maquinaria,
        operario,
        fecha,
        turnos,
        observaciones,
      } = req.body;

      if (!maquinaria) {
        return res.status(400).json({
          message:
            "La máquina es obligatoria",
        });
      }

      if (!operario?.trim()) {
        return res.status(400).json({
          message:
            "El operario es obligatorio",
        });
      }

      if (!fecha) {
        return res.status(400).json({
          message:
            "La fecha es obligatoria",
        });
      }

      const maquinaExiste =
        await Maquinaria.findById(
          maquinaria
        );

      if (!maquinaExiste) {
        return res.status(404).json({
          message:
            "La máquina seleccionada no existe",
        });
      }

      if (
        maquinaExiste.estado !==
        "Activa"
      ) {
        return res.status(400).json({
          message:
            "La máquina seleccionada no está activa",
        });
      }

      let resultadoTurnos;

      try {
        resultadoTurnos =
          procesarTurnos(
            turnos
          );
      } catch (error) {
        return res.status(400).json({
          message:
            error.message,
        });
      }

      /*
        Como ahora un registro contiene
        todos los turnos del día, evitamos
        registrar dos veces el mismo
        operario + máquina + fecha.
      */

      const inicioFecha =
        convertirFecha(fecha);

      const finFecha =
        finDiaUTC(inicioFecha);

      const registroExistente =
        await HoraMaquinaria.findOne({
          maquinaria,

          operario: {
            $regex:
              `^${operario.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
            $options: "i",
          },

          fecha: {
            $gte: inicioFecha,
            $lte: finFecha,
          },
        });

      if (registroExistente) {
        return res.status(409).json({
          message:
            "Este operario ya tiene un registro para esta máquina en la fecha seleccionada. Edite el registro existente para agregar o modificar turnos.",
        });
      }

      const nuevoRegistro =
        await HoraMaquinaria.create({
          maquinaria,

          operario:
            operario
              .trim()
              .replace(/\s+/g, " "),

          fecha:
            convertirFecha(
              fecha
            ),

          turnos:
            resultadoTurnos.turnosProcesados,

          totalMinutos:
            resultadoTurnos.totalMinutos,

          observaciones:
            observaciones?.trim() ||
            "",
        });

      const registroCompleto =
        await HoraMaquinaria.findById(
          nuevoRegistro._id
        ).populate(
          "maquinaria",
          "nombre codigo tipo placa marca modelo"
        );

      res.status(201).json({
        message:
          "Horas de maquinaria registradas correctamente",

        registro:
          registroCompleto,
      });
    } catch (error) {
      console.error(
        "Error al registrar horas:",
        error
      );

      res.status(500).json({
        message:
          "Error al registrar las horas trabajadas",
      });
    }
  };

/* =========================================================
   ACTUALIZAR REGISTRO
========================================================= */

export const actualizarHoraMaquinaria =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const {
        maquinaria,
        operario,
        fecha,
        turnos,
        observaciones,
      } = req.body;

      const registro =
        await HoraMaquinaria.findById(
          id
        );

      if (!registro) {
        return res.status(404).json({
          message:
            "Registro de horas no encontrado",
        });
      }

      if (!maquinaria) {
        return res.status(400).json({
          message:
            "La máquina es obligatoria",
        });
      }

      if (!operario?.trim()) {
        return res.status(400).json({
          message:
            "El operario es obligatorio",
        });
      }

      if (!fecha) {
        return res.status(400).json({
          message:
            "La fecha es obligatoria",
        });
      }

      const maquinaExiste =
        await Maquinaria.findById(
          maquinaria
        );

      if (!maquinaExiste) {
        return res.status(404).json({
          message:
            "La máquina seleccionada no existe",
        });
      }

      let resultadoTurnos;

      try {
        resultadoTurnos =
          procesarTurnos(
            turnos
          );
      } catch (error) {
        return res.status(400).json({
          message:
            error.message,
        });
      }

      const inicioFecha =
        convertirFecha(fecha);

      const finFecha =
        finDiaUTC(inicioFecha);

      const duplicado =
        await HoraMaquinaria.findOne({
          _id: {
            $ne: id,
          },

          maquinaria,

          operario: {
            $regex:
              `^${operario.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
            $options: "i",
          },

          fecha: {
            $gte: inicioFecha,
            $lte: finFecha,
          },
        });

      if (duplicado) {
        return res.status(409).json({
          message:
            "Ya existe otro registro para este operario, máquina y fecha.",
        });
      }

      registro.maquinaria =
        maquinaria;

      registro.operario =
        operario
          .trim()
          .replace(/\s+/g, " ");

      registro.fecha =
        convertirFecha(fecha);

      registro.turnos =
        resultadoTurnos.turnosProcesados;

      registro.totalMinutos =
        resultadoTurnos.totalMinutos;

      registro.observaciones =
        observaciones?.trim() ||
        "";

      await registro.save();

      const registroCompleto =
        await HoraMaquinaria.findById(
          registro._id
        ).populate(
          "maquinaria",
          "nombre codigo tipo placa marca modelo"
        );

      res.status(200).json({
        message:
          "Registro de horas actualizado correctamente",

        registro:
          registroCompleto,
      });
    } catch (error) {
      console.error(
        "Error actualizando horas:",
        error
      );

      res.status(500).json({
        message:
          "Error al actualizar las horas trabajadas",
      });
    }
  };

/* =========================================================
   ELIMINAR
========================================================= */

export const eliminarHoraMaquinaria =
  async (req, res) => {
    try {
      const registro =
        await HoraMaquinaria.findById(
          req.params.id
        );

      if (!registro) {
        return res.status(404).json({
          message:
            "Registro de horas no encontrado",
        });
      }

      await HoraMaquinaria.findByIdAndDelete(
        req.params.id
      );

      res.status(200).json({
        message:
          "Registro de horas eliminado correctamente",
      });
    } catch (error) {
      console.error(
        "Error eliminando registro:",
        error
      );

      res.status(500).json({
        message:
          "Error al eliminar el registro de horas",
      });
    }
  };

/* =========================================================
   RESUMEN DÍA / SEMANA / MES / AÑO
========================================================= */

export const obtenerResumenHoras =
  async (req, res) => {
    try {
      const {
        maquinaria = "",
        fecha = "",
      } = req.query;

      const fechaBase =
        fecha
          ? convertirFecha(
              fecha
            )
          : new Date();

      const inicioDia =
        inicioDiaUTC(
          fechaBase
        );

      const finDia =
        finDiaUTC(
          fechaBase
        );

      const inicioSemana =
        obtenerInicioSemana(
          fechaBase
        );

      const finSemana =
        obtenerFinSemana(
          fechaBase
        );

      const inicioMes =
        obtenerInicioMes(
          fechaBase
        );

      const finMes =
        obtenerFinMes(
          fechaBase
        );

      const inicioAnio =
        obtenerInicioAnio(
          fechaBase
        );

      const finAnio =
        obtenerFinAnio(
          fechaBase
        );

      const [
        totalDia,
        totalSemana,
        totalMes,
        totalAnio,
      ] = await Promise.all([
        sumarMinutos({
          maquinaria,
          fechaInicio:
            inicioDia,
          fechaFinal:
            finDia,
        }),

        sumarMinutos({
          maquinaria,
          fechaInicio:
            inicioSemana,
          fechaFinal:
            finSemana,
        }),

        sumarMinutos({
          maquinaria,
          fechaInicio:
            inicioMes,
          fechaFinal:
            finMes,
        }),

        sumarMinutos({
          maquinaria,
          fechaInicio:
            inicioAnio,
          fechaFinal:
            finAnio,
        }),
      ]);

      res.status(200).json({
        fechaReferencia:
          fechaBase,

        dia: {
          totalMinutos:
            totalDia,
        },

        semana: {
          totalMinutos:
            totalSemana,

          desde:
            inicioSemana,

          hasta:
            finSemana,
        },

        mes: {
          totalMinutos:
            totalMes,
        },

        anio: {
          totalMinutos:
            totalAnio,
        },
      });
    } catch (error) {
      console.error(
        "Error calculando resumen:",
        error
      );

      res.status(500).json({
        message:
          "Error al calcular el resumen de horas",
      });
    }
  };
  export const obtenerResumenOperarios = async (
  req,
  res
) => {
  try {
    const {
      maquinaria = "",
      fecha = "",
    } = req.query;

    const fechaBase = fecha
      ? convertirFecha(fecha)
      : new Date();

    const inicioDia =
      inicioDiaUTC(fechaBase);

    const finDia =
      finDiaUTC(fechaBase);

    const inicioSemana =
      obtenerInicioSemana(fechaBase);

    const finSemana =
      obtenerFinSemana(fechaBase);

    const inicioMes =
      obtenerInicioMes(fechaBase);

    const finMes =
      obtenerFinMes(fechaBase);

    const inicioAnio =
      obtenerInicioAnio(fechaBase);

    const finAnio =
      obtenerFinAnio(fechaBase);

    const filtro = {};

    if (maquinaria) {
      if (
        !mongoose.Types.ObjectId.isValid(
          maquinaria
        )
      ) {
        return res.status(400).json({
          message:
            "El identificador de la máquina no es válido",
        });
      }

      filtro.maquinaria =
        new mongoose.Types.ObjectId(
          maquinaria
        );
    }

    const operarios =
      await HoraMaquinaria.aggregate([
        {
          $match: filtro,
        },

        {
          $group: {
            _id: {
              $toUpper: {
                $trim: {
                  input: "$operario",
                },
              },
            },

            operario: {
              $first: "$operario",
            },

            dia: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      {
                        $gte: [
                          "$fecha",
                          inicioDia,
                        ],
                      },
                      {
                        $lte: [
                          "$fecha",
                          finDia,
                        ],
                      },
                    ],
                  },
                  "$totalMinutos",
                  0,
                ],
              },
            },

            semana: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      {
                        $gte: [
                          "$fecha",
                          inicioSemana,
                        ],
                      },
                      {
                        $lte: [
                          "$fecha",
                          finSemana,
                        ],
                      },
                    ],
                  },
                  "$totalMinutos",
                  0,
                ],
              },
            },

            mes: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      {
                        $gte: [
                          "$fecha",
                          inicioMes,
                        ],
                      },
                      {
                        $lte: [
                          "$fecha",
                          finMes,
                        ],
                      },
                    ],
                  },
                  "$totalMinutos",
                  0,
                ],
              },
            },

            anio: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      {
                        $gte: [
                          "$fecha",
                          inicioAnio,
                        ],
                      },
                      {
                        $lte: [
                          "$fecha",
                          finAnio,
                        ],
                      },
                    ],
                  },
                  "$totalMinutos",
                  0,
                ],
              },
            },

            /*
              Total histórico trabajado
              por el operario.
            */
            total: {
              $sum: "$totalMinutos",
            },
          },
        },

        {
          $sort: {
            operario: 1,
          },
        },
      ]);

    const resumenOperarios =
      operarios.map(
        (operario) => ({
          operario:
            operario.operario,

          dia:
            operario.dia || 0,

          semana:
            operario.semana || 0,

          mes:
            operario.mes || 0,

          anio:
            operario.anio || 0,

          total:
            operario.total || 0,
        })
      );

    const totalGeneral =
      resumenOperarios.reduce(
        (acumulado, operario) => ({
          dia:
            acumulado.dia +
            operario.dia,

          semana:
            acumulado.semana +
            operario.semana,

          mes:
            acumulado.mes +
            operario.mes,

          anio:
            acumulado.anio +
            operario.anio,

          total:
            acumulado.total +
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

    res.status(200).json({
      fechaReferencia:
        fechaBase,

      operarios:
        resumenOperarios,

      totalGeneral,
    });
  } catch (error) {
    console.error(
      "Error calculando resumen por operario:",
      error
    );

    res.status(500).json({
      message:
        "Error al calcular las horas por operario",
    });
  }
};