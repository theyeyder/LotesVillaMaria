import mongoose from "mongoose";

import Lote from "./lote.model.js";
import Manzana from "../manzanas/manzana.model.js";

/* =========================================================
   FUNCIONES AUXILIARES
========================================================= */

/*
  Convierte:

  8 metros + 50 centímetros
  =
  8.50 metros
*/

const convertirAMetros = (
  metros = 0,
  centimetros = 0
) => {
  return (
    Number(metros) +
    Number(centimetros) / 100
  );
};

/*
  Calcula:

  frente × fondo
  =
  área en m²
*/

const calcularArea = ({
  frenteMetros,
  frenteCentimetros,
  fondoMetros,
  fondoCentimetros,
}) => {
  const frente = convertirAMetros(
    frenteMetros,
    frenteCentimetros
  );

  const fondo = convertirAMetros(
    fondoMetros,
    fondoCentimetros
  );

  const area = frente * fondo;

  /*
    Dejamos máximo 2 decimales.
  */

  return Number(
    area.toFixed(2)
  );
};

/* =========================================================
   VALIDAR MEDIDAS
========================================================= */

const validarMedidas = ({
  frenteMetros,
  frenteCentimetros,
  fondoMetros,
  fondoCentimetros,
}) => {
  const fm =
    Number(frenteMetros);

  const fc =
    Number(frenteCentimetros || 0);

  const fom =
    Number(fondoMetros);

  const foc =
    Number(fondoCentimetros || 0);

  if (
    Number.isNaN(fm) ||
    Number.isNaN(fc) ||
    Number.isNaN(fom) ||
    Number.isNaN(foc)
  ) {
    return {
      valido: false,
      message:
        "Las medidas del lote deben ser numéricas",
    };
  }

  if (
    fm < 0 ||
    fom < 0
  ) {
    return {
      valido: false,
      message:
        "Los metros no pueden ser negativos",
    };
  }

  if (
    fc < 0 ||
    fc > 99 ||
    foc < 0 ||
    foc > 99
  ) {
    return {
      valido: false,
      message:
        "Los centímetros deben estar entre 0 y 99",
    };
  }

  const frente =
    convertirAMetros(
      fm,
      fc
    );

  const fondo =
    convertirAMetros(
      fom,
      foc
    );

  if (frente <= 0) {
    return {
      valido: false,
      message:
        "La medida del frente debe ser mayor que cero",
    };
  }

  if (fondo <= 0) {
    return {
      valido: false,
      message:
        "La medida del fondo debe ser mayor que cero",
    };
  }

  return {
    valido: true,
  };
};

/* =========================================================
   OBTENER PREFIJO DE LA MANZANA

   MANZANA A -> A
   MANZANA B -> B
   MANZANA 1 -> 1
========================================================= */

const obtenerPrefijoManzana = (
  nombre = ""
) => {
  const limpio = nombre
    .trim()
    .toUpperCase();

  /*
    Quitamos la palabra MANZANA
    si existe.
  */

  const sinPalabraManzana =
    limpio
      .replace(/^MANZANA\s*/i, "")
      .trim();

  /*
    Quitamos caracteres extraños.
  */

  const prefijo =
    sinPalabraManzana
      .replace(/[^A-Z0-9]/g, "");

  /*
    Si por alguna razón no existe
    un nombre útil, usamos LOT.
  */

  return prefijo || "LOT";
};

/* =========================================================
   ESCAPAR TEXTO PARA REGEX
========================================================= */

const escaparRegex = (
  texto = ""
) => {
  return texto.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
};

/* =========================================================
   GENERAR CÓDIGO AUTOMÁTICO DEL LOTE

   MANZANA A:
   A-001
   A-002
   A-003

   MANZANA B:
   B-001
   B-002
========================================================= */

const generarCodigoLote = async (
  manzana
) => {
  const prefijo =
    obtenerPrefijoManzana(
      manzana.nombre
    );

  const regex =
    new RegExp(
      `^${escaparRegex(
        prefijo
      )}-\\d{3}$`
    );

  const lotes =
    await Lote.find({
      manzana:
        manzana._id,

      codigo: {
        $regex: regex,
      },
    }).select(
      "codigo"
    );

  let numeroMayor = 0;

  lotes.forEach((lote) => {
    const partes =
      lote.codigo.split("-");

    const numero =
      Number(
        partes[
          partes.length - 1
        ]
      );

    if (
      !Number.isNaN(numero) &&
      numero > numeroMayor
    ) {
      numeroMayor =
        numero;
    }
  });

  const siguienteNumero =
    numeroMayor + 1;

  return `${prefijo}-${String(
    siguienteNumero
  ).padStart(3, "0")}`;
};

/* =========================================================
   LISTAR LOTES
========================================================= */

export const obtenerLotes = async (
  req,
  res
) => {
  try {
    const {
      search = "",
      manzana = "",
      estado = "",
    } = req.query;

    const filtro = {};

    /*
      FILTRAR POR MANZANA
    */

    if (manzana) {
      if (
        !mongoose.Types.ObjectId.isValid(
          manzana
        )
      ) {
        return res.status(400).json({
          message:
            "La manzana seleccionada no es válida",
        });
      }

      filtro.manzana =
        manzana;
    }

    /*
      FILTRAR POR ESTADO
    */

    if (estado) {
      filtro.estado =
        estado;
    }

    /*
      BÚSQUEDA
    */

    if (search.trim()) {
      filtro.$or = [
        {
          codigo: {
            $regex:
              search.trim(),
            $options: "i",
          },
        },

        {
          numeroLote: {
            $regex:
              search.trim(),
            $options: "i",
          },
        },

        {
          observaciones: {
            $regex:
              search.trim(),
            $options: "i",
          },
        },
      ];
    }

    const lotes =
      await Lote.find(
        filtro
      )
        .populate(
          "manzana",
          "codigo nombre estado"
        )
        .sort({
          createdAt: -1,
        });

    res.status(200).json(
      lotes
    );
  } catch (error) {
    console.error(
      "Error obteniendo lotes:",
      error
    );

    res.status(500).json({
      message:
        "Error al obtener los lotes",
    });
  }
};

/* =========================================================
   OBTENER LOTE POR ID
========================================================= */

export const obtenerLotePorId = async (
  req,
  res
) => {
  try {
    const lote =
      await Lote.findById(
        req.params.id
      ).populate(
        "manzana",
        "codigo nombre estado"
      );

    if (!lote) {
      return res.status(404).json({
        message:
          "El lote no fue encontrado",
      });
    }

    res.status(200).json(
      lote
    );
  } catch (error) {
    console.error(
      "Error obteniendo lote:",
      error
    );

    res.status(500).json({
      message:
        "Error al obtener el lote",
    });
  }
};

/* =========================================================
   CREAR LOTE
========================================================= */

export const crearLote = async (
  req,
  res
) => {
  try {
    const {
      manzana,
      numeroLote,
      frenteMetros,
      frenteCentimetros,
      fondoMetros,
      fondoCentimetros,
      valorLote,
      estado,
      observaciones,
    } = req.body;

    /* =========================
       VALIDAR MANZANA
    ========================= */

    if (!manzana) {
      return res.status(400).json({
        message:
          "La manzana es obligatoria",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        manzana
      )
    ) {
      return res.status(400).json({
        message:
          "La manzana seleccionada no es válida",
      });
    }

    const manzanaExiste =
      await Manzana.findById(
        manzana
      );

    if (!manzanaExiste) {
      return res.status(404).json({
        message:
          "La manzana seleccionada no existe",
      });
    }

    if (
      manzanaExiste.estado !==
      "Activa"
    ) {
      return res.status(400).json({
        message:
          "No se pueden crear lotes dentro de una manzana inactiva",
      });
    }

    /* =========================
       NÚMERO DE LOTE
    ========================= */

    if (!numeroLote?.trim()) {
      return res.status(400).json({
        message:
          "El número del lote es obligatorio",
      });
    }

    const numeroNormalizado =
      numeroLote
        .trim()
        .toUpperCase();

    /*
      No repetir lote dentro
      de la misma manzana.
    */

    const loteExistente =
      await Lote.findOne({
        manzana,

        numeroLote:
          numeroNormalizado,
      });

    if (loteExistente) {
      return res.status(409).json({
        message:
          `El lote ${numeroNormalizado} ya existe dentro de ${manzanaExiste.nombre}`,
      });
    }

    /* =========================
       MEDIDAS
    ========================= */

    const validacion =
      validarMedidas({
        frenteMetros,
        frenteCentimetros,
        fondoMetros,
        fondoCentimetros,
      });

    if (!validacion.valido) {
      return res.status(400).json({
        message:
          validacion.message,
      });
    }

    /* =========================
       VALOR GENERAL
    ========================= */

    const valor =
      Number(valorLote);

    if (
      Number.isNaN(valor) ||
      valor <= 0
    ) {
      return res.status(400).json({
        message:
          "El valor general del lote debe ser mayor que cero",
      });
    }

    /* =========================
       ÁREA AUTOMÁTICA
    ========================= */

    const areaM2 =
      calcularArea({
        frenteMetros,
        frenteCentimetros,
        fondoMetros,
        fondoCentimetros,
      });

    /* =========================
       CÓDIGO AUTOMÁTICO
    ========================= */

    const codigo =
      await generarCodigoLote(
        manzanaExiste
      );

    /* =========================
       CREAR
    ========================= */

    const nuevoLote =
      await Lote.create({
        manzana,

        codigo,

        numeroLote:
          numeroNormalizado,

        frenteMetros:
          Number(
            frenteMetros
          ),

        frenteCentimetros:
          Number(
            frenteCentimetros ||
              0
          ),

        fondoMetros:
          Number(
            fondoMetros
          ),

        fondoCentimetros:
          Number(
            fondoCentimetros ||
              0
          ),

        areaM2,

        valorLote:
          valor,

        estado:
          estado ||
          "Disponible",

        observaciones:
          observaciones?.trim() ||
          "",
      });

    const loteCompleto =
      await Lote.findById(
        nuevoLote._id
      ).populate(
        "manzana",
        "codigo nombre estado"
      );

    res.status(201).json({
      message:
        "Lote creado correctamente",

      lote:
        loteCompleto,
    });
  } catch (error) {
    console.error(
      "Error creando lote:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "Ya existe un lote con estos datos",
      });
    }

    res.status(500).json({
      message:
        "Error al crear el lote",
    });
  }
};

/* =========================================================
   ACTUALIZAR LOTE
========================================================= */

export const actualizarLote = async (
  req,
  res
) => {
  try {
    const {
      manzana,
      numeroLote,
      frenteMetros,
      frenteCentimetros,
      fondoMetros,
      fondoCentimetros,
      valorLote,
      estado,
      observaciones,
    } = req.body;

    const lote =
      await Lote.findById(
        req.params.id
      );

    if (!lote) {
      return res.status(404).json({
        message:
          "El lote no fue encontrado",
      });
    }

    /*
      Un lote vendido ya forma parte
      de una venta.

      No permitimos modificar sus
      datos físicos o económicos
      desde este módulo.
    */

    if (
      lote.estado ===
      "Vendido"
    ) {
      return res.status(409).json({
        message:
          "No se puede modificar un lote que ya fue vendido",
      });
    }

    /* =========================
       VALIDAR MANZANA
    ========================= */

    if (!manzana) {
      return res.status(400).json({
        message:
          "La manzana es obligatoria",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        manzana
      )
    ) {
      return res.status(400).json({
        message:
          "La manzana seleccionada no es válida",
      });
    }

    const manzanaExiste =
      await Manzana.findById(
        manzana
      );

    if (!manzanaExiste) {
      return res.status(404).json({
        message:
          "La manzana seleccionada no existe",
      });
    }

    /* =========================
       NÚMERO
    ========================= */

    if (!numeroLote?.trim()) {
      return res.status(400).json({
        message:
          "El número del lote es obligatorio",
      });
    }

    const numeroNormalizado =
      numeroLote
        .trim()
        .toUpperCase();

    const duplicado =
      await Lote.findOne({
        _id: {
          $ne: req.params.id,
        },

        manzana,

        numeroLote:
          numeroNormalizado,
      });

    if (duplicado) {
      return res.status(409).json({
        message:
          `Ya existe el lote ${numeroNormalizado} dentro de ${manzanaExiste.nombre}`,
      });
    }

    /* =========================
       MEDIDAS
    ========================= */

    const validacion =
      validarMedidas({
        frenteMetros,
        frenteCentimetros,
        fondoMetros,
        fondoCentimetros,
      });

    if (!validacion.valido) {
      return res.status(400).json({
        message:
          validacion.message,
      });
    }

    /* =========================
       VALOR
    ========================= */

    const valor =
      Number(valorLote);

    if (
      Number.isNaN(valor) ||
      valor <= 0
    ) {
      return res.status(400).json({
        message:
          "El valor general del lote debe ser mayor que cero",
      });
    }

    /* =========================
       RECALCULAR ÁREA
    ========================= */

    const areaM2 =
      calcularArea({
        frenteMetros,
        frenteCentimetros,
        fondoMetros,
        fondoCentimetros,
      });

    /* =========================
       ACTUALIZAR
    ========================= */

    lote.manzana =
      manzana;

    lote.numeroLote =
      numeroNormalizado;

    lote.frenteMetros =
      Number(
        frenteMetros
      );

    lote.frenteCentimetros =
      Number(
        frenteCentimetros ||
          0
      );

    lote.fondoMetros =
      Number(
        fondoMetros
      );

    lote.fondoCentimetros =
      Number(
        fondoCentimetros ||
          0
      );

    lote.areaM2 =
      areaM2;

    lote.valorLote =
      valor;

    lote.estado =
      estado ||
      lote.estado;

    lote.observaciones =
      observaciones?.trim() ||
      "";

    /*
      El código no se modifica.

      Ejemplo:
      A-001 siempre permanece A-001.
    */

    await lote.save();

    const loteCompleto =
      await Lote.findById(
        lote._id
      ).populate(
        "manzana",
        "codigo nombre estado"
      );

    res.status(200).json({
      message:
        "Lote actualizado correctamente",

      lote:
        loteCompleto,
    });
  } catch (error) {
    console.error(
      "Error actualizando lote:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "Ya existe un lote con estos datos",
      });
    }

    res.status(500).json({
      message:
        "Error al actualizar el lote",
    });
  }
};

/* =========================================================
   ELIMINAR LOTE
========================================================= */

export const eliminarLote = async (
  req,
  res
) => {
  try {
    const lote =
      await Lote.findById(
        req.params.id
      );

    if (!lote) {
      return res.status(404).json({
        message:
          "El lote no fue encontrado",
      });
    }

    /*
      Un lote vendido no se elimina.
    */

    if (
      lote.estado ===
      "Vendido"
    ) {
      return res.status(409).json({
        message:
          "No se puede eliminar un lote que ya fue vendido",
      });
    }

    await Lote.findByIdAndDelete(
      req.params.id
    );

    res.status(200).json({
      message:
        "Lote eliminado correctamente",
    });
  } catch (error) {
    console.error(
      "Error eliminando lote:",
      error
    );

    res.status(500).json({
      message:
        "Error al eliminar el lote",
    });
  }
};