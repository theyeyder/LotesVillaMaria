import mongoose from "mongoose";

import Cuota from "./cuota.model.js";
import Venta from "../ventas/venta.model.js";

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
   CONVERTIR FECHA A UTC SIN PROBLEMAS DE ZONA HORARIA
========================================================= */

const convertirFechaUTC = (fecha) => {
  if (!fecha) {
    return null;
  }

  /*
    Si llega:
    2026-09-28

    guardamos exactamente:
    2026-09-28T00:00:00.000Z
  */

  if (
    typeof fecha === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(fecha)
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
   ÚLTIMO DÍA DE UN MES
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
   AGREGAR MESES SIN DAÑAR FECHAS

   Ejemplo:
   31 enero
      ↓
   28 febrero
      ↓
   31 marzo

   Evitamos el problema normal de JavaScript
   al sumar meses sobre días 29, 30 o 31.
========================================================= */

const agregarMeses = (
  fechaBase,
  cantidadMeses
) => {
  const fecha =
    convertirFechaUTC(
      fechaBase
    );

  if (!fecha) {
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
   - no está pagada
   - no está anulada
   - todavía tiene saldo
   - su fecha de vencimiento ya pasó
========================================================= */

const actualizarCuotasVencidas =
  async () => {
    const hoy =
      inicioHoyUTC();

    /*
      Pendientes o parciales cuya fecha
      ya pasó.
    */

    await Cuota.updateMany(
      {
        fechaVencimiento: {
          $lt: hoy,
        },

        saldoPendiente: {
          $gt: 0,
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
          estado: "Vencida",
        },
      }
    );

    /*
      Si una cuota estaba marcada como
      vencida pero su fecha todavía no ha
      llegado, corregimos su estado.

      Esto puede ocurrir si posteriormente
      se corrige una fecha.
    */

    const cuotasVencidas =
      await Cuota.find({
        estado: "Vencida",

        fechaVencimiento: {
          $gte: hoy,
        },

        saldoPendiente: {
          $gt: 0,
        },
      });

    for (
      const cuota
      of cuotasVencidas
    ) {
      cuota.estado =
        cuota.valorPagado > 0
          ? "Parcial"
          : "Pendiente";

      await cuota.save();
    }
  };

/* =========================================================
   DISTRIBUIR SALDO ENTRE CUOTAS

   Trabajamos internamente en centavos para evitar
   diferencias por decimales.

   Ejemplo:

   Saldo: $10.000.000
   3 cuotas

   No dejamos:
   3.333.333,33 x 3 = diferencia

   El total de las cuotas siempre será exactamente
   igual al saldo financiado.
========================================================= */

const distribuirCuotas = (
  saldo,
  numeroCuotas
) => {
  const saldoCentavos =
    Math.round(
      Number(saldo) * 100
    );

  const cantidad =
    Number(numeroCuotas);

  const valorBase =
    Math.floor(
      saldoCentavos /
        cantidad
    );

  const sobrante =
    saldoCentavos -
    valorBase *
      cantidad;

  const valores = [];

  for (
    let i = 0;
    i < cantidad;
    i += 1
  ) {
    /*
      Repartimos los centavos sobrantes
      entre las primeras cuotas.
    */

    const valorCentavos =
      valorBase +
      (i < sobrante
        ? 1
        : 0);

    valores.push(
      Number(
        (
          valorCentavos /
          100
        ).toFixed(2)
      )
    );
  }

  return valores;
};

/* =========================================================
   LISTAR TODAS LAS CUOTAS
========================================================= */

export const obtenerCuotas = async (
  req,
  res
) => {
  try {
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

    if (venta) {
      if (
        !mongoose.Types.ObjectId.isValid(
          venta
        )
      ) {
        return res.status(400).json({
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

    if (estado) {
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
      filtro.fechaVencimiento = {};

      if (fechaInicio) {
        const inicio =
          convertirFechaUTC(
            fechaInicio
          );

        if (!inicio) {
          return res.status(400).json({
            message:
              "La fecha inicial no es válida",
          });
        }

        filtro.fechaVencimiento.$gte =
          inicio;
      }

      if (fechaFinal) {
        const final =
          convertirFechaUTC(
            fechaFinal
          );

        if (!final) {
          return res.status(400).json({
            message:
              "La fecha final no es válida",
          });
        }

        /*
          Incluimos todo el día final.
        */

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

    /*
      Si se filtra por cliente debemos
      encontrar primero sus ventas.
    */

    if (cliente) {
      if (
        !mongoose.Types.ObjectId.isValid(
          cliente
        )
      ) {
        return res.status(400).json({
          message:
            "El cliente seleccionado no es válido",
        });
      }

      const ventasCliente =
        await Venta.find({
          cliente,
        }).select("_id");

      filtro.venta = {
        $in:
          ventasCliente.map(
            (item) =>
              item._id
          ),
      };
    }

    const cuotas =
      await Cuota.find(
        filtro
      )
        .populate({
          path: "venta",

          populate: [
            {
              path: "cliente",
            },
            {
              path: "lote",

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
          fechaVencimiento: 1,
          numeroCuota: 1,
        });

    res.status(200).json(
      cuotas
    );
  } catch (error) {
    console.error(
      "Error obteniendo cuotas:",
      error
    );

    res.status(500).json({
      message:
        "Error al obtener las cuotas",
    });
  }
};

/* =========================================================
   OBTENER CUOTA POR ID
========================================================= */

export const obtenerCuotaPorId =
  async (
    req,
    res
  ) => {
    try {
      await actualizarCuotasVencidas();

      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(400).json({
          message:
            "El identificador de la cuota no es válido",
        });
      }

      const cuota =
        await Cuota.findById(
          req.params.id
        ).populate({
          path: "venta",

          populate: [
            {
              path: "cliente",
            },

            {
              path: "lote",

              populate: {
                path:
                  "manzana",

                select:
                  "codigo nombre",
              },
            },
          ],
        });

      if (!cuota) {
        return res.status(404).json({
          message:
            "La cuota no fue encontrada",
        });
      }

      res.status(200).json(
        cuota
      );
    } catch (error) {
      console.error(
        "Error obteniendo cuota:",
        error
      );

      res.status(500).json({
        message:
          "Error al obtener la cuota",
      });
    }
  };

/* =========================================================
   OBTENER CUOTAS DE UNA VENTA
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
        return res.status(400).json({
          message:
            "El identificador de la venta no es válido",
        });
      }

      const venta =
        await Venta.findById(
          ventaId
        );

      if (!venta) {
        return res.status(404).json({
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
            path: "venta",

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
            numeroCuota: 1,
          });

      res.status(200).json(
        cuotas
      );
    } catch (error) {
      console.error(
        "Error obteniendo cuotas de venta:",
        error
      );

      res.status(500).json({
        message:
          "Error al obtener las cuotas de la venta",
      });
    }
  };

/* =========================================================
   GENERAR CUOTAS DE UNA VENTA

   POST /api/cuotas/generar/:ventaId

   Body opcional:
   {
     "fechaPrimeraCuota": "2026-09-28"
   }

   Si no se envía fecha, la primera cuota vencerá
   un mes después de la fecha de venta.
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
        return res.status(400).json({
          message:
            "El identificador de la venta no es válido",
        });
      }

      /* =========================
         BUSCAR VENTA
      ========================= */

      const venta =
        await Venta.findById(
          ventaId
        )
          .populate(
            "cliente"
          )
          .populate({
            path: "lote",

            populate: {
              path:
                "manzana",

              select:
                "codigo nombre",
            },
          });

      if (!venta) {
        return res.status(404).json({
          message:
            "La venta no fue encontrada",
        });
      }

      /* =========================
         VENTA ANULADA
      ========================= */

      if (
        venta.estado ===
        "Anulada"
      ) {
        return res.status(409).json({
          message:
            "No se pueden generar cuotas para una venta anulada",
        });
      }

      /* =========================
         SOLO FINANCIADAS
      ========================= */

      if (
        venta.formaPago !==
        "Financiado"
      ) {
        return res.status(409).json({
          message:
            "Las ventas de contado no generan cuotas",
        });
      }

      /* =========================
         NÚMERO DE CUOTAS
      ========================= */

      if (
        !Number.isInteger(
          Number(
            venta.numeroCuotas
          )
        ) ||
        Number(
          venta.numeroCuotas
        ) <= 0
      ) {
        return res.status(400).json({
          message:
            "La venta no tiene un número válido de cuotas",
        });
      }

      /* =========================
         SALDO
      ========================= */

      if (
        Number(
          venta.saldoFinanciar
        ) <= 0
      ) {
        return res.status(400).json({
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
        return res.status(409).json({
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

        if (!primeraFecha) {
          return res.status(400).json({
            message:
              "La fecha de la primera cuota no es válida",
          });
        }
      } else {
        /*
          Por defecto:
          un mes después de la venta.
        */

        primeraFecha =
          agregarMeses(
            venta.fechaVenta,
            1
          );
      }

      if (!primeraFecha) {
        return res.status(400).json({
          message:
            "No fue posible calcular la fecha de la primera cuota",
        });
      }

      /* =========================
         DISTRIBUIR VALORES
      ========================= */

      const valoresCuotas =
        distribuirCuotas(
          venta.saldoFinanciar,
          venta.numeroCuotas
        );

      /* =========================
         CONSTRUIR CUOTAS
      ========================= */

      const documentos = [];

      for (
        let i = 0;
        i <
        Number(
          venta.numeroCuotas
        );
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

          fechaAnulacion:
            null,

          motivoAnulacion:
            "",

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

      res.status(201).json({
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
        return res.status(409).json({
          message:
            "Las cuotas de esta venta ya fueron generadas",
        });
      }

      res.status(500).json({
        message:
          "Error al generar las cuotas",
      });
    }
  };

/* =========================================================
   RESUMEN GENERAL DE CUOTAS

   Las cuotas anuladas NO cuentan.
========================================================= */

export const obtenerResumenCuotas =
  async (
    _req,
    res
  ) => {
    try {
      await actualizarCuotasVencidas();

      const cuotas =
        await Cuota.find({
          estado: {
            $ne: "Anulada",
          },
        });

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

            if (
              cuota.estado ===
              "Pendiente"
            ) {
              acc.pendientes +=
                1;
            }

            if (
              cuota.estado ===
              "Parcial"
            ) {
              acc.parciales +=
                1;
            }

            if (
              cuota.estado ===
              "Pagada"
            ) {
              acc.pagadas +=
                1;
            }

            if (
              cuota.estado ===
              "Vencida"
            ) {
              acc.vencidas +=
                1;
            }

            return acc;
          },
          {
            totalCuotas: 0,

            pendientes: 0,

            parciales: 0,

            pagadas: 0,

            vencidas: 0,

            valorProgramado: 0,

            valorPagado: 0,

            saldoPendiente: 0,
          }
        );

      /*
        Las anuladas las contamos solamente
        para información histórica.
      */

      resumen.anuladas =
        await Cuota.countDocuments({
          estado: "Anulada",
        });

      res.status(200).json(
        resumen
      );
    } catch (error) {
      console.error(
        "Error obteniendo resumen de cuotas:",
        error
      );

      res.status(500).json({
        message:
          "Error al obtener el resumen de cuotas",
      });
    }
  };