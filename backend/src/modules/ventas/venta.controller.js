import mongoose from "mongoose";

import Venta from "./venta.model.js";
import Cliente from "../clientes/cliente.model.js";
import Lote from "../lotes/lote.model.js";
import Cuota from "../cuotas/cuota.model.js";
import Pago from "../pagos/pago.model.js";

/* =========================================================
   FUNCIONES AUXILIARES
========================================================= */

const calcularFinanciacion = ({
  valorVenta,
  cuotaInicial,
  formaPago,
  numeroCuotas,
}) => {
  // Validaciones básicas
  if (!valorVenta || Number(valorVenta) <= 0) {
    return { error: "El valor de la venta debe ser mayor a 0" };
  }

  const valorVentaNum = Number(valorVenta);
  const cuotaInicialNum = Number(cuotaInicial) || 0;

  if (cuotaInicialNum > valorVentaNum) {
    return { error: "La cuota inicial no puede ser mayor al valor de la venta" };
  }

  const saldoFinanciar = valorVentaNum - cuotaInicialNum;

  if (formaPago === "Contado") {
    return {
      valorVenta: valorVentaNum,
      cuotaInicial: cuotaInicialNum,
      saldoFinanciar: 0,
      numeroCuotas: 0,
      valorCuota: 0,
      estado: "Pagada",
    };
  }

  // Financiado
  const numeroCuotasNum = Number(numeroCuotas) || 1;

  if (numeroCuotasNum <= 0) {
    return { error: "El número de cuotas debe ser mayor a 0" };
  }

  if (saldoFinanciar <= 0) {
    return { error: "El saldo a financiar debe ser mayor a 0" };
  }

  const valorCuota = saldoFinanciar / numeroCuotasNum;

  return {
    valorVenta: valorVentaNum,
    cuotaInicial: cuotaInicialNum,
    saldoFinanciar: saldoFinanciar,
    numeroCuotas: numeroCuotasNum,
    valorCuota: valorCuota,
    estado: "Activa",
  };
};

/* =========================================================
   DISTRIBUIR VALORES DE CUOTAS

   Distribuye el saldo financiar entre el número de cuotas
   de manera equitativa, manejando los centavos.
========================================================= */

const distribuirValoresCuotas = (total, numeroCuotas) => {
  const valores = [];
  const base = Math.floor(total / numeroCuotas);
  const resto = total - base * numeroCuotas;

  for (let i = 0; i < numeroCuotas; i++) {
    let valor = base;
    if (i < resto) {
      valor += 1;
    }
    valores.push(valor);
  }

  return valores;
};

/* =========================================================
   NORMALIZAR FECHA UTC
========================================================= */

const normalizarFechaUTC = (fecha) => {
  const date = new Date(fecha);
  return Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    0, 0, 0, 0
  );
};

/* =========================================================
   AGREGAR MESES SEGURO

   Maneja correctamente los bordes de mes para evitar
   problemas con fechas como 31 de enero + 1 mes.
========================================================= */

const agregarMesesSeguro = (fecha, meses) => {
  const date = new Date(fecha);
  const day = date.getUTCDate();
  const month = date.getUTCMonth() + meses;
  const year = date.getUTCFullYear();

  const newDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  const lastDay = new Date(Date.UTC(year, month + 1, 0, 0, 0, 0)).getUTCDate();

  newDate.setUTCDate(Math.min(day, lastDay));

  return newDate;
};

/* =========================================================
   CREAR CUOTAS AUTOMÁTICAS DE UNA VENTA

   Cada cuota nace con:
   - valorPagado = 0
   - saldoPendiente = valorCuota
   - estado = Pendiente
========================================================= */

const crearCuotasAutomaticas = async (venta) => {
  if (
    venta.formaPago !== "Financiado" ||
    Number(venta.numeroCuotas) <= 0 ||
    Number(venta.saldoFinanciar) <= 0
  ) {
    return [];
  }

  const numeroCuotas = Number(venta.numeroCuotas);
  const saldoFinanciar = Number(venta.saldoFinanciar);

  /* =====================================================
     DISTRIBUIR EL SALDO ENTRE LAS CUOTAS
  ===================================================== */

  const valoresCuotas = distribuirValoresCuotas(
    saldoFinanciar,
    numeroCuotas
  );

  const fechaVenta = normalizarFechaUTC(venta.fechaVenta);

  const cuotas = [];

  for (let i = 0; i < numeroCuotas; i += 1) {
    const valorCuota = Number(valoresCuotas[i]);

    const fechaVencimiento = agregarMesesSeguro(
      fechaVenta,
      i + 1
    );

    cuotas.push({
      venta: venta._id,
      numeroCuota: i + 1,
      fechaVencimiento,
      valorCuota,

      /* ===========================
         NUEVA CUOTA = NADA PAGADO
      =========================== */

      valorPagado: 0,

      /* ===========================
         ESTE ERA EL CAMPO FALTANTE
      =========================== */

      saldoPendiente: valorCuota,

      estado: "Pendiente",
      fechaPago: null,
      fechaAnulacion: null,
      motivoAnulacion: "",
      observaciones: "",
    });
  }

  if (cuotas.length === 0) {
    return [];
  }

  const cuotasCreadas = await Cuota.insertMany(cuotas);

  return cuotasCreadas;
};

/* =========================================================
   OBTENER VENTA ACTIVA DE UN LOTE

   Se utiliza principalmente cuando desde LOTES
   intentamos editar un lote vendido.

   GET /api/ventas/lote/:loteId/activa
========================================================= */

export const obtenerVentaActivaPorLote = async (req, res) => {
  try {
    const { loteId } = req.params;

    /* =========================
       VALIDAR ID
    ========================= */

    if (!mongoose.Types.ObjectId.isValid(loteId)) {
      return res.status(400).json({
        message: "El identificador del lote no es válido",
      });
    }

    /* =========================
       BUSCAR VENTA

       Las ventas anuladas NO cuentan
       como venta activa.
    ========================= */

    const venta = await Venta.findOne({
      lote: loteId,
      estado: { $ne: "Anulada" },
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

    /* =========================
       NO ENCONTRADA
    ========================= */

    if (!venta) {
      return res.status(404).json({
        message: "El lote no tiene una venta activa registrada",
      });
    }

    /* =========================
       RESPUESTA
    ========================= */

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

    /* =========================
       VALIDAR CLIENTE
    ========================= */

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

    /* =========================
       VALIDAR LOTE
    ========================= */

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

    const loteExiste = await Lote.findById(lote);

    if (!loteExiste) {
      return res.status(404).json({
        message: "El lote seleccionado no existe",
      });
    }

    if (loteExiste.estado !== "Disponible") {
      return res.status(409).json({
        message: "El lote no está disponible para la venta",
      });
    }

    /* =========================
       CALCULAR FINANCIACIÓN
    ========================= */

    const forma = formaPago === "Contado" ? "Contado" : "Financiado";

    const financiacion = calcularFinanciacion({
      valorVenta,
      cuotaInicial,
      formaPago: forma,
      numeroCuotas,
    });

    if (financiacion.error) {
      return res.status(400).json({
        message: financiacion.error,
      });
    }

    /* =========================
       CREAR VENTA
    ========================= */

    const venta = new Venta({
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

    await venta.save();

    /* =========================
       GENERAR CUOTAS
    ========================= */

    let cuotasGeneradas = [];

    if (venta.formaPago === "Financiado" && Number(venta.numeroCuotas) > 0) {
      cuotasGeneradas = await crearCuotasAutomaticas(venta);
    }

    /* =========================
       ACTUALIZAR LOTE
    ========================= */

    loteExiste.estado = "Vendido";
    await loteExiste.save();

    /* =========================
       RESPUESTA
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

    res.status(201).json({
      message: `Venta creada correctamente. Se generaron ${cuotasGeneradas.length} cuotas.`,
      venta: ventaCompleta,
      cuotasGeneradas,
    });
  } catch (error) {
    console.error("Error creando venta:", error);

    res.status(500).json({
      message: "Error al crear la venta",
    });
  }
};

/* =========================================================
   OBTENER TODAS LAS VENTAS
========================================================= */

export const obtenerVentas = async (req, res) => {
  try {
    const ventas = await Venta.find()
      .populate("cliente")
      .populate({
        path: "lote",
        populate: {
          path: "manzana",
          select: "codigo nombre",
        },
      })
      .sort({ createdAt: -1 });

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
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "El identificador de la venta no es válido",
      });
    }

    const venta = await Venta.findById(id)
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

    // Obtener cuotas
    const cuotas = await Cuota.find({ venta: venta._id }).sort({ numeroCuota: 1 });

    res.status(200).json({
      venta,
      cuotas,
    });
  } catch (error) {
    console.error("Error obteniendo venta:", error);

    res.status(500).json({
      message: "Error al obtener la venta",
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

    /* =====================================================
       GUARDAR ESTRUCTURA ANTERIOR (con valores numéricos)
    ===================================================== */

    const estructuraAnterior = {
      valorVenta: Number(venta.valorVenta),
      cuotaInicial: Number(venta.cuotaInicial),
      saldoFinanciar: Number(venta.saldoFinanciar),
      numeroCuotas: Number(venta.numeroCuotas),
      formaPago: venta.formaPago,
      fechaVenta: venta.fechaVenta ? new Date(venta.fechaVenta).getTime() : null,
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
       VERIFICAR SI CAMBIÓ LA FINANCIACIÓN ANTES DE GUARDAR
    ===================================================== */

    const nuevoValorVenta = financiacion.valorVenta;
    const nuevaCuotaInicial = financiacion.cuotaInicial;
    const nuevoSaldoFinanciar = financiacion.saldoFinanciar;
    const nuevoNumeroCuotas = financiacion.numeroCuotas;
    const nuevaFormaPago = forma;
    const nuevaFechaVenta = fechaVenta ? new Date(fechaVenta).getTime() : estructuraAnterior.fechaVenta;

    const cambioFinanciacion =
      estructuraAnterior.valorVenta !== nuevoValorVenta ||
      estructuraAnterior.cuotaInicial !== nuevaCuotaInicial ||
      estructuraAnterior.saldoFinanciar !== nuevoSaldoFinanciar ||
      estructuraAnterior.numeroCuotas !== nuevoNumeroCuotas ||
      estructuraAnterior.formaPago !== nuevaFormaPago ||
      (fechaVenta && estructuraAnterior.fechaVenta !== nuevaFechaVenta);

    /* =====================================================
       VALIDAR PAGOS APLICADOS SOLO SI HAY CAMBIO
    ===================================================== */

    if (cambioFinanciacion) {
      const pagosAplicados = await Pago.countDocuments({
        venta: venta._id,
        estado: "Aplicado", // Solo pagos aplicados (no anulados)
      });

      if (pagosAplicados > 0) {
        return res.status(409).json({
          message:
            "No se puede modificar la financiación porque esta venta tiene pagos aplicados. Primero debe anular los pagos activos.",
        });
      }
    }

    /* =====================================================
       ACTUALIZAR VENTA
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

    /* =====================================================
       CONTROL DE ACTUALIZACIÓN DE CUOTAS
    ===================================================== */

    let cuotasActualizadas = false;
    let numeroCuotasGeneradas = null;

    /* =====================================================
       VERIFICAR TAMBIÉN LAS CUOTAS EXISTENTES

       Esto permite reparar una venta cuya actualización
       anterior alcanzó a guardar la venta pero falló
       creando las nuevas cuotas.
    ===================================================== */

    const cuotasExistentes = await Cuota.countDocuments({
      venta: venta._id,
      estado: { $ne: "Anulada" },
    });

    const estructuraCuotasIncorrecta =
      venta.formaPago === "Financiado" &&
      Number(venta.numeroCuotas) > 0 &&
      cuotasExistentes !== Number(venta.numeroCuotas);

    /* =====================================================
       REGENERAR CUOTAS
    ===================================================== */

    if (cambioFinanciacion || estructuraCuotasIncorrecta) {
      const pagosAplicados = await Pago.countDocuments({
        venta: venta._id,
        estado: "Aplicado",
      });

      if (pagosAplicados > 0) {
        return res.status(409).json({
          message:
            "No se pueden regenerar las cuotas porque esta venta tiene pagos aplicados. Primero debe anular los pagos activos.",
        });
      }

      await Cuota.deleteMany({
        venta: venta._id,
      });

      cuotasActualizadas = true;

      if (
        venta.formaPago === "Financiado" &&
        Number(venta.numeroCuotas) > 0 &&
        Number(venta.saldoFinanciar) > 0
      ) {
        const nuevasCuotas = await crearCuotasAutomaticas(venta);
        numeroCuotasGeneradas = nuevasCuotas.length;
      } else {
        numeroCuotasGeneradas = 0;
      }
    }

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
      message: cuotasActualizadas
        ? `Venta actualizada correctamente. Se generaron ${numeroCuotasGeneradas} cuotas.`
        : "Venta actualizada correctamente.",
      venta: ventaCompleta,
      cuotasActualizadas,
      numeroCuotasGeneradas,
    });
  } catch (error) {
    console.error("Error actualizando venta:", error);

    if (error.statusCode === 409) {
      return res.status(409).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Error al actualizar la venta",
    });
  }
};

/* =========================================================
   ANULAR VENTA

   - Exige motivo.
   - Si tiene pagos APLICADOS, no permite anular.
   - Los pagos ANULADOS no bloquean.
   - Anula las cuotas.
   - Libera el lote.
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
       VALIDAR MOTIVO
    ========================= */

    if (!motivoAnulacion || !String(motivoAnulacion).trim()) {
      return res.status(400).json({
        message: "Debe indicar el motivo de la anulación",
      });
    }

    if (String(motivoAnulacion).trim().length < 5) {
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

    /* =====================================================
       VERIFICAR PAGOS APLICADOS

       IMPORTANTE:
       Los pagos ANULADOS no cuentan y no bloquean.

       Solo bloqueamos si existe un pago APLICADO.
    ===================================================== */

    const pagosAplicados = await Pago.countDocuments({
      venta: venta._id,
      estado: "Aplicado",
    });

    if (pagosAplicados > 0) {
      return res.status(409).json({
        message:
          "No se puede anular la venta porque tiene pagos aplicados. Primero debe anular los pagos activos.",
      });
    }

    /* =========================
       ANULAR VENTA
    ========================= */

    venta.estado = "Anulada";
    venta.motivoAnulacion = String(motivoAnulacion).trim();
    venta.fechaAnulacion = new Date();

    await venta.save();

    /* =====================================================
       ANULAR CUOTAS

       Se conservan únicamente como historial.
    ===================================================== */

    await Cuota.updateMany(
      {
        venta: venta._id,
        estado: { $ne: "Anulada" },
      },
      {
        $set: {
          estado: "Anulada",
          fechaAnulacion: venta.fechaAnulacion,
          motivoAnulacion: venta.motivoAnulacion,
        },
      }
    );

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
   DELETE SE MANEJA COMO ANULACIÓN
========================================================= */

export const eliminarVenta = anularVenta;