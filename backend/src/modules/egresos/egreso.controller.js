import mongoose from "mongoose";

import Egreso from "./egreso.model.js";
import Comision from "../comisiones/comision.model.js";

import {
  generarCodigoEgreso,
} from "../consecutivos/consecutivo.service.js";

/* =========================================================
   FORMAS DE PAGO VÁLIDAS
========================================================= */

const FORMAS_PAGO = [
  "Efectivo",
  "Transferencia",
  "Consignacion",
  "Otro",
];

/* =========================================================
   POPULATE DE EGRESO
========================================================= */

const obtenerEgresoCompleto =
  async (
    egresoId
  ) => {
    return Egreso.findById(
      egresoId
    )
      .populate({
        path: "vendedor",

        select:
          "codigo nombres apellidos documento telefono correo",
      })
      .populate({
        path: "comision",

        populate: [
          {
            path: "venta",

            select:
              "codigo fechaVenta valorVenta",
          },
          {
            path: "cliente",

            select:
              "nombres apellidos documento telefono",
          },
          {
            path: "lote",

            populate: {
              path: "manzana",

              select:
                "codigo nombre",
            },
          },
        ],
      });
  };

/* =========================================================
   RECALCULAR COMISIÓN DESDE SUS EGRESOS

   Este método evita descuadres.

   Revisa todos los movimientos que todavía existen
   y vuelve a calcular:

   - totalPagado
   - saldoPendiente
   - estado
   - fechaUltimoPago
========================================================= */

const recalcularComisionDesdeEgresos =
  async (
    comisionId
  ) => {
    const comision =
      await Comision.findById(
        comisionId
      );

    if (!comision) {
      throw new Error(
        "La comisión no fue encontrada"
      );
    }

    const movimientos =
      await Egreso.find({
        tipo:
          "Comision",

        comision:
          comisionId,
      })
        .sort({
          createdAt: 1,
        })
        .lean();

    const valorComision =
      Number(
        comision.valorComision
      ) || 0;

    const totalPagado =
      movimientos.reduce(
        (
          total,
          movimiento
        ) =>
          total +
          (
            Number(
              movimiento.valor
            ) || 0
          ),
        0
      );

    if (
      totalPagado >
      valorComision
    ) {
      throw new Error(
        "Los movimientos registrados superan el valor de la comisión"
      );
    }

    const saldoPendiente =
      Math.max(
        0,
        valorComision -
          totalPagado
      );

    let estado =
      "Pendiente";

    if (
      totalPagado > 0 &&
      saldoPendiente > 0
    ) {
      estado =
        "Abonada";
    }

    if (
      saldoPendiente ===
        0 &&
      valorComision > 0
    ) {
      estado =
        "Pagada";
    }

    let fechaUltimoPago =
      null;

    if (
      movimientos.length >
      0
    ) {
      const ultimoMovimiento =
        movimientos[
          movimientos.length -
            1
        ];

      fechaUltimoPago =
        ultimoMovimiento
          .fechaPago ||
        ultimoMovimiento
          .createdAt ||
        null;
    }

    const actualizada =
      await Comision.findByIdAndUpdate(
        comisionId,
        {
          $set: {
            totalPagado,

            saldoPendiente,

            estado,

            fechaUltimoPago,
          },
        },
        {
          new: true,
        }
      );

    return actualizada;
  };

/* =========================================================
   OBTENER ÚLTIMO MOVIMIENTO REGISTRADO

   IMPORTANTE:
   Utilizamos createdAt porque representa
   el orden en que realmente fueron registrados
   los movimientos en el sistema.
========================================================= */

const obtenerUltimoMovimientoComision =
  async (
    comisionId
  ) => {
    return Egreso.findOne({
      tipo:
        "Comision",

      comision:
        comisionId,
    })
      .sort({
        createdAt: -1,
      });
  };

/* =========================================================
   LISTAR EGRESOS

   GET /api/egresos

   Filtros:

   ?tipo=Comision
   ?tipoMovimiento=Abono
   ?vendedor=
   ?comision=
   ?desde=
   ?hasta=
========================================================= */

export const obtenerEgresos =
  async (
    req,
    res
  ) => {
    try {
      const {
        tipo = "",
        tipoMovimiento = "",
        vendedor = "",
        comision = "",
        desde = "",
        hasta = "",
      } = req.query;

      const filtro = {};

      /* =========================
         TIPO
      ========================= */

      if (tipo) {
        if (
          ![
            "Comision",
            "HorasMaquinaria",
            "Otro",
          ].includes(
            tipo
          )
        ) {
          return res.status(
            400
          ).json({
            message:
              "El tipo de egreso no es válido",
          });
        }

        filtro.tipo =
          tipo;
      }

      /* =========================
         MOVIMIENTO
      ========================= */

      if (
        tipoMovimiento
      ) {
        if (
          ![
            "Abono",
            "Pago",
          ].includes(
            tipoMovimiento
          )
        ) {
          return res.status(
            400
          ).json({
            message:
              "El tipo de movimiento no es válido",
          });
        }

        filtro.tipoMovimiento =
          tipoMovimiento;
      }

      /* =========================
         VENDEDOR
      ========================= */

      if (vendedor) {
        if (
          !mongoose.Types.ObjectId.isValid(
            vendedor
          )
        ) {
          return res.status(
            400
          ).json({
            message:
              "El vendedor seleccionado no es válido",
          });
        }

        filtro.vendedor =
          vendedor;
      }

      /* =========================
         COMISIÓN
      ========================= */

      if (comision) {
        if (
          !mongoose.Types.ObjectId.isValid(
            comision
          )
        ) {
          return res.status(
            400
          ).json({
            message:
              "La comisión seleccionada no es válida",
          });
        }

        filtro.comision =
          comision;
      }

      /* =========================
         FECHAS
      ========================= */

      if (
        desde ||
        hasta
      ) {
        filtro.fechaPago =
          {};

        if (desde) {
          const fechaDesde =
            new Date(
              `${desde}T00:00:00`
            );

          if (
            Number.isNaN(
              fechaDesde.getTime()
            )
          ) {
            return res.status(
              400
            ).json({
              message:
                "La fecha inicial no es válida",
            });
          }

          filtro.fechaPago.$gte =
            fechaDesde;
        }

        if (hasta) {
          const fechaHasta =
            new Date(
              `${hasta}T23:59:59.999`
            );

          if (
            Number.isNaN(
              fechaHasta.getTime()
            )
          ) {
            return res.status(
              400
            ).json({
              message:
                "La fecha final no es válida",
            });
          }

          filtro.fechaPago.$lte =
            fechaHasta;
        }
      }

      /* =========================
         CONSULTAR
      ========================= */

      const egresos =
        await Egreso.find(
          filtro
        )
          .populate({
            path: "vendedor",

            select:
              "codigo nombres apellidos documento",
          })
          .populate({
            path: "comision",

            select:
              "codigo valorComision totalPagado saldoPendiente estado",
          })
          .sort({
            fechaPago: -1,
            createdAt: -1,
          });

      /* =========================
         RESUMEN
      ========================= */

      const resumen =
        egresos.reduce(
          (
            acumulado,
            egreso
          ) => {
            acumulado.totalEgresos +=
              Number(
                egreso.valor
              ) || 0;

            if (
              egreso.tipo ===
              "Comision"
            ) {
              acumulado.totalComisiones +=
                Number(
                  egreso.valor
                ) || 0;
            }

            if (
              egreso.tipo ===
              "HorasMaquinaria"
            ) {
              acumulado.totalMaquinaria +=
                Number(
                  egreso.valor
                ) || 0;
            }

            if (
              egreso.tipo ===
              "Otro"
            ) {
              acumulado.totalOtros +=
                Number(
                  egreso.valor
                ) || 0;
            }

            return acumulado;
          },
          {
            totalMovimientos:
              egresos.length,

            totalEgresos:
              0,

            totalComisiones:
              0,

            totalMaquinaria:
              0,

            totalOtros:
              0,
          }
        );

      res.status(
        200
      ).json({
        egresos,
        resumen,
      });
    } catch (error) {
      console.error(
        "Error obteniendo egresos:",
        error
      );

      res.status(
        500
      ).json({
        message:
          "Error al obtener los egresos",
      });
    }
  };

/* =========================================================
   OBTENER EGRESO POR ID

   GET /api/egresos/:id
========================================================= */

export const obtenerEgresoPorId =
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
            "El identificador del egreso no es válido",
        });
      }

      const egreso =
        await obtenerEgresoCompleto(
          id
        );

      if (!egreso) {
        return res.status(
          404
        ).json({
          message:
            "El egreso no fue encontrado",
        });
      }

      res.status(
        200
      ).json(
        egreso
      );
    } catch (error) {
      console.error(
        "Error obteniendo egreso:",
        error
      );

      res.status(
        500
      ).json({
        message:
          "Error al obtener el egreso",
      });
    }
  };

/* =========================================================
   PAGAR / ABONAR COMISIÓN

   POST /api/egresos/comisiones/:comisionId

   BODY EJEMPLO ABONO:

   {
     "tipoMovimiento": "Abono",
     "valor": 500000,
     "formaPago": "Transferencia",
     "referenciaPago": "TRX-123",
     "observaciones": ""
   }

   BODY EJEMPLO PAGO TOTAL:

   {
     "tipoMovimiento": "Pago",
     "formaPago": "Efectivo"
   }
========================================================= */

export const registrarPagoComision =
  async (
    req,
    res
  ) => {
    try {
      const {
        comisionId,
      } = req.params;

      const {
        tipoMovimiento,
        valor,
        formaPago = "Efectivo",
        referenciaPago = "",
        fechaPago,
        observaciones = "",
      } = req.body;

      /* =====================================================
         VALIDAR ID
      ===================================================== */

      if (
        !mongoose.Types.ObjectId.isValid(
          comisionId
        )
      ) {
        return res.status(
          400
        ).json({
          message:
            "La comisión seleccionada no es válida",
        });
      }

      /* =====================================================
         VALIDAR MOVIMIENTO
      ===================================================== */

      if (
        ![
          "Abono",
          "Pago",
        ].includes(
          tipoMovimiento
        )
      ) {
        return res.status(
          400
        ).json({
          message:
            "Seleccione si desea realizar un Abono o un Pago",
        });
      }

      /* =====================================================
         VALIDAR FORMA DE PAGO
      ===================================================== */

      if (
        !FORMAS_PAGO.includes(
          formaPago
        )
      ) {
        return res.status(
          400
        ).json({
          message:
            "La forma de pago seleccionada no es válida",
        });
      }

      /* =====================================================
         BUSCAR COMISIÓN
      ===================================================== */

      const comision =
        await Comision.findById(
          comisionId
        )
          .populate({
            path: "vendedor",

            select:
              "codigo nombres apellidos documento telefono correo",
          })
          .populate({
            path: "venta",

            select:
              "codigo fechaVenta valorVenta",
          });

      if (!comision) {
        return res.status(
          404
        ).json({
          message:
            "La comisión no fue encontrada",
        });
      }

      /* =====================================================
         VALIDAR SALDO
      ===================================================== */

      const saldoAntes =
        Number(
          comision.saldoPendiente
        ) || 0;

      if (
        saldoAntes <= 0 ||
        comision.estado ===
          "Pagada"
      ) {
        return res.status(
          409
        ).json({
          message:
            `La comisión ${comision.codigo} ya se encuentra pagada`,
        });
      }

      /* =====================================================
         DETERMINAR VALOR A PAGAR
      ===================================================== */

      let valorPago;

      if (
        tipoMovimiento ===
        "Pago"
      ) {
        /*
          PAGO = TODO EL SALDO.

          No dependemos del valor enviado
          por el frontend.
        */

        valorPago =
          saldoAntes;
      } else {
        /*
          ABONO = VALOR DIGITADO.
        */

        valorPago =
          Number(
            valor
          );

        if (
          !Number.isFinite(
            valorPago
          ) ||
          valorPago <= 0
        ) {
          return res.status(
            400
          ).json({
            message:
              "Digite un valor de abono válido",
          });
        }

        if (
          valorPago >=
          saldoAntes
        ) {
          return res.status(
            400
          ).json({
            message:
              `Para cancelar todo el saldo utilice Pagar saldo. El saldo actual es ${saldoAntes}.`,
          });
        }
      }

      /* =====================================================
         FECHA
      ===================================================== */

      let fechaMovimiento =
        new Date();

      if (fechaPago) {
        fechaMovimiento =
          new Date(
            fechaPago
          );

        if (
          Number.isNaN(
            fechaMovimiento.getTime()
          )
        ) {
          return res.status(
            400
          ).json({
            message:
              "La fecha del pago no es válida",
          });
        }
      }

      /* =====================================================
         ACTUALIZACIÓN ATÓMICA DE LA COMISIÓN

         Esto evita pagar más del saldo disponible
         si dos operaciones intentaran ejecutarse
         al mismo tiempo.
      ===================================================== */

      const saldoDespues =
        Math.max(
          0,
          saldoAntes -
            valorPago
        );

      const nuevoEstado =
        saldoDespues ===
        0
          ? "Pagada"
          : "Abonada";

      const comisionActualizada =
        await Comision.findOneAndUpdate(
          {
            _id:
              comision._id,

            saldoPendiente: {
              $gte:
                valorPago,
            },

            estado: {
              $ne:
                "Pagada",
            },
          },
          {
            $inc: {
              totalPagado:
                valorPago,

              saldoPendiente:
                -valorPago,
            },

            $set: {
              estado:
                nuevoEstado,

              fechaUltimoPago:
                fechaMovimiento,
            },
          },
          {
            new: true,
          }
        );

      if (
        !comisionActualizada
      ) {
        return res.status(
          409
        ).json({
          message:
            "El saldo de la comisión cambió. Actualice la información e intente nuevamente.",
        });
      }

      /* =====================================================
         BENEFICIARIO
      ===================================================== */

      const nombreVendedor = [
        comision.vendedor
          ?.nombres,
        comision.vendedor
          ?.apellidos,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

      const beneficiarioNombre =
        nombreVendedor ||
        "Vendedor";

      const beneficiarioDocumento =
        comision.vendedor
          ?.documento ||
        "";

      /* =====================================================
         GENERAR CÓDIGO EGRESO
      ===================================================== */

      const codigo =
        await generarCodigoEgreso();

      /* =====================================================
         CONCEPTO
      ===================================================== */

      const concepto =
        tipoMovimiento ===
        "Abono"
          ? `Abono comisión ${comision.codigo}`
          : `Pago comisión ${comision.codigo}`;

      /* =====================================================
         CREAR EGRESO
      ===================================================== */

      let egreso;

      try {
        egreso =
          await Egreso.create({
            codigo,

            tipo:
              "Comision",

            tipoMovimiento,

            comision:
              comision._id,

            vendedor:
              comision.vendedor
                ?._id ||
              comision.vendedor ||
              null,

            beneficiarioNombre,

            beneficiarioDocumento,

            concepto,

            valor:
              valorPago,

            saldoAntes,

            saldoDespues:
              Number(
                comisionActualizada
                  .saldoPendiente
              ) || 0,

            formaPago,

            referenciaPago:
              String(
                referenciaPago ||
                  ""
              ).trim(),

            fechaPago:
              fechaMovimiento,

            observaciones:
              String(
                observaciones ||
                  ""
              ).trim(),
          });
      } catch (
        errorCreandoEgreso
      ) {
        /*
          Si por alguna razón falla la creación
          del egreso, devolvemos el dinero a la
          comisión para no dejar valores
          inconsistentes.
        */

        await Comision.findByIdAndUpdate(
          comision._id,
          {
            $inc: {
              totalPagado:
                -valorPago,

              saldoPendiente:
                valorPago,
            },

            $set: {
              estado:
                Number(
                  comision.totalPagado
                ) > 0
                  ? "Abonada"
                  : "Pendiente",

              fechaUltimoPago:
                comision.fechaUltimoPago ||
                null,
            },
          }
        );

        throw errorCreandoEgreso;
      }

      /* =====================================================
         RESPUESTA COMPLETA
      ===================================================== */

      const egresoCompleto =
        await obtenerEgresoCompleto(
          egreso._id
        );

      const comisionFinal =
        await Comision.findById(
          comision._id
        )
          .populate({
            path: "vendedor",

            select:
              "codigo nombres apellidos documento telefono",
          })
          .populate({
            path: "venta",

            select:
              "codigo fechaVenta valorVenta",
          });

      res.status(
        201
      ).json({
        message:
          tipoMovimiento ===
          "Pago"
            ? "Comisión pagada completamente."
            : "Abono registrado correctamente.",

        egreso:
          egresoCompleto,

        comision:
          comisionFinal,
      });
    } catch (error) {
      console.error(
        "Error registrando pago de comisión:",
        error
      );

      res.status(
        500
      ).json({
        message:
          "No fue posible registrar el pago de la comisión",
      });
    }
  };

/* =========================================================
   EDITAR ABONO DE COMISIÓN

   PUT /api/egresos/comisiones/abonos/:egresoId

   REGLAS:

   - Solo movimientos tipo Abono.
   - Pago total NO se puede editar.
   - Solo se puede editar el último movimiento.
========================================================= */

export const editarAbonoComision =
  async (
    req,
    res
  ) => {
    try {
      const {
        egresoId,
      } = req.params;

      const {
        valor,
        formaPago,
        referenciaPago = "",
        fechaPago,
        observaciones = "",
      } = req.body;

      /* =====================================================
         VALIDAR ID
      ===================================================== */

      if (
        !mongoose.Types.ObjectId.isValid(
          egresoId
        )
      ) {
        return res.status(
          400
        ).json({
          message:
            "El movimiento seleccionado no es válido",
        });
      }

      /* =====================================================
         BUSCAR EGRESO
      ===================================================== */

      const egreso =
        await Egreso.findById(
          egresoId
        );

      if (!egreso) {
        return res.status(
          404
        ).json({
          message:
            "El egreso no fue encontrado",
        });
      }

      if (
        egreso.tipo !==
        "Comision"
      ) {
        return res.status(
          400
        ).json({
          message:
            "Este movimiento no corresponde a una comisión",
        });
      }

      /* =====================================================
         PAGO TOTAL NO SE EDITA
      ===================================================== */

      if (
        egreso.tipoMovimiento !==
        "Abono"
      ) {
        return res.status(
          409
        ).json({
          message:
            "El pago total no se puede editar. Puede eliminarlo si necesita revertirlo.",
        });
      }

      /* =====================================================
         DEBE SER EL ÚLTIMO MOVIMIENTO
      ===================================================== */

      const ultimoMovimiento =
        await obtenerUltimoMovimientoComision(
          egreso.comision
        );

      if (
        !ultimoMovimiento ||
        String(
          ultimoMovimiento._id
        ) !==
          String(
            egreso._id
          )
      ) {
        return res.status(
          409
        ).json({
          message:
            "Solo se puede editar el último movimiento registrado de la comisión.",
        });
      }

      /* =====================================================
         BUSCAR COMISIÓN
      ===================================================== */

      const comision =
        await Comision.findById(
          egreso.comision
        );

      if (!comision) {
        return res.status(
          404
        ).json({
          message:
            "La comisión relacionada no fue encontrada",
        });
      }

      /* =====================================================
         VALIDAR NUEVO VALOR
      ===================================================== */

      const nuevoValor =
        Number(
          valor
        );

      if (
        !Number.isFinite(
          nuevoValor
        ) ||
        nuevoValor <= 0
      ) {
        return res.status(
          400
        ).json({
          message:
            "Digite un valor de abono válido",
        });
      }

      /* =====================================================
         CALCULAR LO PAGADO ANTES DE ESTE ABONO
      ===================================================== */

      const movimientosAnteriores =
        await Egreso.find({
          tipo:
            "Comision",

          comision:
            egreso.comision,

          _id: {
            $ne:
              egreso._id,
          },
        }).lean();

      const totalAnterior =
        movimientosAnteriores.reduce(
          (
            total,
            movimiento
          ) =>
            total +
            (
              Number(
                movimiento.valor
              ) || 0
            ),
          0
        );

      const valorComision =
        Number(
          comision.valorComision
        ) || 0;

      const saldoDisponible =
        Math.max(
          0,
          valorComision -
            totalAnterior
        );

      /*
        Sigue siendo ABONO.

        Si desea cancelar todo,
        debe hacerlo mediante Pagar saldo.
      */

      if (
        nuevoValor >=
        saldoDisponible
      ) {
        return res.status(
          400
        ).json({
          message:
            `El abono debe ser menor al saldo disponible. Para cancelar ${saldoDisponible}, utilice Pagar saldo.`,
        });
      }

      /* =====================================================
         FORMA DE PAGO
      ===================================================== */

      const nuevaFormaPago =
        formaPago ||
        egreso.formaPago ||
        "Efectivo";

      if (
        !FORMAS_PAGO.includes(
          nuevaFormaPago
        )
      ) {
        return res.status(
          400
        ).json({
          message:
            "La forma de pago seleccionada no es válida",
        });
      }

      /* =====================================================
         FECHA
      ===================================================== */

      let nuevaFecha =
        egreso.fechaPago;

      if (fechaPago) {
        nuevaFecha =
          new Date(
            fechaPago
          );

        if (
          Number.isNaN(
            nuevaFecha.getTime()
          )
        ) {
          return res.status(
            400
          ).json({
            message:
              "La fecha del abono no es válida",
          });
        }
      }

      /* =====================================================
         NUEVOS SALDOS HISTÓRICOS
      ===================================================== */

      const saldoAntes =
        saldoDisponible;

      const saldoDespues =
        saldoAntes -
        nuevoValor;

      /* =====================================================
         ACTUALIZAR EGRESO

         Se conserva el mismo código EG-xxxx.
      ===================================================== */

      egreso.valor =
        nuevoValor;

      egreso.saldoAntes =
        saldoAntes;

      egreso.saldoDespues =
        saldoDespues;

      egreso.formaPago =
        nuevaFormaPago;

      egreso.referenciaPago =
        String(
          referenciaPago ||
            ""
        ).trim();

      egreso.fechaPago =
        nuevaFecha;

      egreso.observaciones =
        String(
          observaciones ||
            ""
        ).trim();

      egreso.concepto =
        `Abono comisión ${comision.codigo}`;

      await egreso.save();

      /* =====================================================
         RECALCULAR COMISIÓN
      ===================================================== */

      const comisionActualizada =
        await recalcularComisionDesdeEgresos(
          egreso.comision
        );

      const egresoCompleto =
        await obtenerEgresoCompleto(
          egreso._id
        );

      res.status(
        200
      ).json({
        message:
          "Abono actualizado correctamente.",

        egreso:
          egresoCompleto,

        comision:
          comisionActualizada,
      });
    } catch (error) {
      console.error(
        "Error editando abono:",
        error
      );

      res.status(
        500
      ).json({
        message:
          error?.message ||
          "No fue posible editar el abono",
      });
    }
  };

/* =========================================================
   ELIMINAR MOVIMIENTO DE COMISIÓN

   DELETE /api/egresos/comisiones/movimientos/:egresoId

   REGLAS:

   ABONO:
   - Se puede eliminar.

   PAGO TOTAL:
   - Se puede eliminar.
   - NO se puede editar.

   SEGURIDAD:
   - Solo puede eliminarse el último movimiento.
========================================================= */

export const eliminarMovimientoComision =
  async (
    req,
    res
  ) => {
    try {
      const {
        egresoId,
      } = req.params;

      /* =====================================================
         VALIDAR ID
      ===================================================== */

      if (
        !mongoose.Types.ObjectId.isValid(
          egresoId
        )
      ) {
        return res.status(
          400
        ).json({
          message:
            "El movimiento seleccionado no es válido",
        });
      }

      /* =====================================================
         BUSCAR MOVIMIENTO
      ===================================================== */

      const egreso =
        await Egreso.findById(
          egresoId
        );

      if (!egreso) {
        return res.status(
          404
        ).json({
          message:
            "El movimiento no fue encontrado",
        });
      }

      if (
        egreso.tipo !==
        "Comision"
      ) {
        return res.status(
          400
        ).json({
          message:
            "Este movimiento no corresponde a una comisión",
        });
      }

      /* =====================================================
         SOLO ÚLTIMO MOVIMIENTO
      ===================================================== */

      const ultimoMovimiento =
        await obtenerUltimoMovimientoComision(
          egreso.comision
        );

      if (
        !ultimoMovimiento ||
        String(
          ultimoMovimiento._id
        ) !==
          String(
            egreso._id
          )
      ) {
        return res.status(
          409
        ).json({
          message:
            "Solo se puede eliminar el último movimiento registrado de la comisión.",
        });
      }

      /* =====================================================
         GUARDAR DATOS PARA RESPUESTA
      ===================================================== */

      const tipoMovimiento =
        egreso.tipoMovimiento;

      const codigoMovimiento =
        egreso.codigo;

      const valorEliminado =
        Number(
          egreso.valor
        ) || 0;

      const comisionId =
        egreso.comision;

      /* =====================================================
         ELIMINAR
      ===================================================== */

      await Egreso.findByIdAndDelete(
        egreso._id
      );

      /* =====================================================
         RECALCULAR AUTOMÁTICAMENTE
      ===================================================== */

      const comisionActualizada =
        await recalcularComisionDesdeEgresos(
          comisionId
        );

      res.status(
        200
      ).json({
        message:
          tipoMovimiento ===
          "Pago"
            ? "Pago total eliminado correctamente. La comisión volvió a quedar con saldo pendiente."
            : "Abono eliminado correctamente.",

        movimientoEliminado: {
          codigo:
            codigoMovimiento,

          tipoMovimiento,

          valor:
            valorEliminado,
        },

        comision:
          comisionActualizada,
      });
    } catch (error) {
      console.error(
        "Error eliminando movimiento:",
        error
      );

      res.status(
        500
      ).json({
        message:
          error?.message ||
          "No fue posible eliminar el movimiento",
      });
    }
  };

/* =========================================================
   HISTORIAL DE PAGOS DE UNA COMISIÓN

   GET /api/egresos/comisiones/:comisionId

   DEVUELVE TAMBIÉN:

   esUltimoMovimiento
   puedeEditar
   puedeEliminar
========================================================= */

export const obtenerPagosComision =
  async (
    req,
    res
  ) => {
    try {
      const {
        comisionId,
      } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          comisionId
        )
      ) {
        return res.status(
          400
        ).json({
          message:
            "La comisión seleccionada no es válida",
        });
      }

      const comision =
        await Comision.findById(
          comisionId
        )
          .populate({
            path: "vendedor",

            select:
              "codigo nombres apellidos documento",
          })
          .populate({
            path: "venta",

            select:
              "codigo fechaVenta valorVenta",
          });

      if (!comision) {
        return res.status(
          404
        ).json({
          message:
            "La comisión no fue encontrada",
        });
      }

      /*
        createdAt determina cuál fue
        el último movimiento registrado.
      */

      const egresos =
        await Egreso.find({
          tipo:
            "Comision",

          comision:
            comisionId,
        })
          .sort({
            createdAt: -1,
          })
          .lean();

      const ultimoMovimientoId =
        egresos.length >
        0
          ? String(
              egresos[0]._id
            )
          : null;

      const movimientos =
        egresos.map(
          (
            egreso
          ) => {
            const esUltimoMovimiento =
              String(
                egreso._id
              ) ===
              ultimoMovimientoId;

            /*
              ABONO:
              editar únicamente si es último.

              PAGO:
              nunca editar.
            */

            const puedeEditar =
              esUltimoMovimiento &&
              egreso.tipoMovimiento ===
                "Abono";

            /*
              Tanto Abono como Pago
              pueden eliminarse,
              siempre que sean el último.
            */

            const puedeEliminar =
              esUltimoMovimiento &&
              [
                "Abono",
                "Pago",
              ].includes(
                egreso.tipoMovimiento
              );

            return {
              ...egreso,

              esUltimoMovimiento,

              puedeEditar,

              puedeEliminar,
            };
          }
        );

      const totalPagos =
        movimientos.reduce(
          (
            total,
            egreso
          ) =>
            total +
            (
              Number(
                egreso.valor
              ) || 0
            ),
          0
        );

      res.status(
        200
      ).json({
        comision,

        movimientos,

        resumen: {
          valorComision:
            Number(
              comision.valorComision
            ) || 0,

          totalPagado:
            totalPagos,

          saldoPendiente:
            Number(
              comision.saldoPendiente
            ) || 0,

          estado:
            comision.estado,

          cantidadMovimientos:
            movimientos.length,
        },
      });
    } catch (error) {
      console.error(
        "Error obteniendo pagos de comisión:",
        error
      );

      res.status(
        500
      ).json({
        message:
          "No fue posible obtener el historial de pagos de la comisión",
      });
    }
  };