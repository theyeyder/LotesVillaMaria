import mongoose from "mongoose";

import Venta from "./venta.model.js";
import Cliente from "../clientes/cliente.model.js";
import Lote from "../lotes/lote.model.js";

/* =========================================================
   GENERAR CÓDIGO AUTOMÁTICO
   V-0001, V-0002, V-0003...
========================================================= */

const generarCodigoVenta = async () => {
  const ventas = await Venta.find({
    codigo: {
      $regex: /^V-\d{4}$/,
    },
  }).select("codigo");

  let mayor = 0;

  ventas.forEach((venta) => {
    const numero = Number(venta.codigo.replace("V-", ""));

    if (!Number.isNaN(numero) && numero > mayor) {
      mayor = numero;
    }
  });

  return `V-${String(mayor + 1).padStart(4, "0")}`;
};

/* =========================================================
   CALCULAR FINANCIACIÓN
========================================================= */

const calcularFinanciacion = ({
  valorVenta,
  cuotaInicial,
  formaPago,
  numeroCuotas,
}) => {
  const valor = Number(valorVenta);

  const inicial = Number(cuotaInicial || 0);

  if (Number.isNaN(valor) || valor <= 0) {
    return {
      error: "El valor de la venta debe ser mayor que cero",
    };
  }

  if (Number.isNaN(inicial) || inicial < 0) {
    return {
      error: "La cuota inicial no puede ser negativa",
    };
  }

  if (inicial > valor) {
    return {
      error: "La cuota inicial no puede superar el valor de la venta",
    };
  }

  /* =====================================================
     CONTADO
  ===================================================== */

  if (formaPago === "Contado") {
    return {
      valorVenta: valor,

      cuotaInicial: valor,

      saldoFinanciar: 0,

      numeroCuotas: 0,

      valorCuota: 0,

      estado: "Pagada",
    };
  }

  /* =====================================================
     FINANCIADO
  ===================================================== */

  const cuotas = Number(numeroCuotas);

  if (!Number.isInteger(cuotas) || cuotas <= 0) {
    return {
      error: "Debe indicar un número válido de cuotas",
    };
  }

  const saldo = valor - inicial;

  if (saldo <= 0) {
    return {
      error: "Para una venta financiada debe existir un saldo pendiente",
    };
  }

  const valorCuota = Number((saldo / cuotas).toFixed(2));

  return {
    valorVenta: valor,

    cuotaInicial: inicial,

    saldoFinanciar: saldo,

    numeroCuotas: cuotas,

    valorCuota,

    estado: "Activa",
  };
};

/* =========================================================
   LISTAR VENTAS
========================================================= */

export const obtenerVentas = async (req, res) => {
  try {
    const {
      search = "",
      cliente = "",
      lote = "",
      estado = "",
      formaPago = "",
    } = req.query;

    const filtro = {};

    /* CLIENTE */

    if (cliente) {
      if (!mongoose.Types.ObjectId.isValid(cliente)) {
        return res.status(400).json({
          message: "El cliente seleccionado no es válido",
        });
      }

      filtro.cliente = cliente;
    }

    /* LOTE */

    if (lote) {
      if (!mongoose.Types.ObjectId.isValid(lote)) {
        return res.status(400).json({
          message: "El lote seleccionado no es válido",
        });
      }

      filtro.lote = lote;
    }

    /* ESTADO */

    if (estado) {
      filtro.estado = estado;
    }

    /* FORMA DE PAGO */

    if (formaPago) {
      filtro.formaPago = formaPago;
    }

    /* BÚSQUEDA POR CÓDIGO */

    if (search.trim()) {
      filtro.codigo = {
        $regex: search.trim(),

        $options: "i",
      };
    }

    const ventas = await Venta.find(filtro)
      .populate("cliente")
      .populate({
        path: "lote",

        populate: {
          path: "manzana",

          select: "codigo nombre",
        },
      })
      .sort({
        createdAt: -1,
      });

    res.status(200).json(ventas);
  } catch (error) {
    console.error("Error obteniendo ventas:", error);

    res.status(500).json({
      message: "Error al obtener las ventas",
    });
  }
};

/* =========================================================
   OBTENER VENTA POR ID
========================================================= */

export const obtenerVentaPorId = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "El identificador de la venta no es válido",
      });
    }

    const venta = await Venta.findById(req.params.id)
      .populate("cliente")
      .populate({
        path: "lote",

        populate: {
          path: "manzana",

          select: "codigo nombre",
        },
      });

    if (!venta) {
      return res.status(404).json({
        message: "La venta no fue encontrada",
      });
    }

    res.status(200).json(venta);
  } catch (error) {
    console.error("Error obteniendo venta:", error);

    res.status(500).json({
      message: "Error al obtener la venta",
    });
  }
};

/* =========================================================
   OBTENER VENTA ACTIVA POR LOTE

   Se usará desde el módulo LOTES cuando el usuario
   intente editar un lote que ya está vendido.
========================================================= */

export const obtenerVentaActivaPorLote = async (req, res) => {
  try {
    const { loteId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(loteId)) {
      return res.status(400).json({
        message: "El identificador del lote no es válido",
      });
    }

    const venta = await Venta.findOne({
      lote: loteId,

      estado: {
        $ne: "Anulada",
      },
    })
      .populate("cliente")
      .populate({
        path: "lote",

        populate: {
          path: "manzana",

          select: "codigo nombre",
        },
      })
      .sort({
        createdAt: -1,
      });

    if (!venta) {
      return res.status(404).json({
        message: "El lote no tiene una venta activa registrada",
      });
    }

    res.status(200).json(venta);
  } catch (error) {
    console.error("Error obteniendo venta del lote:", error);

    res.status(500).json({
      message: "Error al consultar la venta del lote",
    });
  }
};

/* =========================================================
   CREAR VENTA
========================================================= */

export const crearVenta = async (req, res) => {
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

    /* =====================================================
       VALIDAR CLIENTE
    ===================================================== */

    if (!cliente) {
      return res.status(400).json({
        message: "El cliente es obligatorio",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(cliente)) {
      return res.status(400).json({
        message: "El cliente seleccionado no es válido",
      });
    }

    const clienteExiste = await Cliente.findById(cliente);

    if (!clienteExiste) {
      return res.status(404).json({
        message: "El cliente seleccionado no existe",
      });
    }

    /* =====================================================
       VALIDAR LOTE
    ===================================================== */

    if (!lote) {
      return res.status(400).json({
        message: "El lote es obligatorio",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(lote)) {
      return res.status(400).json({
        message: "El lote seleccionado no es válido",
      });
    }

    const loteExiste = await Lote.findById(lote).populate(
      "manzana",
      "codigo nombre"
    );

    if (!loteExiste) {
      return res.status(404).json({
        message: "El lote seleccionado no existe",
      });
    }

    /* =====================================================
       SOLO LOTES DISPONIBLES
    ===================================================== */

    if (loteExiste.estado !== "Disponible") {
      return res.status(409).json({
        message: `El lote ${loteExiste.codigo} no está disponible para venta`,
      });
    }

    /* =====================================================
       EVITAR DOBLE VENTA
    ===================================================== */

    const ventaExistente = await Venta.findOne({
      lote,

      estado: {
        $ne: "Anulada",
      },
    });

    if (ventaExistente) {
      return res.status(409).json({
        message: "Este lote ya tiene una venta registrada",
      });
    }

    /* =====================================================
       FORMA DE PAGO
    ===================================================== */

    const forma = formaPago === "Contado" ? "Contado" : "Financiado";

    /* =====================================================
       CALCULAR FINANCIACIÓN
    ===================================================== */

    const financiacion = calcularFinanciacion({
      valorVenta: valorVenta ?? loteExiste.valorLote,

      cuotaInicial,

      formaPago: forma,

      numeroCuotas,
    });

    if (financiacion.error) {
      return res.status(400).json({
        message: financiacion.error,
      });
    }

    /* =====================================================
       CÓDIGO AUTOMÁTICO
    ===================================================== */

    const codigo = await generarCodigoVenta();

    /* =====================================================
       CREAR VENTA
    ===================================================== */

    const nuevaVenta = await Venta.create({
      codigo,

      cliente,

      lote,

      fechaVenta: fechaVenta || new Date(),

      valorVenta: financiacion.valorVenta,

      cuotaInicial: financiacion.cuotaInicial,

      saldoFinanciar: financiacion.saldoFinanciar,

      formaPago: forma,

      numeroCuotas: financiacion.numeroCuotas,

      valorCuota: financiacion.valorCuota,

      estado: financiacion.estado,

      observaciones: observaciones?.trim() || "",
    });

    /* =====================================================
       MARCAR LOTE COMO VENDIDO
    ===================================================== */

    loteExiste.estado = "Vendido";

    await loteExiste.save();

    /* =====================================================
       DEVOLVER VENTA COMPLETA
    ===================================================== */

    const ventaCompleta = await Venta.findById(nuevaVenta._id)
      .populate("cliente")
      .populate({
        path: "lote",

        populate: {
          path: "manzana",

          select: "codigo nombre",
        },
      });

    res.status(201).json({
      message: "Venta registrada correctamente",

      venta: ventaCompleta,
    });
  } catch (error) {
    console.error("Error creando venta:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Ya existe una venta con estos datos",
      });
    }

    res.status(500).json({
      message: "Error al registrar la venta",
    });
  }
};

/* =========================================================
   ACTUALIZAR VENTA

   No permitimos cambiar el lote después de registrar
   la venta para conservar la trazabilidad.
========================================================= */

export const actualizarVenta = async (req, res) => {
  try {
    const venta = await Venta.findById(req.params.id);

    if (!venta) {
      return res.status(404).json({
        message: "La venta no fue encontrada",
      });
    }

    if (venta.estado === "Anulada") {
      return res.status(409).json({
        message: "Una venta anulada no puede modificarse",
      });
    }

    const {
      cliente,
      fechaVenta,
      valorVenta,
      cuotaInicial,
      formaPago,
      numeroCuotas,
      observaciones,
    } = req.body;

    /* =====================================================
       VALIDAR CLIENTE
    ===================================================== */

    if (!cliente) {
      return res.status(400).json({
        message: "El cliente es obligatorio",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(cliente)) {
      return res.status(400).json({
        message: "El cliente seleccionado no es válido",
      });
    }

    const clienteExiste = await Cliente.findById(cliente);

    if (!clienteExiste) {
      return res.status(404).json({
        message: "El cliente seleccionado no existe",
      });
    }

    const forma = formaPago === "Contado" ? "Contado" : "Financiado";

    /* =====================================================
       RECALCULAR
    ===================================================== */

    const financiacion = calcularFinanciacion({
      valorVenta: valorVenta ?? venta.valorVenta,

      cuotaInicial,

      formaPago: forma,

      numeroCuotas,
    });

    if (financiacion.error) {
      return res.status(400).json({
        message: financiacion.error,
      });
    }

    /* =====================================================
       ACTUALIZAR
    ===================================================== */

    venta.cliente = cliente;

    if (fechaVenta) {
      venta.fechaVenta = fechaVenta;
    }

    venta.valorVenta = financiacion.valorVenta;

    venta.cuotaInicial = financiacion.cuotaInicial;

    venta.saldoFinanciar = financiacion.saldoFinanciar;

    venta.formaPago = forma;

    venta.numeroCuotas = financiacion.numeroCuotas;

    venta.valorCuota = financiacion.valorCuota;

    venta.estado = financiacion.estado;

    venta.observaciones = observaciones?.trim() || "";

    await venta.save();

    const ventaCompleta = await Venta.findById(venta._id)
      .populate("cliente")
      .populate({
        path: "lote",

        populate: {
          path: "manzana",

          select: "codigo nombre",
        },
      });

    res.status(200).json({
      message: "Venta actualizada correctamente",

      venta: ventaCompleta,
    });
  } catch (error) {
    console.error("Error actualizando venta:", error);

    res.status(500).json({
      message: "Error al actualizar la venta",
    });
  }
};

/* =========================================================
   ANULAR VENTA

   - Motivo obligatorio
   - Guarda fecha de anulación
   - Conserva todo el historial
   - El lote vuelve a Disponible
========================================================= */

export const anularVenta = async (req, res) => {
  try {
    const { motivoAnulacion } = req.body;

    /* =========================
       VALIDAR ID
    ========================= */

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "El identificador de la venta no es válido",
      });
    }

    /* =========================
       MOTIVO OBLIGATORIO
    ========================= */

    if (!motivoAnulacion || !motivoAnulacion.trim()) {
      return res.status(400).json({
        message: "Debe indicar el motivo de la anulación",
      });
    }

    if (motivoAnulacion.trim().length < 5) {
      return res.status(400).json({
        message: "El motivo de anulación debe ser más descriptivo",
      });
    }

    /* =========================
       BUSCAR VENTA
    ========================= */

    const venta = await Venta.findById(req.params.id);

    if (!venta) {
      return res.status(404).json({
        message: "La venta no fue encontrada",
      });
    }

    /* =========================
       YA ANULADA
    ========================= */

    if (venta.estado === "Anulada") {
      return res.status(409).json({
        message: "La venta ya se encuentra anulada",
      });
    }

    /* =========================
       ACTUALIZAR VENTA
    ========================= */

    venta.estado = "Anulada";

    venta.motivoAnulacion = motivoAnulacion.trim();

    venta.fechaAnulacion = new Date();

    await venta.save();

    /* =========================
       LIBERAR LOTE
    ========================= */

    const lote = await Lote.findById(venta.lote);

    if (lote) {
      lote.estado = "Disponible";

      await lote.save();
    }

    /* =========================
       RESPUESTA COMPLETA
    ========================= */

    const ventaCompleta = await Venta.findById(venta._id)
      .populate("cliente")
      .populate({
        path: "lote",

        populate: {
          path: "manzana",

          select: "codigo nombre",
        },
      });

    res.status(200).json({
      message: "Venta anulada correctamente. El lote volvió a estar disponible.",

      venta: ventaCompleta,

      loteLiberado: lote
        ? {
            _id: lote._id,

            codigo: lote.codigo,

            estado: lote.estado,
          }
        : null,
    });
  } catch (error) {
    console.error("Error anulando venta:", error);

    res.status(500).json({
      message: "Error al anular la venta",
    });
  }
};

/* =========================================================
   DELETE = ANULAR
========================================================= */

export const eliminarVenta = anularVenta;