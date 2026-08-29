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
  const ultimoPago =
    await Pago.findOne({
      codigo: /^PG-\d+$/,
    })
      .sort({
        codigo: -1,
      })
      .select("codigo")
      .lean();

  let consecutivo = 1;

  if (
    ultimoPago?.codigo
  ) {
    const numero = Number(
      ultimoPago.codigo.replace(
        "PG-",
        ""
      )
    );

    if (
      Number.isFinite(
        numero
      )
    ) {
      consecutivo =
        numero + 1;
    }
  }

  return `PG-${String(
    consecutivo
  ).padStart(
    4,
    "0"
  )}`;
};

/* =========================================================
   DETERMINAR ESTADO DE UNA CUOTA

   Estados válidos:

   - Pendiente
   - Parcial
   - Pagada
   - Vencida
========================================================= */

const determinarEstadoCuota = (
  cuota
) => {
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

  /* =========================
     PAGADA
  ========================= */

  if (
    saldo <= 0
  ) {
    return "Pagada";
  }

  /* =========================
     VENCIDA
  ========================= */

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

  /* =========================
     PARCIAL
  ========================= */

  if (
    valorPagado > 0
  ) {
    return "Parcial";
  }

  /* =========================
     PENDIENTE
  ========================= */

  return "Pendiente";
};

/* =========================================================
   RECALCULAR CUOTA DESDE LOS PAGOS EXISTENTES

   Esta función se utiliza tanto después de crear
   como después de eliminar un pago.

   Si un pago desaparece, su valor deja de contar
   automáticamente y vuelve al saldo pendiente.
========================================================= */

const recalcularCuotaDesdePagos =
  async (
    cuotaId
  ) => {
    const cuota =
      await Cuota.findById(
        cuotaId
      );

    if (
      !cuota
    ) {
      return null;
    }

    /* =====================================================
       BUSCAR TODOS LOS PAGOS QUE AFECTAN ESTA CUOTA
    ===================================================== */

    const pagos =
      await Pago.find({
        "aplicaciones.cuota":
          cuota._id,
      })
        .select(
          "fechaPago aplicaciones createdAt"
        )
        .sort({
          fechaPago: 1,
          createdAt: 1,
        })
        .lean();

    let totalPagado =
      0;

    let ultimaFechaAplicada =
      null;

    pagos.forEach(
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

              ultimaFechaAplicada =
                pago.fechaPago ||
                pago.createdAt ||
                ultimaFechaAplicada;
            }
          }
        );
      }
    );

    totalPagado =
      Number(
        totalPagado.toFixed(
          2
        )
      );

    const valorCuota =
      Number(
        cuota.valorCuota
      ) || 0;

    /*
      Una cuota nunca puede quedar
      con más dinero pagado que su valor.
    */

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
        ).toFixed(
          2
        )
      );

    cuota.estado =
      determinarEstadoCuota(
        cuota
      );

    /*
      fechaPago solamente se conserva cuando
      la cuota quedó totalmente pagada.
    */

    cuota.fechaPago =
      cuota.estado ===
      "Pagada"
        ? ultimaFechaAplicada ||
          new Date()
        : null;

    await cuota.save();

    return cuota;
  };

/* =========================================================
   ACTUALIZAR ESTADO GENERAL DE LA VENTA

   Venta financiada:

   Tiene saldo
   -> Activa

   No tiene saldo
   -> Pagada
========================================================= */

const actualizarEstadoVenta =
  async (
    ventaId
  ) => {
    const venta =
      await Venta.findById(
        ventaId
      );

    if (
      !venta
    ) {
      return null;
    }

    if (
      venta.formaPago !==
      "Financiado"
    ) {
      return venta;
    }

    const cuotas =
      await Cuota.find({
        venta:
          venta._id,
      }).select(
        "saldoPendiente"
      );

    if (
      cuotas.length === 0
    ) {
      return venta;
    }

    const tieneSaldo =
      cuotas.some(
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
   OBTENER PAGO COMPLETO
========================================================= */

const obtenerPagoCompleto =
  async (
    pagoId
  ) => {
    return Pago.findById(
      pagoId
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
        metodoPago = "",
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

        filtro.cliente =
          cliente;
      }

      /* =========================
         MÉTODO
      ========================= */

      if (
        metodoPago
      ) {
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

          filtro.fechaPago.$gte =
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

          filtro.fechaPago.$lte =
            final;
        }
      }

      /* =========================
         CONSULTAR
      ========================= */

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

      res.status(
        200
      ).json(
        pagos
      );
    } catch (error) {
      console.error(
        "Error obteniendo pagos:",
        error
      );

      res.status(
        500
      ).json({
        message:
          "Error al obtener los pagos",
      });
    }
  };

/* =========================================================
   OBTENER PAGO POR ID

   GET /api/pagos/:id
========================================================= */

export const obtenerPagoPorId =
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
            "El identificador del pago no es válido",
        });
      }

      const pago =
        await obtenerPagoCompleto(
          id
        );

      if (
        !pago
      ) {
        return res.status(
          404
        ).json({
          message:
            "El pago no fue encontrado",
        });
      }

      res.status(
        200
      ).json(
        pago
      );
    } catch (error) {
      console.error(
        "Error obteniendo pago:",
        error
      );

      res.status(
        500
      ).json({
        message:
          "Error al obtener el pago",
      });
    }
  };

/* =========================================================
   REGISTRAR PAGO

   POST /api/pagos

   El dinero se aplica comenzando
   por la cuota pendiente más antigua.
========================================================= */

export const crearPago =
  async (
    req,
    res
  ) => {
    try {
      const {
        venta:
          ventaId,

        valorPago,

        fechaPago,

        metodoPago =
          "Efectivo",

        referencia =
          "",

        observaciones =
          "",
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
        return res.status(
          400
        ).json({
          message:
            "Debe seleccionar una venta válida",
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

      /* =========================
         SOLO FINANCIADO
      ========================= */

      if (
        venta.formaPago !==
        "Financiado"
      ) {
        return res.status(
          409
        ).json({
          message:
            "Esta venta es de contado y no tiene cuotas por pagar",
        });
      }

      /* =========================
         VALOR
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
        return res.status(
          400
        ).json({
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

      if (
        !fecha
      ) {
        return res.status(
          400
        ).json({
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
        return res.status(
          400
        ).json({
          message:
            "El método de pago no es válido",
        });
      }

      /* =========================
         REFERENCIA
      ========================= */

      if (
        [
          "Transferencia",
          "Consignación",
          "PSE",
        ].includes(
          metodoPago
        ) &&
        !String(
          referencia || ""
        ).trim()
      ) {
        return res.status(
          400
        ).json({
          message:
            "Debe indicar la referencia o número de la transacción",
        });
      }

      /* =========================
         CUOTAS CON SALDO
      ========================= */

      const cuotasPendientes =
        await Cuota.find({
          venta:
            venta._id,

          saldoPendiente: {
            $gt:
              0,
          },
        }).sort({
          fechaVencimiento: 1,
          numeroCuota: 1,
        });

      if (
        cuotasPendientes.length ===
        0
      ) {
        return res.status(
          409
        ).json({
          message:
            "La venta no tiene cuotas pendientes por pagar",
        });
      }

      /* =========================
         SALDO REAL
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
            .toFixed(
              2
            )
        );

      if (
        valor >
        saldoReal
      ) {
        return res.status(
          400
        ).json({
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
          valor.toFixed(
            2
          )
        );

      const aplicaciones =
        [];

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
          ) || 0;

        if (
          saldoCuota <=
          0
        ) {
          continue;
        }

        const valorAplicado =
          Number(
            Math.min(
              dineroDisponible,
              saldoCuota
            ).toFixed(
              2
            )
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
            ).toFixed(
              2
            )
          );
      }

      if (
        aplicaciones.length ===
        0
      ) {
        return res.status(
          409
        ).json({
          message:
            "No fue posible aplicar el pago a ninguna cuota",
        });
      }

      /* =========================
         GENERAR CÓDIGO
      ========================= */

      let codigo =
        await generarCodigoPago();

      let nuevoPago;

      /*
        Se realizan varios intentos por si dos pagos
        fueran registrados prácticamente al mismo tiempo
        y chocaran con el índice único del código.
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

              observaciones:
                String(
                  observaciones || ""
                ).trim(),
            });

          break;
        } catch (error) {
          if (
            error.code !==
              11000 ||
            intento ===
              4
          ) {
            throw error;
          }

          codigo =
            await generarCodigoPago();
        }
      }

      if (
        !nuevoPago
      ) {
        throw new Error(
          "No fue posible crear el pago"
        );
      }

      /* =========================
         CUOTAS AFECTADAS
      ========================= */

      const cuotasAfectadas = [
        ...new Set(
          aplicaciones.map(
            (aplicacion) =>
              String(
                aplicacion.cuota
              )
          )
        ),
      ];

      /* =========================
         RECALCULAR CUOTAS
      ========================= */

      for (
        const cuotaId
        of cuotasAfectadas
      ) {
        await recalcularCuotaDesdePagos(
          cuotaId
        );
      }

      /* =========================
         RECALCULAR VENTA
      ========================= */

      await actualizarEstadoVenta(
        venta._id
      );

      /* =========================
         PAGO COMPLETO
      ========================= */

      const pagoCompleto =
        await obtenerPagoCompleto(
          nuevoPago._id
        );

      const saldoDespues =
        Number(
          (
            saldoReal -
            valor
          ).toFixed(
            2
          )
        );

      /* =========================
         RESPUESTA
      ========================= */

      res.status(
        201
      ).json({
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

      res.status(
        500
      ).json({
        message:
          "Error al registrar el pago",
      });
    }
  };

/* =========================================================
   ELIMINAR PAGO DEFINITIVAMENTE

   DELETE /api/pagos/:id

   1. Guarda las cuotas afectadas.
   2. Elimina definitivamente el pago.
   3. Recalcula las cuotas con los pagos restantes.
   4. El dinero eliminado vuelve al saldo pendiente.
   5. Recalcula el estado de la venta.
========================================================= */

export const eliminarPago =
  async (
    req,
    res
  ) => {
    try {
      const {
        id,
      } = req.params;

      /* =========================
         VALIDAR ID
      ========================= */

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(
          400
        ).json({
          message:
            "El identificador del pago no es válido",
        });
      }

      /* =========================
         BUSCAR PAGO
      ========================= */

      const pago =
        await Pago.findById(
          id
        );

      if (
        !pago
      ) {
        return res.status(
          404
        ).json({
          message:
            "El pago no fue encontrado",
        });
      }

      const ventaId =
        pago.venta;

      const pagoEliminado = {
        _id:
          pago._id,

        codigo:
          pago.codigo,

        valorPago:
          pago.valorPago,

        fechaPago:
          pago.fechaPago,

        metodoPago:
          pago.metodoPago,
      };

      /* =========================
         CUOTAS AFECTADAS
      ========================= */

      const cuotasAfectadas = [
        ...new Set(
          (
            pago.aplicaciones ||
            []
          ).map(
            (aplicacion) =>
              String(
                aplicacion.cuota
              )
          )
        ),
      ];

      /* =========================
         ELIMINAR PAGO
      ========================= */

      await Pago.deleteOne({
        _id:
          pago._id,
      });

      /* =========================
         RECALCULAR CUOTAS
      ========================= */

      for (
        const cuotaId
        of cuotasAfectadas
      ) {
        await recalcularCuotaDesdePagos(
          cuotaId
        );
      }

      /* =========================
         RECALCULAR VENTA
      ========================= */

      if (
        ventaId
      ) {
        await actualizarEstadoVenta(
          ventaId
        );
      }

      /* =========================
         RESPUESTA
      ========================= */

      res.status(
        200
      ).json({
        message:
          "Pago eliminado correctamente. El valor volvió al saldo pendiente y la cartera fue recalculada.",

        pagoEliminado,
      });
    } catch (error) {
      console.error(
        "Error eliminando pago:",
        error
      );

      res.status(
        500
      ).json({
        message:
          "Error al eliminar el pago",
      });
    }
  };

/* =========================================================
   RESUMEN GENERAL DE PAGOS

   GET /api/pagos/resumen

   Todo pago que existe representa dinero recibido.
========================================================= */

export const obtenerResumenPagos =
  async (
    _req,
    res
  ) => {
    try {
      const pagos =
        await Pago.find({})
          .select(
            "valorPago metodoPago"
          )
          .lean();

      const resumen =
        pagos.reduce(
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

            switch (
              pago.metodoPago
            ) {
              case "Efectivo":
                acc.efectivo +=
                  valor;
                break;

              case "Transferencia":
                acc.transferencia +=
                  valor;
                break;

              case "Consignación":
                acc.consignacion +=
                  valor;
                break;

              case "PSE":
                acc.pse +=
                  valor;
                break;

              case "Otro":
                acc.otro +=
                  valor;
                break;

              default:
                break;
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

      /*
        Redondeamos todos los valores monetarios.
      */

      resumen.totalRecibido =
        Number(
          resumen.totalRecibido.toFixed(
            2
          )
        );

      resumen.efectivo =
        Number(
          resumen.efectivo.toFixed(
            2
          )
        );

      resumen.transferencia =
        Number(
          resumen.transferencia.toFixed(
            2
          )
        );

      resumen.consignacion =
        Number(
          resumen.consignacion.toFixed(
            2
          )
        );

      resumen.pse =
        Number(
          resumen.pse.toFixed(
            2
          )
        );

      resumen.otro =
        Number(
          resumen.otro.toFixed(
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
        "Error obteniendo resumen de pagos:",
        error
      );

      res.status(
        500
      ).json({
        message:
          "Error al obtener el resumen de pagos",
      });
    }
  };