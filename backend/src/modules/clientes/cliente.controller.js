import Cliente from "./cliente.model.js";

export const obtenerClientes = async (req, res) => {
  try {
    const { search = "", estado = "" } = req.query;

    const filtro = {};

    if (search.trim()) {
      filtro.$or = [
        { nombres: { $regex: search, $options: "i" } },
        { apellidos: { $regex: search, $options: "i" } },
        { documento: { $regex: search, $options: "i" } },
        { telefono: { $regex: search, $options: "i" } },
        { correo: { $regex: search, $options: "i" } },
        { ciudad: { $regex: search, $options: "i" } },
      ];
    }

    if (estado) {
      filtro.estado = estado;
    }

    const clientes = await Cliente.find(filtro).sort({
      createdAt: -1,
    });

    res.status(200).json(clientes);
  } catch (error) {
    console.error("Error al obtener clientes:", error);

    res.status(500).json({
      message: "Error al obtener los clientes",
    });
  }
};

export const obtenerClientePorId = async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);

    if (!cliente) {
      return res.status(404).json({
        message: "Cliente no encontrado",
      });
    }

    res.status(200).json(cliente);
  } catch (error) {
    console.error("Error al obtener cliente:", error);

    res.status(500).json({
      message: "Error al obtener el cliente",
    });
  }
};

export const crearCliente = async (req, res) => {
  try {
    const {
      nombres,
      apellidos,
      tipoDocumento,
      documento,
      telefono,
      correo,
      ciudad,
      direccion,
      observaciones,
      estado,
    } = req.body;

    if (!nombres?.trim()) {
      return res.status(400).json({
        message: "Los nombres son obligatorios",
      });
    }

    if (!apellidos?.trim()) {
      return res.status(400).json({
        message: "Los apellidos son obligatorios",
      });
    }

    if (!documento?.trim()) {
      return res.status(400).json({
        message: "El documento es obligatorio",
      });
    }

    const clienteExistente = await Cliente.findOne({
      documento: documento.trim(),
    });

    if (clienteExistente) {
      return res.status(409).json({
        message: "Ya existe un cliente con este documento",
      });
    }

    const nuevoCliente = await Cliente.create({
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      tipoDocumento: tipoDocumento || "CC",
      documento: documento.trim(),
      telefono: telefono?.trim() || "",
      correo: correo?.trim() || "",
      ciudad: ciudad?.trim() || "",
      direccion: direccion?.trim() || "",
      observaciones: observaciones?.trim() || "",
      estado: estado || "Activo",
    });

    res.status(201).json({
      message: "Cliente creado correctamente",
      cliente: nuevoCliente,
    });
  } catch (error) {
    console.error("Error al crear cliente:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Ya existe un cliente con este documento",
      });
    }

    res.status(500).json({
      message: "Error al crear el cliente",
    });
  }
};

export const actualizarCliente = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      nombres,
      apellidos,
      tipoDocumento,
      documento,
      telefono,
      correo,
      ciudad,
      direccion,
      observaciones,
      estado,
    } = req.body;

    const cliente = await Cliente.findById(id);

    if (!cliente) {
      return res.status(404).json({
        message: "Cliente no encontrado",
      });
    }

    if (!nombres?.trim()) {
      return res.status(400).json({
        message: "Los nombres son obligatorios",
      });
    }

    if (!apellidos?.trim()) {
      return res.status(400).json({
        message: "Los apellidos son obligatorios",
      });
    }

    if (!documento?.trim()) {
      return res.status(400).json({
        message: "El documento es obligatorio",
      });
    }

    const documentoDuplicado = await Cliente.findOne({
      documento: documento.trim(),
      _id: { $ne: id },
    });

    if (documentoDuplicado) {
      return res.status(409).json({
        message: "Ya existe otro cliente con este documento",
      });
    }

    cliente.nombres = nombres.trim();
    cliente.apellidos = apellidos.trim();
    cliente.tipoDocumento = tipoDocumento || "CC";
    cliente.documento = documento.trim();
    cliente.telefono = telefono?.trim() || "";
    cliente.correo = correo?.trim() || "";
    cliente.ciudad = ciudad?.trim() || "";
    cliente.direccion = direccion?.trim() || "";
    cliente.observaciones = observaciones?.trim() || "";
    cliente.estado = estado || "Activo";

    await cliente.save();

    res.status(200).json({
      message: "Cliente actualizado correctamente",
      cliente,
    });
  } catch (error) {
    console.error("Error al actualizar cliente:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Ya existe otro cliente con este documento",
      });
    }

    res.status(500).json({
      message: "Error al actualizar el cliente",
    });
  }
};

export const eliminarCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);

    if (!cliente) {
      return res.status(404).json({
        message: "Cliente no encontrado",
      });
    }

    await Cliente.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Cliente eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar cliente:", error);

    res.status(500).json({
      message: "Error al eliminar el cliente",
    });
  }
};