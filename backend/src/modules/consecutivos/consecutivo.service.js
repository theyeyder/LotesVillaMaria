import Consecutivo from "./consecutivo.model.js";

import Venta from "../ventas/venta.model.js";
import Cuota from "../cuotas/cuota.model.js";
import Vendedor from "../vendedores/vendedor.model.js";
import Comision from "../comisiones/comision.model.js";

/* =========================================================
   EXTRAER NÚMERO DE UN CÓDIGO
========================================================= */

const extraerNumeroCodigo = (
  codigo,
  expresion
) => {
  const texto =
    String(
      codigo || ""
    )
      .trim()
      .toUpperCase();

  const coincidencia =
    texto.match(
      expresion
    );

  if (
    !coincidencia
  ) {
    return 0;
  }

  const numero =
    Number(
      coincidencia[1]
    );

  if (
    !Number.isInteger(
      numero
    ) ||
    numero <= 0
  ) {
    return 0;
  }

  return numero;
};

/* =========================================================
   OBTENER MAYOR NÚMERO DE VENTAS EXISTENTES

   Reconoce:

   V-0001
   V-0002

   VT-0003
   VT-0004
========================================================= */

const obtenerMayorNumeroVentas =
  async () => {
    const ventas =
      await Venta.find({
        codigo: {
          $regex:
            /^(V|VT)-\d+$/i,
        },
      })
        .select(
          "codigo -_id"
        )
        .lean();

    let mayorNumero =
      0;

    for (
      const venta
      of ventas
    ) {
      const numero =
        extraerNumeroCodigo(
          venta.codigo,
          /^(?:V|VT)-(\d+)$/
        );

      if (
        numero >
        mayorNumero
      ) {
        mayorNumero =
          numero;
      }
    }

    return mayorNumero;
  };

/* =========================================================
   SINCRONIZAR CONSECUTIVO DE VENTAS
========================================================= */

const sincronizarConsecutivoVenta =
  async () => {
    const mayorNumeroVentas =
      await obtenerMayorNumeroVentas();

    const consecutivo =
      await Consecutivo.findOneAndUpdate(
        {
          tipo:
            "venta",
        },
        {
          $setOnInsert: {
            tipo:
              "venta",

            ultimoNumero:
              mayorNumeroVentas,
          },
        },
        {
          new:
            true,

          upsert:
            true,
        }
      );

    if (
      Number(
        consecutivo
          ?.ultimoNumero ||
          0
      ) <
      mayorNumeroVentas
    ) {
      await Consecutivo.findOneAndUpdate(
        {
          tipo:
            "venta",

          ultimoNumero: {
            $lt:
              mayorNumeroVentas,
          },
        },
        {
          $set: {
            ultimoNumero:
              mayorNumeroVentas,
          },
        }
      );
    }
  };

/* =========================================================
   GENERAR CÓDIGO DE VENTA

   VT-0001
   VT-0002
   VT-0003...
========================================================= */

export const generarCodigoVenta =
  async () => {
    await sincronizarConsecutivoVenta();

    const consecutivo =
      await Consecutivo.findOneAndUpdate(
        {
          tipo:
            "venta",
        },
        {
          $inc: {
            ultimoNumero:
              1,
          },
        },
        {
          new:
            true,
        }
      );

    if (
      !consecutivo
    ) {
      throw new Error(
        "No fue posible generar el consecutivo de la venta"
      );
    }

    const numero =
      Number(
        consecutivo.ultimoNumero
      );

    if (
      !Number.isInteger(
        numero
      ) ||
      numero <= 0
    ) {
      throw new Error(
        "El consecutivo generado para la venta no es válido"
      );
    }

    return `VT-${String(
      numero
    ).padStart(
      4,
      "0"
    )}`;
  };

/* =========================================================
   OBTENER MAYOR NÚMERO DE CUOTAS EXISTENTES

   Reconoce:

   CT-0001
   CT-0002
   CT-0003...
========================================================= */

const obtenerMayorNumeroCuotas =
  async () => {
    const cuotas =
      await Cuota.find({
        codigo: {
          $regex:
            /^CT-\d+$/i,
        },
      })
        .select(
          "codigo -_id"
        )
        .lean();

    let mayorNumero =
      0;

    for (
      const cuota
      of cuotas
    ) {
      const numero =
        extraerNumeroCodigo(
          cuota.codigo,
          /^CT-(\d+)$/
        );

      if (
        numero >
        mayorNumero
      ) {
        mayorNumero =
          numero;
      }
    }

    return mayorNumero;
  };

/* =========================================================
   SINCRONIZAR CONSECUTIVO DE CUOTAS

   Ejemplo:

   Si ya existe:

   CT-0001
   CT-0002
   CT-0008

   el contador queda como:

   ultimoNumero = 8
========================================================= */

const sincronizarConsecutivoCuota =
  async () => {
    const mayorNumeroCuotas =
      await obtenerMayorNumeroCuotas();

    const consecutivo =
      await Consecutivo.findOneAndUpdate(
        {
          tipo:
            "cuota",
        },
        {
          $setOnInsert: {
            tipo:
              "cuota",

            ultimoNumero:
              mayorNumeroCuotas,
          },
        },
        {
          new:
            true,

          upsert:
            true,
        }
      );

    if (
      Number(
        consecutivo
          ?.ultimoNumero ||
          0
      ) <
      mayorNumeroCuotas
    ) {
      await Consecutivo.findOneAndUpdate(
        {
          tipo:
            "cuota",

          ultimoNumero: {
            $lt:
              mayorNumeroCuotas,
          },
        },
        {
          $set: {
            ultimoNumero:
              mayorNumeroCuotas,
          },
        }
      );
    }
  };

/* =========================================================
   RESERVAR UN BLOQUE DE CONSECUTIVOS PARA CUOTAS

   Ejemplo:

   Último consecutivo:
   20

   Nueva venta:
   6 cuotas

   Se reserva de una sola vez:

   CT-0021
   CT-0022
   CT-0023
   CT-0024
   CT-0025
   CT-0026

   Después:

   ultimoNumero = 26
========================================================= */

const reservarRangoCuotas =
  async (
    cantidad
  ) => {
    const cantidadNum =
      Number(
        cantidad
      );

    if (
      !Number.isInteger(
        cantidadNum
      ) ||
      cantidadNum <= 0
    ) {
      throw new Error(
        "La cantidad de consecutivos de cuotas debe ser mayor a cero"
      );
    }

    await sincronizarConsecutivoCuota();

    const consecutivo =
      await Consecutivo.findOneAndUpdate(
        {
          tipo:
            "cuota",
        },
        {
          $inc: {
            ultimoNumero:
              cantidadNum,
          },
        },
        {
          new:
            true,
        }
      );

    if (
      !consecutivo
    ) {
      throw new Error(
        "No fue posible reservar los consecutivos de las cuotas"
      );
    }

    const numeroFinal =
      Number(
        consecutivo.ultimoNumero
      );

    const numeroInicial =
      numeroFinal -
      cantidadNum +
      1;

    const codigos =
      [];

    for (
      let numero =
        numeroInicial;
      numero <=
        numeroFinal;
      numero += 1
    ) {
      codigos.push(
        `CT-${String(
          numero
        ).padStart(
          4,
          "0"
        )}`
      );
    }

    return codigos;
  };

/* =========================================================
   ASIGNAR CÓDIGOS A CUOTAS ANTIGUAS

   Algunas cuotas que ya existen actualmente
   no tienen campo "codigo".

   Esta función les asignará consecutivos.

   Ejemplo:

   cuota antigua 1 → CT-0001
   cuota antigua 2 → CT-0002
   cuota antigua 3 → CT-0003

   No modifica:
   - numeroCuota
   - venta
   - valores
   - pagos
   - estados
========================================================= */

export const asignarCodigosCuotasFaltantes =
  async () => {
    const cuotasSinCodigo =
      await Cuota.find({
        $or: [
          {
            codigo: {
              $exists:
                false,
            },
          },

          {
            codigo:
              null,
          },

          {
            codigo:
              "",
          },
        ],
      })
        .select(
          "_id createdAt"
        )
        .sort({
          createdAt:
            1,

          _id:
            1,
        })
        .lean();

    if (
      cuotasSinCodigo.length ===
      0
    ) {
      return {
        actualizadas:
          0,

        codigos:
          [],
      };
    }

    const codigos =
      await reservarRangoCuotas(
        cuotasSinCodigo.length
      );

    const operaciones =
      cuotasSinCodigo.map(
        (
          cuota,
          indice
        ) => ({
          updateOne: {
            filter: {
              _id:
                cuota._id,

              $or: [
                {
                  codigo: {
                    $exists:
                      false,
                  },
                },

                {
                  codigo:
                    null,
                },

                {
                  codigo:
                    "",
                },
              ],
            },

            update: {
              $set: {
                codigo:
                  codigos[
                    indice
                  ],
              },
            },
          },
        })
      );

    const resultado =
      await Cuota.bulkWrite(
        operaciones,
        {
          ordered:
            true,
        }
      );

    return {
      actualizadas:
        resultado.modifiedCount ||
        0,

      codigos,
    };
  };

/* =========================================================
   GENERAR CÓDIGOS PARA NUEVAS CUOTAS

   Esta es la función que utilizarán:

   - venta.controller.js
   - cuota.controller.js

   Antes de crear cuotas nuevas, primero garantiza
   que las cuotas antiguas ya tengan un CT-....
========================================================= */

export const generarCodigosCuotas =
  async (
    cantidad
  ) => {
    /*
      Primero ponemos al día las cuotas antiguas.
    */

    await asignarCodigosCuotasFaltantes();

    /*
      Después reservamos consecutivos exclusivamente
      para las nuevas cuotas.
    */

    return reservarRangoCuotas(
      cantidad
    );
  };
  /* =========================================================
   OBTENER MAYOR NÚMERO DE VENDEDORES

   VD-0001
   VD-0002
   VD-0003...
========================================================= */

const obtenerMayorNumeroVendedores =
  async () => {
    const vendedores =
      await Vendedor.find({
        codigo: {
          $regex:
            /^VD-\d+$/i,
        },
      })
        .select(
          "codigo -_id"
        )
        .lean();

    let mayorNumero =
      0;

    for (
      const vendedor
      of vendedores
    ) {
      const numero =
        extraerNumeroCodigo(
          vendedor.codigo,
          /^VD-(\d+)$/
        );

      if (
        numero >
        mayorNumero
      ) {
        mayorNumero =
          numero;
      }
    }

    return mayorNumero;
  };

/* =========================================================
   SINCRONIZAR CONSECUTIVO DE VENDEDORES
========================================================= */

const sincronizarConsecutivoVendedor =
  async () => {
    const mayorNumeroVendedores =
      await obtenerMayorNumeroVendedores();

    const consecutivo =
      await Consecutivo.findOneAndUpdate(
        {
          tipo:
            "vendedor",
        },
        {
          $setOnInsert: {
            tipo:
              "vendedor",

            ultimoNumero:
              mayorNumeroVendedores,
          },
        },
        {
          new:
            true,

          upsert:
            true,
        }
      );

    if (
      Number(
        consecutivo
          ?.ultimoNumero ||
          0
      ) <
      mayorNumeroVendedores
    ) {
      await Consecutivo.findOneAndUpdate(
        {
          tipo:
            "vendedor",

          ultimoNumero: {
            $lt:
              mayorNumeroVendedores,
          },
        },
        {
          $set: {
            ultimoNumero:
              mayorNumeroVendedores,
          },
        }
      );
    }
  };

/* =========================================================
   GENERAR CÓDIGO DE VENDEDOR

   VD-0001
   VD-0002
   VD-0003...
========================================================= */

export const generarCodigoVendedor =
  async () => {
    await sincronizarConsecutivoVendedor();

    const consecutivo =
      await Consecutivo.findOneAndUpdate(
        {
          tipo:
            "vendedor",
        },
        {
          $inc: {
            ultimoNumero:
              1,
          },
        },
        {
          new:
            true,
        }
      );

    if (
      !consecutivo
    ) {
      throw new Error(
        "No fue posible generar el consecutivo del vendedor"
      );
    }

    const numero =
      Number(
        consecutivo.ultimoNumero
      );

    if (
      !Number.isInteger(
        numero
      ) ||
      numero <= 0
    ) {
      throw new Error(
        "El consecutivo generado para el vendedor no es válido"
      );
    }

    return `VD-${String(
      numero
    ).padStart(
      4,
      "0"
    )}`;
  };
  /* =========================================================
   OBTENER MAYOR NÚMERO DE COMISIONES
========================================================= */

const obtenerMayorNumeroComisiones =
  async () => {
    const comisiones =
      await Comision.find({
        codigo: {
          $regex: /^CM-\d+$/i,
        },
      })
        .select("codigo -_id")
        .lean();

    let mayorNumero = 0;

    for (const comision of comisiones) {
      const coincidencia =
        String(
          comision.codigo || ""
        ).match(
          /^CM-(\d+)$/i
        );

      const numero =
        coincidencia
          ? Number(
              coincidencia[1]
            )
          : 0;

      if (
        Number.isInteger(numero) &&
        numero > mayorNumero
      ) {
        mayorNumero =
          numero;
      }
    }

    return mayorNumero;
  };

/* =========================================================
   SINCRONIZAR CONSECUTIVO DE COMISIONES
========================================================= */

const sincronizarConsecutivoComision =
  async () => {
    const mayorNumeroComisiones =
      await obtenerMayorNumeroComisiones();

    const consecutivo =
      await Consecutivo.findOneAndUpdate(
        {
          tipo: "comision",
        },
        {
          $setOnInsert: {
            tipo: "comision",
            ultimoNumero:
              mayorNumeroComisiones,
          },
        },
        {
          new: true,
          upsert: true,
        }
      );

    if (
      Number(
        consecutivo?.ultimoNumero ||
          0
      ) <
      mayorNumeroComisiones
    ) {
      await Consecutivo.findOneAndUpdate(
        {
          tipo: "comision",
          ultimoNumero: {
            $lt:
              mayorNumeroComisiones,
          },
        },
        {
          $set: {
            ultimoNumero:
              mayorNumeroComisiones,
          },
        }
      );
    }
  };

/* =========================================================
   GENERAR CÓDIGO DE COMISIÓN

   CM-0001
   CM-0002
   CM-0003
========================================================= */

export const generarCodigoComision =
  async () => {
    await sincronizarConsecutivoComision();

    const consecutivo =
      await Consecutivo.findOneAndUpdate(
        {
          tipo: "comision",
        },
        {
          $inc: {
            ultimoNumero: 1,
          },
        },
        {
          new: true,
        }
      );

    if (!consecutivo) {
      throw new Error(
        "No fue posible generar el consecutivo de la comisión"
      );
    }

    const numero =
      Number(
        consecutivo.ultimoNumero
      );

    if (
      !Number.isInteger(numero) ||
      numero <= 0
    ) {
      throw new Error(
        "El consecutivo generado para la comisión no es válido"
      );
    }

    return `CM-${String(
      numero
    ).padStart(
      4,
      "0"
    )}`;
  };