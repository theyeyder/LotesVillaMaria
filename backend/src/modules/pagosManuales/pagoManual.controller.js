import mongoose from "mongoose";

import PagoManual from "./pagoManual.model.js";

import Beneficiario from "../beneficiarios/beneficiario.model.js";

import Egreso from "../egresos/egreso.model.js";

import {
  generarCodigoEgreso,
} from "../consecutivos/consecutivo.service.js";

/* =========================================================
   PAGOS MANUALES
   LOTES VILLA MARÍA

   Cada Pago Manual:

   1. Tiene un Beneficiario.
   2. Representa una salida real de dinero.
   3. Genera automáticamente un EG-XXXX.
   4. Aparece posteriormente dentro de Egresos.
========================================================= */

/* =========================================================
   FORMAS DE PAGO
========================================================= */

const FORMAS_PAGO = [
  "Efectivo",
  "Transferencia",
  "Consignacion",
  "Otro",
];

/* =========================================================
   HELPERS
========================================================= */

const limpiarTexto = (valor = "") => {
  return String(valor ?? "").trim();
};

const escaparRegex = (texto = "") => {
  return String(texto).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
};

const validarId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/* =========================================================
   FECHA
========================================================= */

const convertirFecha = (valor) => {
  if (!valor) {
    return new Date();
  }

  const fecha = new Date(valor);

  if (
    Number.isNaN(
      fecha.getTime()
    )
  ) {
    return null;
  }

  return fecha;
};

/* =========================================================
   OBTENER PAGO MANUAL COMPLETO
========================================================= */

const obtenerPagoManualCompleto = async (
  pagoManualId
) => {
  return PagoManual.findById(
    pagoManualId
  )
    .populate({
      path: "beneficiario",

      select:
        "nombre tipoDocumento documento telefono observaciones estado",
    })
    .populate({
      path: "egreso",

      select:
        "codigo tipo tipoMovimiento concepto valor formaPago referenciaPago fechaPago observaciones",
    });
};

/* =========================================================
   LISTAR PAGOS MANUALES

   GET /api/pagos-manuales

   FILTROS:

   ?buscar=cafe
   ?beneficiario=
   ?formaPago=Efectivo
   ?desde=2026-10-01
   ?hasta=2026-10-31
========================================================= */

export const obtenerPagosManuales = async (
  req,
  res
) => {
  try {
    const {
      buscar = "",
      beneficiario = "",
      formaPago = "",
      desde = "",
      hasta = "",
    } = req.query;

    const filtro = {};

    /* =====================================================
       BENEFICIARIO
    ===================================================== */

    if (beneficiario) {
      if (
        !validarId(
          beneficiario
        )
      ) {
        return res.status(400).json({
          message:
            "El beneficiario seleccionado no es válido.",
        });
      }

      filtro.beneficiario =
        beneficiario;
    }

    /* =====================================================
       FORMA DE PAGO
    ===================================================== */

    if (formaPago) {
      if (
        !FORMAS_PAGO.includes(
          formaPago
        )
      ) {
        return res.status(400).json({
          message:
            "La forma de pago seleccionada no es válida.",
        });
      }

      filtro.formaPago =
        formaPago;
    }

    /* =====================================================
       BÚSQUEDA
    ===================================================== */

    const textoBusqueda =
      limpiarTexto(buscar);

    if (textoBusqueda) {
      const regex =
        new RegExp(
          escaparRegex(
            textoBusqueda
          ),
          "i"
        );

      filtro.$or = [
        {
          beneficiarioNombre:
            regex,
        },

        {
          beneficiarioDocumento:
            regex,
        },

        {
          motivo:
            regex,
        },

        {
          observaciones:
            regex,
        },

        {
          referenciaPago:
            regex,
        },
      ];
    }

    /* =====================================================
       FECHAS
    ===================================================== */

    if (
      desde ||
      hasta
    ) {
      filtro.fechaPago = {};

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
          return res.status(400).json({
            message:
              "La fecha inicial no es válida.",
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
          return res.status(400).json({
            message:
              "La fecha final no es válida.",
          });
        }

        filtro.fechaPago.$lte =
          fechaHasta;
      }
    }

    /* =====================================================
       CONSULTAR
    ===================================================== */

    const pagosManuales =
      await PagoManual.find(
        filtro
      )
        .populate({
          path: "beneficiario",

          select:
            "nombre tipoDocumento documento telefono estado",
        })
        .populate({
          path: "egreso",

          select:
            "codigo tipo concepto valor formaPago fechaPago",
        })
        .sort({
          fechaPago: -1,
          createdAt: -1,
        });

    /* =====================================================
       RESUMEN
    ===================================================== */

    const totalPagado =
      pagosManuales.reduce(
        (
          total,
          pago
        ) =>
          total +
          (
            Number(
              pago.valor
            ) || 0
          ),
        0
      );

    return res.status(200).json({
      pagosManuales,

      resumen: {
        cantidadMovimientos:
          pagosManuales.length,

        totalPagado,
      },
    });
  } catch (error) {
    console.error(
      "Error obteniendo pagos manuales:",
      error
    );

    return res.status(500).json({
      message:
        "No fue posible obtener los pagos manuales.",
    });
  }
};

/* =========================================================
   OBTENER PAGO MANUAL POR ID

   GET /api/pagos-manuales/:id
========================================================= */

export const obtenerPagoManualPorId = async (
  req,
  res
) => {
  try {
    const {
      id,
    } = req.params;

    if (
      !validarId(
        id
      )
    ) {
      return res.status(400).json({
        message:
          "El pago manual seleccionado no es válido.",
      });
    }

    const pago =
      await obtenerPagoManualCompleto(
        id
      );

    if (!pago) {
      return res.status(404).json({
        message:
          "El pago manual no fue encontrado.",
      });
    }

    return res.status(200).json(
      pago
    );
  } catch (error) {
    console.error(
      "Error obteniendo pago manual:",
      error
    );

    return res.status(500).json({
      message:
        "No fue posible obtener el pago manual.",
    });
  }
};

/* =========================================================
   REGISTRAR PAGO MANUAL

   POST /api/pagos-manuales

   BODY:

   {
     "beneficiario": "...",
     "motivo": "Compra de café",
     "valor": 10000,
     "fechaPago": "2026-10-12",
     "formaPago": "Efectivo",
     "referenciaPago": "",
     "observaciones": "Café para oficina"
   }
========================================================= */

export const crearPagoManual = async (
  req,
  res
) => {
  let pagoManualCreado = null;

  let egresoCreado = null;

  try {
    const {
      beneficiario,
      motivo,
      fechaPago,
      formaPago = "Efectivo",
      referenciaPago = "",
      observaciones = "",
    } = req.body;

    /*
      Aceptamos tanto "valor"
      como "monto".

      Internamente siempre guardamos
      el campo como valor.
    */

    const valorPago =
      Number(
        req.body.valor ??
          req.body.monto
      );

    /* =====================================================
       VALIDAR BENEFICIARIO
    ===================================================== */

    if (
      !beneficiario ||
      !validarId(
        beneficiario
      )
    ) {
      return res.status(400).json({
        message:
          "Seleccione un beneficiario válido.",
      });
    }

    const persona =
      await Beneficiario.findById(
        beneficiario
      );

    if (!persona) {
      return res.status(404).json({
        message:
          "El beneficiario no fue encontrado.",
      });
    }

    if (
      persona.estado !==
      "Activo"
    ) {
      return res.status(409).json({
        message:
          "El beneficiario seleccionado se encuentra Inactivo.",
      });
    }

    /* =====================================================
       MOTIVO
    ===================================================== */

    const motivoLimpio =
      limpiarTexto(
        motivo
      );

    if (!motivoLimpio) {
      return res.status(400).json({
        message:
          "El motivo del pago es obligatorio.",
      });
    }

    /* =====================================================
       VALOR
    ===================================================== */

    if (
      !Number.isFinite(
        valorPago
      ) ||
      valorPago <= 0
    ) {
      return res.status(400).json({
        message:
          "Digite un valor de pago válido.",
      });
    }

    /* =====================================================
       FORMA DE PAGO
    ===================================================== */

    if (
      !FORMAS_PAGO.includes(
        formaPago
      )
    ) {
      return res.status(400).json({
        message:
          "La forma de pago seleccionada no es válida.",
      });
    }

    /* =====================================================
       FECHA
    ===================================================== */

    const fechaMovimiento =
      convertirFecha(
        fechaPago
      );

    if (!fechaMovimiento) {
      return res.status(400).json({
        message:
          "La fecha del pago no es válida.",
      });
    }

    /* =====================================================
       DATOS HISTÓRICOS BENEFICIARIO
    ===================================================== */

    const beneficiarioNombre =
      limpiarTexto(
        persona.nombre
      );

    const beneficiarioDocumento =
      limpiarTexto(
        persona.documento
      );

    /* =====================================================
       CREAR PAGO MANUAL

       Primero se crea sin Egreso.

       Luego lo relacionamos con EG-XXXX.
    ===================================================== */

    pagoManualCreado =
      await PagoManual.create({
        beneficiario:
          persona._id,

        beneficiarioNombre,

        beneficiarioDocumento,

        motivo:
          motivoLimpio,

        valor:
          valorPago,

        fechaPago:
          fechaMovimiento,

        formaPago,

        referenciaPago:
          limpiarTexto(
            referenciaPago
          ),

        observaciones:
          limpiarTexto(
            observaciones
          ),

        egreso:
          null,
      });

    /* =====================================================
       GENERAR CÓDIGO EGRESO

       Utilizamos exactamente el mismo
       consecutivo de todos los demás EG.
    ===================================================== */

    const codigo =
      await generarCodigoEgreso();

    /* =====================================================
       CONCEPTO
    ===================================================== */

    const concepto =
      `Pago manual - ${motivoLimpio}`;

    /* =====================================================
       CREAR EGRESO
    ===================================================== */

    try {
      egresoCreado =
        await Egreso.create({
          codigo,

          tipo:
            "PagoManual",

          tipoMovimiento:
            "Pago",

          comision:
            null,

          horaMaquinaria:
            null,

          pagoManual:
            pagoManualCreado._id,

          vendedor:
            null,

          beneficiario:
            persona._id,

          beneficiarioNombre,

          beneficiarioDocumento,

          concepto,

          valor:
            valorPago,

          /*
            En Pago Manual no existe
            una cuenta pendiente.

            Por eso ambos saldos son 0.
          */

          saldoAntes:
            0,

          saldoDespues:
            0,

          formaPago,

          referenciaPago:
            limpiarTexto(
              referenciaPago
            ),

          fechaPago:
            fechaMovimiento,

          observaciones:
            limpiarTexto(
              observaciones
            ),
        });
    } catch (
      errorCreandoEgreso
    ) {
      /*
        Si falla el Egreso,
        eliminamos el Pago Manual.

        Así no queda un pago huérfano.
      */

      await PagoManual.findByIdAndDelete(
        pagoManualCreado._id
      );

      pagoManualCreado =
        null;

      throw errorCreandoEgreso;
    }

    /* =====================================================
       RELACIONAR PAGO MANUAL CON EGRESO
    ===================================================== */

    try {
      pagoManualCreado.egreso =
        egresoCreado._id;

      await pagoManualCreado.save();
    } catch (
      errorRelacion
    ) {
      /*
        Si falla la relación:

        1. eliminamos EG
        2. eliminamos PagoManual
      */

      await Egreso.findByIdAndDelete(
        egresoCreado._id
      );

      await PagoManual.findByIdAndDelete(
        pagoManualCreado._id
      );

      pagoManualCreado =
        null;

      egresoCreado =
        null;

      throw errorRelacion;
    }

    /* =====================================================
       RESPUESTA COMPLETA
    ===================================================== */

    const pagoFinal =
      await obtenerPagoManualCompleto(
        pagoManualCreado._id
      );

    const egresoFinal =
      await Egreso.findById(
        egresoCreado._id
      )
        .populate({
          path:
            "beneficiario",

          select:
            "nombre tipoDocumento documento telefono estado",
        })
        .populate({
          path:
            "pagoManual",

          select:
            "motivo valor fechaPago formaPago observaciones",
        });

    return res.status(201).json({
      message:
        "Pago manual registrado correctamente.",

      pagoManual:
        pagoFinal,

      egreso:
        egresoFinal,
    });
  } catch (error) {
    console.error(
      "Error registrando pago manual:",
      error
    );

    return res.status(500).json({
      message:
        error?.message ||
        "No fue posible registrar el pago manual.",
    });
  }
};

/* =========================================================
   ACTUALIZAR PAGO MANUAL

   PUT /api/pagos-manuales/:id

   REGLA:

   El EGRESO relacionado también se actualiza.

   El código EG-XXXX NO cambia.
========================================================= */

export const actualizarPagoManual = async (
  req,
  res
) => {
  try {
    const {
      id,
    } = req.params;

    if (
      !validarId(
        id
      )
    ) {
      return res.status(400).json({
        message:
          "El pago manual seleccionado no es válido.",
      });
    }

    const pago =
      await PagoManual.findById(
        id
      );

    if (!pago) {
      return res.status(404).json({
        message:
          "El pago manual no fue encontrado.",
      });
    }

    /* =====================================================
       EGRESO RELACIONADO
    ===================================================== */

    let egreso = null;

    if (
      pago.egreso &&
      validarId(
        pago.egreso
      )
    ) {
      egreso =
        await Egreso.findById(
          pago.egreso
        );
    }

    /*
      Respaldo alternativo por relación inversa.
    */

    if (!egreso) {
      egreso =
        await Egreso.findOne({
          pagoManual:
            pago._id,

          tipo:
            "PagoManual",
        });
    }

    if (!egreso) {
      return res.status(409).json({
        message:
          "El pago manual no tiene un egreso relacionado. No es seguro modificarlo.",
      });
    }

    /* =====================================================
       BENEFICIARIO
    ===================================================== */

    const beneficiarioId =
      req.body.beneficiario ??
      pago.beneficiario;

    if (
      !beneficiarioId ||
      !validarId(
        beneficiarioId
      )
    ) {
      return res.status(400).json({
        message:
          "Seleccione un beneficiario válido.",
      });
    }

    const persona =
      await Beneficiario.findById(
        beneficiarioId
      );

    if (!persona) {
      return res.status(404).json({
        message:
          "El beneficiario no fue encontrado.",
      });
    }

    /*
      Si se intenta cambiar el beneficiario
      por otro, el nuevo debe estar Activo.

      Si es el mismo beneficiario histórico,
      permitimos editar aunque posteriormente
      haya sido marcado como Inactivo.
    */

    const cambioBeneficiario =
      String(
        pago.beneficiario
      ) !==
      String(
        persona._id
      );

    if (
      cambioBeneficiario &&
      persona.estado !==
        "Activo"
    ) {
      return res.status(409).json({
        message:
          "El nuevo beneficiario seleccionado se encuentra Inactivo.",
      });
    }

    /* =====================================================
       MOTIVO
    ===================================================== */

    const motivo =
      limpiarTexto(
        req.body.motivo ??
          pago.motivo
      );

    if (!motivo) {
      return res.status(400).json({
        message:
          "El motivo del pago es obligatorio.",
      });
    }

    /* =====================================================
       VALOR
    ===================================================== */

    const valorPago =
      Number(
        req.body.valor ??
          req.body.monto ??
          pago.valor
      );

    if (
      !Number.isFinite(
        valorPago
      ) ||
      valorPago <= 0
    ) {
      return res.status(400).json({
        message:
          "Digite un valor de pago válido.",
      });
    }

    /* =====================================================
       FORMA DE PAGO
    ===================================================== */

    const formaPago =
      req.body.formaPago ??
      pago.formaPago ??
      "Efectivo";

    if (
      !FORMAS_PAGO.includes(
        formaPago
      )
    ) {
      return res.status(400).json({
        message:
          "La forma de pago seleccionada no es válida.",
      });
    }

    /* =====================================================
       FECHA
    ===================================================== */

    let fechaMovimiento =
      pago.fechaPago;

    if (
      req.body.fechaPago
    ) {
      fechaMovimiento =
        convertirFecha(
          req.body.fechaPago
        );

      if (!fechaMovimiento) {
        return res.status(400).json({
          message:
            "La fecha del pago no es válida.",
        });
      }
    }

    /* =====================================================
       OTROS CAMPOS
    ===================================================== */

    const referenciaPago =
      limpiarTexto(
        req.body.referenciaPago ??
          pago.referenciaPago
      );

    const observaciones =
      limpiarTexto(
        req.body.observaciones ??
          pago.observaciones
      );

    const beneficiarioNombre =
      limpiarTexto(
        persona.nombre
      );

    const beneficiarioDocumento =
      limpiarTexto(
        persona.documento
      );

    /* =====================================================
       RESPALDO DEL PAGO

       Si falla la actualización del EG,
       restauramos PagoManual.
    ===================================================== */

    const respaldoPago = {
      beneficiario:
        pago.beneficiario,

      beneficiarioNombre:
        pago.beneficiarioNombre,

      beneficiarioDocumento:
        pago.beneficiarioDocumento,

      motivo:
        pago.motivo,

      valor:
        pago.valor,

      fechaPago:
        pago.fechaPago,

      formaPago:
        pago.formaPago,

      referenciaPago:
        pago.referenciaPago,

      observaciones:
        pago.observaciones,
    };

    /* =====================================================
       ACTUALIZAR PAGO MANUAL
    ===================================================== */

    pago.beneficiario =
      persona._id;

    pago.beneficiarioNombre =
      beneficiarioNombre;

    pago.beneficiarioDocumento =
      beneficiarioDocumento;

    pago.motivo =
      motivo;

    pago.valor =
      valorPago;

    pago.fechaPago =
      fechaMovimiento;

    pago.formaPago =
      formaPago;

    pago.referenciaPago =
      referenciaPago;

    pago.observaciones =
      observaciones;

    await pago.save();

    /* =====================================================
       SINCRONIZAR MISMO EGRESO

       IMPORTANTE:

       NO se genera otro EG.

       Se conserva el mismo código.
    ===================================================== */

    try {
      egreso.tipo =
        "PagoManual";

      egreso.tipoMovimiento =
        "Pago";

      egreso.pagoManual =
        pago._id;

      egreso.beneficiario =
        persona._id;

      egreso.beneficiarioNombre =
        beneficiarioNombre;

      egreso.beneficiarioDocumento =
        beneficiarioDocumento;

      egreso.concepto =
        `Pago manual - ${motivo}`;

      egreso.valor =
        valorPago;

      egreso.saldoAntes =
        0;

      egreso.saldoDespues =
        0;

      egreso.formaPago =
        formaPago;

      egreso.referenciaPago =
        referenciaPago;

      egreso.fechaPago =
        fechaMovimiento;

      egreso.observaciones =
        observaciones;

      await egreso.save();
    } catch (
      errorActualizandoEgreso
    ) {
      /*
        Restaurar Pago Manual
        si la sincronización del Egreso falla.
      */

      await PagoManual.findByIdAndUpdate(
        pago._id,
        {
          $set:
            respaldoPago,
        },
        {
          runValidators:
            true,
        }
      );

      throw errorActualizandoEgreso;
    }

    /* =====================================================
       RESPUESTA
    ===================================================== */

    const pagoFinal =
      await obtenerPagoManualCompleto(
        pago._id
      );

    const egresoFinal =
      await Egreso.findById(
        egreso._id
      )
        .populate({
          path:
            "beneficiario",

          select:
            "nombre tipoDocumento documento telefono estado",
        })
        .populate({
          path:
            "pagoManual",

          select:
            "motivo valor fechaPago formaPago observaciones",
        });

    return res.status(200).json({
      message:
        "Pago manual actualizado correctamente.",

      pagoManual:
        pagoFinal,

      egreso:
        egresoFinal,
    });
  } catch (error) {
    console.error(
      "Error actualizando pago manual:",
      error
    );

    return res.status(500).json({
      message:
        error?.message ||
        "No fue posible actualizar el pago manual.",
    });
  }
};

/* =========================================================
   ELIMINAR PAGO MANUAL

   DELETE /api/pagos-manuales/:id

   Al eliminar:

   PagoManual
       +
   Egreso EG-XXXX

   Se eliminan juntos para que Egresos
   no conserve un movimiento inexistente.
========================================================= */

export const eliminarPagoManual = async (
  req,
  res
) => {
  try {
    const {
      id,
    } = req.params;

    if (
      !validarId(
        id
      )
    ) {
      return res.status(400).json({
        message:
          "El pago manual seleccionado no es válido.",
      });
    }

    const pago =
      await PagoManual.findById(
        id
      );

    if (!pago) {
      return res.status(404).json({
        message:
          "El pago manual no fue encontrado.",
      });
    }

    /* =====================================================
       BUSCAR EGRESO
    ===================================================== */

    let egreso = null;

    if (
      pago.egreso
    ) {
      egreso =
        await Egreso.findById(
          pago.egreso
        );
    }

    if (!egreso) {
      egreso =
        await Egreso.findOne({
          pagoManual:
            pago._id,

          tipo:
            "PagoManual",
        });
    }

    /* =====================================================
       DATOS PARA RESPUESTA
    ===================================================== */

    const codigoEgreso =
      egreso?.codigo ||
      "";

    const valor =
      Number(
        pago.valor
      ) || 0;

    const beneficiarioNombre =
      pago.beneficiarioNombre;

    const motivo =
      pago.motivo;

    /* =====================================================
       ELIMINAR EGRESO
    ===================================================== */

    if (egreso) {
      await Egreso.findByIdAndDelete(
        egreso._id
      );
    }

    /* =====================================================
       ELIMINAR PAGO MANUAL
    ===================================================== */

    try {
      await PagoManual.findByIdAndDelete(
        pago._id
      );
    } catch (
      errorEliminandoPago
    ) {
      /*
        Si se eliminó el EG pero no se pudo
        eliminar PagoManual, intentamos
        restaurar el Egreso.
      */

      if (egreso) {
        const respaldoEgreso =
          egreso.toObject();

        await Egreso.create(
          respaldoEgreso
        );
      }

      throw errorEliminandoPago;
    }

    /* =====================================================
       RESPUESTA
    ===================================================== */

    return res.status(200).json({
      message:
        "Pago manual eliminado correctamente.",

      pagoEliminado: {
        codigoEgreso,

        beneficiarioNombre,

        motivo,

        valor,
      },
    });
  } catch (error) {
    console.error(
      "Error eliminando pago manual:",
      error
    );

    return res.status(500).json({
      message:
        error?.message ||
        "No fue posible eliminar el pago manual.",
    });
  }
};