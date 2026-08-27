import HoraMaquinaria from "./horaMaquinaria.model.js";
import Maquinaria from "../maquinaria/maquinaria.model.js";

/* =========================================================
   FUNCIONES AUXILIARES
========================================================= */

const convertirHoraAMinutos = (hora) => {
  const [horas, minutos] = hora.split(":").map(Number);

  return horas * 60 + minutos;
};

const calcularTotalMinutos = (horaInicio, horaFinal) => {
  const inicio = convertirHoraAMinutos(horaInicio);
  const final = convertirHoraAMinutos(horaFinal);

  if (final <= inicio) {
    throw new Error(
      "La hora final debe ser mayor que la hora de inicio"
    );
  }

  return final - inicio;
};

const convertirFecha = (fecha) => {
  return new Date(`${fecha}T00:00:00.000Z`);
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

  const diaSemana = date.getUTCDay();

  /*
    Domingo = 0
    Lunes = 1
    ...
    Queremos que la semana empiece el lunes.
  */
  const diferencia =
    diaSemana === 0
      ? -6
      : 1 - diaSemana;

  date.setUTCDate(
    date.getUTCDate() + diferencia
  );

  return date;
};

const obtenerFinSemana = (fecha) => {
  const inicio = obtenerInicioSemana(fecha);

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
    filtro.maquinaria = maquinaria;
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
   OBTENER REGISTROS
========================================================= */

export const obtenerHorasMaquinaria = async (
  req,
  res
) => {
  try {
    const {
      maquinaria = "",
      operario = "",
      fechaInicio = "",
      fechaFinal = "",
    } = req.query;

    const filtro = {};

    if (maquinaria) {
      filtro.maquinaria = maquinaria;
    }

    if (operario.trim()) {
      filtro.operario = {
        $regex: operario.trim(),
        $options: "i",
      };
    }

    if (fechaInicio || fechaFinal) {
      filtro.fecha = {};

      if (fechaInicio) {
        filtro.fecha.$gte =
          convertirFecha(fechaInicio);
      }

      if (fechaFinal) {
        filtro.fecha.$lte =
          finDiaUTC(
            convertirFecha(fechaFinal)
          );
      }
    }

    const registros =
      await HoraMaquinaria.find(filtro)
        .populate(
          "maquinaria",
          "nombre codigo tipo placa marca modelo"
        )
        .sort({
          fecha: -1,
          horaInicio: -1,
        });

    res.status(200).json(registros);
  } catch (error) {
    console.error(
      "Error al obtener horas de maquinaria:",
      error
    );

    res.status(500).json({
      message:
        "Error al obtener las horas trabajadas",
    });
  }
};

/* =========================================================
   OBTENER REGISTRO POR ID
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

      res.status(200).json(registro);
    } catch (error) {
      console.error(
        "Error al obtener registro:",
        error
      );

      res.status(500).json({
        message:
          "Error al obtener el registro de horas",
      });
    }
  };

/* =========================================================
   CREAR REGISTRO
========================================================= */

export const crearHoraMaquinaria = async (
  req,
  res
) => {
  try {
    const {
      maquinaria,
      operario,
      fecha,
      horaInicio,
      horaFinal,
      observaciones,
    } = req.body;

    if (!maquinaria) {
      return res.status(400).json({
        message: "La máquina es obligatoria",
      });
    }

    if (!operario?.trim()) {
      return res.status(400).json({
        message: "El operario es obligatorio",
      });
    }

    if (!fecha) {
      return res.status(400).json({
        message: "La fecha es obligatoria",
      });
    }

    if (!horaInicio) {
      return res.status(400).json({
        message:
          "La hora de inicio es obligatoria",
      });
    }

    if (!horaFinal) {
      return res.status(400).json({
        message:
          "La hora final es obligatoria",
      });
    }

    const maquinaExiste =
      await Maquinaria.findById(maquinaria);

    if (!maquinaExiste) {
      return res.status(404).json({
        message:
          "La máquina seleccionada no existe",
      });
    }

    if (maquinaExiste.estado !== "Activa") {
      return res.status(400).json({
        message:
          "La máquina seleccionada no está activa",
      });
    }

    let totalMinutos;

    try {
      totalMinutos = calcularTotalMinutos(
        horaInicio,
        horaFinal
      );
    } catch (error) {
      return res.status(400).json({
        message: error.message,
      });
    }

    const nuevoRegistro =
      await HoraMaquinaria.create({
        maquinaria,
        operario: operario.trim(),
        fecha: convertirFecha(fecha),
        horaInicio,
        horaFinal,
        totalMinutos,
        observaciones:
          observaciones?.trim() || "",
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
      registro: registroCompleto,
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
      const { id } = req.params;

      const {
        maquinaria,
        operario,
        fecha,
        horaInicio,
        horaFinal,
        observaciones,
      } = req.body;

      const registro =
        await HoraMaquinaria.findById(id);

      if (!registro) {
        return res.status(404).json({
          message:
            "Registro de horas no encontrado",
        });
      }

      if (!maquinaria) {
        return res.status(400).json({
          message: "La máquina es obligatoria",
        });
      }

      if (!operario?.trim()) {
        return res.status(400).json({
          message: "El operario es obligatorio",
        });
      }

      if (!fecha) {
        return res.status(400).json({
          message: "La fecha es obligatoria",
        });
      }

      if (!horaInicio || !horaFinal) {
        return res.status(400).json({
          message:
            "La hora inicial y final son obligatorias",
        });
      }

      const maquinaExiste =
        await Maquinaria.findById(maquinaria);

      if (!maquinaExiste) {
        return res.status(404).json({
          message:
            "La máquina seleccionada no existe",
        });
      }

      let totalMinutos;

      try {
        totalMinutos =
          calcularTotalMinutos(
            horaInicio,
            horaFinal
          );
      } catch (error) {
        return res.status(400).json({
          message: error.message,
        });
      }

      registro.maquinaria = maquinaria;
      registro.operario = operario.trim();
      registro.fecha =
        convertirFecha(fecha);
      registro.horaInicio = horaInicio;
      registro.horaFinal = horaFinal;
      registro.totalMinutos =
        totalMinutos;
      registro.observaciones =
        observaciones?.trim() || "";

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
        registro: registroCompleto,
      });
    } catch (error) {
      console.error(
        "Error al actualizar horas:",
        error
      );

      res.status(500).json({
        message:
          "Error al actualizar las horas trabajadas",
      });
    }
  };

/* =========================================================
   ELIMINAR REGISTRO
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
        "Error al eliminar registro:",
        error
      );

      res.status(500).json({
        message:
          "Error al eliminar el registro de horas",
      });
    }
  };

/* =========================================================
   RESUMEN HORAS
   DÍA / SEMANA / MES / AÑO
========================================================= */

export const obtenerResumenHoras = async (
  req,
  res
) => {
  try {
    const {
      maquinaria = "",
      fecha = "",
    } = req.query;

    /*
      Si el frontend no manda fecha,
      utilizamos hoy.
    */
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

    const [
      totalDia,
      totalSemana,
      totalMes,
      totalAnio,
    ] = await Promise.all([
      sumarMinutos({
        maquinaria,
        fechaInicio: inicioDia,
        fechaFinal: finDia,
      }),

      sumarMinutos({
        maquinaria,
        fechaInicio: inicioSemana,
        fechaFinal: finSemana,
      }),

      sumarMinutos({
        maquinaria,
        fechaInicio: inicioMes,
        fechaFinal: finMes,
      }),

      sumarMinutos({
        maquinaria,
        fechaInicio: inicioAnio,
        fechaFinal: finAnio,
      }),
    ]);

    res.status(200).json({
      fechaReferencia: fechaBase,

      dia: {
        totalMinutos: totalDia,
      },

      semana: {
        totalMinutos: totalSemana,
        desde: inicioSemana,
        hasta: finSemana,
      },

      mes: {
        totalMinutos: totalMes,
      },

      anio: {
        totalMinutos: totalAnio,
      },
    });
  } catch (error) {
    console.error(
      "Error calculando resumen de horas:",
      error
    );

    res.status(500).json({
      message:
        "Error al calcular el resumen de horas",
    });
  }
};