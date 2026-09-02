import mongoose from "mongoose";

import HoraMaquinaria from "./horaMaquinaria.model.js";
import Maquinaria from "../maquinaria/maquinaria.model.js";
import Egreso from "../egresos/egreso.model.js";

/* =========================================================
   FUNCIONES AUXILIARES
========================================================= */

/* =========================================================
   ESCAPAR REGEX
========================================================= */

const escaparRegex = (
  texto = ""
) => {
  return texto.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
};

/* =========================================================
   NORMALIZAR NOMBRE DEL OPERARIO
========================================================= */

const normalizarOperario = (
  operario = ""
) => {
  return String(
    operario
  )
    .trim()
    .replace(
      /\s+/g,
      " "
    );
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
    throw new Error(
      "Formato de hora inválido"
    );
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
    ) ||
    horas < 0 ||
    horas > 23 ||
    minutos < 0 ||
    minutos > 59
  ) {
    throw new Error(
      "Formato de hora inválido"
    );
  }

  return (
    horas * 60 +
    minutos
  );
};

/* =========================================================
   CALCULAR MINUTOS DEL TURNO
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

  /*
    NOCHE:

    Permitimos cruzar medianoche.

    Ejemplo:
    19:00 → 02:00
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
    MAÑANA Y TARDE:

    La final debe ser mayor
    que la inicial.
  */

  if (
    periodo !==
      "Noche" &&
    final <= inicio
  ) {
    throw new Error(
      `En el turno ${periodo}, la hora final debe ser mayor que la hora de inicio`
    );
  }

  const total =
    final -
    inicio;

  if (
    total <= 0
  ) {
    throw new Error(
      `El horario del turno ${periodo} no es válido`
    );
  }

  if (
    total >
    24 * 60
  ) {
    throw new Error(
      `El turno ${periodo} no puede superar 24 horas`
    );
  }

  return total;
};

/* =========================================================
   PROCESAR TURNOS
========================================================= */

const procesarTurnos = (
  turnos = []
) => {
  const periodosPermitidos = [
    "Mañana",
    "Tarde",
    "Noche",
  ];

  const turnosProcesados =
    periodosPermitidos.map(
      (
        periodo
      ) => {
        const turnoRecibido =
          turnos.find(
            (
              turno
            ) =>
              turno.periodo ===
              periodo
          ) || {};

        const activo =
          Boolean(
            turnoRecibido.activo
          );

        /* =========================
           TURNO DESACTIVADO
        ========================= */

        if (
          !activo
        ) {
          return {
            periodo,

            activo:
              false,

            horaInicio:
              "",

            horaFinal:
              "",

            totalMinutos:
              0,
          };
        }

        /* =========================
           TURNO ACTIVO
        ========================= */

        const horaInicio =
          turnoRecibido.horaInicio ||
          "";

        const horaFinal =
          turnoRecibido.horaFinal ||
          "";

        if (
          !horaInicio ||
          !horaFinal
        ) {
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

          activo:
            true,

          horaInicio,

          horaFinal,

          totalMinutos,
        };
      }
    );

  const turnosActivos =
    turnosProcesados.filter(
      (
        turno
      ) =>
        turno.activo
    );

  if (
    turnosActivos.length ===
    0
  ) {
    throw new Error(
      "Debe activar al menos un turno: mañana, tarde o noche"
    );
  }

  const totalMinutos =
    turnosProcesados.reduce(
      (
        total,
        turno
      ) =>
        total +
        turno.totalMinutos,
      0
    );

  return {
    turnosProcesados,

    totalMinutos,
  };
};

/* =========================================================
   VALIDAR VALOR DE LA HORA
========================================================= */

const validarValorHora = (
  valorHora
) => {
  const valor =
    Number(
      valorHora
    );

  if (
    !Number.isFinite(
      valor
    ) ||
    valor <= 0
  ) {
    return {
      valido:
        false,

      message:
        "El valor de la hora debe ser mayor que cero",
    };
  }

  return {
    valido:
      true,

    valorHora:
      valor,
  };
};

/* =========================================================
   CALCULAR VALOR A PAGAR

   Los minutos también se pagan.

   Ejemplo:

   135 minutos
   ÷ 60
   = 2.25 horas

   2.25 × $40.000
   = $90.000
========================================================= */

const calcularValorPagar = (
  totalMinutos,
  valorHora
) => {
  const minutos =
    Number(
      totalMinutos
    ) || 0;

  const valor =
    Number(
      valorHora
    ) || 0;

  return Math.round(
    (
      minutos /
      60
    ) *
      valor
  );
};

/* =========================================================
   FECHAS
========================================================= */

const convertirFecha = (
  fecha
) => {
  return new Date(
    `${fecha}T00:00:00.000Z`
  );
};

const inicioDiaUTC = (
  fecha
) => {
  const date =
    new Date(
      fecha
    );

  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    )
  );
};

const finDiaUTC = (
  fecha
) => {
  const inicio =
    inicioDiaUTC(
      fecha
    );

  return new Date(
    inicio.getTime() +
      24 *
        60 *
        60 *
        1000 -
      1
  );
};

const obtenerInicioSemana = (
  fecha
) => {
  const date =
    inicioDiaUTC(
      fecha
    );

  const diaSemana =
    date.getUTCDay();

  const diferencia =
    diaSemana === 0
      ? -6
      : 1 -
        diaSemana;

  date.setUTCDate(
    date.getUTCDate() +
      diferencia
  );

  return date;
};

const obtenerFinSemana = (
  fecha
) => {
  const inicio =
    obtenerInicioSemana(
      fecha
    );

  return new Date(
    inicio.getTime() +
      7 *
        24 *
        60 *
        60 *
        1000 -
      1
  );
};

const obtenerInicioMes = (
  fecha
) => {
  const date =
    new Date(
      fecha
    );

  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      1
    )
  );
};

const obtenerFinMes = (
  fecha
) => {
  const date =
    new Date(
      fecha
    );

  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth() +
        1,
      1
    ) - 1
  );
};

const obtenerInicioAnio = (
  fecha
) => {
  const date =
    new Date(
      fecha
    );

  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      0,
      1
    )
  );
};

const obtenerFinAnio = (
  fecha
) => {
  const date =
    new Date(
      fecha
    );

  return new Date(
    Date.UTC(
      date.getUTCFullYear() +
        1,
      0,
      1
    ) - 1
  );
};

/* =========================================================
   SUMAR MINUTOS Y DINERO

   Se utiliza para:
   - Día
   - Semana
   - Mes
   - Año
========================================================= */

const sumarResumen = async ({
  maquinaria,
  fechaInicio,
  fechaFinal,
}) => {
  const filtro = {
    fecha: {
      $gte:
        fechaInicio,

      $lte:
        fechaFinal,
    },
  };

  if (
    maquinaria
  ) {
    if (
      !mongoose.Types.ObjectId.isValid(
        maquinaria
      )
    ) {
      return {
        totalMinutos:
          0,

        valorPagar:
          0,
      };
    }

    filtro.maquinaria =
      new mongoose.Types.ObjectId(
        maquinaria
      );
  }

  const resultado =
    await HoraMaquinaria.aggregate([
      {
        $match:
          filtro,
      },

      {
        $group: {
          _id:
            null,

          totalMinutos: {
            $sum:
              "$totalMinutos",
          },

          valorPagar: {
            $sum: {
              $ifNull: [
                "$valorPagar",
                0,
              ],
            },
          },
        },
      },
    ]);

  if (
    resultado.length ===
    0
  ) {
    return {
      totalMinutos:
        0,

      valorPagar:
        0,
    };
  }

  return {
    totalMinutos:
      Number(
        resultado[0]
          .totalMinutos ||
          0
      ),

    valorPagar:
      Number(
        resultado[0]
          .valorPagar ||
          0
      ),
  };
};

/* =========================================================
   LISTAR REGISTROS
========================================================= */

export const obtenerHorasMaquinaria =
  async (
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

      /* =========================
         MAQUINARIA
      ========================= */

      if (
        maquinaria
      ) {
        if (
          !mongoose.Types.ObjectId.isValid(
            maquinaria
          )
        ) {
          return res.status(
            400
          ).json({
            message:
              "La máquina seleccionada no es válida",
          });
        }

        filtro.maquinaria =
          maquinaria;
      }

      /* =========================
         OPERARIO
      ========================= */

      if (
        operario.trim()
      ) {
        filtro.operario = {
          $regex:
            operario.trim(),

          $options:
            "i",
        };
      }

      /* =========================
         FECHAS
      ========================= */

      if (
        fechaInicio ||
        fechaFinal
      ) {
        filtro.fecha =
          {};

        if (
          fechaInicio
        ) {
          filtro.fecha.$gte =
            convertirFecha(
              fechaInicio
            );
        }

        if (
          fechaFinal
        ) {
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
            fecha:
              -1,

            createdAt:
              -1,
          });

      res.status(
        200
      ).json(
        registros
      );
    } catch (error) {
      console.error(
        "Error al obtener horas:",
        error
      );

      res.status(
        500
      ).json({
        message:
          "Error al obtener las horas trabajadas",
      });
    }
  };

/* =========================================================
   OBTENER REGISTRO POR ID
========================================================= */

export const obtenerHoraMaquinariaPorId =
  async (
    req,
    res
  ) => {
    try {
      const {
        id,
      } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(
          400
        ).json({
          message:
            "El identificador del registro no es válido",
        });
      }

      const registro =
        await HoraMaquinaria.findById(
          id
        ).populate(
          "maquinaria",
          "nombre codigo tipo placa marca modelo"
        );

      if (
        !registro
      ) {
        return res.status(
          404
        ).json({
          message:
            "Registro de horas no encontrado",
        });
      }

      res.status(
        200
      ).json(
        registro
      );
    } catch (error) {
      console.error(
        "Error al obtener registro:",
        error
      );

      res.status(
        500
      ).json({
        message:
          "Error al obtener el registro",
      });
    }
  };

/* =========================================================
   CREAR REGISTRO
========================================================= */

export const crearHoraMaquinaria =
  async (
    req,
    res
  ) => {
    try {
      const {
        maquinaria,
        operario,
        fecha,
        turnos,
        valorHora,
        observaciones,
      } = req.body;

      /* =========================
         MAQUINARIA
      ========================= */

      if (
        !maquinaria
      ) {
        return res.status(
          400
        ).json({
          message:
            "La máquina es obligatoria",
        });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          maquinaria
        )
      ) {
        return res.status(
          400
        ).json({
          message:
            "La máquina seleccionada no es válida",
        });
      }

      /* =========================
         OPERARIO
      ========================= */

      const nombreOperario =
        normalizarOperario(
          operario
        );

      if (
        !nombreOperario
      ) {
        return res.status(
          400
        ).json({
          message:
            "El operario es obligatorio",
        });
      }

      /* =========================
         FECHA
      ========================= */

      if (
        !fecha
      ) {
        return res.status(
          400
        ).json({
          message:
            "La fecha es obligatoria",
        });
      }

      /* =========================
         VALOR DE LA HORA
      ========================= */

      const validacionValor =
        validarValorHora(
          valorHora
        );

      if (
        !validacionValor.valido
      ) {
        return res.status(
          400
        ).json({
          message:
            validacionValor.message,
        });
      }

      /* =========================
         MAQUINARIA EXISTENTE
      ========================= */

      const maquinaExiste =
        await Maquinaria.findById(
          maquinaria
        );

      if (
        !maquinaExiste
      ) {
        return res.status(
          404
        ).json({
          message:
            "La máquina seleccionada no existe",
        });
      }

      if (
        maquinaExiste.estado !==
        "Activa"
      ) {
        return res.status(
          400
        ).json({
          message:
            "La máquina seleccionada no está activa",
        });
      }

      /* =========================
         TURNOS
      ========================= */

      let resultadoTurnos;

      try {
        resultadoTurnos =
          procesarTurnos(
            turnos
          );
      } catch (error) {
        return res.status(
          400
        ).json({
          message:
            error.message,
        });
      }

      /* =========================
         EVITAR DUPLICADOS
      ========================= */

      const inicioFecha =
        convertirFecha(
          fecha
        );

      const finFecha =
        finDiaUTC(
          inicioFecha
        );

      const registroExistente =
        await HoraMaquinaria.findOne({
          maquinaria,

          operario: {
            $regex:
              `^${escaparRegex(
                nombreOperario
              )}$`,

            $options:
              "i",
          },

          fecha: {
            $gte:
              inicioFecha,

            $lte:
              finFecha,
          },
        });

      if (
        registroExistente
      ) {
        return res.status(
          409
        ).json({
          message:
            "Este operario ya tiene un registro para esta máquina en la fecha seleccionada. Edite el registro existente para agregar o modificar turnos.",
        });
      }

      /* =========================
         VALOR A PAGAR
      ========================= */

      const valorPagar =
        calcularValorPagar(
          resultadoTurnos.totalMinutos,
          validacionValor.valorHora
        );

      /* =========================
         CREAR
      ========================= */

      const nuevoRegistro =
        await HoraMaquinaria.create({
          maquinaria,

          operario:
            nombreOperario,

          fecha:
            convertirFecha(
              fecha
            ),

          turnos:
            resultadoTurnos.turnosProcesados,

          totalMinutos:
            resultadoTurnos.totalMinutos,

          valorHora:
            validacionValor.valorHora,

          valorPagar,

          /* =========================
             CONTROL DE PAGOS
          ========================= */

          totalPagado:
            0,

          saldoPendiente:
            valorPagar,

          estadoPago:
            "Pendiente",

          fechaUltimoPago:
            null,

          observaciones:
            String(
              observaciones ||
                ""
            ).trim(),
        });

      const registroCompleto =
        await HoraMaquinaria.findById(
          nuevoRegistro._id
        ).populate(
          "maquinaria",
          "nombre codigo tipo placa marca modelo"
        );

      res.status(
        201
      ).json({
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

      if (
        error.name ===
        "ValidationError"
      ) {
        const mensaje =
          Object.values(
            error.errors
          )[0]?.message;

        return res.status(
          400
        ).json({
          message:
            mensaje ||
            "Los datos del registro no son válidos",
        });
      }

      res.status(
        500
      ).json({
        message:
          "Error al registrar las horas trabajadas",
      });
    }
  };

/* =========================================================
   ACTUALIZAR REGISTRO

   IMPORTANTE:

   Si cambia el nombre del operario,
   TODOS sus registros históricos cambian
   al nuevo nombre.
========================================================= */

export const actualizarHoraMaquinaria =
  async (
    req,
    res
  ) => {
    try {
      const {
        id,
      } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(
          400
        ).json({
          message:
            "El identificador del registro no es válido",
        });
      }

      const {
        maquinaria,
        operario,
        fecha,
        turnos,
        valorHora,
        observaciones,
      } = req.body;

      const registro =
        await HoraMaquinaria.findById(
          id
        );

      if (
        !registro
      ) {
        return res.status(
          404
        ).json({
          message:
            "Registro de horas no encontrado",
        });
      }

      /* =========================
         GUARDAR NOMBRE ANTERIOR
      ========================= */

      const nombreAnterior =
        normalizarOperario(
          registro.operario
        );

      const nombreNuevo =
        normalizarOperario(
          operario
        );

      /* =========================
         MAQUINARIA
      ========================= */

      if (
        !maquinaria
      ) {
        return res.status(
          400
        ).json({
          message:
            "La máquina es obligatoria",
        });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          maquinaria
        )
      ) {
        return res.status(
          400
        ).json({
          message:
            "La máquina seleccionada no es válida",
        });
      }

      /* =========================
         OPERARIO
      ========================= */

      if (
        !nombreNuevo
      ) {
        return res.status(
          400
        ).json({
          message:
            "El operario es obligatorio",
        });
      }

      /* =========================
         FECHA
      ========================= */

      if (
        !fecha
      ) {
        return res.status(
          400
        ).json({
          message:
            "La fecha es obligatoria",
        });
      }

      /* =========================
         VALOR DE LA HORA
      ========================= */

      const validacionValor =
        validarValorHora(
          valorHora
        );

      if (
        !validacionValor.valido
      ) {
        return res.status(
          400
        ).json({
          message:
            validacionValor.message,
        });
      }

      /* =========================
         MAQUINARIA EXISTENTE
      ========================= */

      const maquinaExiste =
        await Maquinaria.findById(
          maquinaria
        );

      if (
        !maquinaExiste
      ) {
        return res.status(
          404
        ).json({
          message:
            "La máquina seleccionada no existe",
        });
      }

      /* =========================
         TURNOS
      ========================= */

      let resultadoTurnos;

      try {
        resultadoTurnos =
          procesarTurnos(
            turnos
          );
      } catch (error) {
        return res.status(
          400
        ).json({
          message:
            error.message,
        });
      }

      /* =========================
         EVITAR DUPLICADO
      ========================= */

      const inicioFecha =
        convertirFecha(
          fecha
        );

      const finFecha =
        finDiaUTC(
          inicioFecha
        );

      const duplicado =
        await HoraMaquinaria.findOne({
          _id: {
            $ne:
              id,
          },

          maquinaria,

          operario: {
            $regex:
              `^${escaparRegex(
                nombreNuevo
              )}$`,

            $options:
              "i",
          },

          fecha: {
            $gte:
              inicioFecha,

            $lte:
              finFecha,
          },
        });

      if (
        duplicado
      ) {
        return res.status(
          409
        ).json({
          message:
            "Ya existe otro registro para este operario, máquina y fecha.",
        });
      }

      /* =========================
         CALCULAR VALOR
      ========================= */

      const valorPagar =
        calcularValorPagar(
          resultadoTurnos.totalMinutos,
          validacionValor.valorHora
        );

      /* =====================================================
         PROTEGER REGISTROS QUE YA TIENEN PAGOS

         Podemos modificar las horas o valor de hora,
         siempre que el nuevo valor total NO quede
         por debajo de lo que ya se ha pagado.
      ===================================================== */

      const totalPagadoActual =
        Number(
          registro.totalPagado ||
            0
        );

      if (
        valorPagar <
        totalPagadoActual
      ) {
        return res.status(
          409
        ).json({
          message:
            `No puede reducir el valor de las horas a ${valorPagar} porque ya se han pagado ${totalPagadoActual}.`,
        });
      }

      /* =========================
         ACTUALIZAR ESTE REGISTRO
      ========================= */

      registro.maquinaria =
        maquinaria;

      registro.operario =
        nombreNuevo;

      registro.fecha =
        convertirFecha(
          fecha
        );

      registro.turnos =
        resultadoTurnos.turnosProcesados;

      registro.totalMinutos =
        resultadoTurnos.totalMinutos;

      registro.valorHora =
        validacionValor.valorHora;

      registro.valorPagar =
        valorPagar;

      registro.observaciones =
        String(
          observaciones ||
            ""
        ).trim();

      await registro.save();

      /* =====================================================
         CAMBIO GLOBAL DEL NOMBRE DEL OPERARIO

         Ejemplo:

         Antes:
         JUAN PEREZ

         Nuevo:
         JUAN CARLOS PEREZ

         Todos los registros que tengan exactamente
         "JUAN PEREZ" pasan al nuevo nombre.
      ===================================================== */

      let registrosRenombrados =
        0;

      if (
        nombreAnterior.toLocaleLowerCase(
          "es"
        ) !==
        nombreNuevo.toLocaleLowerCase(
          "es"
        )
      ) {
        const resultadoCambio =
          await HoraMaquinaria.updateMany(
            {
              _id: {
                $ne:
                  registro._id,
              },

              operario: {
                $regex:
                  `^${escaparRegex(
                    nombreAnterior
                  )}$`,

                $options:
                  "i",
              },
            },

            {
              $set: {
                operario:
                  nombreNuevo,
              },
            }
          );

        registrosRenombrados =
          resultadoCambio.modifiedCount ||
          0;
      }

      /* =========================
         RESPUESTA
      ========================= */

      const registroCompleto =
        await HoraMaquinaria.findById(
          registro._id
        ).populate(
          "maquinaria",
          "nombre codigo tipo placa marca modelo"
        );

      res.status(
        200
      ).json({
        message:
          registrosRenombrados >
          0
            ? `Registro actualizado correctamente. El nombre del operario también se actualizó en ${registrosRenombrados} registros anteriores.`
            : "Registro de horas actualizado correctamente",

        registro:
          registroCompleto,

        registrosRenombrados,
      });
    } catch (error) {
      console.error(
        "Error actualizando horas:",
        error
      );

      if (
        error.name ===
        "ValidationError"
      ) {
        const mensaje =
          Object.values(
            error.errors
          )[0]?.message;

        return res.status(
          400
        ).json({
          message:
            mensaje ||
            "Los datos del registro no son válidos",
        });
      }

      res.status(
        500
      ).json({
        message:
          "Error al actualizar las horas trabajadas",
      });
    }
  };

/* =========================================================
   ELIMINAR
========================================================= */

export const eliminarHoraMaquinaria =
  async (
    req,
    res
  ) => {
    try {
      const {
        id,
      } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(
          400
        ).json({
          message:
            "El identificador del registro no es válido",
        });
      }

      const registro =
        await HoraMaquinaria.findById(
          id
        );

      if (
        !registro
      ) {
        return res.status(
          404
        ).json({
          message:
            "Registro de horas no encontrado",
        });
      }

      /* =====================================================
         VALIDAR PAGOS / EGRESOS

         No permitimos borrar un registro de horas si ya
         produjo movimientos financieros.

         Primero deben eliminarse/revertirse sus egresos.
      ===================================================== */

      const egresosRegistrados =
        await Egreso.countDocuments({
          tipo:
            "HorasMaquinaria",

          horaMaquinaria:
            registro._id,
        });

      const totalPagado =
        Number(
          registro.totalPagado ||
            0
        );

      if (
        egresosRegistrados > 0 ||
        totalPagado > 0
      ) {
        return res.status(
          409
        ).json({
          message:
            "Este registro de horas tiene pagos registrados. Primero debe eliminar los movimientos de pago correspondientes antes de eliminar las horas.",
        });
      }

      await HoraMaquinaria.deleteOne({
        _id:
          registro._id,
      });

      res.status(
        200
      ).json({
        message:
          "Registro de horas eliminado correctamente",
      });
    } catch (error) {
      console.error(
        "Error eliminando registro:",
        error
      );

      res.status(
        500
      ).json({
        message:
          "Error al eliminar el registro de horas",
      });
    }
  };

/* =========================================================
   RESUMEN DÍA / SEMANA / MES / AÑO

   Ahora incluye:

   - totalMinutos
   - valorPagar
========================================================= */

export const obtenerResumenHoras =
  async (
    req,
    res
  ) => {
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
        resumenDia,
        resumenSemana,
        resumenMes,
        resumenAnio,
      ] = await Promise.all([
        sumarResumen({
          maquinaria,

          fechaInicio:
            inicioDia,

          fechaFinal:
            finDia,
        }),

        sumarResumen({
          maquinaria,

          fechaInicio:
            inicioSemana,

          fechaFinal:
            finSemana,
        }),

        sumarResumen({
          maquinaria,

          fechaInicio:
            inicioMes,

          fechaFinal:
            finMes,
        }),

        sumarResumen({
          maquinaria,

          fechaInicio:
            inicioAnio,

          fechaFinal:
            finAnio,
        }),
      ]);

      res.status(
        200
      ).json({
        fechaReferencia:
          fechaBase,

        dia: {
          totalMinutos:
            resumenDia.totalMinutos,

          valorPagar:
            resumenDia.valorPagar,
        },

        semana: {
          totalMinutos:
            resumenSemana.totalMinutos,

          valorPagar:
            resumenSemana.valorPagar,

          desde:
            inicioSemana,

          hasta:
            finSemana,
        },

        mes: {
          totalMinutos:
            resumenMes.totalMinutos,

          valorPagar:
            resumenMes.valorPagar,
        },

        anio: {
          totalMinutos:
            resumenAnio.totalMinutos,

          valorPagar:
            resumenAnio.valorPagar,
        },
      });
    } catch (error) {
      console.error(
        "Error calculando resumen:",
        error
      );

      res.status(
        500
      ).json({
        message:
          "Error al calcular el resumen de horas",
      });
    }
  };

/* =========================================================
   RESUMEN POR OPERARIOS

   Ahora incluye:
   - Minutos
   - Valores a pagar
========================================================= */

export const obtenerResumenOperarios =
  async (
    req,
    res
  ) => {
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

      const filtro = {};

      if (
        maquinaria
      ) {
        if (
          !mongoose.Types.ObjectId.isValid(
            maquinaria
          )
        ) {
          return res.status(
            400
          ).json({
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
            $match:
              filtro,
          },

          {
            $group: {
              _id: {
                $toUpper: {
                  $trim: {
                    input:
                      "$operario",
                  },
                },
              },

              operario: {
                $first:
                  "$operario",
              },

              /* =====================
                 MINUTOS DÍA
              ===================== */

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

              /* =====================
                 DINERO DÍA
              ===================== */

              valorDia: {
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

                    {
                      $ifNull: [
                        "$valorPagar",
                        0,
                      ],
                    },

                    0,
                  ],
                },
              },

              /* =====================
                 MINUTOS SEMANA
              ===================== */

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

              /* =====================
                 DINERO SEMANA
              ===================== */

              valorSemana: {
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

                    {
                      $ifNull: [
                        "$valorPagar",
                        0,
                      ],
                    },

                    0,
                  ],
                },
              },

              /* =====================
                 MINUTOS MES
              ===================== */

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

              /* =====================
                 DINERO MES
              ===================== */

              valorMes: {
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

                    {
                      $ifNull: [
                        "$valorPagar",
                        0,
                      ],
                    },

                    0,
                  ],
                },
              },

              /* =====================
                 MINUTOS AÑO
              ===================== */

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

              /* =====================
                 DINERO AÑO
              ===================== */

              valorAnio: {
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

                    {
                      $ifNull: [
                        "$valorPagar",
                        0,
                      ],
                    },

                    0,
                  ],
                },
              },

              /* =====================
                 TOTAL HISTÓRICO
              ===================== */

              total: {
                $sum:
                  "$totalMinutos",
              },

              valorTotal: {
                $sum: {
                  $ifNull: [
                    "$valorPagar",
                    0,
                  ],
                },
              },
            },
          },

          {
            $sort: {
              operario:
                1,
            },
          },
        ]);

      const resumenOperarios =
        operarios.map(
          (
            operario
          ) => ({
            operario:
              operario.operario,

            dia:
              operario.dia ||
              0,

            valorDia:
              operario.valorDia ||
              0,

            semana:
              operario.semana ||
              0,

            valorSemana:
              operario.valorSemana ||
              0,

            mes:
              operario.mes ||
              0,

            valorMes:
              operario.valorMes ||
              0,

            anio:
              operario.anio ||
              0,

            valorAnio:
              operario.valorAnio ||
              0,

            total:
              operario.total ||
              0,

            valorTotal:
              operario.valorTotal ||
              0,
          })
        );

      /* =========================
         TOTAL GENERAL
      ========================= */

      const totalGeneral =
        resumenOperarios.reduce(
          (
            acumulado,
            operario
          ) => ({
            dia:
              acumulado.dia +
              operario.dia,

            valorDia:
              acumulado.valorDia +
              operario.valorDia,

            semana:
              acumulado.semana +
              operario.semana,

            valorSemana:
              acumulado.valorSemana +
              operario.valorSemana,

            mes:
              acumulado.mes +
              operario.mes,

            valorMes:
              acumulado.valorMes +
              operario.valorMes,

            anio:
              acumulado.anio +
              operario.anio,

            valorAnio:
              acumulado.valorAnio +
              operario.valorAnio,

            total:
              acumulado.total +
              operario.total,

            valorTotal:
              acumulado.valorTotal +
              operario.valorTotal,
          }),

          {
            dia:
              0,

            valorDia:
              0,

            semana:
              0,

            valorSemana:
              0,

            mes:
              0,

            valorMes:
              0,

            anio:
              0,

            valorAnio:
              0,

            total:
              0,

            valorTotal:
              0,
          }
        );

      res.status(
        200
      ).json({
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

      res.status(
        500
      ).json({
        message:
          "Error al calcular las horas por operario",
      });
    }
  };