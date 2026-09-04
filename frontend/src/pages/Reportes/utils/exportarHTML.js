import {
  crearNombreArchivo,
  escaparHTML,
  formatearDinero,
  formatearFecha,
  formatearNumero,
  numero,
  textoSeguro,
} from "./formatos";

/* =========================================================
   NORMALIZAR COLUMNAS
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
   FORMATEAR VALOR
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
   CLASE SEGÚN TIPO
========================================================= */

const obtenerClaseCelda = (
  valor,
  tipo
) => {
  if (
    tipo ===
    "moneda"
  ) {
    return "valor-moneda";
  }

  if (
    tipo ===
    "moneda-pendiente"
  ) {
    return numero(valor) >
      0
      ? "valor-pendiente"
      : "valor-pagado";
  }

  if (
    tipo ===
    "moneda-vencida"
  ) {
    return numero(valor) >
      0
      ? "valor-vencido"
      : "valor-pagado";
  }

  if (
    tipo ===
    "estado"
  ) {
    const estado =
      String(
        valor || ""
      )
        .trim()
        .toLowerCase();

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
      return "estado estado-verde";
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
      return "estado estado-dorado";
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
      return "estado estado-rojo";
    }

    return "estado";
  }

  return "";
};

/* =========================================================
   DESCARGAR HTML
========================================================= */

const descargarHTML = (
  contenido,
  nombreArchivo
) => {
  const blob =
    new Blob(
      [
        contenido,
      ],
      {
        type:
          "text/html;charset=utf-8",
      }
    );

  const url =
    URL.createObjectURL(
      blob
    );

  const enlace =
    document.createElement(
      "a"
    );

  enlace.href =
    url;

  enlace.download =
    nombreArchivo;

  document.body.appendChild(
    enlace
  );

  enlace.click();

  enlace.remove();

  URL.revokeObjectURL(
    url
  );
};

/* =========================================================
   EXPORTAR HTML
========================================================= */

export const exportarHTML = ({
  titulo = "Reporte",
  subtitulo = "",
  nombreArchivo = "",
  resumen = [],
  filtros = [],
  columnas = [],
  filas = [],
  descargar = false,
}) => {
  try {
    const columnasNormalizadas =
      normalizarColumnas(
        columnas
      );

    /* =====================================================
       FILTROS
    ===================================================== */

    const filtrosHTML =
      filtros.length
        ? filtros
            .map(
              (
                filtro
              ) => `
                <div class="filtro">
                  <span>
                    ${escaparHTML(
                      filtro.label ||
                        filtro.titulo ||
                        "Filtro"
                    )}
                  </span>

                  <strong>
                    ${escaparHTML(
                      filtro.valor ||
                        "Todos"
                    )}
                  </strong>
                </div>
              `
            )
            .join("")
        : `
            <div class="filtro">
              <span>
                Filtros
              </span>

              <strong>
                Todos los registros
              </strong>
            </div>
          `;

    /* =====================================================
       RESUMEN
    ===================================================== */

    const resumenHTML =
      resumen.length
        ? resumen
            .map(
              (
                item
              ) => {
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
                }

                if (
                  item.tipo ===
                  "numero"
                ) {
                  valor =
                    formatearNumero(
                      valor
                    );
                }

                let clase =
                  "resumen-card";

                if (
                  item.color ===
                  "rojo"
                ) {
                  clase +=
                    " resumen-rojo";
                }

                if (
                  item.color ===
                  "dorado"
                ) {
                  clase +=
                    " resumen-dorado";
                }

                if (
                  item.color ===
                  "azul"
                ) {
                  clase +=
                    " resumen-azul";
                }

                return `
                  <article class="${clase}">
                    <span>
                      ${escaparHTML(
                        item.label ||
                          item.titulo ||
                          "Indicador"
                      )}
                    </span>

                    <strong>
                      ${escaparHTML(
                        valor
                      )}
                    </strong>

                    ${
                      item.detalle
                        ? `
                          <small>
                            ${escaparHTML(
                              item.detalle
                            )}
                          </small>
                        `
                        : ""
                    }
                  </article>
                `;
              }
            )
            .join("")
        : "";

    /* =====================================================
       ENCABEZADOS TABLA
    ===================================================== */

    const encabezadosHTML =
      columnasNormalizadas
        .map(
          (
            columna
          ) => `
            <th>
              ${escaparHTML(
                columna.titulo
              )}
            </th>
          `
        )
        .join("");

    /* =====================================================
       FILAS TABLA
    ===================================================== */

    const filasHTML =
      filas.length
        ? filas
            .map(
              (
                fila
              ) => {
                const celdas =
                  columnasNormalizadas
                    .map(
                      (
                        columna,
                        indice
                      ) => {
                        const valor =
                          obtenerValorFila(
                            fila,
                            columna,
                            indice
                          );

                        const visible =
                          formatearValor(
                            valor,
                            columna.tipo
                          );

                        const clase =
                          obtenerClaseCelda(
                            valor,
                            columna.tipo
                          );

                        return `
                          <td class="${clase}">
                            ${escaparHTML(
                              visible
                            )}
                          </td>
                        `;
                      }
                    )
                    .join("");

                return `
                  <tr>
                    ${celdas}
                  </tr>
                `;
              }
            )
            .join("")
        : `
            <tr>
              <td
                colspan="${Math.max(
                  columnasNormalizadas.length,
                  1
                )}"
                class="sin-registros"
              >
                No hay registros para mostrar.
              </td>
            </tr>
          `;

    /* =====================================================
       DOCUMENTO HTML
    ===================================================== */

    const html = `
      <!DOCTYPE html>
      <html lang="es">

      <head>

        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <title>
          ${escaparHTML(
            titulo
          )}
        </title>

        <style>

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 24px;

            background: #f3f0e8;

            color: #25352b;

            font-family:
              Arial,
              Helvetica,
              sans-serif;
          }

          .acciones {
            display: flex;
            justify-content: flex-end;
            gap: 8px;

            max-width: 1500px;

            margin:
              0
              auto
              14px;
          }

          .acciones button {
            min-height: 38px;

            padding:
              0
              14px;

            border: none;
            border-radius: 9px;

            background: #173f2e;

            color: #ffffff;

            font-size: 12px;
            font-weight: 700;

            cursor: pointer;
          }

          .reporte {
            width: 100%;
            max-width: 1500px;

            margin: 0 auto;

            overflow: hidden;

            background: #ffffff;

            border-radius: 16px;

            box-shadow:
              0
              14px
              34px
              rgba(
                23,
                63,
                46,
                0.08
              );
          }

          .encabezado {
            padding: 24px 26px;

            border-bottom:
              4px
              solid
              #d9aa58;

            background: #173f2e;

            color: #ffffff;
          }

          .encabezado-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 20px;
          }

          .empresa {
            margin: 0;

            color: #ffffff;

            font-size: 22px;
            font-weight: 800;
          }

          .empresa-sub {
            display: block;

            margin-top: 5px;

            color:
              rgba(
                255,
                255,
                255,
                0.66
              );

            font-size: 11px;
          }

          .titulo {
            text-align: right;
          }

          .titulo h1 {
            margin: 0;

            color: #e3c47d;

            font-size: 20px;
          }

          .titulo p {
            margin:
              5px
              0
              0;

            color:
              rgba(
                255,
                255,
                255,
                0.7
              );

            font-size: 11px;
          }

          .contenido {
            padding: 22px;
          }

          .seccion-titulo {
            margin:
              0
              0
              10px;

            color: #173f2e;

            font-size: 13px;
            font-weight: 800;

            text-transform: uppercase;

            letter-spacing: 0.05em;
          }

          .filtros {
            display: grid;

            grid-template-columns:
              repeat(
                4,
                minmax(
                  0,
                  1fr
                )
              );

            gap: 8px;

            margin-bottom: 20px;
          }

          .filtro {
            padding: 10px;

            border: 1px solid #e2dccf;
            border-radius: 9px;

            background: #faf8f2;
          }

          .filtro span {
            display: block;

            margin-bottom: 4px;

            color: #7a837d;

            font-size: 9px;
            font-weight: 700;

            text-transform: uppercase;
          }

          .filtro strong {
            color: #314139;

            font-size: 11px;
          }

          .resumen {
            display: grid;

            grid-template-columns:
              repeat(
                4,
                minmax(
                  0,
                  1fr
                )
              );

            gap: 9px;

            margin-bottom: 22px;
          }

          .resumen-card {
            min-width: 0;

            padding: 13px;

            border-radius: 10px;

            background: #e7f2ea;

            border: 1px solid #cce0d2;
          }

          .resumen-card span {
            display: block;

            margin-bottom: 5px;

            color: #6a756e;

            font-size: 9px;
          }

          .resumen-card strong {
            display: block;

            color: #2f6b4a;

            font-size: 15px;

            overflow-wrap: anywhere;
          }

          .resumen-card small {
            display: block;

            margin-top: 5px;

            color: #78817b;

            font-size: 8px;
          }

          .resumen-dorado {
            background: #f5edd8;
            border-color: #e3d2a7;
          }

          .resumen-dorado strong {
            color: #8a6827;
          }

          .resumen-rojo {
            background: #f9e7e4;
            border-color: #e9c5bf;
          }

          .resumen-rojo strong {
            color: #a33f35;
          }

          .resumen-azul {
            background: #e8f1f5;
            border-color: #cbdde5;
          }

          .resumen-azul strong {
            color: #426b82;
          }

          .tabla-wrapper {
            width: 100%;

            overflow-x: auto;

            border: 1px solid #e4dfd5;
            border-radius: 10px;
          }

          table {
            width: 100%;
            min-width: 1000px;

            border-collapse: collapse;
          }

          thead {
            background: #173f2e;
          }

          th {
            padding: 10px 8px;

            border-right:
              1px
              solid
              rgba(
                255,
                255,
                255,
                0.12
              );

            color: #ffffff;

            font-size: 9px;
            font-weight: 800;

            text-align: left;

            text-transform: uppercase;

            white-space: nowrap;
          }

          td {
            padding: 9px 8px;

            border-bottom: 1px solid #ece8df;

            color: #36433b;

            font-size: 9px;

            vertical-align: middle;
          }

          tbody tr:nth-child(even) td {
            background: #fbfaf6;
          }

          tbody tr:hover td {
            background: #f6f2e8;
          }

          .valor-moneda {
            color: #2f6b4a;

            font-weight: 800;

            white-space: nowrap;
          }

          .valor-pagado {
            background: #e7f2ea !important;

            color: #2f6b4a;

            font-weight: 800;

            white-space: nowrap;
          }

          .valor-pendiente {
            background: #f5edd8 !important;

            color: #8a6827;

            font-weight: 800;

            white-space: nowrap;
          }

          .valor-vencido {
            background: #f9e7e4 !important;

            color: #a33f35;

            font-weight: 800;

            white-space: nowrap;
          }

          .estado {
            font-weight: 800;

            text-align: center;

            white-space: nowrap;
          }

          .estado-verde {
            background: #e7f2ea !important;

            color: #2f6b4a;
          }

          .estado-dorado {
            background: #f5edd8 !important;

            color: #8a6827;
          }

          .estado-rojo {
            background: #f9e7e4 !important;

            color: #a33f35;
          }

          .sin-registros {
            height: 160px;

            color: #7c857f;

            text-align: center;
          }

          .pie {
            display: flex;
            justify-content: space-between;
            gap: 15px;

            padding: 13px 22px;

            border-top: 1px solid #e5e0d7;

            background: #faf8f2;

            color: #7d857f;

            font-size: 9px;
          }

          @media
          (
            max-width:
              900px
          ) {

            .filtros,
            .resumen {
              grid-template-columns:
                repeat(
                  2,
                  minmax(
                    0,
                    1fr
                  )
                );
            }

            .encabezado-top {
              flex-direction: column;
            }

            .titulo {
              text-align: left;
            }

          }

          @media print {

            @page {
              size: A4 landscape;

              margin: 7mm;
            }

            body {
              padding: 0;

              background: #ffffff;

              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .acciones {
              display: none;
            }

            .reporte {
              max-width: none;

              border-radius: 0;

              box-shadow: none;
            }

            .contenido {
              padding: 10px 0;
            }

            .encabezado {
              padding: 15px;
            }

            .filtros {
              grid-template-columns:
                repeat(
                  4,
                  minmax(
                    0,
                    1fr
                  )
                );
            }

            .resumen {
              grid-template-columns:
                repeat(
                  4,
                  minmax(
                    0,
                    1fr
                  )
                );
            }

            .tabla-wrapper {
              overflow: visible;

              border-radius: 0;
            }

            table {
              min-width: 0;

              table-layout: fixed;
            }

            thead {
              display: table-header-group;
            }

            tr {
              break-inside: avoid;
              page-break-inside: avoid;
            }

            th {
              padding: 5px 3px;

              font-size: 6px;
            }

            td {
              padding: 5px 3px;

              font-size: 6px;

              overflow-wrap: anywhere;
            }

          }

        </style>

      </head>

      <body>

        <div class="acciones">

          <button
            type="button"
            onclick="window.print()"
          >
            Imprimir
          </button>

        </div>

        <main class="reporte">

          <header class="encabezado">

            <div class="encabezado-top">

              <div>

                <h2 class="empresa">
                  LOTES VILLA MARÍA
                </h2>

                <span class="empresa-sub">
                  Sistema administrativo y financiero
                </span>

              </div>

              <div class="titulo">

                <h1>
                  ${escaparHTML(
                    titulo
                  )}
                </h1>

                ${
                  subtitulo
                    ? `
                      <p>
                        ${escaparHTML(
                          subtitulo
                        )}
                      </p>
                    `
                    : ""
                }

              </div>

            </div>

          </header>

          <section class="contenido">

            <h3 class="seccion-titulo">
              Filtros aplicados
            </h3>

            <div class="filtros">
              ${filtrosHTML}
            </div>

            ${
              resumen.length
                ? `
                  <h3 class="seccion-titulo">
                    Resumen
                  </h3>

                  <div class="resumen">
                    ${resumenHTML}
                  </div>
                `
                : ""
            }

            <h3 class="seccion-titulo">
              Detalle del informe
            </h3>

            <div class="tabla-wrapper">

              <table>

                <thead>

                  <tr>
                    ${encabezadosHTML}
                  </tr>

                </thead>

                <tbody>
                  ${filasHTML}
                </tbody>

              </table>

            </div>

          </section>

          <footer class="pie">

            <span>
              Lotes Villa María
            </span>

            <span>
              Registros:
              ${filas.length}
            </span>

            <span>
              Generado:
              ${escaparHTML(
                new Date().toLocaleString(
                  "es-CO"
                )
              )}
            </span>

          </footer>

        </main>

      </body>

      </html>
    `;

    /* =====================================================
       DESCARGAR .HTML
    ===================================================== */

    if (
      descargar
    ) {
      descargarHTML(
        html,
        crearNombreArchivo(
          nombreArchivo ||
            titulo,
          "html"
        )
      );

      return true;
    }

    /* =====================================================
       ABRIR EN NUEVA PESTAÑA
    ===================================================== */

    const ventana =
      window.open(
        "",
        "_blank"
      );

    if (
      !ventana
    ) {
      return false;
    }

    ventana.document.open();

    ventana.document.write(
      html
    );

    ventana.document.close();

    return true;
  } catch (error) {
    console.error(
      "Error exportando HTML:",
      error
    );

    return false;
  }
};

export default exportarHTML;