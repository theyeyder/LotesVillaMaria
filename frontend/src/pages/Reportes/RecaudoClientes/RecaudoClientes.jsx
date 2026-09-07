import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  FileSpreadsheet,
  FileText,
  Globe2,
  List,
  ReceiptText,
  RefreshCw,
  Search,
  UserRound,
  Users,
  WalletCards,
  X,
} from "lucide-react";

import Toast from "../../../components/ui/Toast";

import {
  obtenerReporteRecaudoClientes,
} from "../../../services/reportes/recaudoClientes.service";

import exportarExcel from "../utils/exportarExcel";
import exportarPDF from "../utils/exportarPDF";
import exportarHTML from "../utils/exportarHTML";

import {
  formatearDinero,
  formatearFecha,
  formatearNumero,
  normalizarTexto,
  numero,
} from "../utils/formatos";

import "./RecaudoClientes.css";

/* =========================================================
   CONSTANTES
========================================================= */

const REGISTROS_POR_PAGINA =
  8;

/* =========================================================
   COMPONENTE
========================================================= */

export default function RecaudoClientes({
  onVolver,
}) {
  /* =======================================================
     ESTADOS GENERALES
  ======================================================= */

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    clientes,
    setClientes,
  ] = useState([]);

  const [
    registros,
    setRegistros,
  ] = useState([]);

  const [
    resumen,
    setResumen,
  ] = useState({
    clientes: 0,
    totalPagos: 0,
    ventasAsociadas: 0,
    lotesAsociados: 0,
    totalRecaudado: 0,
    efectivo: 0,
    transferencia: 0,
    consignacion: 0,
    pse: 0,
    otro: 0,
  });

  /* =======================================================
     VISTA
  ======================================================= */

  const [
    vista,
    setVista,
  ] = useState(
    "clientes"
  );

  /* =======================================================
     FILTROS
  ======================================================= */

  const [
    buscar,
    setBuscar,
  ] = useState("");

  const [
    desde,
    setDesde,
  ] = useState("");

  const [
    hasta,
    setHasta,
  ] = useState("");

  const [
    cliente,
    setCliente,
  ] = useState("");

  const [
    metodo,
    setMetodo,
  ] = useState("");

  /* =======================================================
     CATÁLOGO CLIENTES
  ======================================================= */

  const [
    opcionesCliente,
    setOpcionesCliente,
  ] = useState([]);

  /* =======================================================
     PAGINACIÓN
  ======================================================= */

  const [
    pagina,
    setPagina,
  ] = useState(1);

  /* =======================================================
     TOAST
  ======================================================= */

  const [
    toast,
    setToast,
  ] = useState(null);

  const mostrarToast = (
    mensaje,
    tipo = "success"
  ) => {
    setToast({
      mensaje,
      tipo,
    });
  };

  /* =======================================================
     CATÁLOGO CLIENTES
  ======================================================= */

  const actualizarCatalogoClientes =
    (
      datos
    ) => {
      const mapa =
        new Map();

      datos.forEach(
        (
          registro
        ) => {
          const item =
            registro.cliente;

          if (
            !item?.nombre
          ) {
            return;
          }

          const clave =
            String(
              item._id ||
              item.documento ||
              item.nombre
            );

          mapa.set(
            clave,
            {
              id:
                item._id ||
                item.documento ||
                item.nombre,

              nombre:
                item.nombre,

              documento:
                item.documento ||
                "",
            }
          );
        }
      );

      setOpcionesCliente(
        Array.from(
          mapa.values()
        ).sort(
          (
            a,
            b
          ) =>
            String(
              a.nombre
            ).localeCompare(
              String(
                b.nombre
              ),
              "es"
            )
        )
      );
    };

  /* =======================================================
     CARGAR INFORME
  ======================================================= */

  const cargarInforme =
    async (
      filtros = {},
      actualizarOpciones = false
    ) => {
      try {
        setCargando(
          true
        );

        setError(
          ""
        );

        const respuesta =
          await obtenerReporteRecaudoClientes(
            filtros
          );

        const nuevosClientes =
          Array.isArray(
            respuesta?.clientes
          )
            ? respuesta.clientes
            : [];

        const nuevosRegistros =
          Array.isArray(
            respuesta?.registros
          )
            ? respuesta.registros
            : [];

        setClientes(
          nuevosClientes
        );

        setRegistros(
          nuevosRegistros
        );

        setResumen({
          clientes:
            numero(
              respuesta
                ?.resumen
                ?.clientes
            ),

          totalPagos:
            numero(
              respuesta
                ?.resumen
                ?.totalPagos
            ),

          ventasAsociadas:
            numero(
              respuesta
                ?.resumen
                ?.ventasAsociadas
            ),

          lotesAsociados:
            numero(
              respuesta
                ?.resumen
                ?.lotesAsociados
            ),

          totalRecaudado:
            numero(
              respuesta
                ?.resumen
                ?.totalRecaudado
            ),

          efectivo:
            numero(
              respuesta
                ?.resumen
                ?.efectivo
            ),

          transferencia:
            numero(
              respuesta
                ?.resumen
                ?.transferencia
            ),

          consignacion:
            numero(
              respuesta
                ?.resumen
                ?.consignacion
            ),

          pse:
            numero(
              respuesta
                ?.resumen
                ?.pse
            ),

          otro:
            numero(
              respuesta
                ?.resumen
                ?.otro
            ),
        });

        if (
          actualizarOpciones
        ) {
          actualizarCatalogoClientes(
            nuevosRegistros
          );
        }

        setPagina(
          1
        );
      } catch (
        error
      ) {
        console.error(
          "Error cargando informe de recaudo por cliente:",
          error
        );

        const mensaje =
          error?.response
            ?.data
            ?.message ||
          "No fue posible cargar el informe.";

        setError(
          mensaje
        );

        mostrarToast(
          mensaje,
          "error"
        );
      } finally {
        setCargando(
          false
        );
      }
    };

  /* =======================================================
     CARGA INICIAL
  ======================================================= */

  useEffect(
    () => {
      cargarInforme(
        {},
        true
      );
    },
    []
  );

  /* =======================================================
     APLICAR FILTROS
  ======================================================= */

  const aplicarFiltros =
    () => {
      cargarInforme({
        buscar,
        desde,
        hasta,
        cliente,
        metodo,
      });
    };

  /* =======================================================
     LIMPIAR FILTROS
  ======================================================= */

  const limpiarFiltros =
    async () => {
      setBuscar(
        ""
      );

      setDesde(
        ""
      );

      setHasta(
        ""
      );

      setCliente(
        ""
      );

      setMetodo(
        ""
      );

      await cargarInforme(
        {},
        true
      );
    };

  /* =======================================================
     FILTRO LOCAL CLIENTES
  ======================================================= */

  const clientesVisibles =
    useMemo(
      () => {
        const busqueda =
          normalizarTexto(
            buscar
          );

        if (
          !busqueda
        ) {
          return clientes;
        }

        return clientes.filter(
          (
            item
          ) => {
            const campos = [
              item.cliente
                ?.nombre,

              item.cliente
                ?.documento,

              item.cliente
                ?.telefono,

              item.cliente
                ?.ciudad,

              item.ultimoPagoCodigo,
            ];

            return campos.some(
              (
                campo
              ) =>
                normalizarTexto(
                  campo
                ).includes(
                  busqueda
                )
            );
          }
        );
      },
      [
        clientes,
        buscar,
      ]
    );

  /* =======================================================
     FILTRO LOCAL DETALLE
  ======================================================= */

  const registrosVisibles =
    useMemo(
      () => {
        const busqueda =
          normalizarTexto(
            buscar
          );

        if (
          !busqueda
        ) {
          return registros;
        }

        return registros.filter(
          (
            registro
          ) => {
            const campos = [
              registro.codigoPago,

              registro.cliente
                ?.nombre,

              registro.cliente
                ?.documento,

              registro.cliente
                ?.telefono,

              registro.venta
                ?.codigo,

              registro.manzana
                ?.codigo,

              registro.lote
                ?.codigo,

              registro.metodoPago,

              registro.referencia,

              registro.observaciones,
            ];

            return campos.some(
              (
                campo
              ) =>
                normalizarTexto(
                  campo
                ).includes(
                  busqueda
                )
            );
          }
        );
      },
      [
        registros,
        buscar,
      ]
    );

  /* =======================================================
     DATOS SEGÚN VISTA
  ======================================================= */

  const datosVista =
    vista ===
    "detalle"
      ? registrosVisibles
      : clientesVisibles;

  const totalPaginas =
    Math.max(
      1,
      Math.ceil(
        datosVista.length /
          REGISTROS_POR_PAGINA
      )
    );

  const paginaActual =
    Math.min(
      pagina,
      totalPaginas
    );

  const datosPagina =
    useMemo(
      () => {
        const inicio =
          (
            paginaActual -
            1
          ) *
          REGISTROS_POR_PAGINA;

        return datosVista.slice(
          inicio,
          inicio +
            REGISTROS_POR_PAGINA
        );
      },
      [
        datosVista,
        paginaActual,
      ]
    );

  /* =======================================================
     CAMBIAR VISTA
  ======================================================= */

  const cambiarVista =
    (
      nuevaVista
    ) => {
      setVista(
        nuevaVista
      );

      setPagina(
        1
      );
    };

  /* =======================================================
     COLUMNAS CLIENTES
  ======================================================= */

  const columnasClientes = [
    {
      titulo:
        "Cliente",
      clave:
        "cliente",
      ancho:
        30,
      anchoPDF:
        30,
    },

    {
      titulo:
        "Documento",
      clave:
        "documento",
      ancho:
        18,
      anchoPDF:
        19,
    },

    {
      titulo:
        "Pagos",
      clave:
        "pagos",
      tipo:
        "numero",
      ancho:
        12,
      anchoPDF:
        12,
    },

    {
      titulo:
        "Ventas",
      clave:
        "ventas",
      tipo:
        "numero",
      ancho:
        12,
      anchoPDF:
        12,
    },

    {
      titulo:
        "Lotes",
      clave:
        "lotes",
      tipo:
        "numero",
      ancho:
        12,
      anchoPDF:
        12,
    },

    {
      titulo:
        "Total recaudado",
      clave:
        "totalRecaudado",
      tipo:
        "moneda",
      ancho:
        21,
      anchoPDF:
        22,
    },

    {
      titulo:
        "Efectivo",
      clave:
        "efectivo",
      tipo:
        "moneda",
      ancho:
        19,
      anchoPDF:
        20,
    },

    {
      titulo:
        "Transferencia",
      clave:
        "transferencia",
      tipo:
        "moneda",
      ancho:
        19,
      anchoPDF:
        20,
    },

    {
      titulo:
        "Consignación",
      clave:
        "consignacion",
      tipo:
        "moneda",
      ancho:
        19,
      anchoPDF:
        20,
    },

    {
      titulo:
        "PSE",
      clave:
        "pse",
      tipo:
        "moneda",
      ancho:
        18,
      anchoPDF:
        19,
    },

    {
      titulo:
        "Otro",
      clave:
        "otro",
      tipo:
        "moneda",
      ancho:
        18,
      anchoPDF:
        19,
    },

    {
      titulo:
        "Último pago",
      clave:
        "ultimoPago",
      tipo:
        "fecha",
      ancho:
        16,
      anchoPDF:
        17,
    },
  ];

  /* =======================================================
     FILAS CLIENTES
  ======================================================= */

  const filasClientes =
    useMemo(
      () => {
        return clientesVisibles.map(
          (
            item
          ) => ({
            cliente:
              item.cliente
                ?.nombre ||
              "—",

            documento:
              item.cliente
                ?.documento ||
              "—",

            pagos:
              numero(
                item.cantidadPagos
              ),

            ventas:
              numero(
                item.cantidadVentas
              ),

            lotes:
              numero(
                item.cantidadLotes
              ),

            totalRecaudado:
              numero(
                item.totalRecaudado
              ),

            efectivo:
              numero(
                item.efectivo
              ),

            transferencia:
              numero(
                item.transferencia
              ),

            consignacion:
              numero(
                item.consignacion
              ),

            pse:
              numero(
                item.pse
              ),

            otro:
              numero(
                item.otro
              ),

            ultimoPago:
              item.ultimoPago,
          })
        );
      },
      [
        clientesVisibles,
      ]
    );

  /* =======================================================
     COLUMNAS DETALLE
  ======================================================= */

  const columnasDetalle = [
    {
      titulo:
        "Pago",
      clave:
        "pago",
      ancho:
        14,
      anchoPDF:
        15,
    },

    {
      titulo:
        "Fecha",
      clave:
        "fecha",
      tipo:
        "fecha",
      ancho:
        14,
      anchoPDF:
        16,
    },

    {
      titulo:
        "Cliente",
      clave:
        "cliente",
      ancho:
        29,
      anchoPDF:
        27,
    },

    {
      titulo:
        "Documento",
      clave:
        "documento",
      ancho:
        18,
      anchoPDF:
        19,
    },

    {
      titulo:
        "Venta",
      clave:
        "venta",
      ancho:
        14,
      anchoPDF:
        15,
    },

    {
      titulo:
        "Manzana",
      clave:
        "manzana",
      ancho:
        14,
      anchoPDF:
        15,
    },

    {
      titulo:
        "Lote",
      clave:
        "lote",
      ancho:
        14,
      anchoPDF:
        15,
    },

    {
      titulo:
        "Área m²",
      clave:
        "area",
      tipo:
        "numero",
      ancho:
        13,
      anchoPDF:
        14,
    },

    {
      titulo:
        "Método",
      clave:
        "metodo",
      ancho:
        18,
      anchoPDF:
        18,
    },

    {
      titulo:
        "Referencia",
      clave:
        "referencia",
      ancho:
        20,
      anchoPDF:
        20,
    },

    {
      titulo:
        "Valor pago",
      clave:
        "valorPago",
      tipo:
        "moneda",
      ancho:
        20,
      anchoPDF:
        22,
    },

    {
      titulo:
        "Cuotas aplicadas",
      clave:
        "cuotas",
      tipo:
        "numero",
      ancho:
        16,
      anchoPDF:
        16,
    },
  ];

  /* =======================================================
     FILAS DETALLE
  ======================================================= */

  const filasDetalle =
    useMemo(
      () => {
        return registrosVisibles.map(
          (
            registro
          ) => ({
            pago:
              registro.codigoPago ||
              "—",

            fecha:
              registro.fechaPago,

            cliente:
              registro.cliente
                ?.nombre ||
              "—",

            documento:
              registro.cliente
                ?.documento ||
              "—",

            venta:
              registro.venta
                ?.codigo ||
              "—",

            manzana:
              registro.manzana
                ?.codigo ||
              "—",

            lote:
              registro.lote
                ?.codigo ||
              "—",

            area:
              numero(
                registro.lote
                  ?.areaM2
              ),

            metodo:
              registro.metodoPago ||
              "—",

            referencia:
              registro.referencia ||
              "—",

            valorPago:
              numero(
                registro.valorPago
              ),

            cuotas:
              numero(
                registro.cuotasAplicadas
              ),
          })
        );
      },
      [
        registrosVisibles,
      ]
    );

  /* =======================================================
     RESUMEN EXPORTACIÓN
  ======================================================= */

  const resumenExportacion = [
    {
      label:
        "Clientes",

      valor:
        resumen.clientes,

      tipo:
        "numero",

      color:
        "azul",

      detalle:
        "Clientes con pagos registrados",
    },

    {
      label:
        "Pagos",

      valor:
        resumen.totalPagos,

      tipo:
        "numero",

      color:
        "dorado",

      detalle:
        "Movimientos de recaudo",
    },

    {
      label:
        "Ventas asociadas",

      valor:
        resumen.ventasAsociadas,

      tipo:
        "numero",

      detalle:
        "Ventas con recaudo",
    },

    {
      label:
        "Lotes asociados",

      valor:
        resumen.lotesAsociados,

      tipo:
        "numero",

      detalle:
        "Lotes relacionados con pagos",
    },

    {
      label:
        "Total recaudado",

      valor:
        resumen.totalRecaudado,

      tipo:
        "moneda",

      color:
        "verde",

      detalle:
        "Total recibido de clientes",
    },

    {
      label:
        "Transferencias",

      valor:
        resumen.transferencia,

      tipo:
        "moneda",

      color:
        "azul",

      detalle:
        "Pagos por transferencia",
    },
  ];

  /* =======================================================
     FILTROS EXPORTACIÓN
  ======================================================= */

  const filtrosExportacion =
    useMemo(
      () => {
        const opcionCliente =
          opcionesCliente.find(
            (
              item
            ) =>
              String(
                item.id
              ) ===
              String(
                cliente
              )
          );

        return [
          {
            label:
              "Desde",

            valor:
              desde
                ? formatearFecha(
                    desde
                  )
                : "Todas",
          },

          {
            label:
              "Hasta",

            valor:
              hasta
                ? formatearFecha(
                    hasta
                  )
                : "Todas",
          },

          {
            label:
              "Cliente",

            valor:
              opcionCliente
                ?.nombre ||
              "Todos",
          },

          {
            label:
              "Método",

            valor:
              metodo ||
              "Todos",
          },

          {
            label:
              "Búsqueda",

            valor:
              buscar ||
              "Sin búsqueda",
          },

          {
            label:
              "Vista",

            valor:
              vista ===
              "detalle"
                ? "Detalle de pagos"
                : "Resumen por cliente",
          },
        ];
      },
      [
        desde,
        hasta,
        cliente,
        metodo,
        buscar,
        vista,
        opcionesCliente,
      ]
    );

  /* =======================================================
     EXPORTACIÓN
  ======================================================= */

  const columnasExportacion =
    vista ===
    "detalle"
      ? columnasDetalle
      : columnasClientes;

  const filasExportacion =
    vista ===
    "detalle"
      ? filasDetalle
      : filasClientes;

  /* =======================================================
     EXCEL
  ======================================================= */

  const generarExcel =
    () => {
      const correcto =
        exportarExcel({
          titulo:
            "Recaudo por cliente",

          subtitulo:
            vista ===
            "detalle"
              ? "Detalle de pagos recibidos"
              : "Resumen consolidado de recaudo por cliente",

          nombreArchivo:
            "RecaudoPorCliente",

          resumen:
            resumenExportacion,

          filtros:
            filtrosExportacion,

          columnas:
            columnasExportacion,

          filas:
            filasExportacion,
        });

      mostrarToast(
        correcto
          ? "Informe Excel generado correctamente."
          : "No fue posible generar el archivo Excel.",

        correcto
          ? "success"
          : "error"
      );
    };

  /* =======================================================
     PDF
  ======================================================= */

  const generarPDF =
    () => {
      const correcto =
        exportarPDF({
          titulo:
            "Recaudo por cliente",

          subtitulo:
            vista ===
            "detalle"
              ? "Detalle de pagos y medios de recaudo"
              : "Resumen consolidado de recaudo por cliente",

          nombreArchivo:
            "RecaudoPorCliente",

          resumen:
            resumenExportacion,

          filtros:
            filtrosExportacion,

          columnas:
            columnasExportacion,

          filas:
            filasExportacion,

          orientacion:
            "landscape",
        });

      mostrarToast(
        correcto
          ? "Informe PDF generado correctamente."
          : "No fue posible generar el PDF.",

        correcto
          ? "success"
          : "error"
      );
    };

  /* =======================================================
     HTML
  ======================================================= */

  const generarHTML =
    () => {
      const correcto =
        exportarHTML({
          titulo:
            "Recaudo por cliente",

          subtitulo:
            vista ===
            "detalle"
              ? "Detalle de pagos recibidos"
              : "Resumen consolidado de recaudo",

          nombreArchivo:
            "RecaudoPorCliente",

          resumen:
            resumenExportacion,

          filtros:
            filtrosExportacion,

          columnas:
            columnasExportacion,

          filas:
            filasExportacion,

          descargar:
            false,
        });

      if (
        !correcto
      ) {
        mostrarToast(
          "El navegador bloqueó la ventana del informe HTML.",
          "error"
        );
      }
    };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="recaudo-clientes-reporte">

      {toast && (
        <Toast
          message={
            toast.mensaje
          }
          type={
            toast.tipo
          }
          onClose={() =>
            setToast(
              null
            )
          }
        />
      )}

      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="recaudo-clientes-header">

        <div className="recaudo-clientes-header-left">

          {onVolver && (
            <button
              type="button"
              className="recaudo-clientes-back"
              onClick={
                onVolver
              }
            >
              <ArrowLeft
                size={18}
              />
            </button>
          )}

          <div>

            <span className="recaudo-clientes-kicker">
              Informe independiente
            </span>

            <h1>
              Recaudo por cliente
            </h1>

            <p>
              Consulta los pagos recibidos, clientes, ventas, lotes y medios utilizados para el recaudo.
            </p>

          </div>

        </div>

        <button
          type="button"
          className="recaudo-clientes-refresh"
          onClick={
            aplicarFiltros
          }
          disabled={
            cargando
          }
        >
          <RefreshCw
            size={16}
            className={
              cargando
                ? "recaudo-clientes-spin"
                : ""
            }
          />

          Actualizar
        </button>

      </header>

      {/* ===================================================
          TARJETAS
      =================================================== */}

      <section className="recaudo-clientes-stats">

        <article className="recaudo-clientes-stat">

          <i className="azul">
            <Users
              size={20}
            />
          </i>

          <div>
            <span>
              Clientes
            </span>

            <strong>
              {formatearNumero(
                resumen.clientes
              )}
            </strong>

            <small>
              Con pagos registrados
            </small>
          </div>

        </article>

        <article className="recaudo-clientes-stat">

          <i className="dorado">
            <ReceiptText
              size={20}
            />
          </i>

          <div>
            <span>
              Pagos
            </span>

            <strong>
              {formatearNumero(
                resumen.totalPagos
              )}
            </strong>

            <small>
              Movimientos de recaudo
            </small>
          </div>

        </article>

        <article className="recaudo-clientes-stat">

          <i>
            <WalletCards
              size={20}
            />
          </i>

          <div>
            <span>
              Ventas asociadas
            </span>

            <strong>
              {formatearNumero(
                resumen.ventasAsociadas
              )}
            </strong>

            <small>
              Ventas con pagos
            </small>
          </div>

        </article>

        <article className="recaudo-clientes-stat">

          <i>
            <UserRound
              size={20}
            />
          </i>

          <div>
            <span>
              Lotes asociados
            </span>

            <strong>
              {formatearNumero(
                resumen.lotesAsociados
              )}
            </strong>

            <small>
              Lotes relacionados
            </small>
          </div>

        </article>

        <article className="recaudo-clientes-stat">

          <i className="verde">
            <CircleDollarSign
              size={20}
            />
          </i>

          <div>
            <span>
              Total recaudado
            </span>

            <strong className="texto-verde">
              {formatearDinero(
                resumen.totalRecaudado
              )}
            </strong>

            <small>
              Total recibido
            </small>
          </div>

        </article>

        <article className="recaudo-clientes-stat">

          <i className="azul">
            <CircleDollarSign
              size={20}
            />
          </i>

          <div>
            <span>
              Transferencias
            </span>

            <strong>
              {formatearDinero(
                resumen.transferencia
              )}
            </strong>

            <small>
              Pagos por transferencia
            </small>
          </div>

        </article>

      </section>

      {/* ===================================================
          FILTROS
      =================================================== */}

      <section className="recaudo-clientes-filtros">

        <div className="recaudo-clientes-search">

          <Search
            size={16}
          />

          <input
            type="text"
            value={
              buscar
            }
            onChange={(
              event
            ) => {
              setBuscar(
                event.target.value
              );

              setPagina(
                1
              );
            }}
            placeholder="Cliente, documento, pago, venta, lote..."
          />

        </div>

        <label className="recaudo-clientes-field">

          <span>
            Desde
          </span>

          <div className="recaudo-clientes-date">

            <CalendarDays
              size={14}
            />

            <input
              type="date"
              value={
                desde
              }
              onChange={(
                event
              ) =>
                setDesde(
                  event.target.value
                )
              }
            />

          </div>

        </label>

        <label className="recaudo-clientes-field">

          <span>
            Hasta
          </span>

          <div className="recaudo-clientes-date">

            <CalendarDays
              size={14}
            />

            <input
              type="date"
              value={
                hasta
              }
              onChange={(
                event
              ) =>
                setHasta(
                  event.target.value
                )
              }
            />

          </div>

        </label>

        <label className="recaudo-clientes-field">

          <span>
            Cliente
          </span>

          <select
            value={
              cliente
            }
            onChange={(
              event
            ) =>
              setCliente(
                event.target.value
              )
            }
          >

            <option value="">
              Todos
            </option>

            {opcionesCliente.map(
              (
                opcion
              ) => (
                <option
                  key={
                    opcion.id
                  }
                  value={
                    opcion.id
                  }
                >
                  {opcion.documento
                    ? `${opcion.documento} · `
                    : ""}
                  {opcion.nombre}
                </option>
              )
            )}

          </select>

        </label>

        <label className="recaudo-clientes-field">

          <span>
            Método
          </span>

          <select
            value={
              metodo
            }
            onChange={(
              event
            ) =>
              setMetodo(
                event.target.value
              )
            }
          >

            <option value="">
              Todos
            </option>

            <option value="Efectivo">
              Efectivo
            </option>

            <option value="Transferencia">
              Transferencia
            </option>

            <option value="Consignación">
              Consignación
            </option>

            <option value="PSE">
              PSE
            </option>

          </select>

        </label>

        <button
          type="button"
          className="recaudo-clientes-aplicar"
          onClick={
            aplicarFiltros
          }
          disabled={
            cargando
          }
        >
          Aplicar
        </button>

        <button
          type="button"
          className="recaudo-clientes-limpiar"
          onClick={
            limpiarFiltros
          }
          disabled={
            cargando
          }
        >
          <X
            size={14}
          />

          Limpiar
        </button>

      </section>

      {/* ===================================================
          VISTAS
      =================================================== */}

      <section className="recaudo-clientes-vistas">

        <button
          type="button"
          className={
            vista ===
            "clientes"
              ? "active"
              : ""
          }
          onClick={() =>
            cambiarVista(
              "clientes"
            )
          }
        >
          <UserRound
            size={15}
          />

          Resumen por cliente

          <span>
            {clientesVisibles.length}
          </span>
        </button>

        <button
          type="button"
          className={
            vista ===
            "detalle"
              ? "active"
              : ""
          }
          onClick={() =>
            cambiarVista(
              "detalle"
            )
          }
        >
          <List
            size={15}
          />

          Detalle de pagos

          <span>
            {registrosVisibles.length}
          </span>
        </button>

      </section>

      {/* ===================================================
          EXPORTAR
      =================================================== */}

      <section className="recaudo-clientes-export">

        <div>
          <strong>
            Informe generado
          </strong>

          <span>
            {datosVista.length} registro(s) en la vista actual
          </span>
        </div>

        <div className="recaudo-clientes-export-buttons">

          <button
            type="button"
            className="pdf"
            onClick={
              generarPDF
            }
            disabled={
              cargando
            }
          >
            <FileText
              size={17}
            />

            PDF
          </button>

          <button
            type="button"
            className="excel"
            onClick={
              generarExcel
            }
            disabled={
              cargando
            }
          >
            <FileSpreadsheet
              size={17}
            />

            Excel XLSX
          </button>

          <button
            type="button"
            className="html"
            onClick={
              generarHTML
            }
            disabled={
              cargando
            }
          >
            <Globe2
              size={17}
            />

            HTML
          </button>

        </div>

      </section>

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <div className="recaudo-clientes-error">

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={
              aplicarFiltros
            }
          >
            Reintentar
          </button>

        </div>
      )}

      {/* ===================================================
          TABLAS
      =================================================== */}

      <section className="recaudo-clientes-panel">

        {cargando ? (
          <div className="recaudo-clientes-loading">

            <RefreshCw
              size={25}
              className="recaudo-clientes-spin"
            />

            <span>
              Generando informe...
            </span>

          </div>
        ) : vista ===
          "detalle" ? (
          <div className="recaudo-clientes-table-wrapper">

            <table className="recaudo-clientes-table detalle">

              <thead>
                <tr>
                  <th>Pago</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Documento</th>
                  <th>Venta</th>
                  <th>Manzana</th>
                  <th>Lote</th>
                  <th>Área m²</th>
                  <th>Método</th>
                  <th>Referencia</th>
                  <th>Valor pago</th>
                  <th>Cuotas aplicadas</th>
                </tr>
              </thead>

              <tbody>

                {datosPagina.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={12}
                      className="recaudo-clientes-empty"
                    >
                      No hay pagos que coincidan con los filtros.
                    </td>
                  </tr>
                ) : (
                  datosPagina.map(
                    (
                      registro,
                      indice
                    ) => (
                      <tr
                        key={
                          registro._id ||
                          indice
                        }
                      >

                        <td>
                          <strong className="recaudo-clientes-codigo">
                            {registro.codigoPago ||
                              "—"}
                          </strong>
                        </td>

                        <td>
                          {formatearFecha(
                            registro.fechaPago
                          )}
                        </td>

                        <td>
                          <div className="recaudo-clientes-persona">

                            <strong>
                              {registro.cliente
                                ?.nombre ||
                                "—"}
                            </strong>

                            {registro.cliente
                              ?.ciudad && (
                              <span>
                                {registro.cliente.ciudad}
                              </span>
                            )}

                          </div>
                        </td>

                        <td>
                          {registro.cliente
                            ?.documento ||
                            "—"}
                        </td>

                        <td>
                          <strong>
                            {registro.venta
                              ?.codigo ||
                              "—"}
                          </strong>
                        </td>

                        <td>
                          {registro.manzana
                            ?.codigo ||
                            "—"}
                        </td>

                        <td>
                          <strong>
                            {registro.lote
                              ?.codigo ||
                              "—"}
                          </strong>
                        </td>

                        <td>
                          {formatearNumero(
                            registro.lote
                              ?.areaM2,
                            2
                          )}{" "}
                          m²
                        </td>

                        <td>
                          <span className="recaudo-clientes-metodo">
                            {registro.metodoPago ||
                              "—"}
                          </span>
                        </td>

                        <td>
                          {registro.referencia ||
                            "—"}
                        </td>

                        <td>
                          <strong className="recaudo-clientes-money">
                            {formatearDinero(
                              registro.valorPago
                            )}
                          </strong>
                        </td>

                        <td>
                          <span className="recaudo-clientes-contador">
                            {registro.cuotasAplicadas ||
                              0}
                          </span>
                        </td>

                      </tr>
                    )
                  )
                )}

              </tbody>

            </table>

          </div>
        ) : (
          <div className="recaudo-clientes-table-wrapper">

            <table className="recaudo-clientes-table clientes">

              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Documento</th>
                  <th>Pagos</th>
                  <th>Ventas</th>
                  <th>Lotes</th>
                  <th>Total recaudado</th>
                  <th>Efectivo</th>
                  <th>Transferencia</th>
                  <th>Consignación</th>
                  <th>PSE</th>
                  <th>Otro</th>
                  <th>Último pago</th>
                </tr>
              </thead>

              <tbody>

                {datosPagina.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={12}
                      className="recaudo-clientes-empty"
                    >
                      No hay clientes que coincidan con los filtros.
                    </td>
                  </tr>
                ) : (
                  datosPagina.map(
                    (
                      item,
                      indice
                    ) => (
                      <tr
                        key={
                          item.cliente
                            ?._id ||
                          item.cliente
                            ?.documento ||
                          indice
                        }
                      >

                        <td>
                          <div className="recaudo-clientes-persona">

                            <strong>
                              {item.cliente
                                ?.nombre ||
                                "—"}
                            </strong>

                            {item.cliente
                              ?.ciudad && (
                              <span>
                                {item.cliente.ciudad}
                              </span>
                            )}

                          </div>
                        </td>

                        <td>
                          {item.cliente
                            ?.documento ||
                            "—"}
                        </td>

                        <td>
                          <span className="recaudo-clientes-contador">
                            {item.cantidadPagos ||
                              0}
                          </span>
                        </td>

                        <td>
                          <span className="recaudo-clientes-contador">
                            {item.cantidadVentas ||
                              0}
                          </span>
                        </td>

                        <td>
                          <span className="recaudo-clientes-contador">
                            {item.cantidadLotes ||
                              0}
                          </span>
                        </td>

                        <td>
                          <strong className="recaudo-clientes-money principal">
                            {formatearDinero(
                              item.totalRecaudado
                            )}
                          </strong>
                        </td>

                        <td>
                          <strong className="recaudo-clientes-money">
                            {formatearDinero(
                              item.efectivo
                            )}
                          </strong>
                        </td>

                        <td>
                          <strong className="recaudo-clientes-money">
                            {formatearDinero(
                              item.transferencia
                            )}
                          </strong>
                        </td>

                        <td>
                          <strong className="recaudo-clientes-money">
                            {formatearDinero(
                              item.consignacion
                            )}
                          </strong>
                        </td>

                        <td>
                          <strong className="recaudo-clientes-money">
                            {formatearDinero(
                              item.pse
                            )}
                          </strong>
                        </td>

                        <td>
                          <strong className="recaudo-clientes-money">
                            {formatearDinero(
                              item.otro
                            )}
                          </strong>
                        </td>

                        <td>
                          <div className="recaudo-clientes-ultimo">

                            <strong>
                              {item.ultimoPago
                                ? formatearFecha(
                                    item.ultimoPago
                                  )
                                : "—"}
                            </strong>

                            {item.ultimoPagoCodigo && (
                              <span>
                                {item.ultimoPagoCodigo}
                              </span>
                            )}

                          </div>
                        </td>

                      </tr>
                    )
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

        {/* =================================================
            PAGINACIÓN
        ================================================= */}

        {!cargando && (
          <footer className="recaudo-clientes-table-footer">

            <span>
              Mostrando{" "}
              {datosVista.length ===
              0
                ? 0
                : (
                    paginaActual -
                    1
                  ) *
                    REGISTROS_POR_PAGINA +
                  1}
              {" - "}
              {Math.min(
                paginaActual *
                  REGISTROS_POR_PAGINA,
                datosVista.length
              )}
              {" de "}
              {datosVista.length}
            </span>

            <div className="recaudo-clientes-pagination">

              <button
                type="button"
                disabled={
                  paginaActual <=
                  1
                }
                onClick={() =>
                  setPagina(
                    (
                      actual
                    ) =>
                      Math.max(
                        1,
                        actual -
                          1
                      )
                  )
                }
              >
                Anterior
              </button>

              <strong>
                Página{" "}
                {paginaActual}
                {" de "}
                {totalPaginas}
              </strong>

              <button
                type="button"
                disabled={
                  paginaActual >=
                  totalPaginas
                }
                onClick={() =>
                  setPagina(
                    (
                      actual
                    ) =>
                      Math.min(
                        totalPaginas,
                        actual +
                          1
                      )
                  )
                }
              >
                Siguiente
              </button>

            </div>

          </footer>
        )}

      </section>

    </div>
  );
}