import * as XLSX from "xlsx-js-style";

import {
  crearNombreArchivo,
  numero,
} from "./formatos";

/* =========================================================
   PALETA LOTES VILLA MARÍA
========================================================= */

const COLORES = {
  verdeOscuro: "173F2E",
  verde: "2F6B4A",
  verdeClaro: "E7F2EA",

  dorado: "D9AA58",
  doradoOscuro: "8A6827",
  doradoClaro: "F5EDD8",

  rojo: "A33F35",
  rojoClaro: "F9E7E4",

  azul: "426B82",
  azulClaro: "E8F1F5",

  crema: "F8F6EF",
  cremaClaro: "FCFBF7",

  gris: "69736D",
  grisClaro: "E5E1D8",

  blanco: "FFFFFF",
  negro: "25352B",
};

/* =========================================================
   ESTILOS BASE
========================================================= */

const ESTILO_TITULO = {
  fill: {
    fgColor: {
      rgb: COLORES.verdeOscuro,
    },
  },

  font: {
    color: {
      rgb: COLORES.blanco,
    },

    bold: true,
    sz: 18,
  },

  alignment: {
    horizontal: "center",
    vertical: "center",
  },

  border: {
    bottom: {
      style: "medium",

      color: {
        rgb: COLORES.dorado,
      },
    },
  },
};

const ESTILO_SUBTITULO = {
  fill: {
    fgColor: {
      rgb: COLORES.doradoClaro,
    },
  },

  font: {
    color: {
      rgb: COLORES.doradoOscuro,
    },

    bold: true,
    sz: 11,
  },

  alignment: {
    horizontal: "center",
    vertical: "center",
  },
};

const ESTILO_ENCABEZADO = {
  fill: {
    fgColor: {
      rgb: COLORES.verdeOscuro,
    },
  },

  font: {
    color: {
      rgb: COLORES.blanco,
    },

    bold: true,
    sz: 10,
  },

  alignment: {
    horizontal: "center",
    vertical: "center",
    wrapText: true,
  },

  border: {
    top: {
      style: "thin",

      color: {
        rgb: COLORES.dorado,
      },
    },

    bottom: {
      style: "thin",

      color: {
        rgb: COLORES.dorado,
      },
    },

    left: {
      style: "thin",

      color: {
        rgb: COLORES.grisClaro,
      },
    },

    right: {
      style: "thin",

      color: {
        rgb: COLORES.grisClaro,
      },
    },
  },
};

const crearEstiloFila = (
  alterna = false
) => {
  return {
    fill: {
      fgColor: {
        rgb: alterna
          ? COLORES.cremaClaro
          : COLORES.blanco,
      },
    },

    font: {
      color: {
        rgb: COLORES.negro,
      },

      sz: 9,
    },

    alignment: {
      vertical: "center",
      wrapText: true,
    },

    border: {
      bottom: {
        style: "thin",

        color: {
          rgb: COLORES.grisClaro,
        },
      },
    },
  };
};

/* =========================================================
   ESTILOS ESPECIALES
========================================================= */

const crearEstiloMoneda = (
  fondo = COLORES.verdeClaro,
  texto = COLORES.verde
) => {
  return {
    fill: {
      fgColor: {
        rgb: fondo,
      },
    },

    font: {
      color: {
        rgb: texto,
      },

      bold: true,
      sz: 9,
    },

    alignment: {
      horizontal: "right",
      vertical: "center",
    },

    numFmt: '$#,##0',

    border: {
      bottom: {
        style: "thin",

        color: {
          rgb: COLORES.grisClaro,
        },
      },
    },
  };
};

const crearEstiloEstado = (
  estado
) => {
  const valor = String(
    estado || ""
  )
    .trim()
    .toLowerCase();

  let fondo =
    COLORES.crema;

  let texto =
    COLORES.negro;

  if (
    [
      "pagada",
      "pagado",
      "disponible",
      "activo",
      "activa",
      "al día",
    ].includes(valor)
  ) {
    fondo =
      COLORES.verdeClaro;

    texto =
      COLORES.verde;
  }

  if (
    [
      "pendiente",
      "abonada",
      "abonado",
      "vendido",
      "vendida",
    ].includes(valor)
  ) {
    fondo =
      COLORES.doradoClaro;

    texto =
      COLORES.doradoOscuro;
  }

  if (
    [
      "vencida",
      "vencido",
      "anulado",
      "anulada",
      "inactivo",
      "inactiva",
    ].includes(valor)
  ) {
    fondo =
      COLORES.rojoClaro;

    texto =
      COLORES.rojo;
  }

  return {
    fill: {
      fgColor: {
        rgb: fondo,
      },
    },

    font: {
      color: {
        rgb: texto,
      },

      bold: true,
      sz: 9,
    },

    alignment: {
      horizontal: "center",
      vertical: "center",
    },

    border: {
      bottom: {
        style: "thin",

        color: {
          rgb: COLORES.grisClaro,
        },
      },
    },
  };
};

/* =========================================================
   NORMALIZAR COLUMNAS

   Ejemplo:

   {
     titulo: "Valor venta",
     clave: "valorVenta",
     tipo: "moneda",
     ancho: 18
   }
========================================================= */

const normalizarColumnas = (
  columnas = []
) => {
  return columnas.map(
    (
      columna,
      indice
    ) => {
      if (
        typeof columna ===
        "string"
      ) {
        return {
          titulo:
            columna,

          clave:
            `columna_${indice}`,

          tipo:
            "texto",

          ancho:
            16,
        };
      }

      return {
        titulo:
          columna.titulo ||
          columna.label ||
          columna.clave ||
          `Columna ${indice + 1}`,

        clave:
          columna.clave ||
          columna.key ||
          `columna_${indice}`,

        tipo:
          columna.tipo ||
          "texto",

        ancho:
          Number(
            columna.ancho
          ) || 16,

        color:
          columna.color ||
          null,
      };
    }
  );
};

/* =========================================================
   OBTENER VALOR DE UNA FILA

   Permite:
   - objetos
   - arreglos
========================================================= */

const obtenerValorFila = (
  fila,
  columna,
  indice
) => {
  if (
    Array.isArray(fila)
  ) {
    return fila[
      indice
    ];
  }

  return fila?.[
    columna.clave
  ];
};

/* =========================================================
   CREAR HOJA RESUMEN
========================================================= */

const crearHojaResumen = ({
  titulo,
  subtitulo,
  resumen = [],
  filtros = [],
}) => {
  const filas = [
    [
      "LOTES VILLA MARÍA",
      "",
      "",
      "",
    ],

    [
      titulo,
      "",
      "",
      "",
    ],

    [
      subtitulo ||
        "Informe administrativo",
      "",
      "",
      "",
    ],

    [
      "",
      "",
      "",
      "",
    ],
  ];

  /* =======================================================
     FILTROS
  ======================================================= */

  if (
    filtros.length
  ) {
    filas.push([
      "FILTROS APLICADOS",
      "",
      "",
      "",
    ]);

    filtros.forEach(
      (filtro) => {
        filas.push([
          filtro.label ||
            filtro.titulo ||
            "Filtro",

          filtro.valor ||
            "Todos",

          "",
          "",
        ]);
      }
    );

    filas.push([
      "",
      "",
      "",
      "",
    ]);
  }

  /* =======================================================
     RESUMEN
  ======================================================= */

  const filaEncabezadoResumen =
    filas.length;

  filas.push([
    "INDICADOR",
    "VALOR",
    "DETALLE",
    "",
  ]);

  resumen.forEach(
    (item) => {
      filas.push([
        item.label ||
          item.titulo ||
          "Indicador",

        item.valor ?? 0,

        item.detalle ||
          "",

        "",
      ]);
    }
  );

  const hoja =
    XLSX.utils.aoa_to_sheet(
      filas
    );

  hoja["!merges"] = [
    {
      s: {
        r: 0,
        c: 0,
      },

      e: {
        r: 0,
        c: 3,
      },
    },

    {
      s: {
        r: 1,
        c: 0,
      },

      e: {
        r: 1,
        c: 3,
      },
    },

    {
      s: {
        r: 2,
        c: 0,
      },

      e: {
        r: 2,
        c: 3,
      },
    },
  ];

  /* =======================================================
     ESTILOS TÍTULO
  ======================================================= */

  if (
    hoja["A1"]
  ) {
    hoja["A1"].s =
      ESTILO_TITULO;
  }

  if (
    hoja["A2"]
  ) {
    hoja["A2"].s = {
      ...ESTILO_SUBTITULO,

      font: {
        ...ESTILO_SUBTITULO.font,
        sz: 13,
      },
    };
  }

  if (
    hoja["A3"]
  ) {
    hoja["A3"].s = {
      fill: {
        fgColor: {
          rgb:
            COLORES.crema,
        },
      },

      font: {
        color: {
          rgb:
            COLORES.gris,
        },

        italic: true,
        sz: 9,
      },

      alignment: {
        horizontal:
          "center",
      },
    };
  }

  /* =======================================================
     FILTROS
  ======================================================= */

  if (
    filtros.length
  ) {
    const filaTituloFiltros =
      4;

    for (
      let columna = 0;
      columna < 4;
      columna += 1
    ) {
      const celda =
        XLSX.utils.encode_cell({
          r:
            filaTituloFiltros,
          c:
            columna,
        });

      if (
        hoja[
          celda
        ]
      ) {
        hoja[
          celda
        ].s = {
          fill: {
            fgColor: {
              rgb:
                COLORES.dorado,
            },
          },

          font: {
            color: {
              rgb:
                COLORES.verdeOscuro,
            },

            bold: true,
          },

          alignment: {
            horizontal:
              "center",
          },
        };
      }
    }

    filtros.forEach(
      (
        filtro,
        indice
      ) => {
        const fila =
          filaTituloFiltros +
          indice +
          1;

        const celdaLabel =
          XLSX.utils.encode_cell({
            r:
              fila,
            c:
              0,
          });

        const celdaValor =
          XLSX.utils.encode_cell({
            r:
              fila,
            c:
              1,
          });

        if (
          hoja[
            celdaLabel
          ]
        ) {
          hoja[
            celdaLabel
          ].s = {
            fill: {
              fgColor: {
                rgb:
                  COLORES.doradoClaro,
              },
            },

            font: {
              color: {
                rgb:
                  COLORES.doradoOscuro,
              },

              bold: true,
            },
          };
        }

        if (
          hoja[
            celdaValor
          ]
        ) {
          hoja[
            celdaValor
          ].s = {
            fill: {
              fgColor: {
                rgb:
                  COLORES.cremaClaro,
              },
            },

            font: {
              color: {
                rgb:
                  COLORES.negro,
              },
            },
          };
        }
      }
    );
  }

  /* =======================================================
     ENCABEZADO RESUMEN
  ======================================================= */

  for (
    let columna = 0;
    columna < 4;
    columna += 1
  ) {
    const celda =
      XLSX.utils.encode_cell({
        r:
          filaEncabezadoResumen,

        c:
          columna,
      });

    if (
      hoja[
        celda
      ]
    ) {
      hoja[
        celda
      ].s =
        ESTILO_ENCABEZADO;
    }
  }

  /* =======================================================
     FILAS DEL RESUMEN
  ======================================================= */

  resumen.forEach(
    (
      item,
      indice
    ) => {
      const fila =
        filaEncabezadoResumen +
        indice +
        1;

      for (
        let columna = 0;
        columna < 4;
        columna += 1
      ) {
        const celda =
          XLSX.utils.encode_cell({
            r:
              fila,

            c:
              columna,
          });

        if (
          !hoja[
            celda
          ]
        ) {
          continue;
        }

        hoja[
          celda
        ].s =
          crearEstiloFila(
            indice %
              2 ===
              1
          );
      }

      const celdaValor =
        XLSX.utils.encode_cell({
          r:
            fila,

          c:
            1,
        });

      if (
        hoja[
          celdaValor
        ]
      ) {
        if (
          item.tipo ===
          "moneda"
        ) {
          hoja[
            celdaValor
          ].s =
            crearEstiloMoneda(
              item.color ===
              "rojo"
                ? COLORES.rojoClaro
                : item.color ===
                    "dorado"
                  ? COLORES.doradoClaro
                  : COLORES.verdeClaro,

              item.color ===
              "rojo"
                ? COLORES.rojo
                : item.color ===
                    "dorado"
                  ? COLORES.doradoOscuro
                  : COLORES.verde
            );
        }

        if (
          item.tipo ===
          "numero"
        ) {
          hoja[
            celdaValor
          ].s = {
            fill: {
              fgColor: {
                rgb:
                  COLORES.azulClaro,
              },
            },

            font: {
              color: {
                rgb:
                  COLORES.azul,
              },

              bold: true,
            },

            alignment: {
              horizontal:
                "center",
            },
          };
        }
      }
    }
  );

  hoja["!cols"] = [
    {
      wch: 30,
    },

    {
      wch: 22,
    },

    {
      wch: 28,
    },

    {
      wch: 10,
    },
  ];

  hoja["!rows"] = [
    {
      hpt: 30,
    },

    {
      hpt: 24,
    },

    {
      hpt: 20,
    },
  ];

  return hoja;
};

/* =========================================================
   CREAR HOJA DETALLE
========================================================= */

const crearHojaDetalle = ({
  titulo,
  subtitulo,
  columnas = [],
  filas = [],
  filtros = [],
}) => {
  const columnasNormalizadas =
    normalizarColumnas(
      columnas
    );

  const cantidadColumnas =
    Math.max(
      columnasNormalizadas.length,
      1
    );

  const filaVacia =
    Array(
      cantidadColumnas
    ).fill("");

  const informacionFiltros =
    filtros
      .map(
        (filtro) =>
          `${filtro.label || filtro.titulo}: ${filtro.valor || "Todos"}`
      )
      .join(" | ");

  const contenido = [
    [
      "LOTES VILLA MARÍA",
      ...filaVacia.slice(
        1
      ),
    ],

    [
      titulo,
      ...filaVacia.slice(
        1
      ),
    ],

    [
      subtitulo ||
        informacionFiltros ||
        "Informe administrativo",
      ...filaVacia.slice(
        1
      ),
    ],

    filaVacia,

    columnasNormalizadas.map(
      (columna) =>
        columna.titulo
    ),

    ...filas.map(
      (fila) =>
        columnasNormalizadas.map(
          (
            columna,
            indice
          ) =>
            obtenerValorFila(
              fila,
              columna,
              indice
            )
        )
    ),
  ];

  const hoja =
    XLSX.utils.aoa_to_sheet(
      contenido
    );

  hoja["!merges"] = [
    {
      s: {
        r: 0,
        c: 0,
      },

      e: {
        r: 0,
        c:
          cantidadColumnas -
          1,
      },
    },

    {
      s: {
        r: 1,
        c: 0,
      },

      e: {
        r: 1,
        c:
          cantidadColumnas -
          1,
      },
    },

    {
      s: {
        r: 2,
        c: 0,
      },

      e: {
        r: 2,
        c:
          cantidadColumnas -
          1,
      },
    },
  ];

  /* =======================================================
     TÍTULOS
  ======================================================= */

  if (
    hoja["A1"]
  ) {
    hoja["A1"].s =
      ESTILO_TITULO;
  }

  if (
    hoja["A2"]
  ) {
    hoja["A2"].s =
      ESTILO_SUBTITULO;
  }

  if (
    hoja["A3"]
  ) {
    hoja["A3"].s = {
      fill: {
        fgColor: {
          rgb:
            COLORES.crema,
        },
      },

      font: {
        color: {
          rgb:
            COLORES.gris,
        },

        italic: true,
        sz: 8,
      },

      alignment: {
        horizontal:
          "center",

        wrapText: true,
      },
    };
  }

  /* =======================================================
     ENCABEZADOS
  ======================================================= */

  columnasNormalizadas.forEach(
    (
      columna,
      indice
    ) => {
      const celda =
        XLSX.utils.encode_cell({
          r: 4,
          c: indice,
        });

      if (
        hoja[
          celda
        ]
      ) {
        hoja[
          celda
        ].s =
          ESTILO_ENCABEZADO;
      }
    }
  );

  /* =======================================================
     FILAS
  ======================================================= */

  filas.forEach(
    (
      fila,
      indiceFila
    ) => {
      columnasNormalizadas.forEach(
        (
          columna,
          indiceColumna
        ) => {
          const celda =
            XLSX.utils.encode_cell({
              r:
                indiceFila +
                5,

              c:
                indiceColumna,
            });

          const celdaActual =
            hoja[
              celda
            ];

          if (
            !celdaActual
          ) {
            return;
          }

          const valor =
            obtenerValorFila(
              fila,
              columna,
              indiceColumna
            );

          celdaActual.s =
            crearEstiloFila(
              indiceFila %
                2 ===
                1
            );

          /* =======================
             MONEDA
          ======================= */

          if (
            columna.tipo ===
            "moneda"
          ) {
            celdaActual.v =
              numero(valor);

            celdaActual.t =
              "n";

            celdaActual.s =
              crearEstiloMoneda();
          }

          /* =======================
             MONEDA PENDIENTE
          ======================= */

          if (
            columna.tipo ===
            "moneda-pendiente"
          ) {
            celdaActual.v =
              numero(valor);

            celdaActual.t =
              "n";

            celdaActual.s =
              crearEstiloMoneda(
                numero(valor) >
                  0
                  ? COLORES.doradoClaro
                  : COLORES.verdeClaro,

                numero(valor) >
                  0
                  ? COLORES.doradoOscuro
                  : COLORES.verde
              );
          }

          /* =======================
             MONEDA VENCIDA
          ======================= */

          if (
            columna.tipo ===
            "moneda-vencida"
          ) {
            celdaActual.v =
              numero(valor);

            celdaActual.t =
              "n";

            celdaActual.s =
              crearEstiloMoneda(
                numero(valor) >
                  0
                  ? COLORES.rojoClaro
                  : COLORES.verdeClaro,

                numero(valor) >
                  0
                  ? COLORES.rojo
                  : COLORES.verde
              );
          }

          /* =======================
             NÚMERO
          ======================= */

          if (
            columna.tipo ===
            "numero"
          ) {
            celdaActual.v =
              numero(valor);

            celdaActual.t =
              "n";

            celdaActual.s = {
              ...crearEstiloFila(
                indiceFila %
                  2 ===
                  1
              ),

              alignment: {
                horizontal:
                  "center",

                vertical:
                  "center",
              },
            };
          }

          /* =======================
             ESTADO
          ======================= */

          if (
            columna.tipo ===
            "estado"
          ) {
            celdaActual.s =
              crearEstiloEstado(
                valor
              );
          }

          /* =======================
             FECHA
          ======================= */

          if (
            columna.tipo ===
            "fecha"
          ) {
            celdaActual.s = {
              ...crearEstiloFila(
                indiceFila %
                  2 ===
                  1
              ),

              alignment: {
                horizontal:
                  "center",

                vertical:
                  "center",
              },
            };
          }
        }
      );
    }
  );

  /* =======================================================
     COLUMNAS
  ======================================================= */

  hoja["!cols"] =
    columnasNormalizadas.map(
      (columna) => ({
        wch:
          columna.ancho,
      })
    );

  /* =======================================================
     ALTURAS
  ======================================================= */

  hoja["!rows"] = [
    {
      hpt: 30,
    },

    {
      hpt: 23,
    },

    {
      hpt: 25,
    },

    {
      hpt: 8,
    },

    {
      hpt: 27,
    },
  ];

  /* =======================================================
     AUTOFILTRO
  ======================================================= */

  if (
    filas.length &&
    columnasNormalizadas.length
  ) {
    hoja[
      "!autofilter"
    ] = {
      ref:
        XLSX.utils.encode_range({
          s: {
            r: 4,
            c: 0,
          },

          e: {
            r:
              filas.length +
              4,

            c:
              columnasNormalizadas.length -
              1,
          },
        }),
    };
  }

  return hoja;
};

/* =========================================================
   EXPORTAR EXCEL

   USO:

   exportarExcel({
     titulo: "Clientes por lotes vendidos",
     subtitulo: "Detalle de compradores",
     nombreArchivo: "ClientesLotesVendidos",

     resumen: [
       {
         label: "Clientes compradores",
         valor: 10,
         tipo: "numero"
       },
       {
         label: "Total vendido",
         valor: 500000000,
         tipo: "moneda"
       }
     ],

     filtros: [
       {
         label: "Desde",
         valor: "01/09/2026"
       }
     ],

     columnas: [
       {
         titulo: "Cliente",
         clave: "cliente",
         ancho: 28
       },
       {
         titulo: "Valor venta",
         clave: "valorVenta",
         tipo: "moneda",
         ancho: 18
       }
     ],

     filas: [...]
   });
========================================================= */

export const exportarExcel = ({
  titulo = "Reporte",
  subtitulo = "",
  nombreArchivo = "",
  resumen = [],
  filtros = [],
  columnas = [],
  filas = [],
}) => {
  try {
    const libro =
      XLSX.utils.book_new();

    /* =====================================================
       HOJA RESUMEN
    ===================================================== */

    const hojaResumen =
      crearHojaResumen({
        titulo,
        subtitulo,
        resumen,
        filtros,
      });

    XLSX.utils.book_append_sheet(
      libro,
      hojaResumen,
      "Resumen"
    );

    /* =====================================================
       HOJA DETALLE
    ===================================================== */

    if (
      columnas.length
    ) {
      const hojaDetalle =
        crearHojaDetalle({
          titulo,
          subtitulo,
          columnas,
          filas,
          filtros,
        });

      XLSX.utils.book_append_sheet(
        libro,
        hojaDetalle,
        "Detalle"
      );
    }

    /* =====================================================
       PROPIEDADES
    ===================================================== */

    libro.Props = {
      Title:
        `Lotes Villa María - ${titulo}`,

      Subject:
        titulo,

      Author:
        "Lotes Villa María",

      Company:
        "Lotes Villa María",

      Comments:
        "Informe generado desde el sistema Lotes Villa María",
    };

    /* =====================================================
       ARCHIVO
    ===================================================== */

    const archivo =
      crearNombreArchivo(
        nombreArchivo ||
          titulo,
        "xlsx"
      );

    XLSX.writeFile(
      libro,
      archivo
    );

    return true;
  } catch (error) {
    console.error(
      "Error exportando Excel:",
      error
    );

    return false;
  }
};

export default exportarExcel;