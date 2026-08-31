import mongoose from "mongoose";

import Cuota from "./cuota.model.js";
import Venta from "../ventas/venta.model.js";

import {
  asignarCodigosCuotasFaltantes,
  generarCodigosCuotas,
} from "../consecutivos/consecutivo.service.js";

/* =========================================================
   INICIO DEL DÍA EN UTC
========================================================= */

const inicioHoyUTC = () => {
  const hoy = new Date();

  return new Date(
    Date.UTC(
      hoy.getUTCFullYear(),
      hoy.getUTCMonth(),
      hoy.getUTCDate()
    )
  );
};

/* =========================================================
   CONVERTIR FECHA A UTC
========================================================= */

const convertirFechaUTC = (
  fecha
) => {
  if (!fecha) {
    return null;
  }

  if (
    typeof fecha === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(
      fecha
    )
  ) {
    const [
      year,
      month,
      day,
    ] = fecha
      .split("-")
      .map(Number);

    return new Date(
      Date.UTC(
        year,
        month - 1,
        day
      )
    );
  }

  const date =
    new Date(fecha);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    )
  );
};

/* =========================================================
   ÚLTIMO DÍA DEL MES
========================================================= */

const obtenerUltimoDiaMes = (
  year,
  month
) => {
  return new Date(
    Date.UTC(
      year,
      month + 1,
      0
    )
  ).getUTCDate();
};

/* =========================================================
   AGREGAR MESES DE FORMA SEGURA
========================================================= */

const agregarMeses = (
  fechaBase,
  cantidadMeses
) => {
  const fecha =
    convertirFechaUTC(
      fechaBase
    );

  if (
    !fecha
  ) {
    return null;
  }

  const diaOriginal =
    fecha.getUTCDate();

  const fechaTemporal =
    new Date(
      Date.UTC(
        fecha.getUTCFullYear(),
        fecha.getUTCMonth() +
          cantidadMeses,
        1
      )
    );

  const year =
    fechaTemporal.getUTCFullYear();

  const month =
    fechaTemporal.getUTCMonth();

  const ultimoDia =
    obtenerUltimoDiaMes(
      year,
      month
    );

  const diaFinal =
    Math.min(
      diaOriginal,
      ultimoDia
    );

  return new Date(
    Date.UTC(
      year,
      month,
      diaFinal
    )
  );
};

/* =========================================================
   ACTUALIZAR CUOTAS VENCIDAS

   Una cuota queda Vencida cuando:
   - tiene saldo pendiente
   - la fecha de vencimiento ya pasó
   - estaba Pendiente o Parcial

   Si una cuota Vencida cambia a una fecha futura,
   vuelve a Pendiente o Parcial según lo pagado.
========================================================= */

const actualizarCuotasVencidas =
  async () => {
    const hoy =
      inicioHoyUTC();

    /* =========================
       MARCAR COMO VENCIDAS
    ========================= */

    await Cuota.updateMany(
      {
        fechaVencimiento: {
          $lt:
            hoy,
        },

        saldoPendiente: {
          $gt:
            0,
        },

        estado: {
          $in: [
            "Pendiente",
            "Parcial",
          ],
        },
      },
      {
        $set: {
          estado:
            "Vencida",
        },
      }
    );

    /* =========================
       CORREGIR VENCIDAS
       CUYA FECHA YA NO VENCIÓ
    ========================= */

    const cuotasVencidas =
      await Cuota.find({
        estado:
          "Vencida",

        fechaVencimiento: {
          $gte:
            hoy,
        },

        saldoPendiente: {
          $gt:
            0,
        },
      });

    for (
      const cuota
      of cuotasVencidas
    ) {
      cuota.estado =
        Number(
          cuota.valorPagado
        ) > 0
          ? "Parcial"
          : "Pendiente";

      await cuota.save();
    }
  };

/* =========================================================
   DISTRIBUIR SALDO ENTRE CUOTAS

   Se trabaja en centavos para evitar diferencias
   por decimales.

   Ejemplo:

   $10.000.000 / 3

   La suma final de las cuotas siempre coincide
   exactamente con el saldo financiado.
========================================================= */

const distribuirCuotas = (
  saldo,
  numeroCuotas
) => {
  const saldoCentavos =
    Math.round(
      Number(saldo) *
        100
    );

  const cantidad =
    Number(
      numeroCuotas
    );

  const valorBase =
    Math.floor(
      saldoCentavos /
        cantidad
    );

  const sobrante =
    saldoCentavos -
    valorBase *
      cantidad;

  const valores =
    [];

  for (
    let i = 0;
    i < cantidad;
    i += 1
  ) {
    const valorCentavos =
      valorBase +
      (
        i <
        sobrante
          ? 1
          : 0
      );

    valores.push(
      Number(
        (
          valorCentavos /
          100
        ).toFixed(
          2
        )
      )
    );
  }

  return valores;
};

/* =========================================================
   LISTAR TODAS LAS CUOTAS

   GET /api/cuotas

   Filtros:
   - venta
   - cliente
   - estado
   - fechaInicio
   - fechaFinal
========================================================= */

export const obtenerCuotas =
  async (
    req,
    res
  ) => {
    try {
      /* =========================
         COMPLETAR CÓDIGOS ANTIGUOS
      ========================= */

      await asignarCodigosCuotasFaltantes();

      /* =========================
         ACTUALIZAR VENCIDAS
      ========================= */

      await actualizarCuotasVencidas();

      const {
        venta = "",
        estado = "",
        cliente = "",
        fechaInicio = "",
        fechaFinal = "",
      } = req.query;

      const filtro = {};

      /* =========================
         VENTA
      ========================= */

      if (
        venta
      ) {
        if (
          !mongoose.Types.ObjectId.isValid(
            venta
          )
        ) {
          return res.status(
            400
          ).json({
            message:
              "La venta seleccionada no es válida",
          });
        }

        filtro.venta =
          venta;
      }

      /* =========================
         ESTADO
      ========================= */

      if (
        estado
      ) {
        const estadosValidos = [
          "Pendiente",
          "Parcial",
          "Pagada",
          "Vencida",
        ];

        if (
          !estadosValidos.includes(
            estado
          )
        ) {
          return res.status(
            400
          ).json({
            message:
              "El estado de la cuota no es válido",
          });
        }

        filtro.estado =
          estado;
      }

      /* =========================
         FECHAS
      ========================= */

      if (
        fechaInicio ||
        fechaFinal
      ) {
        filtro.fechaVencimiento =
          {};

        if (
          fechaInicio
        ) {
          const inicio =
            convertirFechaUTC(
              fechaInicio
            );

          if (
            !inicio
          ) {
            return res.status(
              400
            ).json({
              message:
                "La fecha inicial no es válida",
            });
          }

          filtro.fechaVencimiento.$gte =
            inicio;
        }

        if (
          fechaFinal
        ) {
          const final =
            convertirFechaUTC(
              fechaFinal
            );

          if (
            !final
          ) {
            return res.status(
              400
            ).json({
              message:
                "La fecha final no es válida",
            });
          }

          final.setUTCHours(
            23,
            59,
            59,
            999
          );

          filtro.fechaVencimiento.$lte =
            final;
        }
      }

      /* =========================
         CLIENTE
      ========================= */

      if (
        cliente
      ) {
        if (
          !mongoose.Types.ObjectId.isValid(
            cliente
          )
        ) {
          return res.status(
            400
          ).json({
            message:
              "El cliente seleccionado no es válido",
          });
        }

        const ventasCliente =
          await Venta.find({
            cliente,
          })
            .select(
              "_id"
            )
            .lean();

        const idsVentasCliente =
          ventasCliente.map(
            (item) =>
              String(
                item._id
              )
          );

        /*
          Si además viene filtro por venta,
          deben cumplirse ambos filtros.
        */

        if (
          venta
        ) {
          if (
            !idsVentasCliente.includes(
              String(
                venta
              )
            )
          ) {
            return res.status(
              200
            ).json([]);
          }

          filtro.venta =
            venta;
        } else {
          filtro.venta = {
            $in:
              ventasCliente.map(
                (item) =>
                  item._id
              ),
          };
        }
      }

      /* =========================
         CONSULTAR
      ========================= */

      const cuotas =
        await Cuota.find(
          filtro
        )
          .populate({
            path:
              "venta",

            populate: [
              {
                path:
                  "cliente",
              },

              {
                path:
                  "lote",

                populate: {
                  path:
                    "manzana",

                  select:
                    "codigo nombre",
                },
              },
            ],
          })
          .sort({
            fechaVencimiento:
              1,

            numeroCuota:
              1,
          });

      /*
        Defensa ante posibles documentos huérfanos:
        si una cuota no tiene venta asociada,
        no se envía al frontend.
      */

      const cuotasValidas =
        cuotas.filter(
          (cuota) =>
            Boolean(
              cuota.venta
            )
        );

      res.status(
        200
      ).json(
        cuotasValidas
      );
    } catch (error) {
      console.error(
        "Error obteniendo cuotas:",
        error
      );

      res.status(
        500
      ).json({
        message:
          "Error al obtener las cuotas",
      });
    }
  };

/* =========================================================
   OBTENER CUOTA POR ID

   GET /api/cuotas/:id
========================================================= */

export const obtenerCuotaPorId =
  async (
    req,
    res
  ) => {
    try {
      await actualizarCuotasVencidas();

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
            "El identificador de la cuota no es válido",
        });
      }

      const cuota =
        await Cuota.findById(
          id
        ).populate({
          path:
            "venta",

          populate: [
            {
              path:
                "cliente",
            },

            {
              path:
                "lote",

              populate: {
                path:
                  "manzana",

                select:
                  "codigo nombre",
              },
            },
          ],
        });

      if (
        !cuota ||
        !cuota.venta
      ) {
        return res.status(
          404
        ).json({
          message:
            "La cuota no fue encontrada",
        });
      }

      res.status(
        200
      ).json(
        cuota
      );
    } catch (error) {
      console.error(
        "Error obteniendo cuota:",
        error
      );

      res.status(
        500
      ).json({
        message:
          "Error al obtener la cuota",
      });
    }
  };

/* =========================================================
   OBTENER CUOTAS DE UNA VENTA

   GET /api/cuotas/venta/:ventaId
========================================================= */

export const obtenerCuotasPorVenta =
  async (
    req,
    res
  ) => {
    try {
      await actualizarCuotasVencidas();

      const {
        ventaId,
      } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          ventaId
        )
      ) {
        return res.status(
          400
        ).json({
          message:
            "El identificador de la venta no es válido",
        });
      }

      const venta =
        await Venta.findById(
          ventaId
        );

      if (
        !venta
      ) {
        return res.status(
          404
        ).json({
          message:
            "La venta no fue encontrada",
        });
      }

      const cuotas =
        await Cuota.find({
          venta:
            ventaId,
        })
          .populate({
            path:
              "venta",

            populate: [
              {
                path:
                  "cliente",
              },

              {
                path:
                  "lote",

                populate: {
                  path:
                    "manzana",

                  select:
                    "codigo nombre",
                },
              },
            ],
          })
          .sort({
            numeroCuota:
              1,
          });

      res.status(
        200
      ).json(
        cuotas
      );
    } catch (error) {
      console.error(
        "Error obteniendo cuotas de venta:",
        error
      );

      res.status(
        500
      ).json({
        message:
          "Error al obtener las cuotas de la venta",
      });
    }
  };

/* =========================================================
   GENERAR CUOTAS DE UNA VENTA

   POST /api/cuotas/generar/:ventaId

   Se usa principalmente para una venta financiada
   que todavía no tenga cuotas generadas.
========================================================= */

export const generarCuotasVenta =
  async (
    req,
    res
  ) => {
    try {
      const {
        ventaId,
      } = req.params;

      const {
        fechaPrimeraCuota,
      } = req.body;

      /* =========================
         VALIDAR ID
      ========================= */

      if (
        !mongoose.Types.ObjectId.isValid(
          ventaId
        )
      ) {
        return res.status(
          400
        ).json({
          message:
            "El identificador de la venta no es válido",
        });
      }

      /* =========================
         VENTA
      ========================= */

      const venta =
        await Venta.findById(
          ventaId
        )
          .populate(
            "cliente"
          )
          .populate({
            path:
              "lote",

            populate: {
              path:
                "manzana",

              select:
                "codigo nombre",
            },
          });

      if (
        !venta
      ) {
        return res.status(
          404
        ).json({
          message:
            "La venta no fue encontrada",
        });
      }

      /* =========================
         SOLO FINANCIADAS
      ========================= */

      if (
        venta.formaPago !==
        "Financiado"
      ) {
        return res.status(
          409
        ).json({
          message:
            "Las ventas de contado no generan cuotas",
        });
      }

      /* =========================
         NÚMERO DE CUOTAS
      ========================= */

      const cantidadCuotas =
        Number(
          venta.numeroCuotas
        );

      if (
        !Number.isInteger(
          cantidadCuotas
        ) ||
        cantidadCuotas <= 0
      ) {
        return res.status(
          400
        ).json({
          message:
            "La venta no tiene un número válido de cuotas",
        });
      }

      /* =========================
         SALDO FINANCIADO
      ========================= */

      const saldoFinanciar =
        Number(
          venta.saldoFinanciar
        );

      if (
        !Number.isFinite(
          saldoFinanciar
        ) ||
        saldoFinanciar <= 0
      ) {
        return res.status(
          400
        ).json({
          message:
            "La venta no tiene saldo para financiar",
        });
      }

      /* =========================
         EVITAR DUPLICADOS
      ========================= */

      const cuotasExistentes =
        await Cuota.countDocuments({
          venta:
            venta._id,
        });

      if (
        cuotasExistentes > 0
      ) {
        return res.status(
          409
        ).json({
          message:
            `La venta ${venta.codigo} ya tiene cuotas generadas`,
        });
      }

      /* =========================
         PRIMER VENCIMIENTO
      ========================= */

      let primeraFecha;

      if (
        fechaPrimeraCuota
      ) {
        primeraFecha =
          convertirFechaUTC(
            fechaPrimeraCuota
          );

        if (
          !primeraFecha
        ) {
          return res.status(
            400
          ).json({
            message:
              "La fecha de la primera cuota no es válida",
          });
        }
      } else {
        primeraFecha =
          agregarMeses(
            venta.fechaVenta,
            1
          );
      }

      if (
        !primeraFecha
      ) {
        return res.status(
          400
        ).json({
          message:
            "No fue posible calcular la fecha de la primera cuota",
        });
      }

      /* =========================
         DISTRIBUIR SALDO
      ========================= */

      const valoresCuotas =
        distribuirCuotas(
          saldoFinanciar,
          cantidadCuotas
        );

      /* =========================
         GENERAR CONSECUTIVOS
      ========================= */

      const codigosCuotas =
        await generarCodigosCuotas(
          cantidadCuotas
        );

      /* =========================
         CREAR DOCUMENTOS
      ========================= */

      const documentos =
        [];

      for (
        let i = 0;
        i < cantidadCuotas;
        i += 1
      ) {
        const valor =
          valoresCuotas[i];

        const fecha =
          agregarMeses(
            primeraFecha,
            i
          );

        documentos.push({
          codigo:
            codigosCuotas[i],

          venta:
            venta._id,

          numeroCuota:
            i + 1,

          fechaVencimiento:
            fecha,

          valorCuota:
            valor,

          valorPagado:
            0,

          saldoPendiente:
            valor,

          estado:
            "Pendiente",

          fechaPago:
            null,

          observaciones:
            "",
        });
      }

      /* =========================
         GUARDAR
      ========================= */

      const cuotas =
        await Cuota.insertMany(
          documentos
        );

      res.status(
        201
      ).json({
        message:
          `${cuotas.length} cuotas generadas correctamente para la venta ${venta.codigo}`,

        venta: {
          _id:
            venta._id,

          codigo:
            venta.codigo,

          numeroCuotas:
            venta.numeroCuotas,

          saldoFinanciar:
            venta.saldoFinanciar,

          cliente:
            venta.cliente,

          lote:
            venta.lote,
        },

        cuotas,
      });
    } catch (error) {
      console.error(
        "Error generando cuotas:",
        error
      );

      if (
        error.code ===
        11000
      ) {
        return res.status(
          409
        ).json({
          message:
            "Las cuotas de esta venta ya fueron generadas",
        });
      }

      res.status(
        500
      ).json({
        message:
          "Error al generar las cuotas",
      });
    }
  };

/* =========================================================
   RESUMEN GENERAL DE CUOTAS

   GET /api/cuotas/resumen
========================================================= */

export const obtenerResumenCuotas =
  async (
    _req,
    res
  ) => {
    try {
      await actualizarCuotasVencidas();

      const cuotas =
        await Cuota.find({})
          .select(
            "valorCuota valorPagado saldoPendiente estado"
          )
          .lean();

      const resumen =
        cuotas.reduce(
          (
            acc,
            cuota
          ) => {
            acc.totalCuotas +=
              1;

            acc.valorProgramado +=
              Number(
                cuota.valorCuota
              ) || 0;

            acc.valorPagado +=
              Number(
                cuota.valorPagado
              ) || 0;

            acc.saldoPendiente +=
              Number(
                cuota.saldoPendiente
              ) || 0;

            switch (
              cuota.estado
            ) {
              case "Pendiente":
                acc.pendientes +=
                  1;
                break;

              case "Parcial":
                acc.parciales +=
                  1;
                break;

              case "Pagada":
                acc.pagadas +=
                  1;
                break;

              case "Vencida":
                acc.vencidas +=
                  1;
                break;

              default:
                break;
            }

            return acc;
          },
          {
            totalCuotas:
              0,

            pendientes:
              0,

            parciales:
              0,

            pagadas:
              0,

            vencidas:
              0,

            valorProgramado:
              0,

            valorPagado:
              0,

            saldoPendiente:
              0,
          }
        );

      /* =========================
         REDONDEAR DINERO
      ========================= */

      resumen.valorProgramado =
        Number(
          resumen.valorProgramado.toFixed(
            2
          )
        );

      resumen.valorPagado =
        Number(
          resumen.valorPagado.toFixed(
            2
          )
        );

      resumen.saldoPendiente =
        Number(
          resumen.saldoPendiente.toFixed(
            2
          )
        );

      res.status(
        200
      ).json(
        resumen
      );
    } catch (error) {
      console.error(
        "Error obteniendo resumen de cuotas:",
        error
      );

      res.status(
        500
      ).json({
        message:
          "Error al obtener el resumen de cuotas",
      });
    }
  };