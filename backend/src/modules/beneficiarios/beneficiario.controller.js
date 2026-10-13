import mongoose from "mongoose";

import Beneficiario from "./beneficiario.model.js";
import PagoManual from "../pagosManuales/pagoManual.model.js";

/* =========================================================
   HELPERS
========================================================= */

const limpiarTexto = (valor = "") => {
  return String(valor || "").trim();
};

const escaparRegex = (texto = "") => {
  return String(texto).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const validarId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/* =========================================================
   OBTENER BENEFICIARIOS

   GET /api/beneficiarios

   Filtros opcionales:

   ?buscar=juan
   ?estado=Activo
========================================================= */

export const obtenerBeneficiarios = async (req, res) => {
  try {
    const buscar = limpiarTexto(req.query.buscar);

    const estado = limpiarTexto(req.query.estado);

    const filtro = {};

    /* =====================================================
       FILTRO POR ESTADO
    ===================================================== */

    if (
      estado === "Activo" ||
      estado === "Inactivo"
    ) {
      filtro.estado = estado;
    }

    /* =====================================================
       BÚSQUEDA

       Nombre
       Documento
       Teléfono
    ===================================================== */

    if (buscar) {
      const regex = new RegExp(
        escaparRegex(buscar),
        "i"
      );

      filtro.$or = [
        {
          nombre: regex,
        },
        {
          documento: regex,
        },
        {
          telefono: regex,
        },
      ];
    }

    const beneficiarios = await Beneficiario.find(
      filtro
    )
      .sort({
        nombre: 1,
        createdAt: -1,
      })
      .lean();

    return res.status(200).json(
      beneficiarios
    );
  } catch (error) {
    console.error(
      "Error obteniendo beneficiarios:",
      error
    );

    return res.status(500).json({
      message:
        "No fue posible obtener los beneficiarios.",
    });
  }
};

/* =========================================================
   OBTENER BENEFICIARIO POR ID

   GET /api/beneficiarios/:id
========================================================= */

export const obtenerBeneficiarioPorId = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!validarId(id)) {
      return res.status(400).json({
        message:
          "El identificador del beneficiario no es válido.",
      });
    }

    const beneficiario =
      await Beneficiario.findById(id).lean();

    if (!beneficiario) {
      return res.status(404).json({
        message:
          "Beneficiario no encontrado.",
      });
    }

    return res.status(200).json(
      beneficiario
    );
  } catch (error) {
    console.error(
      "Error obteniendo beneficiario:",
      error
    );

    return res.status(500).json({
      message:
        "No fue posible obtener el beneficiario.",
    });
  }
};

/* =========================================================
   BUSCAR BENEFICIARIO POR DOCUMENTO

   GET /api/beneficiarios/documento/:documento

   Este endpoint será muy importante cuando
   registremos un Pago Manual.

   Ejemplo:

   /api/beneficiarios/documento/1110555888
========================================================= */

export const obtenerBeneficiarioPorDocumento =
  async (req, res) => {
    try {
      const documento = limpiarTexto(
        req.params.documento
      ).toUpperCase();

      if (!documento) {
        return res.status(400).json({
          message:
            "Debe indicar un documento.",
        });
      }

      const beneficiario =
        await Beneficiario.findOne({
          documento,
        }).lean();

      if (!beneficiario) {
        return res.status(404).json({
          message:
            "No existe un beneficiario con este documento.",
        });
      }

      return res.status(200).json(
        beneficiario
      );
    } catch (error) {
      console.error(
        "Error buscando beneficiario por documento:",
        error
      );

      return res.status(500).json({
        message:
          "No fue posible buscar el beneficiario.",
      });
    }
  };

/* =========================================================
   CREAR BENEFICIARIO

   POST /api/beneficiarios
========================================================= */

export const crearBeneficiario = async (
  req,
  res
) => {
  try {
    const nombre = limpiarTexto(
      req.body.nombre
    );

    const tipoDocumento =
      limpiarTexto(
        req.body.tipoDocumento || "CC"
      ).toUpperCase();

    const documento =
      limpiarTexto(
        req.body.documento
      ).toUpperCase();

    const telefono =
      limpiarTexto(
        req.body.telefono
      );

    const observaciones =
      limpiarTexto(
        req.body.observaciones
      );

    const estado =
      limpiarTexto(
        req.body.estado || "Activo"
      );

    /* =====================================================
       VALIDACIONES
    ===================================================== */

    if (!nombre) {
      return res.status(400).json({
        message:
          "El nombre del beneficiario es obligatorio.",
      });
    }

    if (!documento) {
      return res.status(400).json({
        message:
          "El documento del beneficiario es obligatorio.",
      });
    }

    const tiposPermitidos = [
      "CC",
      "CE",
      "NIT",
      "TI",
      "PASAPORTE",
      "OTRO",
    ];

    if (
      !tiposPermitidos.includes(
        tipoDocumento
      )
    ) {
      return res.status(400).json({
        message:
          "El tipo de documento no es válido.",
      });
    }

    if (
      estado !== "Activo" &&
      estado !== "Inactivo"
    ) {
      return res.status(400).json({
        message:
          "El estado del beneficiario no es válido.",
      });
    }

    /* =====================================================
       EVITAR DOCUMENTO DUPLICADO
    ===================================================== */

    const existente =
      await Beneficiario.findOne({
        documento,
      }).lean();

    if (existente) {
      return res.status(409).json({
        message:
          "Ya existe un beneficiario registrado con este documento.",
        beneficiario: existente,
      });
    }

    /* =====================================================
       CREAR
    ===================================================== */

    const beneficiario =
      await Beneficiario.create({
        nombre,
        tipoDocumento,
        documento,
        telefono,
        observaciones,
        estado,
      });

    return res.status(201).json({
      message:
        "Beneficiario registrado correctamente.",
      beneficiario,
    });
  } catch (error) {
    console.error(
      "Error creando beneficiario:",
      error
    );

    if (error?.code === 11000) {
      return res.status(409).json({
        message:
          "Ya existe un beneficiario registrado con este documento.",
      });
    }

    if (error?.name === "ValidationError") {
      const mensaje =
        Object.values(
          error.errors || {}
        )[0]?.message;

      return res.status(400).json({
        message:
          mensaje ||
          "Los datos del beneficiario no son válidos.",
      });
    }

    return res.status(500).json({
      message:
        "No fue posible registrar el beneficiario.",
    });
  }
};

/* =========================================================
   ACTUALIZAR BENEFICIARIO

   PUT /api/beneficiarios/:id
========================================================= */

export const actualizarBeneficiario = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!validarId(id)) {
      return res.status(400).json({
        message:
          "El identificador del beneficiario no es válido.",
      });
    }

    const beneficiarioActual =
      await Beneficiario.findById(id);

    if (!beneficiarioActual) {
      return res.status(404).json({
        message:
          "Beneficiario no encontrado.",
      });
    }

    const nombre = limpiarTexto(
      req.body.nombre ??
        beneficiarioActual.nombre
    );

    const tipoDocumento =
      limpiarTexto(
        req.body.tipoDocumento ??
          beneficiarioActual.tipoDocumento
      ).toUpperCase();

    const documento =
      limpiarTexto(
        req.body.documento ??
          beneficiarioActual.documento
      ).toUpperCase();

    const telefono =
      limpiarTexto(
        req.body.telefono ??
          beneficiarioActual.telefono
      );

    const observaciones =
      limpiarTexto(
        req.body.observaciones ??
          beneficiarioActual.observaciones
      );

    const estado =
      limpiarTexto(
        req.body.estado ??
          beneficiarioActual.estado
      );

    /* =====================================================
       VALIDACIONES
    ===================================================== */

    if (!nombre) {
      return res.status(400).json({
        message:
          "El nombre del beneficiario es obligatorio.",
      });
    }

    if (!documento) {
      return res.status(400).json({
        message:
          "El documento del beneficiario es obligatorio.",
      });
    }

    const tiposPermitidos = [
      "CC",
      "CE",
      "NIT",
      "TI",
      "PASAPORTE",
      "OTRO",
    ];

    if (
      !tiposPermitidos.includes(
        tipoDocumento
      )
    ) {
      return res.status(400).json({
        message:
          "El tipo de documento no es válido.",
      });
    }

    if (
      estado !== "Activo" &&
      estado !== "Inactivo"
    ) {
      return res.status(400).json({
        message:
          "El estado del beneficiario no es válido.",
      });
    }

    /* =====================================================
       VALIDAR DOCUMENTO DUPLICADO
    ===================================================== */

    const documentoExistente =
      await Beneficiario.findOne({
        documento,
        _id: {
          $ne: id,
        },
      }).lean();

    if (documentoExistente) {
      return res.status(409).json({
        message:
          "Ya existe otro beneficiario con este documento.",
      });
    }

    /* =====================================================
       ACTUALIZAR
    ===================================================== */

    beneficiarioActual.nombre =
      nombre;

    beneficiarioActual.tipoDocumento =
      tipoDocumento;

    beneficiarioActual.documento =
      documento;

    beneficiarioActual.telefono =
      telefono;

    beneficiarioActual.observaciones =
      observaciones;

    beneficiarioActual.estado =
      estado;

    await beneficiarioActual.save();

    return res.status(200).json({
      message:
        "Beneficiario actualizado correctamente.",
      beneficiario:
        beneficiarioActual,
    });
  } catch (error) {
    console.error(
      "Error actualizando beneficiario:",
      error
    );

    if (error?.code === 11000) {
      return res.status(409).json({
        message:
          "Ya existe otro beneficiario con este documento.",
      });
    }

    if (error?.name === "ValidationError") {
      const mensaje =
        Object.values(
          error.errors || {}
        )[0]?.message;

      return res.status(400).json({
        message:
          mensaje ||
          "Los datos del beneficiario no son válidos.",
      });
    }

    return res.status(500).json({
      message:
        "No fue posible actualizar el beneficiario.",
    });
  }
};

/* =========================================================
   ELIMINAR BENEFICIARIO

   DELETE /api/beneficiarios/:id

   REGLA:

   Si el beneficiario ya tiene Pagos Manuales,
   NO lo eliminamos.

   Esto protege el historial financiero.

   En ese caso deberá marcarse como Inactivo.
========================================================= */

export const eliminarBeneficiario = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!validarId(id)) {
      return res.status(400).json({
        message:
          "El identificador del beneficiario no es válido.",
      });
    }

    const beneficiario =
      await Beneficiario.findById(id);

    if (!beneficiario) {
      return res.status(404).json({
        message:
          "Beneficiario no encontrado.",
      });
    }

    /* =====================================================
       VERIFICAR PAGOS RELACIONADOS
    ===================================================== */

    const tienePagos =
      await PagoManual.exists({
        beneficiario: id,
      });

    if (tienePagos) {
      return res.status(409).json({
        message:
          "Este beneficiario tiene pagos manuales registrados y no puede eliminarse. Puede marcarlo como Inactivo.",
      });
    }

    /* =====================================================
       ELIMINAR
    ===================================================== */

    await beneficiario.deleteOne();

    return res.status(200).json({
      message:
        "Beneficiario eliminado correctamente.",
    });
  } catch (error) {
    console.error(
      "Error eliminando beneficiario:",
      error
    );

    return res.status(500).json({
      message:
        "No fue posible eliminar el beneficiario.",
    });
  }
};