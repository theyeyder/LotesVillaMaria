import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  LandPlot,
  Printer,
  RefreshCw,
  Search,
  UserRound,
  WalletCards,
} from "lucide-react";

import "./Cuotas.css";

import Toast from "../../components/ui/Toast";

import {
  obtenerCuotas,
  obtenerResumenCuotas,
} from "../../services/cuota.service";

/* =========================================================
   FORMATEAR DINERO
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

/* =========================================================
   FORMATEAR FECHA
========================================================= */

const formatearFecha = (
  fecha
) => {
  if (!fecha) {
    return "—";
  }

  const date =
    new Date(fecha);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleDateString(
    "es-CO",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    }
  );
};

/* =========================================================
   NOMBRE DEL CLIENTE
========================================================= */

const obtenerNombreCliente = (
  cliente
) => {
  if (!cliente) {
    return "Sin cliente";
  }

  const nombre = [
    cliente.nombres,
    cliente.apellidos,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    nombre ||
    cliente.nombre ||
    cliente.razonSocial ||
    "Cliente"
  );
};

/* =========================================================
   ESCAPAR HTML PARA IMPRESIÓN
========================================================= */

const escaparHTML = (
  valor
) => {
  return String(
    valor ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
};

/* =========================================================
   ESTADO INICIAL DEL RESUMEN

   Estados válidos:
   - Pendiente
   - Parcial
   - Pagada
   - Vencida
========================================================= */

const resumenInicial = {
  totalCuotas: 0,

  pendientes: 0,
  parciales: 0,
  pagadas: 0,
  vencidas: 0,

  valorProgramado: 0,
  valorPagado: 0,
  saldoPendiente: 0,
};

/* =========================================================
   COMPONENTE
========================================================= */

export default function Cuotas() {
  /* =======================================================
     DATOS
  ======================================================= */

  const [
    cuotas,
    setCuotas,
  ] = useState([]);

  const [
    resumen,
    setResumen,
  ] = useState(
    resumenInicial
  );

  /* =======================================================
     CARGA
  ======================================================= */

  const [
    cargando,
    setCargando,
  ] = useState(true);

  /* =======================================================
     FILTROS
  ======================================================= */

  const [
    filtroCliente,
    setFiltroCliente,
  ] = useState("");

  const [
    busquedaCliente,
    setBusquedaCliente,
  ] = useState("");

  const [
    mostrarResultadosClientes,
    setMostrarResultadosClientes,
  ] = useState(false);

  /* =======================================================
     PAGINACIÓN
  ======================================================= */

  const [
    paginaActual,
    setPaginaActual,
  ] = useState(1);

  const CUOTAS_POR_PAGINA =
    10;

  /* =======================================================
     TOAST
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

          visible:
            false,
        })
      );
    };

  /* =======================================================
     CARGAR CUOTAS
  ======================================================= */

  const cargarCuotas =
    async () => {
      try {
        const datos =
          await obtenerCuotas();

        setCuotas(
          Array.isArray(
            datos
          )
            ? datos
            : []
        );
      } catch (error) {
        console.error(
          "Error cargando cuotas:",
          error
        );

        mostrarNotificacion(
          error?.response?.data
            ?.message ||
            "No fue posible cargar las cuotas.",
          "error"
        );
      }
    };

  /* =======================================================
     CARGAR RESUMEN
  ======================================================= */

  const cargarResumen =
    async () => {
      try {
        const datos =
          await obtenerResumenCuotas();

        setResumen({
          ...resumenInicial,

          ...(datos || {}),
        });
      } catch (error) {
        console.error(
          "Error cargando resumen:",
          error
        );

        mostrarNotificacion(
          error?.response?.data
            ?.message ||
            "No fue posible cargar el resumen de cuotas.",
          "error"
        );
      }
    };

  /* =======================================================
     CARGAR TODO
  ======================================================= */

  const cargarTodo =
    async () => {
      try {
        setCargando(
          true
        );

        await Promise.all([
          cargarCuotas(),
          cargarResumen(),
        ]);
      } finally {
        setCargando(
          false
        );
      }
    };

  useEffect(() => {
    cargarTodo();
  }, []);

  /* =======================================================
     CLIENTES DISPONIBLES EN LAS CUOTAS
  ======================================================= */

  const clientes =
    useMemo(() => {
      const mapa =
        new Map();

      cuotas.forEach(
        (cuota) => {
          const cliente =
            cuota.venta?.cliente;

          if (
            cliente?._id &&
            !mapa.has(
              cliente._id
            )
          ) {
            mapa.set(
              cliente._id,
              cliente
            );
          }
        }
      );

      return Array.from(
        mapa.values()
      ).sort(
        (
          a,
          b
        ) =>
          obtenerNombreCliente(
            a
          ).localeCompare(
            obtenerNombreCliente(
              b
            ),
            "es"
          )
      );
    }, [
      cuotas,
    ]);

  /* =======================================================
     CLIENTE SELECCIONADO EN EL FILTRO
  ======================================================= */

  const clienteSeleccionado =
    useMemo(() => {
      if (
        !filtroCliente
      ) {
        return null;
      }

      return (
        clientes.find(
          (cliente) =>
            cliente._id ===
            filtroCliente
        ) || null
      );
    }, [
      clientes,
      filtroCliente,
    ]);

  /* =======================================================
     BUSCAR CLIENTES

     Busca por:
     - Nombre
     - Apellido
     - Documento
     - Teléfono
     - Correo

     Máximo 10 resultados.
  ======================================================= */

  const clientesFiltradosBusqueda =
    useMemo(() => {
      const texto =
        busquedaCliente
          .trim()
          .toLowerCase();

      /*
        No mostramos todos los clientes
        cuando el buscador está vacío.
      */

      if (
        !texto
      ) {
        return [];
      }

      return clientes
        .filter(
          (cliente) => {
            const nombre =
              obtenerNombreCliente(
                cliente
              ).toLowerCase();

            const documento =
              String(
                cliente.documento ||
                  ""
              ).toLowerCase();

            const telefono =
              String(
                cliente.telefono ||
                  ""
              ).toLowerCase();

            const correo =
              String(
                cliente.correo ||
                  ""
              ).toLowerCase();

            return (
              nombre.includes(
                texto
              ) ||
              documento.includes(
                texto
              ) ||
              telefono.includes(
                texto
              ) ||
              correo.includes(
                texto
              )
            );
          }
        )
        .slice(
          0,
          10
        );
    }, [
      clientes,
      busquedaCliente,
    ]);

  /* =======================================================
     ESCRIBIR EN BUSCADOR DE CLIENTE
  ======================================================= */

  const handleBuscarCliente =
    (e) => {
      const value =
        e.target.value;

      setBusquedaCliente(
        value
      );

      setMostrarResultadosClientes(
        true
      );

      /*
        Si había un cliente seleccionado
        y comenzamos una búsqueda nueva,
        quitamos el filtro anterior.
      */

      if (
        filtroCliente
      ) {
        setFiltroCliente(
          ""
        );
      }
    };

  /* =======================================================
     SELECCIONAR CLIENTE
  ======================================================= */

  const seleccionarCliente =
    (cliente) => {
      setFiltroCliente(
        cliente._id
      );

      setBusquedaCliente(
        obtenerNombreCliente(
          cliente
        )
      );

      setMostrarResultadosClientes(
        false
      );

      setPaginaActual(
        1
      );
    };

  /* =======================================================
     LIMPIAR CLIENTE
  ======================================================= */

  const limpiarCliente =
    () => {
      setFiltroCliente(
        ""
      );

      setBusquedaCliente(
        ""
      );

      setMostrarResultadosClientes(
        false
      );

      setPaginaActual(
        1
      );
    };

  /* =======================================================
     FILTRAR CUOTAS ÚNICAMENTE POR CLIENTE
  ======================================================= */

  const cuotasFiltradas =
    useMemo(() => {
      if (
        !filtroCliente
      ) {
        return cuotas;
      }

      return cuotas.filter(
        (cuota) =>
          cuota.venta
            ?.cliente
            ?._id ===
          filtroCliente
      );
    }, [
      cuotas,
      filtroCliente,
    ]);

  /* =======================================================
     PAGINACIÓN
  ======================================================= */

  const totalPaginas =
    Math.max(
      1,
      Math.ceil(
        cuotasFiltradas.length /
          CUOTAS_POR_PAGINA
      )
    );

  const indiceInicial =
    (
      paginaActual -
      1
    ) *
    CUOTAS_POR_PAGINA;

  const cuotasPaginadas =
    cuotasFiltradas.slice(
      indiceInicial,
      indiceInicial +
        CUOTAS_POR_PAGINA
    );

  useEffect(() => {
    setPaginaActual(
      1
    );
  }, [
    filtroCliente,
  ]);

  useEffect(() => {
    if (
      paginaActual >
      totalPaginas
    ) {
      setPaginaActual(
        totalPaginas
      );
    }
  }, [
    paginaActual,
    totalPaginas,
  ]);

  /* =======================================================
     LIMPIAR FILTROS
  ======================================================= */

  const limpiarFiltros =
    () => {
      setFiltroCliente(
        ""
      );

      setBusquedaCliente(
        ""
      );

      setMostrarResultadosClientes(
        false
      );

      setPaginaActual(
        1
      );
    };

  /* =======================================================
     VENTANA DE IMPRESIÓN
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
          "width=1200,height=800"
        );

      if (
        !ventana
      ) {
        mostrarNotificacion(
          "El navegador bloqueó la ventana de impresión.",
          "error"
        );

        return;
      }

      ventana.document.write(`
        <!DOCTYPE html>
        <html lang="es">
          <head>
            <meta charset="UTF-8" />
            <title>${escaparHTML(
              titulo
            )}</title>

            <style>
              * {
                box-sizing: border-box;
              }

              body {
                margin: 0;
                padding: 30px;

                font-family:
                  Arial,
                  Helvetica,
                  sans-serif;

                color: #23342b;
                background: #ffffff;
              }

              .print-actions {
                display: flex;
                justify-content: flex-end;
                gap: 10px;

                margin-bottom: 22px;
              }

              .print-actions button {
                padding: 9px 16px;

                border: 1px solid #cfc7b7;
                border-radius: 8px;

                background: #ffffff;

                font-weight: 700;

                cursor: pointer;
              }

              .print-actions .primary {
                border-color: #1f6848;

                background: #1f6848;

                color: #ffffff;
              }

              .report-header {
                margin-bottom: 24px;

                text-align: center;
              }

              .report-header h1 {
                margin: 0 0 5px;

                color: #173f2e;

                font-size: 23px;
              }

              .report-header h2 {
                margin: 0;

                color: #8c672b;

                font-size: 15px;
              }

              .report-header p {
                margin: 7px 0 0;

                color: #777;

                font-size: 11px;
              }

              .cliente-section {
                margin-bottom: 30px;

                page-break-inside: avoid;
              }

              .cliente-header {
                display: flex;
                justify-content: space-between;
                gap: 15px;

                padding: 12px 14px;

                border: 1px solid #d9d2c5;
                border-radius: 9px 9px 0 0;

                background: #f7f2e8;
              }

              .cliente-header strong {
                color: #173f2e;

                font-size: 14px;
              }

              .cliente-header span {
                color: #777;

                font-size: 10px;
              }

              table {
                width: 100%;

                border-collapse: collapse;
              }

              th {
                padding: 8px 7px;

                border: 1px solid #d8d2c7;

                background: #f1eee7;

                color: #4f5b54;

                font-size: 9px;
                text-align: left;
              }

              td {
                padding: 8px 7px;

                border: 1px solid #e2ddd4;

                font-size: 9px;
              }

              .money {
                text-align: right;
                white-space: nowrap;
              }

              .cliente-totales {
                display: grid;

                grid-template-columns:
                  repeat(
                    3,
                    minmax(0, 1fr)
                  );

                gap: 8px;

                padding: 10px 12px;

                border:
                  1px solid
                  #d9d2c5;

                border-top: none;

                background:
                  #fcfaf5;
              }

              .cliente-totales div {
                display: flex;
                flex-direction: column;

                gap: 3px;
              }

              .cliente-totales span {
                color: #777;

                font-size: 8px;

                text-transform: uppercase;
              }

              .cliente-totales strong {
                color: #173f2e;

                font-size: 11px;
              }

              .general-summary {
                display: grid;

                grid-template-columns:
                  repeat(
                    4,
                    minmax(0, 1fr)
                  );

                gap: 10px;

                margin-bottom: 22px;
              }

              .general-summary div {
                padding: 10px;

                border: 1px solid #ddd7cb;
                border-radius: 8px;

                background: #faf8f3;
              }

              .general-summary span {
                display: block;

                margin-bottom: 4px;

                color: #777;

                font-size: 8px;

                text-transform: uppercase;
              }

              .general-summary strong {
                color: #173f2e;

                font-size: 12px;
              }

              @media print {
                @page {
                  size: A4 landscape;
                  margin: 10mm;
                }

                body {
                  padding: 0;
                }

                .print-actions {
                  display: none;
                }

                .cliente-section {
                  page-break-inside:
                    avoid;
                }
              }
            </style>
          </head>

          <body>

            <div class="print-actions">
              <button
                onclick="window.close()"
              >
                Cerrar
              </button>

              <button
                class="primary"
                onclick="window.print()"
              >
                Imprimir
              </button>
            </div>

            ${contenido}

          </body>
        </html>
      `);

      ventana.document.close();

      ventana.focus();
    };

  /* =======================================================
     CREAR BLOQUE DE UN CLIENTE
  ======================================================= */

  const construirReporteCliente =
    (
      cliente,
      cuotasCliente
    ) => {
      const cuotasOrdenadas =
        [...cuotasCliente].sort(
          (
            a,
            b
          ) => {
            const fechaA =
              new Date(
                a.fechaVencimiento
              ).getTime();

            const fechaB =
              new Date(
                b.fechaVencimiento
              ).getTime();

            return (
              fechaA -
                fechaB ||
              Number(
                a.numeroCuota
              ) -
                Number(
                  b.numeroCuota
                )
            );
          }
        );

      const totalProgramado =
        cuotasOrdenadas.reduce(
          (
            total,
            cuota
          ) =>
            total +
            Number(
              cuota.valorCuota ||
                0
            ),
          0
        );

      const totalPagado =
        cuotasOrdenadas.reduce(
          (
            total,
            cuota
          ) =>
            total +
            Number(
              cuota.valorPagado ||
                0
            ),
          0
        );

      const saldoPendiente =
        cuotasOrdenadas.reduce(
          (
            total,
            cuota
          ) =>
            total +
            Number(
              cuota.saldoPendiente ||
                0
            ),
          0
        );

      const filas =
        cuotasOrdenadas
          .map(
            (cuota) => {
              const venta =
                cuota.venta;

              const lote =
                venta?.lote;

              const manzana =
                lote?.manzana;

              return `
                <tr>
                  <td>
                    <strong>
                      ${escaparHTML(
                        cuota.codigo ||
                          "—"
                      )}
                    </strong>
                  </td>

                  <td>
                    ${escaparHTML(
                      venta?.codigo ||
                        "—"
                    )}
                  </td>

                  <td>
                    ${escaparHTML(
                      lote?.codigo ||
                        "—"
                    )}
                  </td>

                  <td>
                    ${escaparHTML(
                      manzana?.nombre ||
                        manzana?.codigo ||
                        "—"
                    )}
                  </td>

                  <td>
                    ${escaparHTML(
                      `Cuota ${
                        cuota.numeroCuota ||
                        0
                      } de ${
                        venta?.numeroCuotas ||
                        "—"
                      }`
                    )}
                  </td>

                  <td>
                    ${escaparHTML(
                      formatearFecha(
                        cuota.fechaVencimiento
                      )
                    )}
                  </td>

                  <td class="money">
                    ${escaparHTML(
                      formatearDinero(
                        cuota.valorCuota
                      )
                    )}
                  </td>

                  <td class="money">
                    ${escaparHTML(
                      formatearDinero(
                        cuota.valorPagado
                      )
                    )}
                  </td>

                  <td class="money">
                    ${escaparHTML(
                      formatearDinero(
                        cuota.saldoPendiente
                      )
                    )}
                  </td>

                  <td>
                    ${escaparHTML(
                      cuota.estado ||
                        "—"
                    )}
                  </td>
                </tr>
              `;
            }
          )
          .join("");

      return `
        <section class="cliente-section">

          <div class="cliente-header">

            <div>
              <strong>
                ${escaparHTML(
                  obtenerNombreCliente(
                    cliente
                  )
                )}
              </strong>

              <br />

              <span>
                Documento:
                ${escaparHTML(
                  cliente?.documento ||
                    "Sin documento"
                )}
              </span>
            </div>

            <span>
              ${cuotasOrdenadas.length}
              cuota(s)
            </span>

          </div>

          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Venta</th>
                <th>Lote</th>
                <th>Manzana</th>
                <th>Cuota</th>
                <th>Vencimiento</th>
                <th>Valor</th>
                <th>Pagado</th>
                <th>Saldo</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody>
              ${filas}
            </tbody>
          </table>

          <div class="cliente-totales">

            <div>
              <span>
                Valor programado
              </span>

              <strong>
                ${escaparHTML(
                  formatearDinero(
                    totalProgramado
                  )
                )}
              </strong>
            </div>

            <div>
              <span>
                Total pagado
              </span>

              <strong>
                ${escaparHTML(
                  formatearDinero(
                    totalPagado
                  )
                )}
              </strong>
            </div>

            <div>
              <span>
                Saldo pendiente
              </span>

              <strong>
                ${escaparHTML(
                  formatearDinero(
                    saldoPendiente
                  )
                )}
              </strong>
            </div>

          </div>

        </section>
      `;
    };

  /* =======================================================
     IMPRESIÓN GENERAL

     REGLAS:

     - Si hay cliente seleccionado:
       imprime únicamente todas las cuotas de ese cliente.

     - Si NO hay cliente seleccionado:
       imprime todos los clientes con todas sus cuotas.

     - No depende de la página actual.
  ======================================================= */

  const imprimirTodasLasCuotas =
    () => {
      /* =====================================================
         DEFINIR QUÉ CUOTAS SE VAN A IMPRIMIR
      ===================================================== */

      const cuotasParaImprimir =
        filtroCliente
          ? cuotas.filter(
              (cuota) =>
                cuota.venta
                  ?.cliente
                  ?._id ===
                filtroCliente
            )
          : cuotas;

      /* =====================================================
         VALIDAR
      ===================================================== */

      if (
        cuotasParaImprimir.length ===
        0
      ) {
        mostrarNotificacion(
          filtroCliente
            ? "El cliente seleccionado no tiene cuotas para imprimir."
            : "No existen cuotas para imprimir.",
          "error"
        );

        return;
      }

      /* =====================================================
         AGRUPAR POR CLIENTE
      ===================================================== */

      const grupos =
        new Map();

      cuotasParaImprimir.forEach(
        (cuota) => {
          const cliente =
            cuota.venta?.cliente;

          const clave =
            cliente?._id ||
            "sin-cliente";

          if (
            !grupos.has(
              clave
            )
          ) {
            grupos.set(
              clave,
              {
                cliente,
                cuotas: [],
              }
            );
          }

          grupos
            .get(
              clave
            )
            .cuotas.push(
              cuota
            );
        }
      );

      /* =====================================================
         ORDENAR CLIENTES
      ===================================================== */

      const clientesAgrupados =
        Array.from(
          grupos.values()
        ).sort(
          (
            a,
            b
          ) =>
            obtenerNombreCliente(
              a.cliente
            ).localeCompare(
              obtenerNombreCliente(
                b.cliente
              ),
              "es"
            )
        );

      /* =====================================================
         CONSTRUIR BLOQUES
      ===================================================== */

      const contenidoClientes =
        clientesAgrupados
          .map(
            ({
              cliente,
              cuotas:
                cuotasCliente,
            }) =>
              construirReporteCliente(
                cliente,
                cuotasCliente
              )
          )
          .join("");

      /* =====================================================
         TOTALES DEL REPORTE
      ===================================================== */

      const totalProgramado =
        cuotasParaImprimir.reduce(
          (
            total,
            cuota
          ) =>
            total +
            Number(
              cuota.valorCuota ||
                0
            ),
          0
        );

      const totalPagado =
        cuotasParaImprimir.reduce(
          (
            total,
            cuota
          ) =>
            total +
            Number(
              cuota.valorPagado ||
                0
            ),
          0
        );

      const saldoPendiente =
        cuotasParaImprimir.reduce(
          (
            total,
            cuota
          ) =>
            total +
            Number(
              cuota.saldoPendiente ||
                0
            ),
          0
        );

      /* =====================================================
         TÍTULO DEL REPORTE
      ===================================================== */

      const tituloReporte =
        filtroCliente &&
        clienteSeleccionado
          ? `Cuotas - ${obtenerNombreCliente(
              clienteSeleccionado
            )}`
          : "Reporte general de cuotas";

      const subtituloReporte =
        filtroCliente &&
        clienteSeleccionado
          ? `ESTADO DE CUOTAS - ${obtenerNombreCliente(
              clienteSeleccionado
            ).toUpperCase()}`
          : "REPORTE GENERAL DE CUOTAS";

      /* =====================================================
         ABRIR IMPRESIÓN
      ===================================================== */

      abrirVentanaImpresion(
        tituloReporte,
        `
          <div class="report-header">

            <h1>
              LOTES VILLA MARÍA
            </h1>

            <h2>
              ${escaparHTML(
                subtituloReporte
              )}
            </h2>

            <p>
              ${
                filtroCliente &&
                clienteSeleccionado
                  ? `Documento: ${escaparHTML(
                      clienteSeleccionado.documento ||
                        "Sin documento"
                    )}`
                  : "Cuotas agrupadas por cliente"
              }
            </p>

          </div>

          <div class="general-summary">

            <div>
              <span>
                Clientes
              </span>

              <strong>
                ${clientesAgrupados.length}
              </strong>
            </div>

            <div>
              <span>
                Total cuotas
              </span>

              <strong>
                ${cuotasParaImprimir.length}
              </strong>
            </div>

            <div>
              <span>
                Total pagado
              </span>

              <strong>
                ${escaparHTML(
                  formatearDinero(
                    totalPagado
                  )
                )}
              </strong>
            </div>

            <div>
              <span>
                Saldo pendiente
              </span>

              <strong>
                ${escaparHTML(
                  formatearDinero(
                    saldoPendiente
                  )
                )}
              </strong>
            </div>

          </div>

          <div
            style="
              margin-bottom: 20px;
              font-size: 10px;
              color: #777;
            "
          >
            Valor total programado:
            <strong>
              ${escaparHTML(
                formatearDinero(
                  totalProgramado
                )
              )}
            </strong>
          </div>

          ${contenidoClientes}
        `
      );
    };

  /* =======================================================
     IMPRIMIR UN SOLO CLIENTE CON TODAS SUS CUOTAS
  ======================================================= */

  const imprimirCuotasCliente =
    (
      cliente
    ) => {
      if (
        !cliente?._id
      ) {
        mostrarNotificacion(
          "No fue posible identificar el cliente.",
          "error"
        );

        return;
      }

      const cuotasCliente =
        cuotas.filter(
          (cuota) =>
            cuota.venta
              ?.cliente
              ?._id ===
            cliente._id
        );

      if (
        cuotasCliente.length ===
        0
      ) {
        mostrarNotificacion(
          "El cliente no tiene cuotas para imprimir.",
          "error"
        );

        return;
      }

      abrirVentanaImpresion(
        `Cuotas - ${obtenerNombreCliente(
          cliente
        )}`,
        `
          <div class="report-header">

            <h1>
              LOTES VILLA MARÍA
            </h1>

            <h2>
              ESTADO DE CUOTAS DEL CLIENTE
            </h2>

          </div>

          ${construirReporteCliente(
            cliente,
            cuotasCliente
          )}
        `
      );
    };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <section className="cuotas-page">

      {/* =================================================
          CABECERA
      ================================================= */}

      <div className="cuotas-header">

        <div>
          <span className="cuotas-kicker">
            Cartera
          </span>

          <h1>
            Control de cuotas
          </h1>

          <p>
            Consulta las cuotas
            generadas por las ventas
            financiadas, sus
            vencimientos, pagos y
            saldos pendientes.
          </p>
        </div>

        <div className="cuotas-header-actions">

          <button
            type="button"
            className="cuotas-print-button"
            onClick={
              imprimirTodasLasCuotas
            }
            disabled={
              cargando ||
              cuotas.length ===
                0
            }
          >
            <Printer
              size={18}
            />

            Imprimir cuotas
          </button>

          <button
            type="button"
            className="cuotas-refresh-button"
            onClick={
              cargarTodo
            }
            disabled={
              cargando
            }
          >
            <RefreshCw
              size={18}
              className={
                cargando
                  ? "cuotas-spin"
                  : ""
              }
            />

            Actualizar
          </button>

        </div>

      </div>

      {/* =================================================
          ESTADÍSTICAS
      ================================================= */}

      <div className="cuotas-stats">

        {/* TOTAL */}

        <article className="cuotas-stat">
          <div className="cuotas-stat-icon">
            <WalletCards
              size={20}
            />
          </div>

          <div>
            <span>
              Total cuotas
            </span>

            <strong>
              {
                resumen.totalCuotas
              }
            </strong>
          </div>
        </article>

        {/* PENDIENTES */}

        <article className="cuotas-stat pendiente">
          <div className="cuotas-stat-icon">
            <Clock3
              size={20}
            />
          </div>

          <div>
            <span>
              Pendientes
            </span>

            <strong>
              {
                resumen.pendientes
              }
            </strong>
          </div>
        </article>

        {/* VENCIDAS */}

        <article className="cuotas-stat vencida">
          <div className="cuotas-stat-icon">
            <AlertTriangle
              size={20}
            />
          </div>

          <div>
            <span>
              Vencidas
            </span>

            <strong>
              {
                resumen.vencidas
              }
            </strong>
          </div>
        </article>

        {/* PAGADAS */}

        <article className="cuotas-stat pagada">
          <div className="cuotas-stat-icon">
            <CheckCircle2
              size={20}
            />
          </div>

          <div>
            <span>
              Pagadas
            </span>

            <strong>
              {
                resumen.pagadas
              }
            </strong>
          </div>
        </article>

        {/* SALDO */}

        <article className="cuotas-stat saldo">
          <div className="cuotas-stat-icon">
            $
          </div>

          <div>
            <span>
              Saldo pendiente
            </span>

            <strong>
              {formatearDinero(
                resumen.saldoPendiente
              )}
            </strong>
          </div>
        </article>

      </div>

      {/* =================================================
          RESUMEN ECONÓMICO
      ================================================= */}

      <div className="cuotas-financial-summary">

        <div>
          <span>
            Valor programado
          </span>

          <strong>
            {formatearDinero(
              resumen.valorProgramado
            )}
          </strong>
        </div>

        <div>
          <span>
            Total pagado
          </span>

          <strong>
            {formatearDinero(
              resumen.valorPagado
            )}
          </strong>
        </div>

        <div>
          <span>
            Saldo por cobrar
          </span>

          <strong>
            {formatearDinero(
              resumen.saldoPendiente
            )}
          </strong>
        </div>

        <div>
          <span>
            Parciales
          </span>

          <strong>
            {
              resumen.parciales
            }
          </strong>
        </div>

      </div>

      {/* =================================================
          PANEL
      ================================================= */}

      <div className="cuotas-panel">

        {/* =============================================
            FILTROS
        ============================================= */}

        <div className="cuotas-filters">

          {/* CLIENTE */}

          <div className="cuotas-filter-field cuotas-client-filter">

            <label>
              Cliente
            </label>

            {clienteSeleccionado ? (
              /* =================================
                 CLIENTE SELECCIONADO
              ================================= */

              <div className="cuotas-client-selected">

                <div>

                  <span>
                    Cliente seleccionado
                  </span>

                  <strong>
                    {obtenerNombreCliente(
                      clienteSeleccionado
                    )}
                  </strong>

                  {clienteSeleccionado.documento && (
                    <small>
                      Documento:{" "}
                      {
                        clienteSeleccionado.documento
                      }
                    </small>
                  )}

                </div>

                <button
                  type="button"
                  onClick={
                    limpiarCliente
                  }
                >
                  Cambiar
                </button>

              </div>
            ) : (
              <>
                {/* ===============================
                    BUSCADOR
                =============================== */}

                <div className="cuotas-client-search">

                  <Search
                    size={16}
                  />

                  <input
                    type="text"
                    value={
                      busquedaCliente
                    }
                    onChange={
                      handleBuscarCliente
                    }
                    onFocus={() =>
                      setMostrarResultadosClientes(
                        true
                      )
                    }
                    placeholder="Nombre, documento o teléfono..."
                    autoComplete="off"
                  />

                  {busquedaCliente && (
                    <button
                      type="button"
                      className="cuotas-client-clear"
                      onClick={
                        limpiarCliente
                      }
                      aria-label="Limpiar cliente"
                    >
                      ×
                    </button>
                  )}

                </div>

                {/* ===============================
                    RESULTADOS
                =============================== */}

                {mostrarResultadosClientes &&
                  busquedaCliente.trim() && (
                    <div className="cuotas-client-results">

                      {clientesFiltradosBusqueda.length >
                      0 ? (
                        clientesFiltradosBusqueda.map(
                          (cliente) => (
                            <button
                              key={
                                cliente._id
                              }
                              type="button"
                              className="cuotas-client-result"
                              onClick={() =>
                                seleccionarCliente(
                                  cliente
                                )
                              }
                            >

                              <div className="cuotas-client-avatar">

                                {obtenerNombreCliente(
                                  cliente
                                )
                                  .charAt(
                                    0
                                  )
                                  .toUpperCase()}

                              </div>

                              <div className="cuotas-client-result-info">

                                <strong>
                                  {obtenerNombreCliente(
                                    cliente
                                  )}
                                </strong>

                                <span>
                                  {cliente.documento
                                    ? `Documento: ${cliente.documento}`
                                    : "Sin documento"}

                                  {cliente.telefono
                                    ? ` · Tel: ${cliente.telefono}`
                                    : ""}
                                </span>

                              </div>

                              <span className="cuotas-client-select-text">
                                Seleccionar
                              </span>

                            </button>
                          )
                        )
                      ) : (
                        <div className="cuotas-client-empty">
                          No se encontraron clientes.
                        </div>
                      )}

                    </div>
                  )}

                {!busquedaCliente.trim() && (
                  <small className="cuotas-client-help">
                    Escriba nombre, apellido,
                    documento o teléfono.
                  </small>
                )}

              </>
            )}

          </div>

        </div>

        {/* =================================================
            TABLA
        ================================================= */}

        <div className="cuotas-table-wrapper">

          <table className="cuotas-table">

            <thead>
              <tr>
                <th>
                  Cliente
                </th>

                <th>
                  Código
                </th>

                <th>
                  Venta
                </th>

                <th>
                  Lote
                </th>

                <th>
                  Cuota
                </th>

                <th>
                  Vencimiento
                </th>

                <th>
                  Valor cuota
                </th>

                <th>
                  Pagado
                </th>

                <th>
                  Saldo
                </th>

                <th>
                  Estado
                </th>

                <th>
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>

              {cargando ? (
                <tr>
                  <td
                    colSpan="11"
                    className="cuotas-empty"
                  >
                    <RefreshCw
                      size={27}
                      className="cuotas-spin"
                    />

                    <strong>
                      Cargando cuotas...
                    </strong>
                  </td>
                </tr>
              ) : cuotasPaginadas.length ===
                0 ? (
                <tr>
                  <td
                    colSpan="11"
                    className="cuotas-empty"
                  >
                    <WalletCards
                      size={38}
                    />

                    <strong>
                      No hay cuotas
                    </strong>

                    <span>
                      No existen cuotas
                      para los filtros
                      seleccionados.
                    </span>
                  </td>
                </tr>
              ) : (
                cuotasPaginadas.map(
                  (cuota) => {
                    const venta =
                      cuota.venta;

                    const cliente =
                      venta?.cliente;

                    const lote =
                      venta?.lote;

                    const manzana =
                      lote?.manzana;

                    return (
                      <tr
                        key={
                          cuota._id
                        }
                      >

                        {/* CLIENTE */}

                        <td>
                          <div className="cuota-client-cell">

                            <UserRound
                              size={16}
                            />

                            <div>
                              <strong>
                                {obtenerNombreCliente(
                                  cliente
                                )}
                              </strong>

                              <span>
                                {cliente?.documento ||
                                  "Sin documento"}
                              </span>
                            </div>

                          </div>
                        </td>

                        {/* CÓDIGO DE CUOTA */}

                        <td>
                          <strong className="cuota-code">
                            {cuota.codigo ||
                              "—"}
                          </strong>
                        </td>

                        {/* VENTA */}

                        <td>
                          <strong className="cuota-venta-code">
                            {venta?.codigo ||
                              "—"}
                          </strong>
                        </td>

                        {/* LOTE */}

                        <td>
                          <div className="cuota-lote-cell">

                            <LandPlot
                              size={15}
                            />

                            <div>
                              <strong>
                                {lote?.codigo ||
                                  "—"}
                              </strong>

                              <span>
                                {manzana?.nombre ||
                                  "Sin manzana"}
                              </span>
                            </div>

                          </div>
                        </td>

                        {/* NÚMERO */}

                        <td>
                          <div className="cuota-number">

                            <span>
                              Cuota
                            </span>

                            <strong>
                              {String(
                                cuota.numeroCuota
                              ).padStart(
                                2,
                                "0"
                              )}

                              {venta?.numeroCuotas
                                ? ` / ${String(
                                    venta.numeroCuotas
                                  ).padStart(
                                    2,
                                    "0"
                                  )}`
                                : ""}
                            </strong>

                          </div>
                        </td>

                        {/* VENCIMIENTO */}

                        <td>
                          <div className="cuota-date">

                            <CalendarClock
                              size={15}
                            />

                            <span>
                              {formatearFecha(
                                cuota.fechaVencimiento
                              )}
                            </span>

                          </div>
                        </td>

                        {/* VALOR */}

                        <td>
                          <strong className="cuota-money">
                            {formatearDinero(
                              cuota.valorCuota
                            )}
                          </strong>
                        </td>

                        {/* PAGADO */}

                        <td>
                          <span className="cuota-paid">
                            {formatearDinero(
                              cuota.valorPagado
                            )}
                          </span>
                        </td>

                        {/* SALDO */}

                        <td>
                          <strong
                            className={`cuota-balance ${
                              Number(
                                cuota.saldoPendiente
                              ) ===
                              0
                                ? "cuota-balance-zero"
                                : ""
                            }`}
                          >
                            {formatearDinero(
                              cuota.saldoPendiente
                            )}
                          </strong>
                        </td>

                        {/* ESTADO */}

                        <td>
                          <span
                            className={`cuota-status cuota-status-${String(
                              cuota.estado
                            ).toLowerCase()}`}
                          >
                            {
                              cuota.estado
                            }
                          </span>
                        </td>

                        {/* ACCIONES */}

                        <td>
                          <div className="cuotas-actions">

                            <button
                              type="button"
                              className="print"
                              title={`Imprimir todas las cuotas de ${obtenerNombreCliente(
                                cliente
                              )}`}
                              onClick={() =>
                                imprimirCuotasCliente(
                                  cliente
                                )
                              }
                            >
                              <Printer
                                size={16}
                              />
                            </button>

                          </div>
                        </td>

                      </tr>
                    );
                  }
                )
              )}

            </tbody>
          </table>

        </div>

        {/* =================================================
            PIE
        ================================================= */}

        <div className="cuotas-table-footer">

          <span>
            Mostrando{" "}
            <strong>
              {
                cuotasFiltradas.length
              }
            </strong>{" "}
            de{" "}
            <strong>
              {
                cuotas.length
              }
            </strong>{" "}
            cuotas
          </span>

          <div className="cuotas-pagination">

            <button
              type="button"
              disabled={
                paginaActual ===
                1
              }
              onClick={() =>
                setPaginaActual(
                  (pagina) =>
                    Math.max(
                      1,
                      pagina - 1
                    )
                )
              }
            >
              Anterior
            </button>

            <span>
              Página{" "}
              <strong>
                {
                  paginaActual
                }
              </strong>{" "}
              de{" "}
              <strong>
                {
                  totalPaginas
                }
              </strong>
            </span>

            <button
              type="button"
              disabled={
                paginaActual ===
                totalPaginas
              }
              onClick={() =>
                setPaginaActual(
                  (pagina) =>
                    Math.min(
                      totalPaginas,
                      pagina + 1
                    )
                )
              }
            >
              Siguiente
            </button>

          </div>

        </div>

      </div>

      {/* =================================================
          NOTIFICACIONES
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