import mongoose from "mongoose";

import Lote from "./lote.model.js";
import Manzana from "../manzanas/manzana.model.js";

/* =========================================================
   CONVERTIR METROS + CENTÍMETROS A METROS
========================================================= */

const convertirAMetros = (
  metros = 0,
  centimetros = 0
) => {
  return (
    Number(metros || 0) +
    Number(centimetros || 0) / 100
  );
};

/* =========================================================
   CALCULAR ÁREA DE LOTE REGULAR

   Frente × Fondo
========================================================= */

const calcularAreaRegular = ({
  frenteMetros,
  frenteCentimetros,
  fondoMetros,
  fondoCentimetros,
}) => {
  const frente =
    convertirAMetros(
      frenteMetros,
      frenteCentimetros
    );

  const fondo =
    convertirAMetros(
      fondoMetros,
      fondoCentimetros
    );

  return Number(
    (
      frente *
      fondo
    ).toFixed(2)
  );
};

/* =========================================================
   VALIDAR Y NORMALIZAR TIPO DE LOTE
========================================================= */

const obtenerTipoLote = (
  tipoLote
) => {
  /*
    Compatibilidad con lotes antiguos.

    Si todavía no viene tipoLote,
    se considera Regular.
  */

  if (
    tipoLote === undefined ||
    tipoLote === null ||
    tipoLote === ""
  ) {
    return "Regular";
  }

  if (
    ![
      "Regular",
      "Irregular",
    ].includes(tipoLote)
  ) {
    return null;
  }

  return tipoLote;
};

/* =========================================================
   VALIDAR MEDIDAS

   REGULAR:
   - frente obligatorio
   - fondo obligatorio

   IRREGULAR:
   - frente y fondo opcionales
   - si se escriben, deben ser medidas válidas
========================================================= */

const validarMedidas = ({
  tipoLote,
  frenteMetros,
  frenteCentimetros,
  fondoMetros,
  fondoCentimetros,
}) => {
  const fm =
    Number(
      frenteMetros || 0
    );

  const fc =
    Number(
      frenteCentimetros || 0
    );

  const fom =
    Number(
      fondoMetros || 0
    );

  const foc =
    Number(
      fondoCentimetros || 0
    );

  /* =========================
     VALIDAR QUE SEAN NÚMEROS
  ========================= */

  if (
    !Number.isFinite(fm) ||
    !Number.isFinite(fc) ||
    !Number.isFinite(fom) ||
    !Number.isFinite(foc)
  ) {
    return {
      valido: false,

      message:
        "Las medidas del lote deben ser numéricas",
    };
  }

  /* =========================
     NO NEGATIVOS
  ========================= */

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

  /* =========================
     CENTÍMETROS
  ========================= */

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
          "El lote regular debe tener una medida de frente mayor que cero",
      };
    }

    if (
      fondo <= 0
    ) {
      return {
        valido: false,

        message:
          "El lote regular debe tener una medida de fondo mayor que cero",
      };
    }
  }

  /* =====================================================
     IRREGULAR

     Frente y fondo pueden quedar en 0.
  ===================================================== */

  return {
    valido: true,

    medidas: {
      frenteMetros:
        fm,

      frenteCentimetros:
        fc,

      fondoMetros:
        fom,

      fondoCentimetros:
        foc,
    },
  };
};

/* =========================================================
   DETERMINAR ÁREA OFICIAL DEL LOTE

   REGULAR:
   frente × fondo

   IRREGULAR:
   areaM2 enviada directamente
========================================================= */

const determinarAreaLote = ({
  tipoLote,
  areaM2,
  frenteMetros,
  frenteCentimetros,
  fondoMetros,
  fondoCentimetros,
}) => {
  /* =====================================================
     REGULAR
  ===================================================== */

  if (
    tipoLote ===
    "Regular"
  ) {
    const area =
      calcularAreaRegular({
        frenteMetros,
        frenteCentimetros,
        fondoMetros,
        fondoCentimetros,
      });

    if (
      !Number.isFinite(area) ||
      area <= 0
    ) {
      return {
        valido: false,

        message:
          "No fue posible calcular el área del lote regular",
      };
    }

    return {
      valido: true,

      areaM2:
        area,
    };
  }

  /* =====================================================
     IRREGULAR
  ===================================================== */

  const area =
    Number(areaM2);

  if (
    !Number.isFinite(area) ||
    area <= 0
  ) {
    return {
      valido: false,

      message:
        "El área total del lote irregular debe ser mayor que cero",
    };
  }

  return {
    valido: true,

    areaM2:
      Number(
        area.toFixed(2)
      ),
  };
};

/* =========================================================
   VALIDAR VALOR DEL LOTE
========================================================= */

const validarValorLote = (
  valorLote
) => {
  const valor =
    Number(valorLote);

  if (
    !Number.isFinite(valor) ||
    valor <= 0
  ) {
    return {
      valido: false,

      message:
        "El valor general del lote debe ser mayor que cero",
    };
  }

  return {
    valido: true,

    valor,
  };
};

/* =========================================================
   VALIDAR ESTADO
========================================================= */

const validarEstadoLote = (
  estado
) => {
  const estadosValidos = [
    "Disponible",
    "Reservado",
    "Vendido",
  ];

  return estadosValidos.includes(
    estado
  );
};

/* =========================================================
   OBTENER PREFIJO DE LA MANZANA

   MANZANA A → A
   MANZANA B → B
   MANZANA 1 → 1
========================================================= */

const obtenerPrefijoManzana = (
  nombre = ""
) => {
  const limpio =
    nombre
      .trim()
      .toUpperCase();

  const sinPalabraManzana =
    limpio
      .replace(
        /^MANZANA\s*/i,
        ""
      )
      .trim();

  const prefijo =
    sinPalabraManzana.replace(
      /[^A-Z0-9]/g,
      ""
    );

  return (
    prefijo ||
    "LOT"
  );
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

   MANZANA B:
   B-001
   B-002
========================================================= */

const generarCodigoLote =
  async (
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
          $regex:
            regex,
        },
      }).select(
        "codigo"
      );

    let numeroMayor =
      0;

    lotes.forEach(
      (lote) => {
        const partes =
          lote.codigo.split(
            "-"
          );

        const numero =
          Number(
            partes[
              partes.length -
                1
            ]
          );

        if (
          Number.isFinite(
            numero
          ) &&
          numero >
            numeroMayor
        ) {
          numeroMayor =
            numero;
        }
      }
    );

    const siguienteNumero =
      numeroMayor +
      1;

    return `${prefijo}-${String(
      siguienteNumero
    ).padStart(
      3,
      "0"
    )}`;
  };

/* =========================================================
   LISTAR LOTES

   GET /api/lotes
========================================================= */

export const obtenerLotes =
  async (
    req,
    res
  ) => {
    try {
      const {
        search = "",
        manzana = "",
        estado = "",
        tipoLote = "",
      } = req.query;

      const filtro = {};

      /* =========================
         MANZANA
      ========================= */

      if (
        manzana
      ) {
        if (
          !mongoose.Types.ObjectId.isValid(
            manzana
          )
        ) {
          return res.status(
            400
          ).json({
            message:
              "La manzana seleccionada no es válida",
          });
        }

        filtro.manzana =
          manzana;
      }

      /* =========================
         ESTADO
      ========================= */

      if (
        estado
      ) {
        if (
          !validarEstadoLote(
            estado
          )
        ) {
          return res.status(
            400
          ).json({
            message:
              "El estado del lote no es válido",
          });
        }

        filtro.estado =
          estado;
      }

      /* =========================
         TIPO
      ========================= */

      if (
        tipoLote
      ) {
        if (
          ![
            "Regular",
            "Irregular",
          ].includes(
            tipoLote
          )
        ) {
          return res.status(
            400
          ).json({
            message:
              "El tipo de lote no es válido",
          });
        }

        filtro.tipoLote =
          tipoLote;
      }

      /* =========================
         BÚSQUEDA
      ========================= */

      if (
        search.trim()
      ) {
        filtro.$or = [
          {
            codigo: {
              $regex:
                search.trim(),

              $options:
                "i",
            },
          },

          {
            numeroLote: {
              $regex:
                search.trim(),

              $options:
                "i",
            },
          },

          {
            observaciones: {
              $regex:
                search.trim(),

              $options:
                "i",
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
            createdAt:
              -1,
          });

      res.status(
        200
      ).json(
        lotes
      );
    } catch (error) {
      console.error(
        "Error obteniendo lotes:",
        error
      );

      res.status(
        500
      ).json({
        message:
          "Error al obtener los lotes",
      });
    }
  };

/* =========================================================
   OBTENER LOTE POR ID

   GET /api/lotes/:id
========================================================= */

export const obtenerLotePorId =
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
            "El identificador del lote no es válido",
        });
      }

      const lote =
        await Lote.findById(
          id
        ).populate(
          "manzana",
          "codigo nombre estado"
        );

      if (
        !lote
      ) {
        return res.status(
          404
        ).json({
          message:
            "El lote no fue encontrado",
        });
      }

      res.status(
        200
      ).json(
        lote
      );
    } catch (error) {
      console.error(
        "Error obteniendo lote:",
        error
      );

      res.status(
        500
      ).json({
        message:
          "Error al obtener el lote",
      });
    }
  };

/* =========================================================
   CREAR LOTE

   POST /api/lotes
========================================================= */

export const crearLote =
  async (
    req,
    res
  ) => {
    try {
      const {
        manzana,
        numeroLote,

        tipoLote,

        frenteMetros,
        frenteCentimetros,

        fondoMetros,
        fondoCentimetros,

        areaM2,

        valorLote,

        estado,

        observaciones,
      } = req.body;

      /* =========================
         MANZANA
      ========================= */

      if (
        !manzana
      ) {
        return res.status(
          400
        ).json({
          message:
            "La manzana es obligatoria",
        });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          manzana
        )
      ) {
        return res.status(
          400
        ).json({
          message:
            "La manzana seleccionada no es válida",
        });
      }

      const manzanaExiste =
        await Manzana.findById(
          manzana
        );

      if (
        !manzanaExiste
      ) {
        return res.status(
          404
        ).json({
          message:
            "La manzana seleccionada no existe",
        });
      }

      if (
        manzanaExiste.estado !==
        "Activa"
      ) {
        return res.status(
          400
        ).json({
          message:
            "No se pueden crear lotes dentro de una manzana inactiva",
        });
      }

      /* =========================
         NÚMERO DE LOTE
      ========================= */

      if (
        !numeroLote?.trim()
      ) {
        return res.status(
          400
        ).json({
          message:
            "El número del lote es obligatorio",
        });
      }

      const numeroNormalizado =
        numeroLote
          .trim()
          .toUpperCase();

      const loteExistente =
        await Lote.findOne({
          manzana,

          numeroLote:
            numeroNormalizado,
        });

      if (
        loteExistente
      ) {
        return res.status(
          409
        ).json({
          message:
            `El lote ${numeroNormalizado} ya existe dentro de ${manzanaExiste.nombre}`,
        });
      }

      /* =========================
         TIPO DE LOTE
      ========================= */

      const tipo =
        obtenerTipoLote(
          tipoLote
        );

      if (
        !tipo
      ) {
        return res.status(
          400
        ).json({
          message:
            "Debe seleccionar un tipo de lote válido",
        });
      }

      /* =========================
         MEDIDAS
      ========================= */

      const validacionMedidas =
        validarMedidas({
          tipoLote:
            tipo,

          frenteMetros,
          frenteCentimetros,

          fondoMetros,
          fondoCentimetros,
        });

      if (
        !validacionMedidas.valido
      ) {
        return res.status(
          400
        ).json({
          message:
            validacionMedidas.message,
        });
      }

      /* =========================
         ÁREA OFICIAL
      ========================= */

      const validacionArea =
        determinarAreaLote({
          tipoLote:
            tipo,

          areaM2,

          frenteMetros:
            validacionMedidas
              .medidas
              .frenteMetros,

          frenteCentimetros:
            validacionMedidas
              .medidas
              .frenteCentimetros,

          fondoMetros:
            validacionMedidas
              .medidas
              .fondoMetros,

          fondoCentimetros:
            validacionMedidas
              .medidas
              .fondoCentimetros,
        });

      if (
        !validacionArea.valido
      ) {
        return res.status(
          400
        ).json({
          message:
            validacionArea.message,
        });
      }

      /* =========================
         VALOR
      ========================= */

      const validacionValor =
        validarValorLote(
          valorLote
        );

      if (
        !validacionValor.valido
      ) {
        return res.status(
          400
        ).json({
          message:
            validacionValor.message,
        });
      }

      /* =========================
         ESTADO
      ========================= */

      const estadoNuevo =
        estado ||
        "Disponible";

      if (
        !validarEstadoLote(
          estadoNuevo
        )
      ) {
        return res.status(
          400
        ).json({
          message:
            "El estado del lote no es válido",
        });
      }

      /*
        Un lote nuevo no debe poder
        crearse directamente como Vendido.
      */

      if (
        estadoNuevo ===
        "Vendido"
      ) {
        return res.status(
          409
        ).json({
          message:
            "Un lote nuevo no puede crearse directamente como vendido",
        });
      }

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

          tipoLote:
            tipo,

          frenteMetros:
            validacionMedidas
              .medidas
              .frenteMetros,

          frenteCentimetros:
            validacionMedidas
              .medidas
              .frenteCentimetros,

          fondoMetros:
            validacionMedidas
              .medidas
              .fondoMetros,

          fondoCentimetros:
            validacionMedidas
              .medidas
              .fondoCentimetros,

          /*
            ESTE ES EL DATO IMPORTANTE:

            Regular:
            área calculada

            Irregular:
            área enviada manualmente
          */

          areaM2:
            validacionArea.areaM2,

          valorLote:
            validacionValor.valor,

          estado:
            estadoNuevo,

          observaciones:
            String(
              observaciones ||
              ""
            ).trim(),
        });

      /* =========================
         RESPUESTA
      ========================= */

      const loteCompleto =
        await Lote.findById(
          nuevoLote._id
        ).populate(
          "manzana",
          "codigo nombre estado"
        );

      res.status(
        201
      ).json({
        message:
          tipo ===
          "Irregular"
            ? "Lote irregular creado correctamente"
            : "Lote regular creado correctamente",

        lote:
          loteCompleto,
      });
    } catch (error) {
      console.error(
        "Error creando lote:",
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
            "Ya existe un lote con estos datos",
        });
      }

      if (
        error.name ===
        "ValidationError"
      ) {
        const mensaje =
          Object.values(
            error.errors
          )[0]?.message;

        return res.status(
          400
        ).json({
          message:
            mensaje ||
            "Los datos del lote no son válidos",
        });
      }

      res.status(
        500
      ).json({
        message:
          "Error al crear el lote",
      });
    }
  };

/* =========================================================
   ACTUALIZAR LOTE

   PUT /api/lotes/:id
========================================================= */

export const actualizarLote =
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
            "El identificador del lote no es válido",
        });
      }

      const lote =
        await Lote.findById(
          id
        );

      if (
        !lote
      ) {
        return res.status(
          404
        ).json({
          message:
            "El lote no fue encontrado",
        });
      }

      /*
        Un lote vendido no puede modificarse.

        Desde Lotes, primero se elimina
        la venta asociada y después se abre
        nuevamente la edición.
      */

      if (
        lote.estado ===
        "Vendido"
      ) {
        return res.status(
          409
        ).json({
          message:
            "No se puede modificar un lote que ya fue vendido",
        });
      }

      const {
        manzana,
        numeroLote,

        tipoLote,

        frenteMetros,
        frenteCentimetros,

        fondoMetros,
        fondoCentimetros,

        areaM2,

        valorLote,

        estado,

        observaciones,
      } = req.body;

      /* =========================
         MANZANA
      ========================= */

      if (
        !manzana
      ) {
        return res.status(
          400
        ).json({
          message:
            "La manzana es obligatoria",
        });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          manzana
        )
      ) {
        return res.status(
          400
        ).json({
          message:
            "La manzana seleccionada no es válida",
        });
      }

      const manzanaExiste =
        await Manzana.findById(
          manzana
        );

      if (
        !manzanaExiste
      ) {
        return res.status(
          404
        ).json({
          message:
            "La manzana seleccionada no existe",
        });
      }

      /* =========================
         NÚMERO DE LOTE
      ========================= */

      if (
        !numeroLote?.trim()
      ) {
        return res.status(
          400
        ).json({
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
            $ne:
              lote._id,
          },

          manzana,

          numeroLote:
            numeroNormalizado,
        });

      if (
        duplicado
      ) {
        return res.status(
          409
        ).json({
          message:
            `Ya existe el lote ${numeroNormalizado} dentro de ${manzanaExiste.nombre}`,
        });
      }

      /* =========================
         TIPO
      ========================= */

      const tipo =
        obtenerTipoLote(
          tipoLote ||
          lote.tipoLote ||
          "Regular"
        );

      if (
        !tipo
      ) {
        return res.status(
          400
        ).json({
          message:
            "Debe seleccionar un tipo de lote válido",
        });
      }

      /* =========================
         MEDIDAS
      ========================= */

      const validacionMedidas =
        validarMedidas({
          tipoLote:
            tipo,

          frenteMetros,
          frenteCentimetros,

          fondoMetros,
          fondoCentimetros,
        });

      if (
        !validacionMedidas.valido
      ) {
        return res.status(
          400
        ).json({
          message:
            validacionMedidas.message,
        });
      }

      /* =========================
         ÁREA
      ========================= */

      const validacionArea =
        determinarAreaLote({
          tipoLote:
            tipo,

          areaM2,

          frenteMetros:
            validacionMedidas
              .medidas
              .frenteMetros,

          frenteCentimetros:
            validacionMedidas
              .medidas
              .frenteCentimetros,

          fondoMetros:
            validacionMedidas
              .medidas
              .fondoMetros,

          fondoCentimetros:
            validacionMedidas
              .medidas
              .fondoCentimetros,
        });

      if (
        !validacionArea.valido
      ) {
        return res.status(
          400
        ).json({
          message:
            validacionArea.message,
        });
      }

      /* =========================
         VALOR
      ========================= */

      const validacionValor =
        validarValorLote(
          valorLote
        );

      if (
        !validacionValor.valido
      ) {
        return res.status(
          400
        ).json({
          message:
            validacionValor.message,
        });
      }

      /* =========================
         ESTADO
      ========================= */

      const estadoNuevo =
        estado ||
        lote.estado;

      if (
        !validarEstadoLote(
          estadoNuevo
        )
      ) {
        return res.status(
          400
        ).json({
          message:
            "El estado del lote no es válido",
        });
      }

      /*
        Desde este formulario tampoco permitimos
        convertir manualmente un lote a Vendido.

        Ese estado lo controla Ventas.
      */

      if (
        estadoNuevo ===
        "Vendido"
      ) {
        return res.status(
          409
        ).json({
          message:
            "El estado Vendido solamente puede ser asignado mediante una venta",
        });
      }

      /* =========================
         ACTUALIZAR
      ========================= */

      lote.manzana =
        manzana;

      lote.numeroLote =
        numeroNormalizado;

      lote.tipoLote =
        tipo;

      lote.frenteMetros =
        validacionMedidas
          .medidas
          .frenteMetros;

      lote.frenteCentimetros =
        validacionMedidas
          .medidas
          .frenteCentimetros;

      lote.fondoMetros =
        validacionMedidas
          .medidas
          .fondoMetros;

      lote.fondoCentimetros =
        validacionMedidas
          .medidas
          .fondoCentimetros;

      lote.areaM2 =
        validacionArea.areaM2;

      lote.valorLote =
        validacionValor.valor;

      lote.estado =
        estadoNuevo;

      lote.observaciones =
        String(
          observaciones ||
          ""
        ).trim();

      /*
        El código permanece igual.

        Ejemplo:
        A-001 continúa siendo A-001.
      */

      await lote.save();

      /* =========================
         RESPUESTA
      ========================= */

      const loteCompleto =
        await Lote.findById(
          lote._id
        ).populate(
          "manzana",
          "codigo nombre estado"
        );

      res.status(
        200
      ).json({
        message:
          tipo ===
          "Irregular"
            ? "Lote irregular actualizado correctamente"
            : "Lote regular actualizado correctamente",

        lote:
          loteCompleto,
      });
    } catch (error) {
      console.error(
        "Error actualizando lote:",
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
            "Ya existe un lote con estos datos",
        });
      }

      if (
        error.name ===
        "ValidationError"
      ) {
        const mensaje =
          Object.values(
            error.errors
          )[0]?.message;

        return res.status(
          400
        ).json({
          message:
            mensaje ||
            "Los datos del lote no son válidos",
        });
      }

      res.status(
        500
      ).json({
        message:
          "Error al actualizar el lote",
      });
    }
  };

/* =========================================================
   ELIMINAR LOTE

   DELETE /api/lotes/:id
========================================================= */

export const eliminarLote =
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
            "El identificador del lote no es válido",
        });
      }

      const lote =
        await Lote.findById(
          id
        );

      if (
        !lote
      ) {
        return res.status(
          404
        ).json({
          message:
            "El lote no fue encontrado",
        });
      }

      if (
        lote.estado ===
        "Vendido"
      ) {
        return res.status(
          409
        ).json({
          message:
            "No se puede eliminar un lote que ya fue vendido",
        });
      }

      await Lote.deleteOne({
        _id:
          lote._id,
      });

      res.status(
        200
      ).json({
        message:
          "Lote eliminado correctamente",
      });
    } catch (error) {
      console.error(
        "Error eliminando lote:",
        error
      );

      res.status(
        500
      ).json({
        message:
          "Error al eliminar el lote",
      });
    }
  };