import HoraMaquinaria from "../horasMaquinaria/horaMaquinaria.model.js";

/* =========================================================
   HELPERS
========================================================= */

const numero = (valor) => {
  const resultado = Number(valor);

  return Number.isFinite(resultado)
    ? resultado
    : 0;
};

const texto = (valor) => {
  return String(valor ?? "").trim();
};

const textoMinuscula = (valor) => {
  return texto(valor).toLowerCase();
};

/* =========================================================
   FECHAS
========================================================= */

const inicioDia = (fecha) => {
  if (!fecha) {
    return null;
  }

  const partes = String(fecha)
    .split("-")
    .map(Number);

  if (
    partes.length !== 3 ||
    partes.some(
      (valor) =>
        !Number.isFinite(valor)
    )
  ) {
    return null;
  }

  const [
    year,
    month,
    day,
  ] = partes;

  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      0,
      0,
      0,
      0
    )
  );
};

const finDia = (fecha) => {
  if (!fecha) {
    return null;
  }

  const partes = String(fecha)
    .split("-")
    .map(Number);

  if (
    partes.length !== 3 ||
    partes.some(
      (valor) =>
        !Number.isFinite(valor)
    )
  ) {
    return null;
  }

  const [
    year,
    month,
    day,
  ] = partes;

  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      23,
      59,
      59,
      999
    )
  );
};

/* =========================================================
   HORAS
========================================================= */

const minutosAHoras = (
  minutos
) => {
  return Number(
    (
      numero(minutos) /
      60
    ).toFixed(2)
  );
};

/* =========================================================
   TURNO
========================================================= */

const construirTurnos = (
  turnos = []
) => {
  if (
    !Array.isArray(turnos)
  ) {
    return [];
  }

  return turnos
    .filter(
      (turno) =>
        turno?.activo
    )
    .map(
      (turno) => ({
        periodo:
          turno.periodo ||
          "—",

        horaInicio:
          turno.horaInicio ||
          "",

        horaFinal:
          turno.horaFinal ||
          "",

        totalMinutos:
          numero(
            turno.totalMinutos
          ),

        totalHoras:
          minutosAHoras(
            turno.totalMinutos
          ),
      })
    );
};

/* =========================================================
   REPORTE DE MAQUINARIA

   GET /api/reportes/maquinaria

   FILTROS:
   ?buscar=
   &maquinaria=
   &operario=
   &desde=
   &hasta=
   &estadoPago=
========================================================= */

export const obtenerReporteMaquinaria =
  async (req, res) => {
    try {
      const {
        buscar = "",
        maquinaria = "",
        operario = "",
        desde = "",
        hasta = "",
        estadoPago = "",
      } = req.query;

      /* =====================================================
         FILTRO BASE
      ===================================================== */

      const filtro = {};

      /* =====================================================
         MAQUINARIA
      ===================================================== */

      if (
        texto(maquinaria)
      ) {
        filtro.maquinaria =
          maquinaria;
      }

      /* =====================================================
         OPERARIO
      ===================================================== */

      if (
        texto(operario)
      ) {
        filtro.operario = {
          $regex:
            texto(operario),

          $options:
            "i",
        };
      }

      /* =====================================================
         ESTADO DE PAGO
      ===================================================== */

      if (
        texto(estadoPago)
      ) {
        filtro.estadoPago =
          texto(estadoPago);
      }

      /* =====================================================
         RANGO DE FECHAS
      ===================================================== */

      if (
        desde ||
        hasta
      ) {
        filtro.fecha = {};

        const fechaDesde =
          inicioDia(desde);

        const fechaHasta =
          finDia(hasta);

        if (
          desde &&
          !fechaDesde
        ) {
          return res
            .status(400)
            .json({
              message:
                "La fecha inicial no es válida.",
            });
        }

        if (
          hasta &&
          !fechaHasta
        ) {
          return res
            .status(400)
            .json({
              message:
                "La fecha final no es válida.",
            });
        }

        if (
          fechaDesde
        ) {
          filtro.fecha.$gte =
            fechaDesde;
        }

        if (
          fechaHasta
        ) {
          filtro.fecha.$lte =
            fechaHasta;
        }
      }

      /* =====================================================
         CONSULTAR HORAS
      ===================================================== */

      const horasMaquinaria =
        await HoraMaquinaria.find(
          filtro
        )
          .populate({
            path:
              "maquinaria",

            select:
              "codigo nombre tipo placa marca modelo",
          })
          .sort({
            fecha:
              -1,

            createdAt:
              -1,
          })
          .lean();

      /* =====================================================
         CONSTRUIR REGISTROS
      ===================================================== */

      let registros =
        horasMaquinaria.map(
          (hora) => {
            const maquina =
              hora.maquinaria;

            const turnos =
              construirTurnos(
                hora.turnos
              );

            return {
              _id:
                hora._id,

              codigo:
                hora.codigo ||
                "",

              fecha:
                hora.fecha,

              operario:
                hora.operario ||
                "—",

              maquinaria: {
                _id:
                  maquina?._id ||
                  null,

                codigo:
                  maquina?.codigo ||
                  "—",

                nombre:
                  maquina?.nombre ||
                  "—",

                tipo:
                  maquina?.tipo ||
                  "",

                placa:
                  maquina?.placa ||
                  "",

                marca:
                  maquina?.marca ||
                  "",

                modelo:
                  maquina?.modelo ||
                  "",
              },

              turnos,

              cantidadTurnos:
                turnos.length,

              totalMinutos:
                numero(
                  hora.totalMinutos
                ),

              totalHoras:
                minutosAHoras(
                  hora.totalMinutos
                ),

              valorHora:
                numero(
                  hora.valorHora
                ),

              valorPagar:
                numero(
                  hora.valorPagar
                ),

              totalPagado:
                numero(
                  hora.totalPagado
                ),

              saldoPendiente:
                numero(
                  hora.saldoPendiente
                ),

              estadoPago:
                hora.estadoPago ||
                "Pendiente",

              fechaUltimoPago:
                hora.fechaUltimoPago ||
                null,

              observaciones:
                hora.observaciones ||
                "",
            };
          }
        );

      /* =====================================================
         BUSCADOR GENERAL
      ===================================================== */

      if (
        texto(buscar)
      ) {
        const busqueda =
          textoMinuscula(
            buscar
          );

        registros =
          registros.filter(
            (registro) => {
              const campos = [
                registro.codigo,

                registro.operario,

                registro.estadoPago,

                registro.maquinaria
                  ?.codigo,

                registro.maquinaria
                  ?.nombre,

                registro.maquinaria
                  ?.tipo,

                registro.maquinaria
                  ?.placa,

                registro.maquinaria
                  ?.marca,

                registro.maquinaria
                  ?.modelo,

                registro.observaciones,

                ...registro.turnos.map(
                  (turno) =>
                    turno.periodo
                ),
              ];

              return campos.some(
                (campo) =>
                  textoMinuscula(
                    campo
                  ).includes(
                    busqueda
                  )
              );
            }
          );
      }

      /* =====================================================
         AGRUPAR POR MÁQUINA
      ===================================================== */

      const mapaMaquinas =
        new Map();

      registros.forEach(
        (registro) => {
          const maquina =
            registro.maquinaria;

          const clave =
            maquina?._id
              ? String(
                  maquina._id
                )
              : maquina?.codigo ||
                "sin-maquina";

          if (
            !mapaMaquinas.has(
              clave
            )
          ) {
            mapaMaquinas.set(
              clave,
              {
                maquinaria: {
                  ...maquina,
                },

                registros:
                  0,

                operarios:
                  new Set(),

                totalMinutos:
                  0,

                totalHoras:
                  0,

                valorCausado:
                  0,

                totalPagado:
                  0,

                saldoPendiente:
                  0,

                pendientes:
                  0,

                abonadas:
                  0,

                pagadas:
                  0,
              }
            );
          }

          const grupo =
            mapaMaquinas.get(
              clave
            );

          grupo.registros +=
            1;

          if (
            registro.operario &&
            registro.operario !==
              "—"
          ) {
            grupo.operarios.add(
              registro.operario
            );
          }

          grupo.totalMinutos +=
            numero(
              registro.totalMinutos
            );

          grupo.valorCausado +=
            numero(
              registro.valorPagar
            );

          grupo.totalPagado +=
            numero(
              registro.totalPagado
            );

          grupo.saldoPendiente +=
            numero(
              registro.saldoPendiente
            );

          if (
            registro.estadoPago ===
            "Pendiente"
          ) {
            grupo.pendientes +=
              1;
          }

          if (
            registro.estadoPago ===
            "Abonada"
          ) {
            grupo.abonadas +=
              1;
          }

          if (
            registro.estadoPago ===
            "Pagada"
          ) {
            grupo.pagadas +=
              1;
          }
        }
      );

      /* =====================================================
         RESUMEN POR MÁQUINA
      ===================================================== */

      const maquinas =
        Array.from(
          mapaMaquinas.values()
        )
          .map(
            (grupo) => ({
              maquinaria:
                grupo.maquinaria,

              registros:
                grupo.registros,

              cantidadOperarios:
                grupo.operarios.size,

              operarios:
                Array.from(
                  grupo.operarios
                ).sort(),

              totalMinutos:
                grupo.totalMinutos,

              totalHoras:
                minutosAHoras(
                  grupo.totalMinutos
                ),

              valorCausado:
                Number(
                  grupo.valorCausado.toFixed(
                    2
                  )
                ),

              totalPagado:
                Number(
                  grupo.totalPagado.toFixed(
                    2
                  )
                ),

              saldoPendiente:
                Number(
                  grupo.saldoPendiente.toFixed(
                    2
                  )
                ),

              pendientes:
                grupo.pendientes,

              abonadas:
                grupo.abonadas,

              pagadas:
                grupo.pagadas,
            })
          )
          .sort(
            (a, b) =>
              String(
                a.maquinaria
                  ?.codigo ||
                  ""
              ).localeCompare(
                String(
                  b.maquinaria
                    ?.codigo ||
                    ""
                ),
                "es",
                {
                  numeric:
                    true,
                }
              )
          );

      /* =====================================================
         TOTALES GENERALES
      ===================================================== */

      const totalMinutos =
        registros.reduce(
          (
            total,
            registro
          ) =>
            total +
            numero(
              registro.totalMinutos
            ),
          0
        );

      const valorCausado =
        registros.reduce(
          (
            total,
            registro
          ) =>
            total +
            numero(
              registro.valorPagar
            ),
          0
        );

      const totalPagado =
        registros.reduce(
          (
            total,
            registro
          ) =>
            total +
            numero(
              registro.totalPagado
            ),
          0
        );

      const saldoPendiente =
        registros.reduce(
          (
            total,
            registro
          ) =>
            total +
            numero(
              registro.saldoPendiente
            ),
          0
        );

      const operarios =
        new Set(
          registros
            .map(
              (registro) =>
                registro.operario
            )
            .filter(
              (nombre) =>
                nombre &&
                nombre !==
                  "—"
            )
        );

      /* =====================================================
         ESTADOS
      ===================================================== */

      const pendientes =
        registros.filter(
          (registro) =>
            registro.estadoPago ===
            "Pendiente"
        ).length;

      const abonadas =
        registros.filter(
          (registro) =>
            registro.estadoPago ===
            "Abonada"
        ).length;

      const pagadas =
        registros.filter(
          (registro) =>
            registro.estadoPago ===
            "Pagada"
        ).length;

      /* =====================================================
         RESPUESTA
      ===================================================== */

      return res
        .status(200)
        .json({
          tipoReporte:
            "maquinaria",

          titulo:
            "Informe de maquinaria",

          filtros: {
            buscar,
            maquinaria,
            operario,
            desde,
            hasta,
            estadoPago,
          },

          resumen: {
            maquinas:
              maquinas.length,

            registros:
              registros.length,

            operarios:
              operarios.size,

            totalMinutos,

            totalHoras:
              minutosAHoras(
                totalMinutos
              ),

            valorCausado:
              Number(
                valorCausado.toFixed(
                  2
                )
              ),

            totalPagado:
              Number(
                totalPagado.toFixed(
                  2
                )
              ),

            saldoPendiente:
              Number(
                saldoPendiente.toFixed(
                  2
                )
              ),

            pendientes,

            abonadas,

            pagadas,
          },

          maquinas,

          registros,
        });
    } catch (error) {
      console.error(
        "Error generando informe de maquinaria:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "No fue posible generar el informe de maquinaria.",

          error:
            error.message,
        });
    }
  };