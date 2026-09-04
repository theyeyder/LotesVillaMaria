import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  crearNombreArchivo,
  formatearDinero,
  formatearFecha,
  formatearNumero,
  numero,
  textoSeguro,
} from "./formatos";

/* =========================================================
   COLORES
   LOTES VILLA MARÍA
========================================================= */

const COLORES = {
  verdeOscuro: [23, 63, 46],
  verde: [47, 107, 74],
  verdeClaro: [231, 242, 234],

  dorado: [217, 170, 88],
  doradoOscuro: [138, 104, 39],
  doradoClaro: [245, 237, 216],

  rojo: [163, 63, 53],
  rojoClaro: [249, 231, 228],

  azul: [66, 107, 130],
  azulClaro: [232, 241, 245],

  crema: [248, 246, 239],
  gris: [105, 115, 109],
  grisClaro: [229, 225, 216],

  blanco: [255, 255, 255],
  negro: [37, 53, 43],
};

/* =========================================================
   NORMALIZAR COLUMNAS

   Ejemplo:

   {
     titulo: "Cliente",
     clave: "cliente",
     ancho: 30
   }

   {
     titulo: "Saldo",
     clave: "saldoPendiente",
     tipo: "moneda-pendiente"
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
            null,
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
          columna.anchoPDF ||
          null,
      };
    }
  );
};

/* =========================================================
   OBTENER VALOR
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
   FORMATEAR VALOR SEGÚN TIPO
========================================================= */

const formatearValor = (
  valor,
  tipo
) => {
  switch (
    tipo
  ) {
    case "moneda":
    case "moneda-pendiente":
    case "moneda-vencida":
      return formatearDinero(
        valor
      );

    case "numero":
      return formatearNumero(
        valor
      );

    case "fecha":
      return formatearFecha(
        valor
      );

    default:
      return textoSeguro(
        valor
      );
  }
};

/* =========================================================
   ORIENTACIÓN AUTOMÁTICA
========================================================= */

const obtenerOrientacion = (
  cantidadColumnas,
  orientacion
) => {
  if (
    orientacion ===
      "portrait" ||
    orientacion ===
      "landscape"
  ) {
    return orientacion;
  }

  return cantidadColumnas >
    7
    ? "landscape"
    : "portrait";
};

/* =========================================================
   ENCABEZADO
========================================================= */

const dibujarEncabezado = ({
  doc,
  titulo,
  subtitulo,
  filtros,
  orientacion,
}) => {
  const anchoPagina =
    doc.internal.pageSize.getWidth();

  /* =======================================================
     FRANJA VERDE
  ======================================================= */

  doc.setFillColor(
    ...COLORES.verdeOscuro
  );

  doc.rect(
    0,
    0,
    anchoPagina,
    26,
    "F"
  );

  /* =======================================================
     DORADO SUPERIOR
  ======================================================= */

  doc.setFillColor(
    ...COLORES.dorado
  );

  doc.rect(
    0,
    26,
    anchoPagina,
    1.8,
    "F"
  );

  /* =======================================================
     EMPRESA
  ======================================================= */

  doc.setTextColor(
    ...COLORES.blanco
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(
    16
  );

  doc.text(
    "LOTES VILLA MARÍA",
    12,
    11
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(
    7.5
  );

  doc.setTextColor(
    220,
    232,
    225
  );

  doc.text(
    "Sistema administrativo y financiero",
    12,
    17
  );

  /* =======================================================
     TÍTULO
  ======================================================= */

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(
    10
  );

  doc.setTextColor(
    ...COLORES.dorado
  );

  const tituloCorto =
    String(
      titulo ||
        "Reporte"
    );

  doc.text(
    tituloCorto,
    anchoPagina - 12,
    11,
    {
      align: "right",
      maxWidth:
        orientacion ===
        "landscape"
          ? 125
          : 90,
    }
  );

  /* =======================================================
     SUBTÍTULO
  ======================================================= */

  if (
    subtitulo
  ) {
    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(
      7
    );

    doc.setTextColor(
      225,
      230,
      226
    );

    doc.text(
      String(
        subtitulo
      ),
      anchoPagina - 12,
      17,
      {
        align:
          "right",

        maxWidth:
          orientacion ===
          "landscape"
            ? 135
            : 95,
      }
    );
  }

  /* =======================================================
     FILTROS
  ======================================================= */

  let y =
    34;

  if (
    filtros?.length
  ) {
    doc.setFontSize(
      7
    );

    filtros.forEach(
      (
        filtro,
        indice
      ) => {
        const etiqueta =
          filtro.label ||
          filtro.titulo ||
          "Filtro";

        const valor =
          filtro.valor ||
          "Todos";

        const bloque =
          `${etiqueta}: ${valor}`;

        const x =
          12 +
          (indice % 3) *
            (
              orientacion ===
              "landscape"
                ? 88
                : 60
            );

        if (
          indice >
            0 &&
          indice %
            3 ===
            0
        ) {
          y += 7;
        }

        doc.setFillColor(
          ...COLORES.crema
        );

        doc.roundedRect(
          x,
          y - 4.5,
          orientacion ===
            "landscape"
            ? 82
            : 55,
          6,
          1,
          1,
          "F"
        );

        doc.setTextColor(
          ...COLORES.gris
        );

        doc.text(
          bloque,
          x + 2,
          y - 0.4,
          {
            maxWidth:
              orientacion ===
              "landscape"
                ? 78
                : 51,
          }
        );
      }
    );

    y += 8;
  }

  return y;
};

/* =========================================================
   RESUMEN
========================================================= */

const dibujarResumen = ({
  doc,
  resumen = [],
  yInicial,
  orientacion,
}) => {
  if (
    !resumen.length
  ) {
    return yInicial;
  }

  const anchoPagina =
    doc.internal.pageSize.getWidth();

  const margen =
    12;

  const columnas =
    orientacion ===
    "landscape"
      ? 4
      : 3;

  const espacio =
    3;

  const anchoDisponible =
    anchoPagina -
    margen * 2;

  const anchoTarjeta =
    (
      anchoDisponible -
      espacio *
        (
          columnas -
          1
        )
    ) /
    columnas;

  const altoTarjeta =
    18;

  let y =
    yInicial;

  resumen.forEach(
    (
      item,
      indice
    ) => {
      const columna =
        indice %
        columnas;

      const fila =
        Math.floor(
          indice /
            columnas
        );

      const x =
        margen +
        columna *
          (
            anchoTarjeta +
            espacio
          );

      const tarjetaY =
        y +
        fila *
          (
            altoTarjeta +
            3
          );

      let fondo =
        COLORES.verdeClaro;

      let texto =
        COLORES.verde;

      if (
        item.color ===
        "dorado"
      ) {
        fondo =
          COLORES.doradoClaro;

        texto =
          COLORES.doradoOscuro;
      }

      if (
        item.color ===
        "rojo"
      ) {
        fondo =
          COLORES.rojoClaro;

        texto =
          COLORES.rojo;
      }

      if (
        item.color ===
        "azul"
      ) {
        fondo =
          COLORES.azulClaro;

        texto =
          COLORES.azul;
      }

      doc.setFillColor(
        ...fondo
      );

      doc.roundedRect(
        x,
        tarjetaY,
        anchoTarjeta,
        altoTarjeta,
        1.8,
        1.8,
        "F"
      );

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(
        6.5
      );

      doc.setTextColor(
        ...COLORES.gris
      );

      doc.text(
        String(
          item.label ||
            item.titulo ||
            "Indicador"
        ),
        x + 3,
        tarjetaY + 5,
        {
          maxWidth:
            anchoTarjeta -
            6,
        }
      );

      let valor =
        item.valor ??
        0;

      if (
        item.tipo ===
        "moneda"
      ) {
        valor =
          formatearDinero(
            valor
          );
      } else if (
        item.tipo ===
        "numero"
      ) {
        valor =
          formatearNumero(
            valor
          );
      }

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(
        9
      );

      doc.setTextColor(
        ...texto
      );

      doc.text(
        String(valor),
        x + 3,
        tarjetaY + 11,
        {
          maxWidth:
            anchoTarjeta -
            6,
        }
      );

      if (
        item.detalle
      ) {
        doc.setFont(
          "helvetica",
          "normal"
        );

        doc.setFontSize(
          5.8
        );

        doc.setTextColor(
          ...COLORES.gris
        );

        doc.text(
          String(
            item.detalle
          ),
          x + 3,
          tarjetaY + 15.5,
          {
            maxWidth:
              anchoTarjeta -
              6,
          }
        );
      }
    }
  );

  const cantidadFilas =
    Math.ceil(
      resumen.length /
        columnas
    );

  y +=
    cantidadFilas *
    (
      altoTarjeta +
      3
    );

  return y + 2;
};

/* =========================================================
   ESTILO DE CELDAS ESPECIALES
========================================================= */

const aplicarEstiloCelda = ({
  data,
  columnas,
}) => {
  if (
    data.section !==
    "body"
  ) {
    return;
  }

  const columna =
    columnas[
      data.column.index
    ];

  if (
    !columna
  ) {
    return;
  }

  const valorOriginal =
    data.cell.raw;

  /* =======================================================
     MONEDA
  ======================================================= */

  if (
    columna.tipo ===
    "moneda"
  ) {
    data.cell.styles.textColor =
      COLORES.verde;

    data.cell.styles.fontStyle =
      "bold";

    data.cell.styles.halign =
      "right";
  }

  /* =======================================================
     SALDO PENDIENTE
  ======================================================= */

  if (
    columna.tipo ===
    "moneda-pendiente"
  ) {
    if (
      numero(
        valorOriginal
      ) > 0
    ) {
      data.cell.styles.fillColor =
        COLORES.doradoClaro;

      data.cell.styles.textColor =
        COLORES.doradoOscuro;
    } else {
      data.cell.styles.fillColor =
        COLORES.verdeClaro;

      data.cell.styles.textColor =
        COLORES.verde;
    }

    data.cell.styles.fontStyle =
      "bold";

    data.cell.styles.halign =
      "right";
  }

  /* =======================================================
     VENCIDO
  ======================================================= */

  if (
    columna.tipo ===
    "moneda-vencida"
  ) {
    if (
      numero(
        valorOriginal
      ) > 0
    ) {
      data.cell.styles.fillColor =
        COLORES.rojoClaro;

      data.cell.styles.textColor =
        COLORES.rojo;
    } else {
      data.cell.styles.fillColor =
        COLORES.verdeClaro;

      data.cell.styles.textColor =
        COLORES.verde;
    }

    data.cell.styles.fontStyle =
      "bold";

    data.cell.styles.halign =
      "right";
  }

  /* =======================================================
     ESTADO
  ======================================================= */

  if (
    columna.tipo ===
    "estado"
  ) {
    const estado =
      String(
        valorOriginal ||
          ""
      )
        .trim()
        .toLowerCase();

    data.cell.styles.fontStyle =
      "bold";

    data.cell.styles.halign =
      "center";

    if (
      [
        "pagada",
        "pagado",
        "disponible",
        "activo",
        "activa",
        "al día",
      ].includes(
        estado
      )
    ) {
      data.cell.styles.fillColor =
        COLORES.verdeClaro;

      data.cell.styles.textColor =
        COLORES.verde;
    }

    if (
      [
        "pendiente",
        "abonada",
        "abonado",
        "vendido",
        "vendida",
      ].includes(
        estado
      )
    ) {
      data.cell.styles.fillColor =
        COLORES.doradoClaro;

      data.cell.styles.textColor =
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
      ].includes(
        estado
      )
    ) {
      data.cell.styles.fillColor =
        COLORES.rojoClaro;

      data.cell.styles.textColor =
        COLORES.rojo;
    }
  }
};

/* =========================================================
   PIE DE PÁGINA
========================================================= */

const agregarPiePaginas = (
  doc
) => {
  const totalPaginas =
    doc.getNumberOfPages();

  for (
    let pagina = 1;
    pagina <=
    totalPaginas;
    pagina += 1
  ) {
    doc.setPage(
      pagina
    );

    const ancho =
      doc.internal.pageSize.getWidth();

    const alto =
      doc.internal.pageSize.getHeight();

    doc.setDrawColor(
      ...COLORES.grisClaro
    );

    doc.line(
      12,
      alto - 10,
      ancho - 12,
      alto - 10
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(
      6.5
    );

    doc.setTextColor(
      ...COLORES.gris
    );

    doc.text(
      "Lotes Villa María",
      12,
      alto - 6
    );

    doc.text(
      `Página ${pagina} de ${totalPaginas}`,
      ancho - 12,
      alto - 6,
      {
        align:
          "right",
      }
    );
  }
};

/* =========================================================
   EXPORTAR PDF
========================================================= */

export const exportarPDF = ({
  titulo = "Reporte",
  subtitulo = "",
  nombreArchivo = "",
  resumen = [],
  filtros = [],
  columnas = [],
  filas = [],
  orientacion = "auto",
}) => {
  try {
    const columnasNormalizadas =
      normalizarColumnas(
        columnas
      );

    const orientacionFinal =
      obtenerOrientacion(
        columnasNormalizadas.length,
        orientacion
      );

    const doc =
      new jsPDF({
        orientation:
          orientacionFinal,

        unit:
          "mm",

        format:
          "a4",
      });

    /* =====================================================
       ENCABEZADO
    ===================================================== */

    let y =
      dibujarEncabezado({
        doc,
        titulo,
        subtitulo,
        filtros,
        orientacion:
          orientacionFinal,
      });

    /* =====================================================
       RESUMEN
    ===================================================== */

    y =
      dibujarResumen({
        doc,
        resumen,
        yInicial:
          y,
        orientacion:
          orientacionFinal,
      });

    /* =====================================================
       TABLA
    ===================================================== */

    if (
      columnasNormalizadas.length
    ) {
      const encabezados =
        columnasNormalizadas.map(
          (
            columna
          ) =>
            columna.titulo
        );

      /*
       * Mantener datos originales en body permite
       * identificar montos y estados dentro de didParseCell.
       */

      const cuerpoOriginal =
        filas.map(
          (
            fila
          ) =>
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
        );

      const cuerpoVisible =
        cuerpoOriginal.map(
          (
            fila
          ) =>
            fila.map(
              (
                valor,
                indice
              ) =>
                formatearValor(
                  valor,
                  columnasNormalizadas[
                    indice
                  ]?.tipo
                )
            )
        );

      autoTable(
        doc,
        {
          startY:
            y,

          margin: {
            left:
              8,

            right:
              8,

            bottom:
              14,
          },

          head: [
            encabezados,
          ],

          body:
            cuerpoVisible,

          theme:
            "grid",

          styles: {
            font:
              "helvetica",

            fontSize:
              orientacionFinal ===
              "landscape"
                ? 6.3
                : 7,

            cellPadding:
              1.7,

            lineWidth:
              0.1,

            lineColor:
              COLORES.grisClaro,

            textColor:
              COLORES.negro,

            overflow:
              "linebreak",

            valign:
              "middle",
          },

          headStyles: {
            fillColor:
              COLORES.verdeOscuro,

            textColor:
              COLORES.blanco,

            fontStyle:
              "bold",

            halign:
              "center",

            valign:
              "middle",

            lineColor:
              COLORES.dorado,

            lineWidth:
              0.25,
          },

          alternateRowStyles: {
            fillColor:
              COLORES.crema,
          },

          didParseCell: (
            data
          ) => {
            /*
             * Restauramos el valor original solo para
             * calcular colores. El texto mostrado sigue
             * siendo el cuerpo formateado.
             */

            if (
              data.section ===
              "body"
            ) {
              const valorOriginal =
                cuerpoOriginal[
                  data.row.index
                ]?.[
                  data.column.index
                ];

              const valorVisible =
                data.cell.raw;

              data.cell.raw =
                valorOriginal;

              aplicarEstiloCelda({
                data,
                columnas:
                  columnasNormalizadas,
              });

              data.cell.raw =
                valorVisible;
            }
          },

          didDrawPage:
            () => {
              /*
               * En páginas nuevas dejamos una pequeña
               * identificación superior.
               */
              if (
                doc.internal
                  .getCurrentPageInfo()
                  .pageNumber >
                1
              ) {
                doc.setFontSize(
                  6.5
                );

                doc.setTextColor(
                  ...COLORES.gris
                );

                doc.text(
                  `Lotes Villa María · ${titulo}`,
                  8,
                  6
                );
              }
            },
        }
      );
    }

    /* =====================================================
       SIN REGISTROS
    ===================================================== */

    if (
      !filas.length &&
      columnasNormalizadas.length
    ) {
      doc.setFillColor(
        ...COLORES.crema
      );

      doc.roundedRect(
        12,
        y,
        doc.internal.pageSize.getWidth() -
          24,
        18,
        2,
        2,
        "F"
      );

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(
        9
      );

      doc.setTextColor(
        ...COLORES.gris
      );

      doc.text(
        "No hay registros para los filtros seleccionados.",
        doc.internal.pageSize.getWidth() /
          2,
        y + 10,
        {
          align:
            "center",
        }
      );
    }

    /* =====================================================
       PIE
    ===================================================== */

    agregarPiePaginas(
      doc
    );

    /* =====================================================
       GUARDAR
    ===================================================== */

    doc.save(
      crearNombreArchivo(
        nombreArchivo ||
          titulo,
        "pdf"
      )
    );

    return true;
  } catch (error) {
    console.error(
      "Error exportando PDF:",
      error
    );

    return false;
  }
};

export default exportarPDF;