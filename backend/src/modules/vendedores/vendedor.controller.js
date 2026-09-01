import mongoose from "mongoose";

import Vendedor from "./vendedor.model.js";

import {
  generarCodigoVendedor,
} from "../consecutivos/consecutivo.service.js";

/* =========================================================
   ESCAPAR TEXTO PARA REGEX
========================================================= */

const escaparRegex = (
  texto = ""
) => {
  return String(texto)
    .replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );
};

/* =========================================================
   NORMALIZAR TEXTO
========================================================= */

const normalizarTexto = (
  valor
) => {
  return String(
    valor ?? ""
  ).trim();
};

/* =========================================================
   VALIDAR VALOR DE COMISIÓN
========================================================= */

const validarValorComision = (
  valor
) => {
  const comision =
    Number(valor);

  if (
    !Number.isFinite(
      comision
    ) ||
    comision < 0
  ) {
    return null;
  }

  return comision;
};

/* =========================================================
   LISTAR VENDEDORES

   GET /api/vendedores

   Filtros:
   - search
   - estado
========================================================= */

export const obtenerVendedores =
  async (
    req,
    res
  ) => {
    try {
      const {
        search = "",
        estado = "",
      } = req.query;

      const filtro = {};

      /* =========================
         ESTADO
      ========================= */

      if (
        estado
      ) {
        if (
          ![
            "Activo",
            "Inactivo",
          ].includes(
            estado
          )
        ) {
          return res.status(
            400
          ).json({
            message:
              "El estado del vendedor no es válido",
          });
        }

        filtro.estado =
          estado;
      }

      /* =========================
         BÚSQUEDA
      ========================= */

      const textoBusqueda =
        normalizarTexto(
          search
        );

      if (
        textoBusqueda
      ) {
        const expresion =
          new RegExp(
            escaparRegex(
              textoBusqueda
            ),
            "i"
          );

        filtro.$or = [
          {
            codigo:
              expresion,
          },

          {
            nombres:
              expresion,
          },

          {
            apellidos:
              expresion,
          },

          {
            documento:
              expresion,
          },

          {
            telefono:
              expresion,
          },

          {
            correo:
              expresion,
          },
        ];
      }

      /* =========================
         CONSULTAR
      ========================= */

      const vendedores =
        await Vendedor.find(
          filtro
        )
          .sort({
            createdAt:
              -1,
          })
          .lean();

      res.status(
        200
      ).json(
        vendedores
      );
    } catch (error) {
      console.error(
        "Error obteniendo vendedores:",
        error
      );

      res.status(
        500
      ).json({
        message:
          "Error al obtener los vendedores",
      });
    }
  };

/* =========================================================
   OBTENER VENDEDOR POR ID

   GET /api/vendedores/:id
========================================================= */

export const obtenerVendedorPorId =
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
            "El identificador del vendedor no es válido",
        });
      }

      const vendedor =
        await Vendedor.findById(
          id
        );

      if (
        !vendedor
      ) {
        return res.status(
          404
        ).json({
          message:
            "El vendedor no fue encontrado",
        });
      }

      res.status(
        200
      ).json(
        vendedor
      );
    } catch (error) {
      console.error(
        "Error obteniendo vendedor:",
        error
      );

      res.status(
        500
      ).json({
        message:
          "Error al obtener el vendedor",
      });
    }
  };

/* =========================================================
   CREAR VENDEDOR

   POST /api/vendedores
========================================================= */

export const crearVendedor =
  async (
    req,
    res
  ) => {
    try {
      const {
        nombres,
        apellidos,
        documento,
        telefono = "",
        correo = "",
        valorComision = 2000000,
        observaciones = "",
      } = req.body;

      /* =========================
         CAMPOS OBLIGATORIOS
      ========================= */

      if (
        !normalizarTexto(
          nombres
        )
      ) {
        return res.status(
          400
        ).json({
          message:
            "Los nombres del vendedor son obligatorios",
        });
      }

      if (
        !normalizarTexto(
          apellidos
        )
      ) {
        return res.status(
          400
        ).json({
          message:
            "Los apellidos del vendedor son obligatorios",
        });
      }

      if (
        !normalizarTexto(
          documento
        )
      ) {
        return res.status(
          400
        ).json({
          message:
            "El documento del vendedor es obligatorio",
        });
      }

      /* =========================
         COMISIÓN
      ========================= */

      const comision =
        validarValorComision(
          valorComision
        );

      if (
        comision ===
        null
      ) {
        return res.status(
          400
        ).json({
          message:
            "El valor de la comisión no es válido",
        });
      }

      /* =========================
         DOCUMENTO REPETIDO
      ========================= */

      const documentoNormalizado =
        normalizarTexto(
          documento
        );

      const vendedorExistente =
        await Vendedor.findOne({
          documento:
            documentoNormalizado,
        });

      if (
        vendedorExistente
      ) {
        return res.status(
          409
        ).json({
          message:
            "Ya existe un vendedor con este documento",
        });
      }

      /* =========================
         GENERAR CÓDIGO
      ========================= */

      const codigo =
        await generarCodigoVendedor();

      /* =========================
         CREAR
      ========================= */

      const vendedor =
        await Vendedor.create({
          codigo,

          nombres:
            normalizarTexto(
              nombres
            ),

          apellidos:
            normalizarTexto(
              apellidos
            ),

          documento:
            documentoNormalizado,

          telefono:
            normalizarTexto(
              telefono
            ),

          correo:
            normalizarTexto(
              correo
            ).toLowerCase(),

          valorComision:
            comision,

          estado:
            "Activo",

          observaciones:
            normalizarTexto(
              observaciones
            ),
        });

      res.status(
        201
      ).json({
        message:
          `Vendedor ${vendedor.codigo} creado correctamente`,

        vendedor,
      });
    } catch (error) {
      console.error(
        "Error creando vendedor:",
        error
      );

      if (
        error.code ===
        11000
      ) {
        return res.status(
          409
        ).json({
          message:
            "Ya existe un vendedor con esos datos",
        });
      }

      res.status(
        500
      ).json({
        message:
          "Error al crear el vendedor",
      });
    }
  };

/* =========================================================
   ACTUALIZAR VENDEDOR

   PUT /api/vendedores/:id
========================================================= */

export const actualizarVendedor =
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
            "El identificador del vendedor no es válido",
        });
      }

      const vendedor =
        await Vendedor.findById(
          id
        );

      if (
        !vendedor
      ) {
        return res.status(
          404
        ).json({
          message:
            "El vendedor no fue encontrado",
        });
      }

      const {
        nombres,
        apellidos,
        documento,
        telefono,
        correo,
        valorComision,
        observaciones,
      } = req.body;

      /* =========================
         NOMBRES
      ========================= */

      if (
        nombres !==
        undefined
      ) {
        const valor =
          normalizarTexto(
            nombres
          );

        if (
          !valor
        ) {
          return res.status(
            400
          ).json({
            message:
              "Los nombres del vendedor son obligatorios",
          });
        }

        vendedor.nombres =
          valor;
      }

      /* =========================
         APELLIDOS
      ========================= */

      if (
        apellidos !==
        undefined
      ) {
        const valor =
          normalizarTexto(
            apellidos
          );

        if (
          !valor
        ) {
          return res.status(
            400
          ).json({
            message:
              "Los apellidos del vendedor son obligatorios",
          });
        }

        vendedor.apellidos =
          valor;
      }

      /* =========================
         DOCUMENTO
      ========================= */

      if (
        documento !==
        undefined
      ) {
        const valor =
          normalizarTexto(
            documento
          );

        if (
          !valor
        ) {
          return res.status(
            400
          ).json({
            message:
              "El documento del vendedor es obligatorio",
          });
        }

        const repetido =
          await Vendedor.findOne({
            documento:
              valor,

            _id: {
              $ne:
                vendedor._id,
            },
          });

        if (
          repetido
        ) {
          return res.status(
            409
          ).json({
            message:
              "Ya existe otro vendedor con este documento",
          });
        }

        vendedor.documento =
          valor;
      }

      /* =========================
         TELÉFONO
      ========================= */

      if (
        telefono !==
        undefined
      ) {
        vendedor.telefono =
          normalizarTexto(
            telefono
          );
      }

      /* =========================
         CORREO
      ========================= */

      if (
        correo !==
        undefined
      ) {
        vendedor.correo =
          normalizarTexto(
            correo
          ).toLowerCase();
      }

      /* =========================
         VALOR DE COMISIÓN
      ========================= */

      if (
        valorComision !==
        undefined
      ) {
        const comision =
          validarValorComision(
            valorComision
          );

        if (
          comision ===
          null
        ) {
          return res.status(
            400
          ).json({
            message:
              "El valor de la comisión no es válido",
          });
        }

        vendedor.valorComision =
          comision;
      }

      /* =========================
         OBSERVACIONES
      ========================= */

      if (
        observaciones !==
        undefined
      ) {
        vendedor.observaciones =
          normalizarTexto(
            observaciones
          );
      }

      /*
        IMPORTANTE:

        No modificamos "codigo".

        VD-0001 siempre seguirá
        siendo VD-0001.
      */

      await vendedor.save();

      res.status(
        200
      ).json({
        message:
          `Vendedor ${vendedor.codigo} actualizado correctamente`,

        vendedor,
      });
    } catch (error) {
      console.error(
        "Error actualizando vendedor:",
        error
      );

      if (
        error.code ===
        11000
      ) {
        return res.status(
          409
        ).json({
          message:
            "Ya existe un vendedor con esos datos",
        });
      }

      res.status(
        500
      ).json({
        message:
          "Error al actualizar el vendedor",
      });
    }
  };

/* =========================================================
   CAMBIAR ESTADO DEL VENDEDOR

   PATCH /api/vendedores/:id/estado

   Activo ↔ Inactivo
========================================================= */

export const cambiarEstadoVendedor =
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
            "El identificador del vendedor no es válido",
        });
      }

      const vendedor =
        await Vendedor.findById(
          id
        );

      if (
        !vendedor
      ) {
        return res.status(
          404
        ).json({
          message:
            "El vendedor no fue encontrado",
        });
      }

      vendedor.estado =
        vendedor.estado ===
        "Activo"
          ? "Inactivo"
          : "Activo";

      await vendedor.save();

      res.status(
        200
      ).json({
        message:
          vendedor.estado ===
          "Activo"
            ? `Vendedor ${vendedor.codigo} activado correctamente`
            : `Vendedor ${vendedor.codigo} inactivado correctamente`,

        vendedor,
      });
    } catch (error) {
      console.error(
        "Error cambiando estado del vendedor:",
        error
      );

      res.status(
        500
      ).json({
        message:
          "Error al cambiar el estado del vendedor",
      });
    }
  };