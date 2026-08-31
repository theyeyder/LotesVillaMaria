import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  Building2,
  ChevronRight,
  Edit3,
  LandPlot,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import "./Lotes.css";

import Toast from "../../components/ui/Toast";

import ManzanaModal from "./ManzanaModal";
import LoteModal from "./LoteModal";

import {
  obtenerManzanas,
  crearManzana,
  actualizarManzana,
  eliminarManzana,
} from "../../services/manzana.service";

import {
  obtenerLotes,
  crearLote,
  actualizarLote,
  eliminarLote,
} from "../../services/lote.service";

import {
  obtenerVentaActivaPorLote,
  eliminarVenta,
} from "../../services/venta.service";

/* =========================================================
   FORMATEADORES
========================================================= */

const formatearDinero = (
  valor = 0
) => {
  return new Intl.NumberFormat(
    "es-CO",
    {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }
  ).format(
    Number(valor) || 0
  );
};

const formatearArea = (
  valor = 0
) => {
  return Number(
    valor || 0
  ).toLocaleString(
    "es-CO",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
};

/* =========================================================
   FORMATEAR MEDIDAS
========================================================= */

const formatearMedida = (
  metros = 0,
  centimetros = 0
) => {
  const m =
    Number(metros) || 0;

  const cm =
    Number(centimetros) || 0;

  if (
    m === 0 &&
    cm === 0
  ) {
    return "—";
  }

  if (
    cm === 0
  ) {
    return `${m} m`;
  }

  return `${m} m ${cm} cm`;
};

/* =========================================================
   ESCAPAR TEXTO PARA IMPRESIÓN
========================================================= */

const escaparHTML = (
  valor = ""
) => {
  return String(valor)
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
};

/* =========================================================
   NOMBRE DEL CLIENTE
========================================================= */

const obtenerNombreVentaCliente = (
  cliente
) => {
  if (!cliente) {
    return "Cliente";
  }

  return (
    [
      cliente.nombres,
      cliente.apellidos,
    ]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    cliente.nombre ||
    cliente.razonSocial ||
    "Cliente"
  );
};

/* =========================================================
   COMPONENTE
========================================================= */

export default function Lotes() {
  /* =======================================================
     DATOS
  ======================================================= */

  const [
    manzanas,
    setManzanas,
  ] = useState([]);

  const [
    lotes,
    setLotes,
  ] = useState([]);

  /* =======================================================
     CARGA
  ======================================================= */

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    guardandoManzana,
    setGuardandoManzana,
  ] = useState(false);

  const [
    guardandoLote,
    setGuardandoLote,
  ] = useState(false);

  /* =======================================================
     SELECCIÓN
  ======================================================= */

  const [
    manzanaSeleccionada,
    setManzanaSeleccionada,
  ] = useState("");

  /* =======================================================
     FILTROS
  ======================================================= */

  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  const [
    filtroEstado,
    setFiltroEstado,
  ] = useState("");

  /* =======================================================
     MODAL MANZANA
  ======================================================= */

  const [
    modalManzanaAbierto,
    setModalManzanaAbierto,
  ] = useState(false);

  const [
    manzanaEditar,
    setManzanaEditar,
  ] = useState(null);

  /* =======================================================
     MODAL LOTE
  ======================================================= */

  const [
    modalLoteAbierto,
    setModalLoteAbierto,
  ] = useState(false);

  const [
    loteEditar,
    setLoteEditar,
  ] = useState(null);

  /* =======================================================
     ELIMINAR VENTA PARA EDITAR LOTE VENDIDO
  ======================================================= */

  const [
    modalEliminarVentaAbierto,
    setModalEliminarVentaAbierto,
  ] = useState(false);

  const [
    ventaParaEliminar,
    setVentaParaEliminar,
  ] = useState(null);

  const [
    lotePendienteEditar,
    setLotePendienteEditar,
  ] = useState(null);

  const [
    procesandoEliminacion,
    setProcesandoEliminacion,
  ] = useState(false);

  /* =======================================================
     NOTIFICACIÓN
  ======================================================= */

  const [
    notificacion,
    setNotificacion,
  ] = useState({
    visible: false,
    mensaje: "",
    tipo: "success",
  });

  const mostrarNotificacion = (
    mensaje,
    tipo = "success"
  ) => {
    setNotificacion({
      visible: true,
      mensaje,
      tipo,
    });
  };

  const cerrarNotificacion =
    () => {
      setNotificacion(
        (prev) => ({
          ...prev,
          visible: false,
        })
      );
    };

  /* =======================================================
     CARGAR MANZANAS
  ======================================================= */

  const cargarManzanas =
    async () => {
      try {
        const datos =
          await obtenerManzanas();

        setManzanas(
          Array.isArray(datos)
            ? datos
            : []
        );
      } catch (error) {
        console.error(
          "Error cargando manzanas:",
          error
        );

        mostrarNotificacion(
          error?.response?.data
            ?.message ||
            "No fue posible cargar las manzanas.",
          "error"
        );
      }
    };

  /* =======================================================
     CARGAR LOTES
  ======================================================= */

  const cargarLotes =
    async () => {
      try {
        setCargando(
          true
        );

        const datos =
          await obtenerLotes();

        const lista =
          Array.isArray(datos)
            ? datos
            : [];

        setLotes(
          lista
        );

        return lista;
      } catch (error) {
        console.error(
          "Error cargando lotes:",
          error
        );

        mostrarNotificacion(
          error?.response?.data
            ?.message ||
            "No fue posible cargar los lotes.",
          "error"
        );

        return [];
      } finally {
        setCargando(
          false
        );
      }
    };

  /* =======================================================
     CARGA INICIAL
  ======================================================= */

  useEffect(() => {
    const cargarTodo =
      async () => {
        await Promise.all([
          cargarManzanas(),
          cargarLotes(),
        ]);
      };

    cargarTodo();
  }, []);

  /* =======================================================
     SELECCIONAR PRIMERA MANZANA
  ======================================================= */

  useEffect(() => {
    if (
      !manzanaSeleccionada &&
      manzanas.length > 0
    ) {
      setManzanaSeleccionada(
        manzanas[0]._id
      );
    }
  }, [
    manzanas,
    manzanaSeleccionada,
  ]);

  /* =======================================================
     MANZANA ACTUAL
  ======================================================= */

  const manzanaActual =
    useMemo(() => {
      return manzanas.find(
        (manzana) =>
          manzana._id ===
          manzanaSeleccionada
      );
    }, [
      manzanas,
      manzanaSeleccionada,
    ]);

  /* =======================================================
     LOTES POR MANZANA
  ======================================================= */

  const lotesManzana =
    useMemo(() => {
      if (
        !manzanaSeleccionada
      ) {
        return [];
      }

      return lotes.filter(
        (lote) => {
          const idManzana =
            lote.manzana?._id ||
            lote.manzana;

          return (
            idManzana ===
            manzanaSeleccionada
          );
        }
      );
    }, [
      lotes,
      manzanaSeleccionada,
    ]);

  /* =======================================================
     FILTRAR LOTES
  ======================================================= */

  const lotesFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      return lotesManzana.filter(
        (lote) => {
          const cumpleEstado =
            !filtroEstado ||
            lote.estado ===
              filtroEstado;

          if (
            !cumpleEstado
          ) {
            return false;
          }

          if (
            !texto
          ) {
            return true;
          }

          const datos = [
            lote.codigo,
            lote.numeroLote,
            lote.estado,
            lote.observaciones,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return datos.includes(
            texto
          );
        }
      );
    }, [
      lotesManzana,
      busqueda,
      filtroEstado,
    ]);

  /* =======================================================
     ESTADÍSTICAS
  ======================================================= */

  const estadisticas =
    useMemo(() => {
      return lotesManzana.reduce(
        (
          acc,
          lote
        ) => {
          acc.total += 1;

          acc.valorTotal +=
            Number(
              lote.valorLote
            ) || 0;

          acc.areaTotal +=
            Number(
              lote.areaM2
            ) || 0;

          if (
            lote.estado ===
            "Disponible"
          ) {
            acc.disponibles += 1;
          }

          if (
            lote.estado ===
            "Reservado"
          ) {
            acc.reservados += 1;
          }

          if (
            lote.estado ===
            "Vendido"
          ) {
            acc.vendidos += 1;
          }

          return acc;
        },
        {
          total: 0,
          disponibles: 0,
          reservados: 0,
          vendidos: 0,
          valorTotal: 0,
          areaTotal: 0,
        }
      );
    }, [
      lotesManzana,
    ]);

  /* =======================================================
     CANTIDAD DE LOTES POR MANZANA
  ======================================================= */

  const contarLotesManzana =
    (manzanaId) => {
      return lotes.filter(
        (lote) => {
          const id =
            lote.manzana?._id ||
            lote.manzana;

          return (
            id ===
            manzanaId
          );
        }
      ).length;
    };

  /* =======================================================
     ABRIR VENTANA DE IMPRESIÓN
  ======================================================= */

  const abrirVentanaImpresion =
    (
      titulo,
      contenido
    ) => {
      const ventana =
        window.open(
          "",
          "_blank",
          "width=1150,height=850"
        );

      if (
        !ventana
      ) {
        mostrarNotificacion(
          "El navegador bloqueó la ventana de impresión. Permita las ventanas emergentes.",
          "error"
        );

        return;
      }

      ventana.document.write(`
        <!DOCTYPE html>

        <html lang="es">
          <head>
            <meta charset="UTF-8" />

            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0"
            />

            <title>
              ${escaparHTML(titulo)}
            </title>

            <style>
              * {
                box-sizing: border-box;
              }

              body {
                margin: 0;
                padding: 28px;

                background: #f1eee6;

                color: #27352e;

                font-family:
                  Arial,
                  Helvetica,
                  sans-serif;
              }

              .acciones {
                display: flex;
                justify-content: flex-end;
                gap: 10px;

                max-width: 1100px;

                margin: 0 auto 15px;
              }

              .acciones button {
                min-height: 40px;

                padding: 0 17px;

                border-radius: 9px;

                font-size: 12px;
                font-weight: 800;

                cursor: pointer;
              }

              .cerrar {
                border: 1px solid #d4d0c7;

                background: #ffffff;

                color: #59635d;
              }

              .imprimir {
                border: 1px solid #173f2e;

                background: #173f2e;

                color: #ffffff;
              }

              .reporte {
                width: 100%;
                max-width: 1100px;

                margin: 0 auto;

                padding: 32px;

                border: 1px solid #ded9d0;
                border-radius: 14px;

                background: #ffffff;

                box-shadow:
                  0 10px 30px
                  rgba(23, 63, 46, 0.08);
              }

              .reporte-header {
                margin-bottom: 24px;
                padding-bottom: 16px;

                border-bottom: 3px solid #173f2e;

                text-align: center;
              }

              .reporte-header h1 {
                margin: 0;

                color: #173f2e;

                font-size: 25px;
                font-weight: 900;
              }

              .reporte-header h2 {
                margin: 5px 0 0;

                color: #9a712d;

                font-size: 15px;
              }

              .datos {
                display: grid;

                grid-template-columns:
                  repeat(4, minmax(0, 1fr));

                gap: 9px;

                margin-bottom: 22px;
              }

              .dato {
                display: flex;
                flex-direction: column;
                gap: 4px;

                padding: 10px 11px;

                border: 1px solid #dfd9ce;
                border-radius: 9px;

                background: #faf8f3;
              }

              .dato span {
                color: #828a85;

                font-size: 9px;
                font-weight: 800;

                text-transform: uppercase;
              }

              .dato strong {
                color: #173f2e;

                font-size: 12px;
              }

              h3 {
                margin: 0 0 10px;

                padding-left: 9px;

                border-left: 4px solid #c99a4b;

                color: #173f2e;

                font-size: 14px;
              }

              table {
                width: 100%;

                border-collapse: collapse;

                margin-top: 10px;
              }

              th {
                padding: 9px 7px;

                border: 1px solid #d8d8d8;

                background: #173f2e;

                color: #ffffff;

                font-size: 9px;
                font-weight: 900;

                text-align: center;

                text-transform: uppercase;
              }

              td {
                padding: 9px 7px;

                border: 1px solid #dedede;

                color: #3a463f;

                font-size: 10px;

                text-align: center;

                vertical-align: middle;
              }

              tbody tr:nth-child(even) {
                background: #faf8f3;
              }

              td:first-child {
                text-align: left;
              }

              .estado {
                font-weight: 900;
              }

              .valor {
                color: #8b6527;

                font-weight: 900;

                white-space: nowrap;
              }

              .area {
                color: #173f2e;

                font-weight: 900;

                white-space: nowrap;
              }

              .observacion {
                max-width: 190px;

                text-align: left;
              }

              .lote-unico {
                display: grid;

                grid-template-columns:
                  repeat(2, minmax(0, 1fr));

                gap: 10px;
              }

              .lote-unico .dato {
                min-height: 65px;
              }

              .nota-irregular {
                grid-column: 1 / -1;

                padding: 11px 13px;

                border: 1px solid #ddc796;
                border-radius: 9px;

                background: #fff8e9;

                color: #76664c;

                font-size: 10px;
                line-height: 1.45;
              }

              @media print {
                @page {
                  size: A4 landscape;
                  margin: 10mm;
                }

                body {
                  padding: 0;

                  background: #ffffff;
                }

                .acciones {
                  display: none;
                }

                .reporte {
                  max-width: none;

                  padding: 0;

                  border: none;
                  border-radius: 0;

                  box-shadow: none;
                }

                .reporte-header {
                  border-bottom:
                    2px solid #000000;
                }

                .reporte-header h1,
                .reporte-header h2,
                .dato strong,
                h3,
                td {
                  color: #000000;
                }

                th {
                  border: 1px solid #777;

                  background: #eeeeee !important;

                  color: #000000;

                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }

                td {
                  border: 1px solid #999;
                }

                tr {
                  break-inside: avoid;
                  page-break-inside: avoid;
                }
              }

              @media (max-width: 700px) {
                .datos,
                .lote-unico {
                  grid-template-columns: 1fr;
                }

                .reporte {
                  padding: 20px;
                }
              }
            </style>
          </head>

          <body>

            <div class="acciones">

              <button
                type="button"
                class="cerrar"
                onclick="window.close()"
              >
                Cerrar
              </button>

              <button
                type="button"
                class="imprimir"
                onclick="window.print()"
              >
                Imprimir
              </button>

            </div>

            <main class="reporte">

              ${contenido}

            </main>

          </body>
        </html>
      `);

      ventana.document.close();

      ventana.focus();
    };

  /* =======================================================
     IMPRIMIR MANZANA COMPLETA

     Incluye TODOS los lotes de esa manzana.
     No depende del filtro de pantalla.
  ======================================================= */

  const imprimirManzana =
    (
      manzana,
      event
    ) => {
      event?.stopPropagation();

      const lotesDeLaManzana =
        lotes.filter(
          (
            lote
          ) => {
            const idManzana =
              lote.manzana?._id ||
              lote.manzana;

            return (
              idManzana ===
              manzana._id
            );
          }
        );

      const areaTotal =
        lotesDeLaManzana.reduce(
          (
            total,
            lote
          ) =>
            total +
            (
              Number(
                lote.areaM2
              ) || 0
            ),
          0
        );

      const valorTotal =
        lotesDeLaManzana.reduce(
          (
            total,
            lote
          ) =>
            total +
            (
              Number(
                lote.valorLote
              ) || 0
            ),
          0
        );

      const disponibles =
        lotesDeLaManzana.filter(
          (
            lote
          ) =>
            lote.estado ===
            "Disponible"
        ).length;

      const vendidos =
        lotesDeLaManzana.filter(
          (
            lote
          ) =>
            lote.estado ===
            "Vendido"
        ).length;

      const filas =
        lotesDeLaManzana.length >
        0
          ? lotesDeLaManzana
              .map(
                (
                  lote
                ) => {
                  const tipo =
                    lote.tipoLote ||
                    (
                      (
                        Number(
                          lote.frenteMetros
                        ) || 0
                      ) >
                        0 &&
                      (
                        Number(
                          lote.fondoMetros
                        ) || 0
                      ) >
                        0
                        ? "Regular"
                        : "Irregular"
                    );

                  return `
                    <tr>
                      <td>
                        <strong>
                          ${escaparHTML(
                            lote.codigo ||
                            ""
                          )}
                        </strong>

                        <br />

                        Lote ${escaparHTML(
                          lote.numeroLote ||
                          ""
                        )}
                      </td>

                      <td>
                        ${escaparHTML(
                          tipo
                        )}
                      </td>

                      <td>
                        ${escaparHTML(
                          formatearMedida(
                            lote.frenteMetros,
                            lote.frenteCentimetros
                          )
                        )}
                      </td>

                      <td>
                        ${escaparHTML(
                          formatearMedida(
                            lote.fondoMetros,
                            lote.fondoCentimetros
                          )
                        )}
                      </td>

                      <td class="area">
                        ${escaparHTML(
                          formatearArea(
                            lote.areaM2
                          )
                        )} m²
                      </td>

                      <td class="valor">
                        ${escaparHTML(
                          formatearDinero(
                            lote.valorLote
                          )
                        )}
                      </td>

                      <td class="estado">
                        ${escaparHTML(
                          lote.estado ||
                          "—"
                        )}
                      </td>

                      <td class="observacion">
                        ${escaparHTML(
                          lote.observaciones ||
                          "—"
                        )}
                      </td>
                    </tr>
                  `;
                }
              )
              .join("")
          : `
              <tr>
                <td
                  colspan="8"
                  style="text-align:center;padding:25px;"
                >
                  Esta manzana todavía no tiene lotes registrados.
                </td>
              </tr>
            `;

      const contenido = `
        <div class="reporte-header">

          <h1>
            LOTES VILLA MARÍA
          </h1>

          <h2>
            Reporte de manzana y lotes
          </h2>

        </div>

        <div class="datos">

          <div class="dato">
            <span>
              Código
            </span>

            <strong>
              ${escaparHTML(
                manzana.codigo ||
                "—"
              )}
            </strong>
          </div>

          <div class="dato">
            <span>
              Manzana
            </span>

            <strong>
              ${escaparHTML(
                manzana.nombre ||
                "—"
              )}
            </strong>
          </div>

          <div class="dato">
            <span>
              Estado
            </span>

            <strong>
              ${escaparHTML(
                manzana.estado ||
                "—"
              )}
            </strong>
          </div>

          <div class="dato">
            <span>
              Total lotes
            </span>

            <strong>
              ${lotesDeLaManzana.length}
            </strong>
          </div>

          <div class="dato">
            <span>
              Disponibles
            </span>

            <strong>
              ${disponibles}
            </strong>
          </div>

          <div class="dato">
            <span>
              Vendidos
            </span>

            <strong>
              ${vendidos}
            </strong>
          </div>

          <div class="dato">
            <span>
              Área total lotes
            </span>

            <strong>
              ${escaparHTML(
                formatearArea(
                  areaTotal
                )
              )} m²
            </strong>
          </div>

          <div class="dato">
            <span>
              Valor total
            </span>

            <strong>
              ${escaparHTML(
                formatearDinero(
                  valorTotal
                )
              )}
            </strong>
          </div>

        </div>

        ${
          manzana.descripcion
            ? `
                <div
                  class="dato"
                  style="margin-bottom:20px;"
                >
                  <span>
                    Descripción
                  </span>

                  <strong>
                    ${escaparHTML(
                      manzana.descripcion
                    )}
                  </strong>
                </div>
              `
            : ""
        }

        <h3>
          Lotes de la manzana
        </h3>

        <table>

          <thead>
            <tr>
              <th>
                Lote
              </th>

              <th>
                Tipo
              </th>

              <th>
                Frente
              </th>

              <th>
                Fondo
              </th>

              <th>
                Área
              </th>

              <th>
                Valor
              </th>

              <th>
                Estado
              </th>

              <th>
                Observación
              </th>
            </tr>
          </thead>

          <tbody>
            ${filas}
          </tbody>

        </table>
      `;

      abrirVentanaImpresion(
        `Manzana ${manzana.nombre}`,
        contenido
      );
    };

  /* =======================================================
     IMPRIMIR UN SOLO LOTE
  ======================================================= */

  const imprimirLote =
    (
      lote
    ) => {
      const manzana =
        manzanas.find(
          (
            item
          ) =>
            item._id ===
            (
              lote.manzana?._id ||
              lote.manzana
            )
        ) ||
        lote.manzana ||
        manzanaActual;

      const tipo =
        lote.tipoLote ||
        (
          (
            Number(
              lote.frenteMetros
            ) || 0
          ) >
            0 &&
          (
            Number(
              lote.fondoMetros
            ) || 0
          ) >
            0
            ? "Regular"
            : "Irregular"
        );

      const frente =
        formatearMedida(
          lote.frenteMetros,
          lote.frenteCentimetros
        );

      const fondo =
        formatearMedida(
          lote.fondoMetros,
          lote.fondoCentimetros
        );

      const contenido = `
        <div class="reporte-header">

          <h1>
            LOTES VILLA MARÍA
          </h1>

          <h2>
            Ficha individual del lote
          </h2>

        </div>

        <h3>
          Información del lote
        </h3>

        <div class="lote-unico">

          <div class="dato">
            <span>
              Código
            </span>

            <strong>
              ${escaparHTML(
                lote.codigo ||
                "—"
              )}
            </strong>
          </div>

          <div class="dato">
            <span>
              Número de lote
            </span>

            <strong>
              ${escaparHTML(
                lote.numeroLote ||
                "—"
              )}
            </strong>
          </div>

          <div class="dato">
            <span>
              Manzana
            </span>

            <strong>
              ${escaparHTML(
                manzana?.nombre ||
                "—"
              )}
            </strong>
          </div>

          <div class="dato">
            <span>
              Código manzana
            </span>

            <strong>
              ${escaparHTML(
                manzana?.codigo ||
                "—"
              )}
            </strong>
          </div>

          <div class="dato">
            <span>
              Tipo de lote
            </span>

            <strong>
              ${escaparHTML(
                tipo
              )}
            </strong>
          </div>

          <div class="dato">
            <span>
              Estado
            </span>

            <strong>
              ${escaparHTML(
                lote.estado ||
                "—"
              )}
            </strong>
          </div>

          <div class="dato">
            <span>
              Frente
            </span>

            <strong>
              ${escaparHTML(
                frente
              )}
            </strong>
          </div>

          <div class="dato">
            <span>
              Fondo
            </span>

            <strong>
              ${escaparHTML(
                fondo
              )}
            </strong>
          </div>

          <div class="dato">
            <span>
              Área total
            </span>

            <strong>
              ${escaparHTML(
                formatearArea(
                  lote.areaM2
                )
              )} m²
            </strong>
          </div>

          <div class="dato">
            <span>
              Valor general
            </span>

            <strong>
              ${escaparHTML(
                formatearDinero(
                  lote.valorLote
                )
              )}
            </strong>
          </div>

          <div class="dato">
            <span>
              Observaciones
            </span>

            <strong>
              ${escaparHTML(
                lote.observaciones ||
                "Sin observaciones"
              )}
            </strong>
          </div>

          ${
            tipo ===
            "Irregular"
              ? `
                  <div class="nota-irregular">
                    <strong>
                      Lote irregular:
                    </strong>

                    este lote se registra y se vende por su
                    área total de
                    ${escaparHTML(
                      formatearArea(
                        lote.areaM2
                      )
                    )} m².
                    Las medidas de frente y fondo, cuando
                    existen, son únicamente de referencia.
                  </div>
                `
              : ""
          }

        </div>
      `;

      abrirVentanaImpresion(
        `Lote ${lote.codigo}`,
        contenido
      );
    };

  /* =======================================================
     NUEVA MANZANA
  ======================================================= */

  const abrirNuevaManzana =
    () => {
      setManzanaEditar(
        null
      );

      setModalManzanaAbierto(
        true
      );
    };

  /* =======================================================
     EDITAR MANZANA
  ======================================================= */

  const abrirEditarManzana =
    (
      manzana,
      event
    ) => {
      event?.stopPropagation();

      setManzanaEditar(
        manzana
      );

      setModalManzanaAbierto(
        true
      );
    };

  /* =======================================================
     CERRAR MODAL MANZANA
  ======================================================= */

  const cerrarModalManzana =
    () => {
      if (
        guardandoManzana
      ) {
        return;
      }

      setModalManzanaAbierto(
        false
      );

      setManzanaEditar(
        null
      );
    };

  /* =======================================================
     GUARDAR MANZANA
  ======================================================= */

  const guardarManzana =
    async (
      datos
    ) => {
      try {
        setGuardandoManzana(
          true
        );

        let respuesta;

        const esEdicion =
          Boolean(
            manzanaEditar?._id
          );

        if (
          esEdicion
        ) {
          respuesta =
            await actualizarManzana(
              manzanaEditar._id,
              datos
            );
        } else {
          respuesta =
            await crearManzana(
              datos
            );
        }

        await cargarManzanas();

        setModalManzanaAbierto(
          false
        );

        setManzanaEditar(
          null
        );

        if (
          respuesta?.manzana?._id
        ) {
          setManzanaSeleccionada(
            respuesta.manzana._id
          );
        }

        mostrarNotificacion(
          respuesta?.message ||
            (
              esEdicion
                ? "Manzana actualizada correctamente"
                : "Manzana creada correctamente"
            )
        );
      } catch (error) {
        console.error(
          "Error guardando manzana:",
          error
        );

        mostrarNotificacion(
          error?.response?.data
            ?.message ||
            "No fue posible guardar la manzana.",
          "error"
        );
      } finally {
        setGuardandoManzana(
          false
        );
      }
    };

  /* =======================================================
     ELIMINAR MANZANA
  ======================================================= */

  const handleEliminarManzana =
    async (
      manzana,
      event
    ) => {
      event?.stopPropagation();

      const cantidad =
        contarLotesManzana(
          manzana._id
        );

      if (
        cantidad > 0
      ) {
        mostrarNotificacion(
          `No se puede eliminar ${manzana.nombre} porque contiene ${cantidad} lote${cantidad === 1 ? "" : "s"}.`,
          "error"
        );

        return;
      }

      const confirmar =
        window.confirm(
          `¿Está seguro de eliminar ${manzana.nombre}?`
        );

      if (
        !confirmar
      ) {
        return;
      }

      try {
        const respuesta =
          await eliminarManzana(
            manzana._id
          );

        if (
          manzanaSeleccionada ===
          manzana._id
        ) {
          setManzanaSeleccionada(
            ""
          );
        }

        await cargarManzanas();

        mostrarNotificacion(
          respuesta?.message ||
            "Manzana eliminada correctamente"
        );
      } catch (error) {
        console.error(
          "Error eliminando manzana:",
          error
        );

        mostrarNotificacion(
          error?.response?.data
            ?.message ||
            "No fue posible eliminar la manzana.",
          "error"
        );
      }
    };

  /* =======================================================
     NUEVO LOTE
  ======================================================= */

  const abrirNuevoLote =
    () => {
      if (
        !manzanaSeleccionada
      ) {
        mostrarNotificacion(
          "Primero debe seleccionar una manzana.",
          "info"
        );

        return;
      }

      if (
        manzanaActual?.estado !==
        "Activa"
      ) {
        mostrarNotificacion(
          "No puede crear lotes dentro de una manzana inactiva.",
          "error"
        );

        return;
      }

      setLoteEditar(
        null
      );

      setModalLoteAbierto(
        true
      );
    };

  /* =======================================================
     EDITAR LOTE

     Disponible / Reservado:
     → abre edición.

     Vendido:
     → consulta la venta relacionada.
     → pide eliminar la venta antes de editar.
  ======================================================= */

  const abrirEditarLote =
    async (
      lote
    ) => {
      if (
        lote.estado !==
        "Vendido"
      ) {
        setLoteEditar(
          lote
        );

        setModalLoteAbierto(
          true
        );

        return;
      }

      try {
        setProcesandoEliminacion(
          true
        );

        const venta =
          await obtenerVentaActivaPorLote(
            lote._id
          );

        setVentaParaEliminar(
          venta
        );

        setLotePendienteEditar(
          lote
        );

        setModalEliminarVentaAbierto(
          true
        );
      } catch (error) {
        console.error(
          "Error consultando venta del lote:",
          error
        );

        mostrarNotificacion(
          error?.response?.data
            ?.message ||
            "No fue posible consultar la venta asociada a este lote.",
          "error"
        );
      } finally {
        setProcesandoEliminacion(
          false
        );
      }
    };

  /* =======================================================
     CERRAR MODAL ELIMINAR VENTA
  ======================================================= */

  const cerrarModalEliminarVenta =
    () => {
      if (
        procesandoEliminacion
      ) {
        return;
      }

      setModalEliminarVentaAbierto(
        false
      );

      setVentaParaEliminar(
        null
      );

      setLotePendienteEditar(
        null
      );
    };

  /* =======================================================
     ELIMINAR VENTA Y ABRIR EDICIÓN DEL LOTE

     Backend:
     - si existen pagos → bloquea eliminación
     - si no existen pagos:
       * elimina cuotas
       * elimina venta
       * lote vuelve a Disponible
  ======================================================= */

  const confirmarEliminarVentaYEditar =
    async () => {
      if (
        !ventaParaEliminar?._id ||
        !lotePendienteEditar?._id
      ) {
        mostrarNotificacion(
          "No fue posible identificar la venta o el lote.",
          "error"
        );

        return;
      }

      try {
        setProcesandoEliminacion(
          true
        );

        const respuesta =
          await eliminarVenta(
            ventaParaEliminar._id
          );

        /*
          Actualizamos los lotes después de eliminar
          la venta para obtener el estado real del lote.
        */

        const lotesActualizados =
          await cargarLotes();

        const loteActualizado =
          lotesActualizados.find(
            (lote) =>
              lote._id ===
              lotePendienteEditar._id
          );

        /*
          Cerramos confirmación.
        */

        setModalEliminarVentaAbierto(
          false
        );

        setVentaParaEliminar(
          null
        );

        /*
          Abrimos inmediatamente la edición del lote.
        */

        setLoteEditar(
          loteActualizado || {
            ...lotePendienteEditar,
            estado:
              "Disponible",
          }
        );

        setLotePendienteEditar(
          null
        );

        setModalLoteAbierto(
          true
        );

        mostrarNotificacion(
          respuesta?.message ||
            "Venta eliminada. Ya puede editar los datos del lote.",
          "success"
        );
      } catch (error) {
        console.error(
          "Error eliminando venta:",
          error
        );

        /*
          Si existen pagos, aquí llegará el mensaje
          del backend indicando que deben eliminarse primero.
        */

        mostrarNotificacion(
          error?.response?.data
            ?.message ||
            "No fue posible eliminar la venta.",
          "error"
        );
      } finally {
        setProcesandoEliminacion(
          false
        );
      }
    };

  /* =======================================================
     CERRAR MODAL LOTE
  ======================================================= */

  const cerrarModalLote =
    () => {
      if (
        guardandoLote
      ) {
        return;
      }

      setModalLoteAbierto(
        false
      );

      setLoteEditar(
        null
      );
    };

  /* =======================================================
     GUARDAR LOTE
  ======================================================= */

  const guardarLote =
    async (
      datos
    ) => {
      try {
        setGuardandoLote(
          true
        );

        let respuesta;

        const esEdicion =
          Boolean(
            loteEditar?._id
          );

        if (
          esEdicion
        ) {
          respuesta =
            await actualizarLote(
              loteEditar._id,
              datos
            );
        } else {
          respuesta =
            await crearLote(
              datos
            );
        }

        await cargarLotes();

        setModalLoteAbierto(
          false
        );

        setLoteEditar(
          null
        );

        if (
          datos.manzana
        ) {
          setManzanaSeleccionada(
            datos.manzana
          );
        }

        mostrarNotificacion(
          respuesta?.message ||
            (
              esEdicion
                ? "Lote actualizado correctamente"
                : "Lote creado correctamente"
            )
        );
      } catch (error) {
        console.error(
          "Error guardando lote:",
          error
        );

        mostrarNotificacion(
          error?.response?.data
            ?.message ||
            "No fue posible guardar el lote.",
          "error"
        );
      } finally {
        setGuardandoLote(
          false
        );
      }
    };

  /* =======================================================
     ELIMINAR LOTE
  ======================================================= */

  const handleEliminarLote =
    async (
      lote
    ) => {
      if (
        lote.estado ===
        "Vendido"
      ) {
        mostrarNotificacion(
          "Un lote vendido no puede eliminarse mientras tenga una venta asociada.",
          "error"
        );

        return;
      }

      const confirmar =
        window.confirm(
          `¿Está seguro de eliminar el lote ${lote.codigo}?`
        );

      if (
        !confirmar
      ) {
        return;
      }

      try {
        const respuesta =
          await eliminarLote(
            lote._id
          );

        await cargarLotes();

        mostrarNotificacion(
          respuesta?.message ||
            "Lote eliminado correctamente"
        );
      } catch (error) {
        console.error(
          "Error eliminando lote:",
          error
        );

        mostrarNotificacion(
          error?.response?.data
            ?.message ||
            "No fue posible eliminar el lote.",
          "error"
        );
      }
    };

  /* =======================================================
     ACTUALIZAR
  ======================================================= */

  const actualizarTodo =
    async () => {
      await Promise.all([
        cargarManzanas(),
        cargarLotes(),
      ]);
    };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <section className="lotes-page">

      {/* =================================================
          CABECERA
      ================================================= */}

      <div className="lotes-header">

        <div>
          <span className="lotes-kicker">
            Gestión del proyecto
          </span>

          <h1>
            Manzanas y lotes
          </h1>

          <p>
            Organiza las manzanas,
            dimensiones, disponibilidad
            y valor general de cada lote.
          </p>
        </div>

        <div className="lotes-header-actions">

          <button
            type="button"
            className="lotes-secondary-action"
            onClick={
              abrirNuevaManzana
            }
          >
            <Building2
              size={18}
            />

            Nueva manzana
          </button>

          <button
            type="button"
            className="lotes-primary-action"
            onClick={
              abrirNuevoLote
            }
          >
            <Plus
              size={19}
            />

            Nuevo lote
          </button>

        </div>
      </div>

      {/* =================================================
          MANZANAS
      ================================================= */}

      <div className="lotes-section-heading">

        <div>
          <span>
            Organización
          </span>

          <h2>
            Manzanas
          </h2>
        </div>

        <strong>
          {manzanas.length}{" "}
          {manzanas.length ===
          1
            ? "manzana"
            : "manzanas"}
        </strong>

      </div>

      {manzanas.length ===
      0 ? (
        <div className="manzanas-empty">

          <Building2
            size={38}
          />

          <strong>
            No hay manzanas creadas
          </strong>

          <span>
            Cree la primera manzana para
            comenzar a registrar los lotes.
          </span>

          <button
            type="button"
            onClick={
              abrirNuevaManzana
            }
          >
            <Plus
              size={17}
            />

            Crear primera manzana
          </button>

        </div>
      ) : (
        <div className="manzanas-grid">

          {manzanas.map(
            (manzana) => {
              const cantidad =
                contarLotesManzana(
                  manzana._id
                );

              const activa =
                manzana._id ===
                manzanaSeleccionada;

              return (
                <article
                  key={
                    manzana._id
                  }
                  className={`manzana-card ${(
                    activa
                      ? "manzana-card-active"
                      : ""
                  )}`}
                  onClick={() =>
                    setManzanaSeleccionada(
                      manzana._id
                    )
                  }
                >

                  <div className="manzana-card-top">

                    <div className="manzana-card-icon">
                      <Building2
                        size={20}
                      />
                    </div>

                    <span
                      className={`manzana-status ${(
                        manzana.estado ===
                        "Activa"
                          ? "activa"
                          : "inactiva"
                      )}`}
                    >
                      {
                        manzana.estado
                      }
                    </span>

                  </div>

                  <span className="manzana-code">
                    {
                      manzana.codigo
                    }
                  </span>

                  <h3>
                    {
                      manzana.nombre
                    }
                  </h3>

                  <p>
                    {manzana.descripcion ||
                      "Sin descripción"}
                  </p>

                  <div className="manzana-card-bottom">

                    <div>
                      <strong>
                        {
                          cantidad
                        }
                      </strong>

                      <span>
                        {cantidad ===
                        1
                          ? "lote"
                          : "lotes"}
                      </span>
                    </div>

                    <div className="manzana-card-actions">

                      <button
                        type="button"
                        className="print"
                        title="Imprimir manzana y sus lotes"
                        onClick={(event) =>
                          imprimirManzana(
                            manzana,
                            event
                          )
                        }
                      >
                        <Printer
                          size={15}
                        />
                      </button>

                      <button
                        type="button"
                        title="Editar manzana"
                        onClick={(event) =>
                          abrirEditarManzana(
                            manzana,
                            event
                          )
                        }
                      >
                        <Edit3
                          size={16}
                        />
                      </button>

                      <button
                        type="button"
                        className="delete"
                        title="Eliminar manzana"
                        onClick={(event) =>
                          handleEliminarManzana(
                            manzana,
                            event
                          )
                        }
                      >
                        <Trash2
                          size={16}
                        />
                      </button>

                      <ChevronRight
                        size={18}
                      />

                    </div>
                  </div>

                </article>
              );
            }
          )}

        </div>
      )}

      {/* =================================================
          MANZANA SELECCIONADA
      ================================================= */}

      {manzanaActual && (
        <>

          <div className="lotes-current-heading">

            <div>

              <div className="lotes-current-title">

                <LandPlot
                  size={22}
                />

                <div>
                  <span>
                    {
                      manzanaActual.codigo
                    }
                  </span>

                  <h2>
                    {
                      manzanaActual.nombre
                    }
                  </h2>
                </div>

              </div>

              <p>
                {manzanaActual.descripcion ||
                  "Lotes registrados dentro de esta manzana."}
              </p>

            </div>

            <button
              type="button"
              className="lotes-add-inside-button"
              onClick={
                abrirNuevoLote
              }
            >
              <Plus
                size={18}
              />

              Crear lote aquí
            </button>

          </div>

          {/* =============================================
              ESTADÍSTICAS
          ============================================= */}

          <div className="lotes-stats">

            <article className="lotes-stat">
              <span>
                Total lotes
              </span>

              <strong>
                {
                  estadisticas.total
                }
              </strong>
            </article>

            <article className="lotes-stat disponible">
              <span>
                Disponibles
              </span>

              <strong>
                {
                  estadisticas.disponibles
                }
              </strong>
            </article>

            <article className="lotes-stat reservado">
              <span>
                Reservados
              </span>

              <strong>
                {
                  estadisticas.reservados
                }
              </strong>
            </article>

            <article className="lotes-stat vendido">
              <span>
                Vendidos
              </span>

              <strong>
                {
                  estadisticas.vendidos
                }
              </strong>
            </article>

            <article className="lotes-stat valor">
              <span>
                Valor total
              </span>

              <strong>
                {formatearDinero(
                  estadisticas.valorTotal
                )}
              </strong>
            </article>

          </div>

          {/* =============================================
              PANEL LOTES
          ============================================= */}

          <div className="lotes-panel">

            <div className="lotes-toolbar">

              <div className="lotes-search">

                <Search
                  size={18}
                />

                <input
                  type="text"
                  value={
                    busqueda
                  }
                  onChange={(e) =>
                    setBusqueda(
                      e.target.value
                    )
                  }
                  placeholder="Buscar por código, número u observación..."
                />

              </div>

              <div className="lotes-toolbar-right">

                <select
                  value={
                    filtroEstado
                  }
                  onChange={(e) =>
                    setFiltroEstado(
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    Todos los estados
                  </option>

                  <option value="Disponible">
                    Disponible
                  </option>

                  <option value="Reservado">
                    Reservado
                  </option>

                  <option value="Vendido">
                    Vendido
                  </option>
                </select>

                <button
                  type="button"
                  className="lotes-refresh-button"
                  onClick={
                    actualizarTodo
                  }
                  title="Actualizar"
                >
                  <RefreshCw
                    size={18}
                    className={
                      cargando
                        ? "lotes-spin"
                        : ""
                    }
                  />
                </button>

              </div>
            </div>

            {/* =============================================
                TABLA
            ============================================= */}

            <div className="lotes-table-wrapper">

              <table className="lotes-table">

                <thead>
                  <tr>
                    <th>
                      Lote
                    </th>

                    <th>
                      Medidas
                    </th>

                    <th>
                      Área
                    </th>

                    <th>
                      Valor general
                    </th>

                    <th>
                      Estado
                    </th>

                    <th>
                      Observaciones
                    </th>

                    <th className="lotes-actions-heading">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {cargando ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="lotes-empty"
                      >
                        <RefreshCw
                          size={25}
                          className="lotes-spin"
                        />

                        <span>
                          Cargando lotes...
                        </span>
                      </td>
                    </tr>
                  ) : lotesFiltrados.length ===
                    0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="lotes-empty"
                      >
                        <LandPlot
                          size={34}
                        />

                        <strong>
                          No hay lotes
                        </strong>

                        <span>
                          No existen lotes
                          para los filtros
                          seleccionados.
                        </span>
                      </td>
                    </tr>
                  ) : (
                    lotesFiltrados.map(
                      (lote) => (
                        <tr
                          key={
                            lote._id
                          }
                        >

                          {/* LOTE */}

                          <td>
                            <div className="lote-main-cell">

                              <div className="lote-main-icon">
                                <LandPlot
                                  size={18}
                                />
                              </div>

                              <div>
                                <strong>
                                  {
                                    lote.codigo
                                  }
                                </strong>

                                <span>
                                  Lote{" "}
                                  {
                                    lote.numeroLote
                                  }
                                </span>
                              </div>

                            </div>
                          </td>

                          {/* MEDIDAS */}

                          <td>
                            <div className="lote-medidas-table">

                              <span>
                                <strong>
                                  Frente:
                                </strong>{" "}
                                {lote.frenteMetros} m{" "}
                                {lote.frenteCentimetros} cm
                              </span>

                              <span>
                                <strong>
                                  Fondo:
                                </strong>{" "}
                                {lote.fondoMetros} m{" "}
                                {lote.fondoCentimetros} cm
                              </span>

                            </div>
                          </td>

                          {/* ÁREA */}

                          <td>
                            <strong className="lote-area-table">
                              {formatearArea(
                                lote.areaM2
                              )}{" "}
                              m²
                            </strong>
                          </td>

                          {/* VALOR */}

                          <td>
                            <strong className="lote-value-table">
                              {formatearDinero(
                                lote.valorLote
                              )}
                            </strong>
                          </td>

                          {/* ESTADO */}

                          <td>
                            <span
                              className={`lote-status lote-status-${lote.estado.toLowerCase()}`}
                            >
                              {
                                lote.estado
                              }
                            </span>
                          </td>

                          {/* OBSERVACIÓN */}

                          <td>
                            {lote.observaciones ? (
                              <span className="lote-observation">
                                {
                                  lote.observaciones
                                }
                              </span>
                            ) : (
                              <span className="lote-muted">
                                Sin observación
                              </span>
                            )}
                          </td>

                          {/* ACCIONES */}

                          <td>
                            <div className="lotes-actions">

                              <button
                                type="button"
                                className="print"
                                title={`Imprimir únicamente ${lote.codigo}`}
                                onClick={() =>
                                  imprimirLote(
                                    lote
                                  )
                                }
                              >
                                <Printer
                                  size={16}
                                />
                              </button>

                              <button
                                type="button"
                                className="edit"
                                title={
                                  lote.estado ===
                                  "Vendido"
                                    ? "Editar lote eliminando primero la venta"
                                    : "Editar lote"
                                }
                                onClick={() =>
                                  abrirEditarLote(
                                    lote
                                  )
                                }
                              >
                                <Edit3
                                  size={16}
                                />
                              </button>

                              <button
                                type="button"
                                className="delete"
                                title="Eliminar lote"
                                onClick={() =>
                                  handleEliminarLote(
                                    lote
                                  )
                                }
                              >
                                <Trash2
                                  size={16}
                                />
                              </button>

                            </div>
                          </td>

                        </tr>
                      )
                    )
                  )}

                </tbody>
              </table>

            </div>

            <div className="lotes-table-footer">

              <span>
                Mostrando{" "}
                <strong>
                  {
                    lotesFiltrados.length
                  }
                </strong>{" "}
                de{" "}
                <strong>
                  {
                    lotesManzana.length
                  }
                </strong>{" "}
                lotes
              </span>

              <span>
                Área total:{" "}
                <strong>
                  {formatearArea(
                    estadisticas.areaTotal
                  )}{" "}
                  m²
                </strong>
              </span>

            </div>

          </div>

        </>
      )}

      {/* =================================================
          MODAL MANZANA
      ================================================= */}

      <ManzanaModal
        abierto={
          modalManzanaAbierto
        }
        onCerrar={
          cerrarModalManzana
        }
        onGuardar={
          guardarManzana
        }
        manzanaEditar={
          manzanaEditar
        }
        guardando={
          guardandoManzana
        }
      />

      {/* =================================================
          MODAL LOTE
      ================================================= */}

      <LoteModal
        abierto={
          modalLoteAbierto
        }
        onCerrar={
          cerrarModalLote
        }
        onGuardar={
          guardarLote
        }
        loteEditar={
          loteEditar
        }
        guardando={
          guardandoLote
        }
        manzanas={
          manzanas
        }
        manzanaInicial={
          manzanaSeleccionada
        }
      />

      {/* =================================================
          ELIMINAR VENTA PARA EDITAR LOTE
      ================================================= */}

      {modalEliminarVentaAbierto && (
        <div
          className="lotes-modal-overlay"
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              cerrarModalEliminarVenta();
            }
          }}
        >
          <div className="lotes-modal eliminar-venta-lote-modal">

            {/* CABECERA */}

            <div className="lotes-modal-header">

              <div className="lotes-modal-title">

                <div className="eliminar-venta-lote-icon">
                  <Trash2
                    size={21}
                  />
                </div>

                <div>
                  <span className="lotes-modal-kicker">
                    Lote vendido
                  </span>

                  <h2>
                    Eliminar venta para editar
                  </h2>
                </div>

              </div>

              <button
                type="button"
                className="lotes-modal-close"
                onClick={
                  cerrarModalEliminarVenta
                }
                disabled={
                  procesandoEliminacion
                }
              >
                <X
                  size={20}
                />
              </button>

            </div>

            {/* CUERPO */}

            <div className="lotes-modal-body">

              <div className="eliminar-venta-lote-warning">

                <AlertTriangle
                  size={22}
                />

                <div>
                  <strong>
                    Este lote tiene una venta registrada
                  </strong>

                  <span>
                    Para modificar los datos del lote,
                    primero debe eliminarse la venta asociada.
                  </span>
                </div>

              </div>

              <div className="eliminar-venta-lote-info">

                <div>
                  <span>
                    Venta
                  </span>

                  <strong>
                    {ventaParaEliminar?.codigo ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>
                    Lote
                  </span>

                  <strong>
                    {lotePendienteEditar?.codigo ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>
                    Cliente
                  </span>

                  <strong>
                    {obtenerNombreVentaCliente(
                      ventaParaEliminar?.cliente
                    )}
                  </strong>
                </div>

              </div>

              <div className="eliminar-venta-lote-after">

                <strong>
                  Al continuar:
                </strong>

                <span>
                  • La venta será eliminada definitivamente.
                </span>

                <span>
                  • Las cuotas de la venta serán eliminadas.
                </span>

                <span>
                  • El lote volverá a estado Disponible.
                </span>

                <span>
                  • Se abrirá automáticamente la ventana para editar el lote.
                </span>

              </div>

              <div className="eliminar-venta-lote-payments">

                <AlertTriangle
                  size={18}
                />

                <div>
                  <strong>
                    Si la venta tiene pagos registrados
                  </strong>

                  <span>
                    El sistema no permitirá eliminarla.
                    Primero deberá eliminar todos los pagos
                    asociados desde el módulo Pagos.
                  </span>
                </div>

              </div>

            </div>

            {/* BOTONES */}

            <div className="lotes-modal-footer">

              <button
                type="button"
                className="lotes-btn-secondary"
                onClick={
                  cerrarModalEliminarVenta
                }
                disabled={
                  procesandoEliminacion
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className="eliminar-venta-lote-button"
                onClick={
                  confirmarEliminarVentaYEditar
                }
                disabled={
                  procesandoEliminacion
                }
              >
                <Trash2
                  size={17}
                />

                {procesandoEliminacion
                  ? "Eliminando..."
                  : "Eliminar venta y editar lote"}
              </button>

            </div>

          </div>
        </div>
      )}

      {/* =================================================
          NOTIFICACIÓN
      ================================================= */}

      <Toast
        visible={
          notificacion.visible
        }
        mensaje={
          notificacion.mensaje
        }
        tipo={
          notificacion.tipo
        }
        onClose={
          cerrarNotificacion
        }
      />

    </section>
  );
}