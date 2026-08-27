import Maquinaria from "./maquinaria.model.js";

export const obtenerMaquinarias = async (req, res) => {
  try {
    const { search = "", estado = "" } = req.query;

    const filtro = {};

    if (search.trim()) {
      filtro.$or = [
        { nombre: { $regex: search, $options: "i" } },
        { codigo: { $regex: search, $options: "i" } },
        { tipo: { $regex: search, $options: "i" } },
        { placa: { $regex: search, $options: "i" } },
        { marca: { $regex: search, $options: "i" } },
        { modelo: { $regex: search, $options: "i" } },
      ];
    }

    if (estado) {
      filtro.estado = estado;
    }

    const maquinarias = await Maquinaria.find(filtro).sort({
      createdAt: -1,
    });

    res.status(200).json(maquinarias);
  } catch (error) {
    console.error("Error al obtener maquinaria:", error);

    res.status(500).json({
      message: "Error al obtener la maquinaria",
    });
  }
};

export const obtenerMaquinariaPorId = async (req, res) => {
  try {
    const maquinaria = await Maquinaria.findById(req.params.id);

    if (!maquinaria) {
      return res.status(404).json({
        message: "Máquina no encontrada",
      });
    }

    res.status(200).json(maquinaria);
  } catch (error) {
    console.error("Error al obtener máquina:", error);

    res.status(500).json({
      message: "Error al obtener la máquina",
    });
  }
};

export const crearMaquinaria = async (req, res) => {
  try {
    const {
      nombre,
      tipo,
      placa,
      marca,
      modelo,
      descripcion,
      estado,
    } = req.body;

    if (!nombre?.trim()) {
      return res.status(400).json({
        message: "El nombre de la máquina es obligatorio",
      });
    }

    const ultimaMaquina = await Maquinaria.findOne({
      codigo: { $regex: /^M-\d{4}$/ },
    }).sort({
      codigo: -1,
    });

    let siguienteNumero = 1;

    if (ultimaMaquina?.codigo) {
      const numeroActual = parseInt(
        ultimaMaquina.codigo.replace("M-", ""),
        10
      );

      siguienteNumero = numeroActual + 1;
    }

    const codigoGenerado =
      `M-${String(siguienteNumero).padStart(4, "0")}`;

    const nuevaMaquinaria = await Maquinaria.create({
      nombre: nombre.trim(),
      codigo: codigoGenerado,
      tipo: tipo?.trim() || "",
      placa: placa?.trim().toUpperCase() || "",
      marca: marca?.trim() || "",
      modelo: modelo?.trim() || "",
      descripcion: descripcion?.trim() || "",
      estado: estado || "Activa",
    });

    res.status(201).json({
      message: "Máquina creada correctamente",
      maquinaria: nuevaMaquinaria,
    });
  } catch (error) {
    console.error(
      "Error al crear maquinaria:",
      error
    );

    res.status(500).json({
      message: "Error al crear la máquina",
    });
  }
};

export const actualizarMaquinaria = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      nombre,
      tipo,
      placa,
      marca,
      modelo,
      descripcion,
      estado,
    } = req.body;

    const maquinaria = await Maquinaria.findById(id);

    if (!maquinaria) {
      return res.status(404).json({
        message: "Máquina no encontrada",
      });
    }

    if (!nombre?.trim()) {
      return res.status(400).json({
        message: "El nombre de la máquina es obligatorio",
      });
    }

    maquinaria.nombre = nombre.trim();
    maquinaria.tipo = tipo?.trim() || "";
    maquinaria.placa = placa?.trim().toUpperCase() || "";
    maquinaria.marca = marca?.trim() || "";
    maquinaria.modelo = modelo?.trim() || "";
    maquinaria.descripcion = descripcion?.trim() || "";
    maquinaria.estado = estado || "Activa";

    await maquinaria.save();

    res.status(200).json({
      message: "Máquina actualizada correctamente",
      maquinaria,
    });
  } catch (error) {
    console.error("Error al actualizar maquinaria:", error);

    res.status(500).json({
      message: "Error al actualizar la máquina",
    });
  }
};

export const eliminarMaquinaria = async (req, res) => {
  try {
    const maquinaria = await Maquinaria.findById(req.params.id);

    if (!maquinaria) {
      return res.status(404).json({
        message: "Máquina no encontrada",
      });
    }

    await Maquinaria.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Máquina eliminada correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar maquinaria:", error);

    res.status(500).json({
      message: "Error al eliminar la máquina",
    });
  }
};