import mongoose from "mongoose";

import Comision from "./comision.model.js";
import Venta from "../ventas/venta.model.js";

import {
  generarCodigoComision,
} from "../consecutivos/consecutivo.service.js";

/* =========================================================
   POPULATE COMPLETO DE COMISIÓN
========================================================= */

const obtenerComisionCompleta =
  async (
    comisionId
  ) => {
    return Comision.findById(
      comisionId
    )
      .populate({
        path: "vendedor",

        select:
          "codigo nombres apellidos documento telefono correo valorComision estado",
      })
      .populate({
        path: "cliente",

        select:
          "codigo nombres apellidos documento telefono",
      })
      .populate({
        path: "venta",

        select:
          "codigo fechaVenta valorVenta valorComision estado",
      })
      .populate({
        path: "lote",

        populate: {
          path: "manzana",

          select:
            "codigo nombre",
        },
      });
  };

/* =========================================================
   CREAR / SINCRONIZAR COMISIÓN DESDE UNA VENTA

   IMPORTANTE:

   La comisión NO se calcula usando
   el valor actual del vendedor.

   Se utiliza:

   venta.valorComision

   porque ese valor es el histórico
   que quedó guardado al momento de
   realizar la venta.
========================================================= */

export const sincronizarComisionDesdeVenta =
  async (
    ventaId
  ) => {
    if (
      !mongoose.Types.ObjectId.isValid(
        ventaId
      )
    ) {
      throw new Error(
        "La venta seleccionada no es válida"
      );
    }

    const venta =
      await Venta.findById(
        ventaId
      );

    if (
      !venta
    ) {
      throw new Error(
        "La venta no fue encontrada"
      );
    }

    /* =====================================================
       VENTA SIN VENDEDOR

       Ventas antiguas que no tengan vendedor
       todavía no pueden generar comisión.
    ===================================================== */

    if (
      !venta.vendedor
    ) {
      return {
        creada: false,

        actualizada: false,

        omitida: true,

        motivo:
          "La venta no tiene vendedor asignado",
      };
    }

    if (
      !venta.cliente ||
      !venta.lote
    ) {
      return {
        creada: false,

        actualizada: false,

        omitida: true,

        motivo:
          "La venta no tiene cliente o lote asociado",
      };
    }

    const valorComision =
      Number(
        venta.valorComision
      ) || 0;

    if (
      valorComision <
      0
    ) {
      throw new Error(
        `La venta ${venta.codigo} tiene una comisión inválida`
      );
    }

    /* =====================================================
       BUSCAR SI YA EXISTE
    ===================================================== */

    let comision =
      await Comision.findOne({
        venta:
          venta._id,
      });

    /* =====================================================
       YA EXISTE

       Si todavía NO tiene pagos,
       podemos mantenerla sincronizada
       con los datos históricos actuales
       de la venta.

       Cuando más adelante tenga pagos,
       ya no modificaremos su valor.
    ===================================================== */

    if (
      comision
    ) {
      const totalPagado =
        Number(
          comision.totalPagado
        ) || 0;

      if (
        totalPagado ===
        0
      ) {
        comision.vendedor =
          venta.vendedor;

        comision.cliente =
          venta.cliente;

        comision.lote =
          venta.lote;

        comision.valorComision =
          valorComision;

        comision.totalPagado =
          0;

        comision.saldoPendiente =
          valorComision;

        comision.estado =
          valorComision >
          0
            ? "Pendiente"
            : "Pagada";

        await comision.save();

        return {
          creada: false,

          actualizada: true,

          omitida: false,

          comision,
        };
      }

      return {
        creada: false,

        actualizada: false,

        omitida: false,

        comision,
      };
    }

    /* =====================================================
       GENERAR CÓDIGO
    ===================================================== */

    const codigo =
      await generarCodigoComision();

    /* =====================================================
       CREAR
    ===================================================== */

    comision =
      await Comision.create({
        codigo,

        venta:
          venta._id,

        vendedor:
          venta.vendedor,

        cliente:
          venta.cliente,

        lote:
          venta.lote,

        valorComision,

        totalPagado:
          0,

        saldoPendiente:
          valorComision,

        estado:
          valorComision >
          0
            ? "Pendiente"
            : "Pagada",

        fechaGeneracion:
          venta.fechaVenta ||
          venta.createdAt ||
          new Date(),

        fechaUltimoPago:
          null,

        observaciones:
          "",
      });

    return {
      creada: true,

      actualizada: false,

      omitida: false,

      comision,
    };
  };

/* =========================================================
   SINCRONIZAR TODAS LAS VENTAS

   Esto permite traer ventas creadas
   ANTES de que existiera el módulo
   Comisiones.

   Ejemplo:

   VT-0002 → José → $2.000.000
   VT-0003 → José → $2.000.000

   generará:

   CM-0001 → VT-0002
   CM-0002 → VT-0003
========================================================= */

const sincronizarTodasLasVentas =
  async () => {
    const ventas =
      await Venta.find({
        vendedor: {
          $ne: null,
        },
      })
        .select(
          "_id codigo vendedor cliente lote valorComision fechaVenta createdAt"
        )
        .sort({
          createdAt: 1,
        });

    let creadas =
      0;

    let actualizadas =
      0;

    let omitidas =
      0;

    for (
      const venta
      of ventas
    ) {
      try {
        const resultado =
          await sincronizarComisionDesdeVenta(
            venta._id
          );

        if (
          resultado.creada
        ) {
          creadas +=
            1;
        }

        if (
          resultado.actualizada
        ) {
          actualizadas +=
            1;
        }

        if (
          resultado.omitida
        ) {
          omitidas +=
            1;
        }
      } catch (error) {
        console.error(
          `Error sincronizando comisión de ${venta.codigo}:`,
          error
        );

        omitidas +=
          1;
      }
    }

    return {
      ventasRevisadas:
        ventas.length,

      creadas,

      actualizadas,

      omitidas,
    };
  };

/* =========================================================
   LISTAR COMISIONES

   GET /api/comisiones

   Filtros:

   ?vendedor=
   ?cliente=
   ?venta=
   ?estado=Pendiente
========================================================= */

export const obtenerComisiones =
  async (
    req,
    res
  ) => {
    try {
      /* =====================================================
         PRIMERO SINCRONIZAMOS

         Así aparecen también las ventas
         anteriores a este módulo.
      ===================================================== */

      await sincronizarTodasLasVentas();

      const {
        vendedor = "",
        cliente = "",
        venta = "",
        estado = "",
      } = req.query;

      const filtro = {};

      /* =========================
         VENDEDOR
      ========================= */

      if (
        vendedor
      ) {
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
        if (
          ![
            "Pendiente",
            "Abonada",
            "Pagada",
          ].includes(
            estado
          )
        ) {
          return res.status(
            400
          ).json({
            message:
              "El estado de la comisión no es válido",
          });
        }

        filtro.estado =
          estado;
      }

      /* =========================
         CONSULTAR
      ========================= */

      const comisiones =
        await Comision.find(
          filtro
        )
          .populate({
            path:
              "vendedor",

            select:
              "codigo nombres apellidos documento telefono correo estado",
          })
          .populate({
            path:
              "cliente",

            select:
              "codigo nombres apellidos documento telefono",
          })
          .populate({
            path:
              "venta",

            select:
              "codigo fechaVenta valorVenta valorComision estado",
          })
          .populate({
            path:
              "lote",

            populate: {
              path:
                "manzana",

              select:
                "codigo nombre",
            },
          })
          .sort({
            fechaGeneracion:
              -1,

            createdAt:
              -1,
          });

      /* =====================================================
         RESUMEN

         Se calcula sobre las comisiones
         que cumplen los filtros actuales.
      ===================================================== */

      const resumen =
        comisiones.reduce(
          (
            acumulado,
            comision
          ) => {
            const valor =
              Number(
                comision.valorComision
              ) || 0;

            const pagado =
              Number(
                comision.totalPagado
              ) || 0;

            const saldo =
              Number(
                comision.saldoPendiente
              ) || 0;

            acumulado.valorGenerado +=
              valor;

            acumulado.valorPagado +=
              pagado;

            acumulado.saldoPendiente +=
              saldo;

            if (
              comision.estado ===
              "Pendiente"
            ) {
              acumulado.pendientes +=
                1;
            }

            if (
              comision.estado ===
              "Abonada"
            ) {
              acumulado.abonadas +=
                1;
            }

            if (
              comision.estado ===
              "Pagada"
            ) {
              acumulado.pagadas +=
                1;
            }

            return acumulado;
          },
          {
            valorGenerado:
              0,

            valorPagado:
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

      res.status(
        200
      ).json({
        comisiones,

        resumen: {
          totalComisiones:
            comisiones.length,

          ...resumen,
        },
      });
    } catch (error) {
      console.error(
        "Error obteniendo comisiones:",
        error
      );

      res.status(
        500
      ).json({
        message:
          "Error al obtener las comisiones",
      });
    }
  };

/* =========================================================
   OBTENER UNA COMISIÓN

   GET /api/comisiones/:id
========================================================= */

export const obtenerComisionPorId =
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
            "El identificador de la comisión no es válido",
        });
      }

      const comision =
        await obtenerComisionCompleta(
          id
        );

      if (
        !comision
      ) {
        return res.status(
          404
        ).json({
          message:
            "La comisión no fue encontrada",
        });
      }

      res.status(
        200
      ).json(
        comision
      );
    } catch (error) {
      console.error(
        "Error obteniendo comisión:",
        error
      );

      res.status(
        500
      ).json({
        message:
          "Error al obtener la comisión",
      });
    }
  };

/* =========================================================
   SINCRONIZAR MANUALMENTE

   POST /api/comisiones/sincronizar

   Lo podemos usar desde un botón
   "Actualizar" en el frontend.
========================================================= */

export const sincronizarComisiones =
  async (
    req,
    res
  ) => {
    try {
      const resultado =
        await sincronizarTodasLasVentas();

      res.status(
        200
      ).json({
        message:
          "Comisiones sincronizadas correctamente",

        ...resultado,
      });
    } catch (error) {
      console.error(
        "Error sincronizando comisiones:",
        error
      );

      res.status(
        500
      ).json({
        message:
          "Error al sincronizar las comisiones",
      });
    }
  };