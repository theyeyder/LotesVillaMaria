import Manzana from "./manzana.model.js";

/* =========================================================
   GENERAR CÓDIGO AUTOMÁTICO
   MZ-001, MZ-002, MZ-003...
========================================================= */

const generarCodigoManzana = async () => {
  const ultimaManzana = await Manzana.findOne({
    codigo: {
      $regex: /^MZ-\d{3}$/,
    },
  }).sort({
    codigo: -1,
  });

  let siguienteNumero = 1;

  if (ultimaManzana?.codigo) {
    const numeroActual = parseInt(
      ultimaManzana.codigo.replace("MZ-", ""),
      10
    );

    siguienteNumero = numeroActual + 1;
  }

  return `MZ-${String(
    siguienteNumero
  ).padStart(3, "0")}`;
};

/* =========================================================
   NORMALIZAR ÁREA
   Puede venir vacía porque es opcional
========================================================= */

const normalizarArea = (areaM2) => {
  if (
    areaM2 === undefined ||
    areaM2 === null ||
    areaM2 === ""
  ) {
    return null;
  }

  const area = Number(areaM2);

  if (
    Number.isNaN(area) ||
    area < 0
  ) {
    return {
      error:
        "El área de la manzana debe ser un número válido mayor o igual a cero",
    };
  }

  return area;
};

/* =========================================================
   LISTAR MANZANAS
========================================================= */

export const obtenerManzanas = async (
  req,
  res
) => {
  try {
    const {
      search = "",
      estado = "",
    } = req.query;

    const filtro = {};

    if (search.trim()) {
      filtro.$or = [
        {
          codigo: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          nombre: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          descripcion: {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];
    }

    if (estado) {
      filtro.estado = estado;
    }

    const manzanas =
      await Manzana.find(filtro).sort({
        codigo: 1,
      });

    res.status(200).json(manzanas);
  } catch (error) {
    console.error(
      "Error obteniendo manzanas:",
      error
    );

    res.status(500).json({
      message:
        "Error al obtener las manzanas",
    });
  }
};

/* =========================================================
   OBTENER MANZANA POR ID
========================================================= */

export const obtenerManzanaPorId = async (
  req,
  res
) => {
  try {
    const manzana =
      await Manzana.findById(
        req.params.id
      );

    if (!manzana) {
      return res.status(404).json({
        message:
          "La manzana no fue encontrada",
      });
    }

    res.status(200).json(manzana);
  } catch (error) {
    console.error(
      "Error obteniendo manzana:",
      error
    );

    res.status(500).json({
      message:
        "Error al obtener la manzana",
    });
  }
};

/* =========================================================
   CREAR MANZANA
========================================================= */

export const crearManzana = async (
  req,
  res
) => {
  try {
    const {
      nombre,
      areaM2,
      descripcion,
      estado,
    } = req.body;

    /* =========================
       NOMBRE
    ========================= */

    if (!nombre?.trim()) {
      return res.status(400).json({
        message:
          "El nombre de la manzana es obligatorio",
      });
    }

    const nombreNormalizado =
      nombre
        .trim()
        .replace(/\s+/g, " ")
        .toUpperCase();

    const existente =
      await Manzana.findOne({
        nombre: nombreNormalizado,
      });

    if (existente) {
      return res.status(409).json({
        message:
          "Ya existe una manzana con este nombre",
      });
    }

    /* =========================
       ÁREA OPCIONAL
    ========================= */

    const areaNormalizada =
      normalizarArea(areaM2);

    if (
      typeof areaNormalizada ===
        "object" &&
      areaNormalizada?.error
    ) {
      return res.status(400).json({
        message:
          areaNormalizada.error,
      });
    }

    /* =========================
       CÓDIGO AUTOMÁTICO
    ========================= */

    const codigo =
      await generarCodigoManzana();

    /* =========================
       CREAR
    ========================= */

    const nuevaManzana =
      await Manzana.create({
        codigo,

        nombre:
          nombreNormalizado,

        areaM2:
          areaNormalizada,

        descripcion:
          descripcion?.trim() || "",

        estado:
          estado || "Activa",
      });

    res.status(201).json({
      message:
        "Manzana creada correctamente",

      manzana:
        nuevaManzana,
    });
  } catch (error) {
    console.error(
      "Error creando manzana:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "Ya existe una manzana con estos datos",
      });
    }

    res.status(500).json({
      message:
        "Error al crear la manzana",
    });
  }
};

/* =========================================================
   ACTUALIZAR MANZANA
========================================================= */

export const actualizarManzana = async (
  req,
  res
) => {
  try {
    const {
      nombre,
      areaM2,
      descripcion,
      estado,
    } = req.body;

    const manzana =
      await Manzana.findById(
        req.params.id
      );

    if (!manzana) {
      return res.status(404).json({
        message:
          "La manzana no fue encontrada",
      });
    }

    /* =========================
       NOMBRE
    ========================= */

    if (!nombre?.trim()) {
      return res.status(400).json({
        message:
          "El nombre de la manzana es obligatorio",
      });
    }

    const nombreNormalizado =
      nombre
        .trim()
        .replace(/\s+/g, " ")
        .toUpperCase();

    const duplicada =
      await Manzana.findOne({
        _id: {
          $ne: req.params.id,
        },

        nombre:
          nombreNormalizado,
      });

    if (duplicada) {
      return res.status(409).json({
        message:
          "Ya existe otra manzana con este nombre",
      });
    }

    /* =========================
       ÁREA OPCIONAL
    ========================= */

    const areaNormalizada =
      normalizarArea(areaM2);

    if (
      typeof areaNormalizada ===
        "object" &&
      areaNormalizada?.error
    ) {
      return res.status(400).json({
        message:
          areaNormalizada.error,
      });
    }

    /* =========================
       ACTUALIZAR
    ========================= */

    manzana.nombre =
      nombreNormalizado;

    manzana.areaM2 =
      areaNormalizada;

    manzana.descripcion =
      descripcion?.trim() || "";

    manzana.estado =
      estado || manzana.estado;

    /*
      El código nunca cambia.
    */

    await manzana.save();

    res.status(200).json({
      message:
        "Manzana actualizada correctamente",

      manzana,
    });
  } catch (error) {
    console.error(
      "Error actualizando manzana:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "Ya existe una manzana con estos datos",
      });
    }

    res.status(500).json({
      message:
        "Error al actualizar la manzana",
    });
  }
};

/* =========================================================
   ELIMINAR MANZANA
========================================================= */

export const eliminarManzana = async (
  req,
  res
) => {
  try {
    const manzana =
      await Manzana.findById(
        req.params.id
      );

    if (!manzana) {
      return res.status(404).json({
        message:
          "La manzana no fue encontrada",
      });
    }

    await Manzana.findByIdAndDelete(
      req.params.id
    );

    res.status(200).json({
      message:
        "Manzana eliminada correctamente",
    });
  } catch (error) {
    console.error(
      "Error eliminando manzana:",
      error
    );

    res.status(500).json({
      message:
        "Error al eliminar la manzana",
    });
  }
};