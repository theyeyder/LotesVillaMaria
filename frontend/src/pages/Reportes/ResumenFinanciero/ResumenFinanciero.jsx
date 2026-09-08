import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  CalendarDays,
  ChartNoAxesCombined,
  CircleDollarSign,
  FileSpreadsheet,
  FileText,
  Globe2,
  List,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  WalletCards,
  X,
} from "lucide-react";

import Toast from "../../../components/ui/Toast";

import {
  obtenerResumenFinanciero,
} from "../../../services/reportes/resumenFinanciero.service";

import exportarExcel from "../utils/exportarExcel";
import exportarPDF from "../utils/exportarPDF";
import exportarHTML from "../utils/exportarHTML";

import {
  formatearDinero,
  formatearFecha,
  formatearNumero,
  numero,
} from "../utils/formatos";

import "./ResumenFinanciero.css";

/* =========================================================
   CONSTANTES
========================================================= */

const REGISTROS_POR_PAGINA = 8;

/* =========================================================
   COMPONENTE
========================================================= */

export default function ResumenFinanciero({
  onVolver,
}) {
  /* =======================================================
     ESTADOS
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
    nota,
    setNota,
  ] = useState("");

  const [
    periodos,
    setPeriodos,
  ] = useState([]);

  const [
    composicionEgresos,
    setComposicionEgresos,
  ] = useState([]);

  const [
    resumen,
    setResumen,
  ] = useState({
    cantidadVentas: 0,
    totalVentas: 0,
    ventasContado: 0,
    valorVentasContado: 0,
    ventasFinanciadas: 0,
    valorVentasFinanciadas: 0,

    cantidadPagos: 0,
    totalRecaudo: 0,

    carteraActual: 0,
    carteraVencida: 0,
    ventasConCartera: 0,
    clientesConCartera: 0,
    cuotasPendientes: 0,
    cuotasVencidas: 0,

    cantidadEgresos: 0,
    totalEgresos: 0,
    egresosComisiones: 0,
    egresosMaquinaria: 0,
    egresosOtros: 0,

    flujoNeto: 0,
    diferenciaVentasRecaudo: 0,
  });

  /* =======================================================
     VISTA
  ======================================================= */

  const [
    vista,
    setVista,
  ] = useState(
    "periodos"
  );

  /* =======================================================
     FILTROS
  ======================================================= */

  const [
    desde,
    setDesde,
  ] = useState("");

  const [
    hasta,
    setHasta,
  ] = useState("");

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
    tipoToast = "success"
  ) => {
    setToast({
      mensaje,
      tipo:
        tipoToast,
    });
  };

  /* =======================================================
     CARGAR INFORME
  ======================================================= */

  const cargarInforme =
    async (
      filtros = {}
    ) => {
      try {
        setCargando(
          true
        );

        setError(
          ""
        );

        const respuesta =
          await obtenerResumenFinanciero(
            filtros
          );

        setNota(
          respuesta?.nota ||
          ""
        );

        setPeriodos(
          Array.isArray(
            respuesta?.periodos
          )
            ? respuesta.periodos
            : []
        );

        setComposicionEgresos(
          Array.isArray(
            respuesta?.composicionEgresos
          )
            ? respuesta.composicionEgresos
            : []
        );

        setResumen({
          cantidadVentas:
            numero(
              respuesta
                ?.resumen
                ?.cantidadVentas
            ),

          totalVentas:
            numero(
              respuesta
                ?.resumen
                ?.totalVentas
            ),

          ventasContado:
            numero(
              respuesta
                ?.resumen
                ?.ventasContado
            ),

          valorVentasContado:
            numero(
              respuesta
                ?.resumen
                ?.valorVentasContado
            ),

          ventasFinanciadas:
            numero(
              respuesta
                ?.resumen
                ?.ventasFinanciadas
            ),

          valorVentasFinanciadas:
            numero(
              respuesta
                ?.resumen
                ?.valorVentasFinanciadas
            ),

          cantidadPagos:
            numero(
              respuesta
                ?.resumen
                ?.cantidadPagos
            ),

          totalRecaudo:
            numero(
              respuesta
                ?.resumen
                ?.totalRecaudo
            ),

          carteraActual:
            numero(
              respuesta
                ?.resumen
                ?.carteraActual
            ),

          carteraVencida:
            numero(
              respuesta
                ?.resumen
                ?.carteraVencida
            ),

          ventasConCartera:
            numero(
              respuesta
                ?.resumen
                ?.ventasConCartera
            ),

          clientesConCartera:
            numero(
              respuesta
                ?.resumen
                ?.clientesConCartera
            ),

          cuotasPendientes:
            numero(
              respuesta
                ?.resumen
                ?.cuotasPendientes
            ),

          cuotasVencidas:
            numero(
              respuesta
                ?.resumen
                ?.cuotasVencidas
            ),

          cantidadEgresos:
            numero(
              respuesta
                ?.resumen
                ?.cantidadEgresos
            ),

          totalEgresos:
            numero(
              respuesta
                ?.resumen
                ?.totalEgresos
            ),

          egresosComisiones:
            numero(
              respuesta
                ?.resumen
                ?.egresosComisiones
            ),

          egresosMaquinaria:
            numero(
              respuesta
                ?.resumen
                ?.egresosMaquinaria
            ),

          egresosOtros:
            numero(
              respuesta
                ?.resumen
                ?.egresosOtros
            ),

          flujoNeto:
            numero(
              respuesta
                ?.resumen
                ?.flujoNeto
            ),

          diferenciaVentasRecaudo:
            numero(
              respuesta
                ?.resumen
                ?.diferenciaVentasRecaudo
            ),
        });

        setPagina(
          1
        );
      } catch (
        errorCargar
      ) {
        console.error(
          "Error cargando resumen financiero:",
          errorCargar
        );

        const mensaje =
          errorCargar?.response
            ?.data
            ?.message ||
          "No fue posible cargar el resumen financiero.";

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
      cargarInforme();
    },
    []
  );

  /* =======================================================
     APLICAR FILTROS
  ======================================================= */

  const aplicarFiltros =
    () => {
      cargarInforme({
        desde,
        hasta,
      });
    };

  /* =======================================================
     LIMPIAR
  ======================================================= */

  const limpiarFiltros =
    async () => {
      setDesde(
        ""
      );

      setHasta(
        ""
      );

      await cargarInforme();
    };

  /* =======================================================
     CAMBIAR VISTA
  ======================================================= */

  const cambiarVista = (
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
     DATOS VISTA
  ======================================================= */

  const datosVista =
    vista ===
    "egresos"
      ? composicionEgresos
      : periodos;

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
     COLUMNAS PERIODOS
  ======================================================= */

  const columnasPeriodos = [
    {
      titulo:
        "Periodo",

      clave:
        "periodo",

      ancho:
        20,

      anchoPDF:
        20,
    },

    {
      titulo:
        "Ventas",

      clave:
        "cantidadVentas",

      tipo:
        "numero",

      ancho:
        14,

      anchoPDF:
        14,
    },

    {
      titulo:
        "Valor vendido",

      clave:
        "ventas",

      tipo:
        "moneda",

      ancho:
        22,

      anchoPDF:
        22,
    },

    {
      titulo:
        "Pagos",

      clave:
        "cantidadPagos",

      tipo:
        "numero",

      ancho:
        14,

      anchoPDF:
        14,
    },

    {
      titulo:
        "Recaudo",

      clave:
        "recaudo",

      tipo:
        "moneda",

      ancho:
        22,

      anchoPDF:
        22,
    },

    {
      titulo:
        "Egresos",

      clave:
        "cantidadEgresos",

      tipo:
        "numero",

      ancho:
        14,

      anchoPDF:
        14,
    },

    {
      titulo:
        "Valor egresos",

      clave:
        "egresos",

      tipo:
        "moneda",

      ancho:
        22,

      anchoPDF:
        22,
    },

    {
      titulo:
        "Flujo neto",

      clave:
        "flujoNeto",

      tipo:
        "moneda",

      ancho:
        22,

      anchoPDF:
        22,
    },
  ];

  /* =======================================================
     FILAS PERIODOS
  ======================================================= */

  const filasPeriodos =
    useMemo(
      () => {
        return periodos.map(
          (item) => ({
            periodo:
              item.periodo ||
              item.clave ||
              "—",

            cantidadVentas:
              numero(
                item.cantidadVentas
              ),

            ventas:
              numero(
                item.ventas
              ),

            cantidadPagos:
              numero(
                item.cantidadPagos
              ),

            recaudo:
              numero(
                item.recaudo
              ),

            cantidadEgresos:
              numero(
                item.cantidadEgresos
              ),

            egresos:
              numero(
                item.egresos
              ),

            flujoNeto:
              numero(
                item.flujoNeto
              ),
          })
        );
      },
      [
        periodos,
      ]
    );

  /* =======================================================
     COLUMNAS COMPOSICIÓN EGRESOS
  ======================================================= */

  const columnasEgresos = [
    {
      titulo:
        "Tipo de egreso",

      clave:
        "tipo",

      ancho:
        32,

      anchoPDF:
        30,
    },

    {
      titulo:
        "Movimientos",

      clave:
        "cantidad",

      tipo:
        "numero",

      ancho:
        18,

      anchoPDF:
        18,
    },

    {
      titulo:
        "Valor",

      clave:
        "valor",

      tipo:
        "moneda",

      ancho:
        24,

      anchoPDF:
        24,
    },

    {
      titulo:
        "Participación",

      clave:
        "participacion",

      ancho:
        18,

      anchoPDF:
        18,
    },
  ];

  /* =======================================================
     FILAS EGRESOS
  ======================================================= */

  const filasEgresos =
    useMemo(
      () => {
        return composicionEgresos.map(
          (item) => {
            const total =
              numero(
                resumen.totalEgresos
              );

            const valor =
              numero(
                item.valor
              );

            const porcentaje =
              total > 0
                ? (
                    valor /
                    total
                  ) *
                  100
                : 0;

            return {
              tipo:
                item.tipo ||
                "—",

              cantidad:
                numero(
                  item.cantidad
                ),

              valor,

              participacion:
                `${formatearNumero(
                  porcentaje,
                  2
                )}%`,
            };
          }
        );
      },
      [
        composicionEgresos,
        resumen.totalEgresos,
      ]
    );

  /* =======================================================
     RESUMEN EXPORTACIÓN
  ======================================================= */

  const resumenExportacion = [
    {
      label:
        "Ventas",

      valor:
        resumen.totalVentas,

      tipo:
        "moneda",

      color:
        "dorado",

      detalle:
        `${resumen.cantidadVentas} venta(s)`,
    },

    {
      label:
        "Recaudo",

      valor:
        resumen.totalRecaudo,

      tipo:
        "moneda",

      color:
        "verde",

      detalle:
        `${resumen.cantidadPagos} pago(s)`,
    },

    {
      label:
        "Cartera actual",

      valor:
        resumen.carteraActual,

      tipo:
        "moneda",

      color:
        "azul",

      detalle:
        `${resumen.ventasConCartera} venta(s) con saldo`,
    },

    {
      label:
        "Cartera vencida",

      valor:
        resumen.carteraVencida,

      tipo:
        "moneda",

      color:
        "rojo",

      detalle:
        `${resumen.cuotasVencidas} cuota(s) vencida(s)`,
    },

    {
      label:
        "Egresos",

      valor:
        resumen.totalEgresos,

      tipo:
        "moneda",

      color:
        "rojo",

      detalle:
        `${resumen.cantidadEgresos} movimiento(s)`,
    },

    {
      label:
        "Flujo neto",

      valor:
        resumen.flujoNeto,

      tipo:
        "moneda",

      color:
        resumen.flujoNeto >= 0
          ? "verde"
          : "rojo",

      detalle:
        "Recaudo menos egresos",
    },
  ];

  /* =======================================================
     FILTROS EXPORTACIÓN
  ======================================================= */

  const filtrosExportacion =
    useMemo(
      () => {
        return [
          {
            label:
              "Desde",

            valor:
              desde
                ? formatearFecha(
                    desde
                  )
                : "Sin fecha inicial",
          },

          {
            label:
              "Hasta",

            valor:
              hasta
                ? formatearFecha(
                    hasta
                  )
                : "Sin fecha final",
          },

          {
            label:
              "Vista",

            valor:
              vista ===
              "egresos"
                ? "Composición de egresos"
                : "Evolución financiera",
          },
        ];
      },
      [
        desde,
        hasta,
        vista,
      ]
    );

  /* =======================================================
     EXPORTACIÓN
  ======================================================= */

  const columnasExportacion =
    vista ===
    "egresos"
      ? columnasEgresos
      : columnasPeriodos;

  const filasExportacion =
    vista ===
    "egresos"
      ? filasEgresos
      : filasPeriodos;

  /* =======================================================
     EXCEL
  ======================================================= */

  const generarExcel =
    () => {
      const correcto =
        exportarExcel({
          titulo:
            "Resumen financiero",

          subtitulo:
            vista ===
            "egresos"
              ? "Composición de egresos"
              : "Evolución financiera por periodo",

          nombreArchivo:
            "ResumenFinanciero",

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
            "Resumen financiero",

          subtitulo:
            vista ===
            "egresos"
              ? "Composición consolidada de egresos"
              : "Evolución mensual de ventas, recaudo y egresos",

          nombreArchivo:
            "ResumenFinanciero",

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
            "Resumen financiero",

          subtitulo:
            vista ===
            "egresos"
              ? "Composición de egresos"
              : "Evolución financiera por periodo",

          nombreArchivo:
            "ResumenFinanciero",

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
    <div className="resumen-financiero">

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

      <header className="resumen-financiero-header">

        <div className="resumen-financiero-header-left">

          {onVolver && (
            <button
              type="button"
              className="resumen-financiero-back"
              onClick={
                onVolver
              }
              title="Volver a reportes"
            >
              <ArrowLeft
                size={18}
              />
            </button>
          )}

          <div>

            <span className="resumen-financiero-kicker">
              Consolidado administrativo
            </span>

            <h1>
              Resumen financiero
            </h1>

            <p>
              Consulta ventas, recaudo, cartera, egresos y flujo neto en una sola vista administrativa.
            </p>

          </div>

        </div>

        <button
          type="button"
          className="resumen-financiero-refresh"
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
                ? "resumen-financiero-spin"
                : ""
            }
          />

          Actualizar
        </button>

      </header>

      {/* ===================================================
          NOTA
      =================================================== */}

      {nota && (
        <section className="resumen-financiero-nota">
          {nota}
        </section>
      )}

      {/* ===================================================
          TARJETAS PRINCIPALES
      =================================================== */}

      <section className="resumen-financiero-stats">

        <article className="resumen-financiero-stat">

          <i className="dorado">
            <CircleDollarSign
              size={20}
            />
          </i>

          <div>

            <span>
              Ventas
            </span>

            <strong>
              {formatearDinero(
                resumen.totalVentas
              )}
            </strong>

            <small>
              {resumen.cantidadVentas} venta(s)
            </small>

          </div>

        </article>

        <article className="resumen-financiero-stat">

          <i className="verde">
            <ArrowUpCircle
              size={20}
            />
          </i>

          <div>

            <span>
              Recaudo
            </span>

            <strong className="texto-verde">
              {formatearDinero(
                resumen.totalRecaudo
              )}
            </strong>

            <small>
              {resumen.cantidadPagos} pago(s)
            </small>

          </div>

        </article>

        <article className="resumen-financiero-stat">

          <i className="azul">
            <WalletCards
              size={20}
            />
          </i>

          <div>

            <span>
              Cartera actual
            </span>

            <strong>
              {formatearDinero(
                resumen.carteraActual
              )}
            </strong>

            <small>
              {resumen.ventasConCartera} venta(s) con saldo
            </small>

          </div>

        </article>

        <article className="resumen-financiero-stat">

          <i className="rojo">
            <TrendingDown
              size={20}
            />
          </i>

          <div>

            <span>
              Cartera vencida
            </span>

            <strong className="texto-rojo">
              {formatearDinero(
                resumen.carteraVencida
              )}
            </strong>

            <small>
              {resumen.cuotasVencidas} cuota(s) vencida(s)
            </small>

          </div>

        </article>

        <article className="resumen-financiero-stat">

          <i className="rojo">
            <ArrowDownCircle
              size={20}
            />
          </i>

          <div>

            <span>
              Egresos
            </span>

            <strong className="texto-rojo">
              {formatearDinero(
                resumen.totalEgresos
              )}
            </strong>

            <small>
              {resumen.cantidadEgresos} movimiento(s)
            </small>

          </div>

        </article>

        <article className="resumen-financiero-stat">

          <i
            className={
              resumen.flujoNeto >= 0
                ? "verde"
                : "rojo"
            }
          >
            {resumen.flujoNeto >= 0 ? (
              <TrendingUp
                size={20}
              />
            ) : (
              <TrendingDown
                size={20}
              />
            )}
          </i>

          <div>

            <span>
              Flujo neto
            </span>

            <strong
              className={
                resumen.flujoNeto >= 0
                  ? "texto-verde"
                  : "texto-rojo"
              }
            >
              {formatearDinero(
                resumen.flujoNeto
              )}
            </strong>

            <small>
              Recaudo - egresos
            </small>

          </div>

        </article>

      </section>

      {/* ===================================================
          INFORMACIÓN SECUNDARIA
      =================================================== */}

      <section className="resumen-financiero-detalles">

        <article>

          <span>
            Ventas de contado
          </span>

          <strong>
            {formatearDinero(
              resumen.valorVentasContado
            )}
          </strong>

          <small>
            {resumen.ventasContado} venta(s)
          </small>

        </article>

        <article>

          <span>
            Ventas financiadas
          </span>

          <strong>
            {formatearDinero(
              resumen.valorVentasFinanciadas
            )}
          </strong>

          <small>
            {resumen.ventasFinanciadas} venta(s)
          </small>

        </article>

        <article>

          <span>
            Cuotas pendientes
          </span>

          <strong>
            {formatearNumero(
              resumen.cuotasPendientes
            )}
          </strong>

          <small>
            Cuotas con saldo
          </small>

        </article>

        <article>

          <span>
            Diferencia ventas / recaudo
          </span>

          <strong>
            {formatearDinero(
              resumen.diferenciaVentasRecaudo
            )}
          </strong>

          <small>
            Valor vendido menos recaudo del periodo
          </small>

        </article>

      </section>

      {/* ===================================================
          FILTROS
      =================================================== */}

      <section className="resumen-financiero-filtros">

        <label className="resumen-financiero-field">

          <span>
            Desde
          </span>

          <div className="resumen-financiero-date">

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

        <label className="resumen-financiero-field">

          <span>
            Hasta
          </span>

          <div className="resumen-financiero-date">

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

        <button
          type="button"
          className="resumen-financiero-aplicar"
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
          className="resumen-financiero-limpiar"
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

      <section className="resumen-financiero-vistas">

        <button
          type="button"
          className={
            vista ===
            "periodos"
              ? "active"
              : ""
          }
          onClick={() =>
            cambiarVista(
              "periodos"
            )
          }
        >
          <ChartNoAxesCombined
            size={15}
          />

          Evolución financiera

          <span>
            {periodos.length}
          </span>

        </button>

        <button
          type="button"
          className={
            vista ===
            "egresos"
              ? "active"
              : ""
          }
          onClick={() =>
            cambiarVista(
              "egresos"
            )
          }
        >
          <List
            size={15}
          />

          Composición de egresos

          <span>
            {composicionEgresos.length}
          </span>

        </button>

      </section>

      {/* ===================================================
          EXPORTAR
      =================================================== */}

      <section className="resumen-financiero-export">

        <div>

          <strong>
            Consolidado financiero
          </strong>

          <span>
            {datosVista.length} registro(s) en la vista actual
          </span>

        </div>

        <div className="resumen-financiero-export-buttons">

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
        <div className="resumen-financiero-error">

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
          TABLA
      =================================================== */}

      <section className="resumen-financiero-panel">

        {cargando ? (
          <div className="resumen-financiero-loading">

            <RefreshCw
              size={25}
              className="resumen-financiero-spin"
            />

            <span>
              Generando resumen financiero...
            </span>

          </div>
        ) : vista ===
          "egresos" ? (
          <div className="resumen-financiero-table-wrapper">

            <table className="resumen-financiero-table egresos">

              <thead>

                <tr>
                  <th>Tipo de egreso</th>
                  <th>Movimientos</th>
                  <th>Valor</th>
                  <th>Participación</th>
                </tr>

              </thead>

              <tbody>

                {datosPagina.length ===
                0 ? (
                  <tr>

                    <td
                      colSpan={4}
                      className="resumen-financiero-empty"
                    >
                      No hay egresos registrados en el periodo seleccionado.
                    </td>

                  </tr>
                ) : (
                  datosPagina.map(
                    (
                      item,
                      indice
                    ) => {
                      const total =
                        numero(
                          resumen.totalEgresos
                        );

                      const valor =
                        numero(
                          item.valor
                        );

                      const porcentaje =
                        total > 0
                          ? (
                              valor /
                              total
                            ) *
                            100
                          : 0;

                      return (
                        <tr
                          key={
                            item.codigo ||
                            item.tipo ||
                            indice
                          }
                        >

                          <td>
                            <strong className="resumen-financiero-tipo">
                              {item.tipo ||
                                "—"}
                            </strong>
                          </td>

                          <td>
                            <span className="resumen-financiero-contador">
                              {item.cantidad ||
                                0}
                            </span>
                          </td>

                          <td>
                            <strong className="resumen-financiero-money egreso">
                              {formatearDinero(
                                item.valor
                              )}
                            </strong>
                          </td>

                          <td>
                            <div className="resumen-financiero-participacion">

                              <strong>
                                {formatearNumero(
                                  porcentaje,
                                  2
                                )}
                                %
                              </strong>

                              <div>
                                <span
                                  style={{
                                    width:
                                      `${Math.min(
                                        100,
                                        Math.max(
                                          0,
                                          porcentaje
                                        )
                                      )}%`,
                                  }}
                                />
                              </div>

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
        ) : (
          <div className="resumen-financiero-table-wrapper">

            <table className="resumen-financiero-table periodos">

              <thead>

                <tr>
                  <th>Periodo</th>
                  <th>Ventas</th>
                  <th>Valor vendido</th>
                  <th>Pagos</th>
                  <th>Recaudo</th>
                  <th>Egresos</th>
                  <th>Valor egresos</th>
                  <th>Flujo neto</th>
                </tr>

              </thead>

              <tbody>

                {datosPagina.length ===
                0 ? (
                  <tr>

                    <td
                      colSpan={8}
                      className="resumen-financiero-empty"
                    >
                      No hay movimientos financieros en el periodo seleccionado.
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
                          item.clave ||
                          indice
                        }
                      >

                        <td>
                          <strong className="resumen-financiero-periodo">
                            {item.periodo ||
                              item.clave ||
                              "—"}
                          </strong>
                        </td>

                        <td>
                          <span className="resumen-financiero-contador">
                            {item.cantidadVentas ||
                              0}
                          </span>
                        </td>

                        <td>
                          <strong className="resumen-financiero-money venta">
                            {formatearDinero(
                              item.ventas
                            )}
                          </strong>
                        </td>

                        <td>
                          <span className="resumen-financiero-contador pago">
                            {item.cantidadPagos ||
                              0}
                          </span>
                        </td>

                        <td>
                          <strong className="resumen-financiero-money recaudo">
                            {formatearDinero(
                              item.recaudo
                            )}
                          </strong>
                        </td>

                        <td>
                          <span className="resumen-financiero-contador egreso">
                            {item.cantidadEgresos ||
                              0}
                          </span>
                        </td>

                        <td>
                          <strong className="resumen-financiero-money egreso">
                            {formatearDinero(
                              item.egresos
                            )}
                          </strong>
                        </td>

                        <td>
                          <strong
                            className={`resumen-financiero-flujo ${
                              numero(
                                item.flujoNeto
                              ) >= 0
                                ? "positivo"
                                : "negativo"
                            }`}
                          >
                            {formatearDinero(
                              item.flujoNeto
                            )}
                          </strong>
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
          <footer className="resumen-financiero-table-footer">

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

            <div className="resumen-financiero-pagination">

              <button
                type="button"
                disabled={
                  paginaActual <=
                  1
                }
                onClick={() =>
                  setPagina(
                    (actual) =>
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
                    (actual) =>
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