import mongoose from "mongoose";

import Venta from "./venta.model.js";
import Cliente from "../clientes/cliente.model.js";
import Lote from "../lotes/lote.model.js";
import Cuota from "../cuotas/cuota.model.js";
import Pago from "../pagos/pago.model.js";

import {
  generarCodigoVenta,
  generarCodigosCuotas,
} from "../consecutivos/consecutivo.service.js";

/* =========================================================
   CALCULAR FINANCIACIÓN
========================================================= */

const calcularFinanciacion = ({
  valorVenta,
  cuotaInicial,
  formaPago,
  numeroCuotas,
}) => {
  const valorVentaNum =
    Number(valorVenta);

  if (
    !Number.isFinite(valorVentaNum) ||
    valorVentaNum <= 0
  ) {
    return {
      error:
        "El valor de la venta debe ser mayor a 0",
    };
  }

  const cuotaInicialNum =
    Number(cuotaInicial) || 0;

  if (
    cuotaInicialNum < 0
  ) {
    return {
      error:
        "La cuota inicial no puede ser negativa",
    };
  }

  if (
    cuotaInicialNum >
    valorVentaNum
  ) {
    return {
      error:
        "La cuota inicial no puede ser mayor al valor de la venta",
    };
  }

  /* =====================================================
     CONTADO
  ===================================================== */

  if (
    formaPago ===
    "Contado"
  ) {
    return {
      valorVenta:
        valorVentaNum,

      cuotaInicial:
        cuotaInicialNum,

      saldoFinanciar:
        0,

      numeroCuotas:
        0,

      valorCuota:
        0,

      estado:
        "Pagada",
    };
  }

  /* =====================================================
     FINANCIADO
  ===================================================== */

  const saldoFinanciar =
    valorVentaNum -
    cuotaInicialNum;

  const numeroCuotasNum =
    Number(numeroCuotas);

  if (
    !Number.isInteger(
      numeroCuotasNum
    ) ||
    numeroCuotasNum <= 0
  ) {
    return {
      error:
        "El número de cuotas debe ser mayor a 0",
    };
  }

  if (
    saldoFinanciar <= 0
  ) {
    return {
      error:
        "El saldo a financiar debe ser mayor a 0",
    };
  }

  const valorCuota =
    saldoFinanciar /
    numeroCuotasNum;

  return {
    valorVenta:
      valorVentaNum,

    cuotaInicial:
      cuotaInicialNum,

    saldoFinanciar,

    numeroCuotas:
      numeroCuotasNum,

    valorCuota,

    estado:
      "Activa",
  };
};

/* =========================================================
   DISTRIBUIR VALORES DE CUOTAS

   Se reparte el saldo completo para que la suma
   de las cuotas coincida con el saldo financiado.
========================================================= */

const distribuirValoresCuotas = (
  total,
  numeroCuotas
) => {
  const totalCentavos =
    Math.round(
      Number(total) * 100
    );

  const baseCentavos =
    Math.floor(
      totalCentavos /
      numeroCuotas
    );

  const restoCentavos =
    totalCentavos -
    baseCentavos *
      numeroCuotas;

  const valores =
    [];

  for (
    let i = 0;
    i < numeroCuotas;
    i += 1
  ) {
    const centavos =
      baseCentavos +
      (
        i <
        restoCentavos
          ? 1
          : 0
      );

    valores.push(
      Number(
        (
          centavos /
          100
        ).toFixed(2)
      )
    );
  }

  return valores;
};

/* =========================================================
   NORMALIZAR FECHA UTC
========================================================= */

const normalizarFechaUTC = (
  fecha
) => {
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
      date.getUTCDate(),
      0,
      0,
      0,
      0
    )
  );
};

/* =========================================================
   AGREGAR MESES SEGURO

   Evita problemas con fechas como día 31
   cuando el siguiente mes tiene menos días.
========================================================= */

const agregarMesesSeguro = (
  fecha,
  meses
) => {
  const date =
    new Date(fecha);

  const diaOriginal =
    date.getUTCDate();

  const objetivo =
    new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth() +
          meses,
        1
      )
    );

  const ultimoDiaMes =
    new Date(
      Date.UTC(
        objetivo.getUTCFullYear(),
        objetivo.getUTCMonth() +
          1,
        0
      )
    ).getUTCDate();

  objetivo.setUTCDate(
    Math.min(
      diaOriginal,
      ultimoDiaMes
    )
  );

  return objetivo;
};

/* =========================================================
   VALIDAR LOTE ANTES DE VENDER

   REGULAR:
   - frente > 0
   - fondo > 0
   - areaM2 > 0

   IRREGULAR:
   - no necesita frente ni fondo
   - areaM2 > 0
   - el área registrada es la medida oficial
========================================================= */

const validarLoteParaVenta = (
  lote
) => {
  if (
    !lote
  ) {
    return {
      valido: false,

      message:
        "El lote seleccionado no existe",
    };
  }

  const areaM2 =
    Number(
      lote.areaM2
    );

  if (
    !Number.isFinite(
      areaM2
    ) ||
    areaM2 <= 0
  ) {
    return {
      valido: false,

      message:
        "El lote seleccionado no tiene un área válida para realizar la venta",
    };
  }

  const frente =
    Number(
      lote.frenteMetros || 0
    ) +
    Number(
      lote.frenteCentimetros || 0
    ) /
      100;

  const fondo =
    Number(
      lote.fondoMetros || 0
    ) +
    Number(
      lote.fondoCentimetros || 0
    ) /
      100;

  /*
    Los lotes creados antes de agregar tipoLote
    se consideran Regulares si tienen frente y fondo.
  */

  const tipoLote =
    lote.tipoLote ||
    (
      frente > 0 &&
      fondo > 0
        ? "Regular"
        : "Irregular"
    );

  if (
    ![
      "Regular",
      "Irregular",
    ].includes(
      tipoLote
    )
  ) {
    return {
      valido: false,

      message:
        "El tipo del lote seleccionado no es válido",
    };
  }

  /* =====================================================
     LOTE REGULAR
  ===================================================== */

  if (
    tipoLote ===
    "Regular"
  ) {
    if (
      frente <= 0
    ) {
      return {
        valido: false,

        message:
          "El lote regular no tiene una medida válida de frente",
      };
    }

    if (
      fondo <= 0
    ) {
      return {
        valido: false,

        message:
          "El lote regular no tiene una medida válida de fondo",
      };
    }
  }

  /* =====================================================
     LOTE IRREGULAR

     No exigimos frente ni fondo.
     areaM2 es la medida oficial.
  ===================================================== */

  return {
    valido: true,

    tipoLote,

    areaM2,

    frente,

    fondo,
  };
};

/* =========================================================
   CREAR CUOTAS AUTOMÁTICAS
========================================================= */

const crearCuotasAutomaticas =
  async (
    venta
  ) => {
    if (
      venta.formaPago !==
        "Financiado" ||
      Number(
        venta.numeroCuotas
      ) <= 0 ||
      Number(
        venta.saldoFinanciar
      ) <= 0
    ) {
      return [];
    }

    const numeroCuotas =
      Number(
        venta.numeroCuotas
      );

    const saldoFinanciar =
      Number(
        venta.saldoFinanciar
      );

    const fechaVenta =
      normalizarFechaUTC(
        venta.fechaVenta
      );

    if (
      !fechaVenta
    ) {
      throw new Error(
        "La fecha de la venta no es válida"
      );
    }

    const valoresCuotas =
      distribuirValoresCuotas(
        saldoFinanciar,
        numeroCuotas
      );

    /* =====================================================
       GENERAR CONSECUTIVOS CT
    ===================================================== */

    const codigosCuotas =
      await generarCodigosCuotas(
        numeroCuotas
      );

    const cuotas =
      [];

    for (
      let i = 0;
      i < numeroCuotas;
      i += 1
    ) {
      const valorCuota =
        Number(
          valoresCuotas[i]
        );

      const fechaVencimiento =
        agregarMesesSeguro(
          fechaVenta,
          i + 1
        );

      cuotas.push({
        codigo:
          codigosCuotas[i],

        venta:
          venta._id,

        numeroCuota:
          i + 1,

        fechaVencimiento,

        valorCuota,

        valorPagado:
          0,

        saldoPendiente:
          valorCuota,

        estado:
          "Pendiente",

        fechaPago:
          null,

        observaciones:
          "",
      });
    }

    return Cuota.insertMany(
      cuotas
    );
  };

/* =========================================================
   OBTENER VENTA POBLADA
========================================================= */

const obtenerVentaPoblada =
  async (
    ventaId
  ) => {
    return Venta.findById(
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
  };

/* =========================================================
   OBTENER VENTA DE UN LOTE

   GET /api/ventas/lote/:loteId/activa

   Conservamos el nombre de la ruta por compatibilidad
   con el módulo Lotes.

   En la lógica nueva una venta eliminada desaparece,
   por lo tanto cualquier venta existente es la actual.
========================================================= */

export const obtenerVentaActivaPorLote =
  async (
    req,
    res
  ) => {
    try {
      const {
        loteId,
      } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          loteId
        )
      ) {
        return res.status(
          400
        ).json({
          message:
            "El identificador del lote no es válido",
        });
      }

      const venta =
        await Venta.findOne({
          lote:
            loteId,
        })
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
          })
          .sort({
            createdAt:
              -1,
          });

      if (
        !venta
      ) {
        return res.status(
          404
        ).json({
          message:
            "El lote no tiene una venta registrada",
        });
      }

      res.status(
        200
      ).json(
        venta
      );
    } catch (error) {
      console.error(
        "Error obteniendo venta del lote:",
        error
      );

      res.status(
        500
      ).json({
        message:
          "Error al consultar la venta del lote",
      });
    }
  };

/* =========================================================
   CREAR VENTA

   POST /api/ventas
========================================================= */

export const crearVenta =
  async (
    req,
    res
  ) => {
    try {
      const {
        cliente,
        lote,
        fechaVenta,
        valorVenta,
        cuotaInicial,
        formaPago,
        numeroCuotas,
        observaciones,
      } = req.body;

      /* =========================
         CLIENTE
      ========================= */

      if (
        !cliente
      ) {
        return res.status(
          400
        ).json({
          message:
            "El cliente es obligatorio",
        });
      }

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

      const clienteExiste =
        await Cliente.findById(
          cliente
        );

      if (
        !clienteExiste
      ) {
        return res.status(
          404
        ).json({
          message:
            "El cliente seleccionado no existe",
        });
      }

      /* =========================
         LOTE
      ========================= */

      if (
        !lote
      ) {
        return res.status(
          400
        ).json({
          message:
            "El lote es obligatorio",
        });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          lote
        )
      ) {
        return res.status(
          400
        ).json({
          message:
            "El lote seleccionado no es válido",
        });
      }

      const loteExiste =
        await Lote.findById(
          lote
        );

      if (
        !loteExiste
      ) {
        return res.status(
          404
        ).json({
          message:
            "El lote seleccionado no existe",
        });
      }

      if (
        loteExiste.estado !==
        "Disponible"
      ) {
        return res.status(
          409
        ).json({
          message:
            "El lote no está disponible para la venta",
        });
      }

      /* =========================
         VALIDAR TIPO Y ÁREA
      ========================= */

      const validacionLote =
        validarLoteParaVenta(
          loteExiste
        );

      if (
        !validacionLote.valido
      ) {
        return res.status(
          400
        ).json({
          message:
            validacionLote.message,
        });
      }

      /*
        IMPORTANTE:

        Regular:
        se vende usando las medidas de
        frente, fondo y su área calculada.

        Irregular:
        se vende por el areaM2 total
        registrada en el lote.

        No recalculamos el área del
        irregular usando frente × fondo.
      */

      /* =========================
         FECHA
      ========================= */

      const fechaVentaNormalizada =
        normalizarFechaUTC(
          fechaVenta ||
          new Date()
        );

      if (
        !fechaVentaNormalizada
      ) {
        return res.status(
          400
        ).json({
          message:
            "La fecha de la venta no es válida",
        });
      }

      /* =========================
         FORMA DE PAGO
      ========================= */

      const forma =
        formaPago ===
        "Contado"
          ? "Contado"
          : "Financiado";

      /* =========================
         FINANCIACIÓN
      ========================= */

      const financiacion =
        calcularFinanciacion({
          valorVenta,
          cuotaInicial,
          formaPago:
            forma,
          numeroCuotas,
        });

      if (
        financiacion.error
      ) {
        return res.status(
          400
        ).json({
          message:
            financiacion.error,
        });
      }

      /* =========================
         GENERAR CONSECUTIVO
      ========================= */

      const codigo =
        await generarCodigoVenta();

      /* =========================
         CREAR VENTA
      ========================= */

      const venta =
        await Venta.create({
          codigo,

          cliente,
          lote,

          fechaVenta:
            fechaVentaNormalizada,

          valorVenta:
            financiacion.valorVenta,

          cuotaInicial:
            financiacion.cuotaInicial,

          saldoFinanciar:
            financiacion.saldoFinanciar,

          formaPago:
            forma,

          numeroCuotas:
            financiacion.numeroCuotas,

          valorCuota:
            financiacion.valorCuota,

          estado:
            financiacion.estado,

          observaciones:
            String(
              observaciones ||
              ""
            ).trim(),
        });

      /* =========================
         CREAR CUOTAS
      ========================= */

      let cuotasGeneradas =
        [];

      if (
        venta.formaPago ===
          "Financiado" &&
        Number(
          venta.numeroCuotas
        ) > 0
      ) {
        cuotasGeneradas =
          await crearCuotasAutomaticas(
            venta
          );
      }

      /* =========================
         MARCAR LOTE VENDIDO
      ========================= */

      loteExiste.estado =
        "Vendido";

      await loteExiste.save();

      /* =========================
         RESPUESTA
      ========================= */

      const ventaCompleta =
        await obtenerVentaPoblada(
          venta._id
        );

      res.status(
        201
      ).json({
        message:
          venta.formaPago ===
          "Financiado"
            ? `Venta ${venta.codigo} creada correctamente. Se generaron ${cuotasGeneradas.length} cuotas.`
            : `Venta ${venta.codigo} de contado creada correctamente.`,

        venta:
          ventaCompleta,

        cuotasGeneradas,
      });
    } catch (error) {
      console.error(
        "Error creando venta:",
        error
      );

      res.status(
        500
      ).json({
        message:
          "Error al crear la venta",
      });
    }
  };

/* =========================================================
   OBTENER TODAS LAS VENTAS

   GET /api/ventas
========================================================= */

export const obtenerVentas =
  async (
    _req,
    res
  ) => {
    try {
      const ventas =
        await Venta.find({})
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
          })
          .sort({
            createdAt:
              -1,
          });

      res.status(
        200
      ).json(
        ventas
      );
    } catch (error) {
      console.error(
        "Error obteniendo ventas:",
        error
      );

      res.status(
        500
      ).json({
        message:
          "Error al obtener las ventas",
      });
    }
  };

/* =========================================================
   OBTENER VENTA POR ID

   GET /api/ventas/:id
========================================================= */

export const obtenerVentaPorId =
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
            "El identificador de la venta no es válido",
        });
      }

      const venta =
        await obtenerVentaPoblada(
          id
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
            venta._id,
        }).sort({
          numeroCuota:
            1,
        });

      res.status(
        200
      ).json({
        venta,
        cuotas,
      });
    } catch (error) {
      console.error(
        "Error obteniendo venta:",
        error
      );

      res.status(
        500
      ).json({
        message:
          "Error al obtener la venta",
      });
    }
  };

/* =========================================================
   ACTUALIZAR VENTA

   PUT /api/ventas/:id

   REGLAS:

   - No se permite cambiar el lote.
   - Si cambia la financiación y existen pagos,
     primero deben eliminarse los pagos.
   - Si no existen pagos, se regeneran las cuotas.
   - Editar observaciones o cliente no altera una venta
     Pagada si la financiación no cambió.
========================================================= */

export const actualizarVenta =
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
            "El identificador de la venta no es válido",
        });
      }

      const venta =
        await Venta.findById(
          id
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

      /* =====================================================
         ESTRUCTURA ACTUAL
      ===================================================== */

      const estructuraAnterior = {
        valorVenta:
          Number(
            venta.valorVenta
          ),

        cuotaInicial:
          Number(
            venta.cuotaInicial
          ),

        saldoFinanciar:
          Number(
            venta.saldoFinanciar
          ),

        numeroCuotas:
          Number(
            venta.numeroCuotas
          ),

        formaPago:
          venta.formaPago,

        fechaVenta:
          venta.fechaVenta
            ? normalizarFechaUTC(
                venta.fechaVenta
              )?.getTime()
            : null,
      };

      const {
        cliente,
        fechaVenta,
        valorVenta,
        cuotaInicial,
        formaPago,
        numeroCuotas,
        observaciones,
      } = req.body;

      /* =========================
         CLIENTE
      ========================= */

      const clienteNuevo =
        cliente ||
        String(
          venta.cliente
        );

      if (
        !mongoose.Types.ObjectId.isValid(
          clienteNuevo
        )
      ) {
        return res.status(
          400
        ).json({
          message:
            "El cliente seleccionado no es válido",
        });
      }

      const clienteExiste =
        await Cliente.findById(
          clienteNuevo
        );

      if (
        !clienteExiste
      ) {
        return res.status(
          404
        ).json({
          message:
            "El cliente seleccionado no existe",
        });
      }

      /* =========================
         FORMA DE PAGO
      ========================= */

      const forma =
        (
          formaPago ??
          venta.formaPago
        ) ===
        "Contado"
          ? "Contado"
          : "Financiado";

      /* =========================
         FINANCIACIÓN
      ========================= */

      const financiacion =
        calcularFinanciacion({
          valorVenta:
            valorVenta ??
            venta.valorVenta,

          cuotaInicial:
            cuotaInicial ??
            venta.cuotaInicial,

          formaPago:
            forma,

          numeroCuotas:
            numeroCuotas ??
            venta.numeroCuotas,
        });

      if (
        financiacion.error
      ) {
        return res.status(
          400
        ).json({
          message:
            financiacion.error,
        });
      }

      /* =========================
         FECHA
      ========================= */

      let nuevaFecha =
        venta.fechaVenta;

      if (
        fechaVenta
      ) {
        nuevaFecha =
          normalizarFechaUTC(
            fechaVenta
          );

        if (
          !nuevaFecha
        ) {
          return res.status(
            400
          ).json({
            message:
              "La fecha de la venta no es válida",
          });
        }
      }

      const nuevaFechaComparacion =
        nuevaFecha
          ? normalizarFechaUTC(
              nuevaFecha
            )?.getTime()
          : null;

      /* =====================================================
         DETECTAR CAMBIO DE FINANCIACIÓN
      ===================================================== */

      const cambioFinanciacion =
        estructuraAnterior.valorVenta !==
          financiacion.valorVenta ||

        estructuraAnterior.cuotaInicial !==
          financiacion.cuotaInicial ||

        estructuraAnterior.saldoFinanciar !==
          financiacion.saldoFinanciar ||

        estructuraAnterior.numeroCuotas !==
          financiacion.numeroCuotas ||

        estructuraAnterior.formaPago !==
          forma ||

        estructuraAnterior.fechaVenta !==
          nuevaFechaComparacion;

      /* =====================================================
         SI CAMBIA FINANCIACIÓN, NO PUEDE HABER PAGOS
      ===================================================== */

      if (
        cambioFinanciacion
      ) {
        const pagosRegistrados =
          await Pago.countDocuments({
            venta:
              venta._id,
          });

        if (
          pagosRegistrados > 0
        ) {
          return res.status(
            409
          ).json({
            message:
              "No se puede modificar la financiación porque esta venta tiene pagos registrados. Primero elimine los pagos de esta venta.",
          });
        }
      }

      /* =====================================================
         VERIFICAR ESTRUCTURA DE CUOTAS
      ===================================================== */

      const cuotasExistentes =
        await Cuota.countDocuments({
          venta:
            venta._id,
        });

      const cantidadEsperada =
        forma ===
        "Financiado"
          ? Number(
              financiacion.numeroCuotas
            )
          : 0;

      const estructuraCuotasIncorrecta =
        cuotasExistentes !==
        cantidadEsperada;

      /* =====================================================
         ACTUALIZAR VENTA
      ===================================================== */

      venta.cliente =
        clienteNuevo;

      venta.fechaVenta =
        nuevaFecha;

      venta.valorVenta =
        financiacion.valorVenta;

      venta.cuotaInicial =
        financiacion.cuotaInicial;

      venta.saldoFinanciar =
        financiacion.saldoFinanciar;

      venta.formaPago =
        forma;

      venta.numeroCuotas =
        financiacion.numeroCuotas;

      venta.valorCuota =
        financiacion.valorCuota;

      /*
        Solo recalculamos el estado cuando realmente
        cambió la financiación.

        Así una venta financiada Pagada no vuelve a
        Activa simplemente por editar observaciones.
      */

      if (
        cambioFinanciacion
      ) {
        venta.estado =
          financiacion.estado;
      }

      venta.observaciones =
        String(
          observaciones ??
          venta.observaciones ??
          ""
        ).trim();

      await venta.save();

      /* =====================================================
         SINCRONIZAR CUOTAS
      ===================================================== */

      let cuotasActualizadas =
        false;

      let numeroCuotasGeneradas =
        null;

      if (
        cambioFinanciacion ||
        estructuraCuotasIncorrecta
      ) {
        const pagosRegistrados =
          await Pago.countDocuments({
            venta:
              venta._id,
          });

        /*
          Nunca destruimos cuotas mientras haya pagos.
        */

        if (
          pagosRegistrados ===
          0
        ) {
          await Cuota.deleteMany({
            venta:
              venta._id,
          });

          cuotasActualizadas =
            true;

          if (
            venta.formaPago ===
              "Financiado" &&
            Number(
              venta.numeroCuotas
            ) > 0 &&
            Number(
              venta.saldoFinanciar
            ) > 0
          ) {
            const nuevasCuotas =
              await crearCuotasAutomaticas(
                venta
              );

            numeroCuotasGeneradas =
              nuevasCuotas.length;
          } else {
            numeroCuotasGeneradas =
              0;
          }
        }
      }

      /* =========================
         RESPUESTA
      ========================= */

      const ventaCompleta =
        await obtenerVentaPoblada(
          venta._id
        );

      res.status(
        200
      ).json({
        message:
          cuotasActualizadas
            ? `Venta actualizada correctamente. Se generaron ${numeroCuotasGeneradas} cuotas.`
            : "Venta actualizada correctamente.",

        venta:
          ventaCompleta,

        cuotasActualizadas,

        numeroCuotasGeneradas,
      });
    } catch (error) {
      console.error(
        "Error actualizando venta:",
        error
      );

      res.status(
        500
      ).json({
        message:
          "Error al actualizar la venta",
      });
    }
  };

/* =========================================================
   ELIMINAR VENTA DEFINITIVAMENTE

   DELETE /api/ventas/:id

   REGLAS:

   1. Si existen pagos, la venta NO se elimina.
   2. Primero deben eliminarse todos sus pagos.
   3. Si no existen pagos:
      - se eliminan sus cuotas
      - se elimina la venta
      - el lote vuelve a Disponible
========================================================= */

export const eliminarVenta =
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
            "El identificador de la venta no es válido",
        });
      }

      /* =========================
         BUSCAR VENTA
      ========================= */

      const venta =
        await Venta.findById(
          id
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
         VERIFICAR PAGOS
      ========================= */

      const pagosRegistrados =
        await Pago.countDocuments({
          venta:
            venta._id,
        });

      if (
        pagosRegistrados > 0
      ) {
        return res.status(
          409
        ).json({
          message:
            "No se puede eliminar esta venta porque tiene pagos registrados. Primero elimine todos los pagos asociados a la venta.",
        });
      }

      /* =========================
         BUSCAR LOTE
      ========================= */

      const lote =
        await Lote.findById(
          venta.lote
        );

      /* =========================
         ELIMINAR CUOTAS
      ========================= */

      const resultadoCuotas =
        await Cuota.deleteMany({
          venta:
            venta._id,
        });

      /* =========================
         ELIMINAR VENTA
      ========================= */

      await Venta.deleteOne({
        _id:
          venta._id,
      });

      /* =========================
         LIBERAR LOTE
      ========================= */

      if (
        lote
      ) {
        lote.estado =
          "Disponible";

        await lote.save();
      }

      /* =========================
         RESPUESTA
      ========================= */

      res.status(
        200
      ).json({
        message:
          "Venta eliminada correctamente. El lote volvió a estar disponible.",

        ventaEliminada: {
          _id:
            venta._id,

          codigo:
            venta.codigo,
        },

        cuotasEliminadas:
          resultadoCuotas.deletedCount,

        loteLiberado:
          lote
            ? {
                _id:
                  lote._id,

                codigo:
                  lote.codigo,

                estado:
                  lote.estado,
              }
            : null,
      });
    } catch (error) {
      console.error(
        "Error eliminando venta:",
        error
      );

      res.status(
        500
      ).json({
        message:
          "Error al eliminar la venta",
      });
    }
  };