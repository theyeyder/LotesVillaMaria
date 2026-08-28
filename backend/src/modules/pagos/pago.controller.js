import mongoose from "mongoose";

import Pago from "./pago.model.js";
import Cuota from "../cuotas/cuota.model.js";
import Venta from "../ventas/venta.model.js";

/* =========================================================
   FECHA DE HOY EN UTC
========================================================= */

const obtenerHoyUTC = () => {
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
   NORMALIZAR FECHA
========================================================= */

const convertirFechaUTC = (fecha) => {
  if (!fecha) {
    return obtenerHoyUTC();
  }

  if (
    typeof fecha === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(fecha)
  ) {
    const [year, month, day] = fecha
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

  const date = new Date(fecha);

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
   GENERAR CÓDIGO DE PAGO

   PG-0001
   PG-0002
   PG-0003
========================================================= */

const generarCodigoPago = async () => {
  const ultimoPago = await Pago.findOne({
    codigo: /^PG-\d+$/,
  })
    .sort({
      codigo: -1,
    })
    .select("codigo")
    .lean();

  let consecutivo = 1;

  if (ultimoPago?.codigo) {
    const numero = Number(
      ultimoPago.codigo.replace(
        "PG-",
        ""
      )
    );

    if (
      Number.isFinite(numero)
    ) {
      consecutivo =
        numero + 1;
    }
  }

  return `PG-${String(
    consecutivo
  ).padStart(4, "0")}`;
};

/* =========================================================
   DETERMINAR ESTADO DE UNA CUOTA
========================================================= */

const determinarEstadoCuota = (
  cuota
) => {
  if (
    cuota.estado ===
    "Anulada"
  ) {
    return "Anulada";
  }

  const valorCuota =
    Number(
      cuota.valorCuota
    ) || 0;

  const valorPagado =
    Number(
      cuota.valorPagado
    ) || 0;

  const saldo =
    Math.max(
      0,
      valorCuota -
        valorPagado
    );

  if (saldo <= 0) {
    return "Pagada";
  }

  const hoy =
    obtenerHoyUTC();

  const vencimiento =
    convertirFechaUTC(
      cuota.fechaVencimiento
    );

  if (
    vencimiento &&
    vencimiento < hoy
  ) {
    return "Vencida";
  }

  if (
    valorPagado > 0
  ) {
    return "Parcial";
  }

  return "Pendiente";
};

/* =========================================================
   RECALCULAR UNA CUOTA DESDE LOS PAGOS ACTIVOS

   Esto es especialmente importante cuando se anula
   un pago.

   En lugar de "adivinar" cuánto había pagado,
   sumamos nuevamente todos los pagos Aplicados.
========================================================= */

const recalcularCuotaDesdePagos =
  async (cuotaId) => {
    const cuota =
      await Cuota.findById(
        cuotaId
      );

    if (!cuota) {
      return null;
    }

    /*
      Si la cuota fue anulada porque la venta fue
      anulada, no debemos volverla a activar.
    */

    if (
      cuota.estado ===
      "Anulada"
    ) {
      return cuota;
    }

    const pagosAplicados =
      await Pago.find({
        estado: "Aplicado",

        "aplicaciones.cuota":
          cuota._id,
      }).lean();

    let totalPagado = 0;

    pagosAplicados.forEach(
      (pago) => {
        pago.aplicaciones?.forEach(
          (aplicacion) => {
            if (
              String(
                aplicacion.cuota
              ) ===
              String(
                cuota._id
              )
            ) {
              totalPagado +=
                Number(
                  aplicacion.valorAplicado
                ) || 0;
            }
          }
        );
      }
    );

    /*
      Evitamos diferencias mínimas por decimales.
    */

    totalPagado = Number(
      totalPagado.toFixed(2)
    );

    const valorCuota =
      Number(
        cuota.valorCuota
      ) || 0;

    if (
      totalPagado >
      valorCuota
    ) {
      totalPagado =
        valorCuota;
    }

    cuota.valorPagado =
      totalPagado;

    cuota.saldoPendiente =
      Number(
        Math.max(
          0,
          valorCuota -
            totalPagado
        ).toFixed(2)
      );

    cuota.estado =
      determinarEstadoCuota(
        cuota
      );

    cuota.fechaPago =
      cuota.estado ===
      "Pagada"
        ? cuota.fechaPago ||
          new Date()
        : null;

    await cuota.save();

    return cuota;
  };

/* =========================================================
   ACTUALIZAR ESTADO GENERAL DE LA VENTA

   Si no queda ninguna cuota pendiente:
   Venta -> Pagada

   Si vuelve a existir saldo:
   Venta -> Activa
========================================================= */

const actualizarEstadoVenta =
  async (ventaId) => {
    const venta =
      await Venta.findById(
        ventaId
      );

    if (!venta) {
      return null;
    }

    if (
      venta.estado ===
      "Anulada"
    ) {
      return venta;
    }

    if (
      venta.formaPago !==
      "Financiado"
    ) {
      return venta;
    }

    const cuotasActivas =
      await Cuota.find({
        venta:
          venta._id,

        estado: {
          $ne: "Anulada",
        },
      }).select(
        "saldoPendiente"
      );

    if (
      cuotasActivas.length ===
      0
    ) {
      return venta;
    }

    const tieneSaldo =
      cuotasActivas.some(
        (cuota) =>
          Number(
            cuota.saldoPendiente
          ) > 0
      );

    venta.estado =
      tieneSaldo
        ? "Activa"
        : "Pagada";

    await venta.save();

    return venta;
  };

/* =========================================================
   POPULATE DE PAGO
========================================================= */

const obtenerPagoCompleto =
  async (pagoId) => {
    return Pago.findById(
      pagoId
    )
      .populate(
        "cliente"
      )
      .populate({
        path: "venta",

        populate: {
          path: "lote",

          populate: {
            path:
              "manzana",

            select:
              "codigo nombre",
          },
        },
      })
      .populate({
        path:
          "aplicaciones.cuota",

        select:
          "numeroCuota fechaVencimiento valorCuota valorPagado saldoPendiente estado",
      });
  };

/* =========================================================
   LISTAR PAGOS

   GET /api/pagos
========================================================= */

export const obtenerPagos =
  async (
    req,
    res
  ) => {
    try {
      const {
        venta = "",
        cliente = "",
        estado = "",
        metodoPago = "",
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
         CLIENTE
      ========================= */

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

        filtro.cliente =
          cliente;
      }

      /* =========================
         ESTADO
      ========================= */

      if (estado) {
        filtro.estado =
          estado;
      }

      /* =========================
         MÉTODO
      ========================= */

      if (metodoPago) {
        filtro.metodoPago =
          metodoPago;
      }

      /* =========================
         FECHAS
      ========================= */

      if (
        fechaInicio ||
        fechaFinal
      ) {
        filtro.fechaPago = {};

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

          filtro.fechaPago.$gte =
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

          final.setUTCHours(
            23,
            59,
            59,
            999
          );

          filtro.fechaPago.$lte =
            final;
        }
      }

      const pagos =
        await Pago.find(
          filtro
        )
          .populate(
            "cliente"
          )
          .populate({
            path:
              "venta",

            populate: {
              path:
                "lote",

              populate: {
                path:
                  "manzana",

                select:
                  "codigo nombre",
              },
            },
          })
          .populate({
            path:
              "aplicaciones.cuota",

            select:
              "numeroCuota fechaVencimiento valorCuota valorPagado saldoPendiente estado",
          })
          .sort({
            fechaPago: -1,
            createdAt: -1,
          });

      res.status(200).json(
        pagos
      );
    } catch (error) {
      console.error(
        "Error obteniendo pagos:",
        error
      );

      res.status(500).json({
        message:
          "Error al obtener los pagos",
      });
    }
  };

/* =========================================================
   OBTENER PAGO POR ID
========================================================= */

export const obtenerPagoPorId =
  async (
    req,
    res
  ) => {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(400).json({
          message:
            "El identificador del pago no es válido",
        });
      }

      const pago =
        await obtenerPagoCompleto(
          req.params.id
        );

      if (!pago) {
        return res.status(404).json({
          message:
            "El pago no fue encontrado",
        });
      }

      res.status(200).json(
        pago
      );
    } catch (error) {
      console.error(
        "Error obteniendo pago:",
        error
      );

      res.status(500).json({
        message:
          "Error al obtener el pago",
      });
    }
  };

/* =========================================================
   REGISTRAR PAGO

   POST /api/pagos

   Body:

   {
     venta: "...",
     valorPago: 2500000,
     fechaPago: "2026-08-28",
     metodoPago: "Transferencia",
     referencia: "ABC123",
     observaciones: ""
   }

   El dinero se aplica automáticamente empezando
   por la cuota más antigua pendiente.
========================================================= */

export const crearPago =
  async (
    req,
    res
  ) => {
    try {
      const {
        venta: ventaId,
        valorPago,
        fechaPago,
        metodoPago =
          "Efectivo",
        referencia = "",
        observaciones = "",
      } = req.body;

      /* =========================
         VALIDAR VENTA
      ========================= */

      if (
        !ventaId ||
        !mongoose.Types.ObjectId.isValid(
          ventaId
        )
      ) {
        return res.status(400).json({
          message:
            "Debe seleccionar una venta válida",
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

      /* =========================
         VENTA ANULADA
      ========================= */

      if (
        venta.estado ===
        "Anulada"
      ) {
        return res.status(409).json({
          message:
            "No se pueden registrar pagos sobre una venta anulada",
        });
      }

      /* =========================
         SOLO VENTAS FINANCIADAS
      ========================= */

      if (
        venta.formaPago !==
        "Financiado"
      ) {
        return res.status(409).json({
          message:
            "Esta venta es de contado y no tiene cuotas por pagar",
        });
      }

      /* =========================
         VALOR DEL PAGO
      ========================= */

      const valor =
        Number(
          valorPago
        );

      if (
        !Number.isFinite(
          valor
        ) ||
        valor <= 0
      ) {
        return res.status(400).json({
          message:
            "El valor del pago debe ser mayor que cero",
        });
      }

      /* =========================
         FECHA
      ========================= */

      const fecha =
        convertirFechaUTC(
          fechaPago
        );

      if (!fecha) {
        return res.status(400).json({
          message:
            "La fecha del pago no es válida",
        });
      }

      /* =========================
         MÉTODO
      ========================= */

      const metodosValidos = [
        "Efectivo",
        "Transferencia",
        "Consignación",
        "PSE",
        "Otro",
      ];

      if (
        !metodosValidos.includes(
          metodoPago
        )
      ) {
        return res.status(400).json({
          message:
            "El método de pago no es válido",
        });
      }

      /* =========================
         CUOTAS PENDIENTES

         Primero las más antiguas.
      ========================= */

      const cuotasPendientes =
        await Cuota.find({
          venta:
            venta._id,

          estado: {
            $ne: "Anulada",
          },

          saldoPendiente: {
            $gt: 0,
          },
        }).sort({
          fechaVencimiento: 1,
          numeroCuota: 1,
        });

      if (
        cuotasPendientes.length ===
        0
      ) {
        return res.status(409).json({
          message:
            "La venta no tiene cuotas pendientes por pagar",
        });
      }

      /* =========================
         SALDO REAL DE LA VENTA
      ========================= */

      const saldoReal =
        Number(
          cuotasPendientes
            .reduce(
              (
                total,
                cuota
              ) =>
                total +
                Number(
                  cuota.saldoPendiente
                ),
              0
            )
            .toFixed(2)
        );

      if (
        valor >
        saldoReal
      ) {
        return res.status(400).json({
          message:
            `El pago supera el saldo pendiente de la venta. Saldo actual: $${saldoReal.toLocaleString(
              "es-CO"
            )}`,
        });
      }

      /* =========================
         DISTRIBUIR PAGO
      ========================= */

      let dineroDisponible =
        Number(
          valor.toFixed(2)
        );

      const aplicaciones = [];

      for (
        const cuota
        of cuotasPendientes
      ) {
        if (
          dineroDisponible <=
          0
        ) {
          break;
        }

        const saldoCuota =
          Number(
            cuota.saldoPendiente
          );

        if (
          saldoCuota <= 0
        ) {
          continue;
        }

        const valorAplicado =
          Number(
            Math.min(
              dineroDisponible,
              saldoCuota
            ).toFixed(2)
          );

        aplicaciones.push({
          cuota:
            cuota._id,

          numeroCuota:
            cuota.numeroCuota,

          valorAplicado,
        });

        dineroDisponible =
          Number(
            (
              dineroDisponible -
              valorAplicado
            ).toFixed(2)
          );
      }

      if (
        aplicaciones.length ===
        0
      ) {
        return res.status(409).json({
          message:
            "No fue posible aplicar el pago a ninguna cuota",
        });
      }

      /* =========================
         CREAR PAGO
      ========================= */

      let codigo =
        await generarCodigoPago();

      let nuevoPago;

      /*
        Reintentamos unas pocas veces si existiera
        una colisión excepcional del consecutivo.
      */

      for (
        let intento = 0;
        intento < 5;
        intento += 1
      ) {
        try {
          nuevoPago =
            await Pago.create({
              codigo,

              venta:
                venta._id,

              cliente:
                venta.cliente,

              fechaPago:
                fecha,

              valorPago:
                valor,

              metodoPago,

              referencia:
                String(
                  referencia || ""
                ).trim(),

              aplicaciones,

              estado:
                "Aplicado",

              motivoAnulacion:
                "",

              fechaAnulacion:
                null,

              observaciones:
                String(
                  observaciones ||
                    ""
                ).trim(),
            });

          break;
        } catch (error) {
          if (
            error.code !==
              11000 ||
            intento === 4
          ) {
            throw error;
          }

          codigo =
            await generarCodigoPago();
        }
      }

      /* =========================
         ACTUALIZAR CUOTAS
      ========================= */

      for (
        const aplicacion
        of aplicaciones
      ) {
        const cuota =
          await Cuota.findById(
            aplicacion.cuota
          );

        if (!cuota) {
          continue;
        }

        cuota.valorPagado =
          Number(
            (
              Number(
                cuota.valorPagado
              ) +
              Number(
                aplicacion.valorAplicado
              )
            ).toFixed(2)
          );

        /*
          Nunca dejamos valor pagado por encima
          del valor original de la cuota.
        */

        if (
          cuota.valorPagado >
          Number(
            cuota.valorCuota
          )
        ) {
          cuota.valorPagado =
            Number(
              cuota.valorCuota
            );
        }

        cuota.saldoPendiente =
          Number(
            Math.max(
              0,
              Number(
                cuota.valorCuota
              ) -
                cuota.valorPagado
            ).toFixed(2)
          );

        cuota.estado =
          determinarEstadoCuota(
            cuota
          );

        if (
          cuota.estado ===
          "Pagada"
        ) {
          cuota.fechaPago =
            fecha;
        } else {
          cuota.fechaPago =
            null;
        }

        await cuota.save();
      }

      /* =========================
         ACTUALIZAR VENTA
      ========================= */

      await actualizarEstadoVenta(
        venta._id
      );

      const pagoCompleto =
        await obtenerPagoCompleto(
          nuevoPago._id
        );

      const saldoDespues =
        Number(
          (
            saldoReal -
            valor
          ).toFixed(2)
        );

      res.status(201).json({
        message:
          saldoDespues === 0
            ? "Pago registrado correctamente. La venta quedó totalmente pagada."
            : "Pago registrado correctamente.",

        pago:
          pagoCompleto,

        saldoAnterior:
          saldoReal,

        valorAplicado:
          valor,

        saldoPendiente:
          saldoDespues,
      });
    } catch (error) {
      console.error(
        "Error registrando pago:",
        error
      );

      res.status(500).json({
        message:
          "Error al registrar el pago",
      });
    }
  };

/* =========================================================
   ANULAR PAGO

   PATCH /api/pagos/:id/anular

   Body:
   {
     "motivoAnulacion": "Pago registrado por error"
   }

   El pago queda en historial y las cuotas se recalculan.
========================================================= */

export const anularPago =
  async (
    req,
    res
  ) => {
    try {
      const {
        motivoAnulacion,
      } = req.body;

      /* =========================
         ID
      ========================= */

      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(400).json({
          message:
            "El identificador del pago no es válido",
        });
      }

      /* =========================
         MOTIVO
      ========================= */

      if (
        !motivoAnulacion ||
        !String(
          motivoAnulacion
        ).trim()
      ) {
        return res.status(400).json({
          message:
            "Debe indicar el motivo de la anulación",
        });
      }

      if (
        String(
          motivoAnulacion
        )
          .trim()
          .length < 5
      ) {
        return res.status(400).json({
          message:
            "El motivo de anulación debe ser más descriptivo",
        });
      }

      /* =========================
         PAGO
      ========================= */

      const pago =
        await Pago.findById(
          req.params.id
        );

      if (!pago) {
        return res.status(404).json({
          message:
            "El pago no fue encontrado",
        });
      }

      if (
        pago.estado ===
        "Anulado"
      ) {
        return res.status(409).json({
          message:
            "El pago ya se encuentra anulado",
        });
      }

      /* =========================
         VENTA ANULADA

         Si la venta completa ya está anulada,
         mantenemos el historial financiero y no
         intentamos reactivar sus cuotas.
      ========================= */

      const venta =
        await Venta.findById(
          pago.venta
        );

      /* =========================
         ANULAR PAGO
      ========================= */

      pago.estado =
        "Anulado";

      pago.motivoAnulacion =
        String(
          motivoAnulacion
        ).trim();

      pago.fechaAnulacion =
        new Date();

      await pago.save();

      /* =========================
         RECALCULAR CUOTAS

         Eliminamos duplicados por seguridad.
      ========================= */

      const cuotasAfectadas = [
        ...new Set(
          pago.aplicaciones.map(
            (aplicacion) =>
              String(
                aplicacion.cuota
              )
          )
        ),
      ];

      if (
        venta?.estado !==
        "Anulada"
      ) {
        for (
          const cuotaId
          of cuotasAfectadas
        ) {
          await recalcularCuotaDesdePagos(
            cuotaId
          );
        }

        await actualizarEstadoVenta(
          pago.venta
        );
      }

      const pagoCompleto =
        await obtenerPagoCompleto(
          pago._id
        );

      res.status(200).json({
        message:
          "Pago anulado correctamente. La cartera fue recalculada.",

        pago:
          pagoCompleto,
      });
    } catch (error) {
      console.error(
        "Error anulando pago:",
        error
      );

      res.status(500).json({
        message:
          "Error al anular el pago",
      });
    }
  };

/* =========================================================
   RESUMEN GENERAL DE PAGOS

   GET /api/pagos/resumen

   Los pagos anulados NO cuentan como dinero recibido.
========================================================= */

export const obtenerResumenPagos =
  async (
    _req,
    res
  ) => {
    try {
      const pagosAplicados =
        await Pago.find({
          estado:
            "Aplicado",
        }).select(
          "valorPago metodoPago"
        );

      const resumen =
        pagosAplicados.reduce(
          (
            acc,
            pago
          ) => {
            const valor =
              Number(
                pago.valorPago
              ) || 0;

            acc.totalPagos +=
              1;

            acc.totalRecibido +=
              valor;

            if (
              pago.metodoPago ===
              "Efectivo"
            ) {
              acc.efectivo +=
                valor;
            }

            if (
              pago.metodoPago ===
              "Transferencia"
            ) {
              acc.transferencia +=
                valor;
            }

            if (
              pago.metodoPago ===
              "Consignación"
            ) {
              acc.consignacion +=
                valor;
            }

            if (
              pago.metodoPago ===
              "PSE"
            ) {
              acc.pse +=
                valor;
            }

            if (
              pago.metodoPago ===
              "Otro"
            ) {
              acc.otro +=
                valor;
            }

            return acc;
          },
          {
            totalPagos: 0,

            totalRecibido: 0,

            efectivo: 0,

            transferencia: 0,

            consignacion: 0,

            pse: 0,

            otro: 0,
          }
        );

      resumen.totalRecibido =
        Number(
          resumen.totalRecibido.toFixed(
            2
          )
        );

      resumen.anulados =
        await Pago.countDocuments({
          estado:
            "Anulado",
        });

      res.status(200).json(
        resumen
      );
    } catch (error) {
      console.error(
        "Error obteniendo resumen de pagos:",
        error
      );

      res.status(500).json({
        message:
          "Error al obtener el resumen de pagos",
      });
    }
  };