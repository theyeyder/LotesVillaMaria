import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowDownCircle,
  BadgeDollarSign,
  Banknote,
  CalendarDays,
  FileSpreadsheet,
  FileText,
  Globe2,
  List,
  RefreshCw,
  Search,
  Tractor,
  WalletCards,
  X,
} from "lucide-react";

import Toast from "../../../components/ui/Toast";

import {
  obtenerReporteEgresos,
} from "../../../services/reportes/egresosReporte.service";

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

import "./ReporteEgresos.css";

/* =========================================================
   CONSTANTES
========================================================= */

const REGISTROS_POR_PAGINA =
  8;

/* =========================================================
   COMPONENTE
========================================================= */

export default function ReporteEgresos({
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
    tipos,
    setTipos,
  ] = useState([]);

  const [
    registros,
    setRegistros,
  ] = useState([]);

  const [
    resumen,
    setResumen,
  ] = useState({
    movimientos: 0,
    totalEgresos: 0,
    totalComisiones: 0,
    totalMaquinaria: 0,
    totalOtros: 0,
    cantidadAbonos: 0,
    cantidadPagos: 0,
    valorAbonos: 0,
    valorPagos: 0,
  });

  /* =======================================================
     VISTA
  ======================================================= */

  const [
    vista,
    setVista,
  ] = useState(
    "tipos"
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
    tipo,
    setTipo,
  ] = useState("");

  const [
    tipoMovimiento,
    setTipoMovimiento,
  ] = useState("");

  const [
    formaPago,
    setFormaPago,
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
          await obtenerReporteEgresos(
            filtros
          );

        const nuevosTipos =
          Array.isArray(
            respuesta?.tipos
          )
            ? respuesta.tipos
            : [];

        const nuevosRegistros =
          Array.isArray(
            respuesta?.registros
          )
            ? respuesta.registros
            : [];

        setTipos(
          nuevosTipos
        );

        setRegistros(
          nuevosRegistros
        );

        setResumen({
          movimientos:
            numero(
              respuesta
                ?.resumen
                ?.movimientos
            ),

          totalEgresos:
            numero(
              respuesta
                ?.resumen
                ?.totalEgresos
            ),

          totalComisiones:
            numero(
              respuesta
                ?.resumen
                ?.totalComisiones
            ),

          totalMaquinaria:
            numero(
              respuesta
                ?.resumen
                ?.totalMaquinaria
            ),

          totalOtros:
            numero(
              respuesta
                ?.resumen
                ?.totalOtros
            ),

          cantidadAbonos:
            numero(
              respuesta
                ?.resumen
                ?.cantidadAbonos
            ),

          cantidadPagos:
            numero(
              respuesta
                ?.resumen
                ?.cantidadPagos
            ),

          valorAbonos:
            numero(
              respuesta
                ?.resumen
                ?.valorAbonos
            ),

          valorPagos:
            numero(
              respuesta
                ?.resumen
                ?.valorPagos
            ),
        });

        setPagina(
          1
        );
      } catch (
        errorCargar
      ) {
        console.error(
          "Error cargando informe de egresos:",
          errorCargar
        );

        const mensaje =
          errorCargar?.response
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
        buscar,
        desde,
        hasta,
        tipo,
        tipoMovimiento,
        formaPago,
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

      setTipo(
        ""
      );

      setTipoMovimiento(
        ""
      );

      setFormaPago(
        ""
      );

      await cargarInforme();
    };

  /* =======================================================
     FILTRO LOCAL TIPOS
  ======================================================= */

  const tiposVisibles =
    useMemo(
      () => {
        const busqueda =
          normalizarTexto(
            buscar
          );

        if (
          !busqueda
        ) {
          return tipos;
        }

        return tipos.filter(
          (
            item
          ) =>
            normalizarTexto(
              item.tipo
            ).includes(
              busqueda
            )
        );
      },
      [
        tipos,
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
              registro.codigo,

              registro.tipo,

              registro.tipoMovimiento,

              registro.beneficiario
                ?.nombre,

              registro.beneficiario
                ?.documento,

              registro.concepto,

              registro.formaPago,

              registro.referenciaPago,

              registro.observaciones,

              registro.vendedor
                ?.codigo,

              registro.vendedor
                ?.nombre,

              registro.vendedor
                ?.documento,

              registro.comision
                ?.codigo,

              registro.venta
                ?.codigo,

              registro.manzana
                ?.codigo,

              registro.lote
                ?.codigo,

              registro.maquinaria
                ?.codigo,

              registro.maquinaria
                ?.nombre,

              registro.horaMaquinaria
                ?.operario,
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
     DATOS DE LA VISTA
  ======================================================= */

  const datosVista =
    vista ===
    "detalle"
      ? registrosVisibles
      : tiposVisibles;

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
     TEXTO TIPO
  ======================================================= */

  const nombreTipo = (
    valor
  ) => {
    if (
      valor ===
      "Comision"
    ) {
      return "Comisiones";
    }

    if (
      valor ===
      "HorasMaquinaria"
    ) {
      return "Horas de maquinaria";
    }

    if (
      valor ===
      "Otro"
    ) {
      return "Otros";
    }

    return (
      valor ||
      "—"
    );
  };

  /* =======================================================
     COLUMNAS RESUMEN
  ======================================================= */

  const columnasTipos = [
    {
      titulo:
        "Tipo de egreso",

      clave:
        "tipo",

      ancho:
        26,

      anchoPDF:
        26,
    },

    {
      titulo:
        "Movimientos",

      clave:
        "movimientos",

      tipo:
        "numero",

      ancho:
        15,

      anchoPDF:
        15,
    },

    {
      titulo:
        "Abonos",

      clave:
        "abonos",

      tipo:
        "numero",

      ancho:
        13,

      anchoPDF:
        13,
    },

    {
      titulo:
        "Valor abonos",

      clave:
        "valorAbonos",

      tipo:
        "moneda",

      ancho:
        20,

      anchoPDF:
        21,
    },

    {
      titulo:
        "Pagos",

      clave:
        "pagos",

      tipo:
        "numero",

      ancho:
        13,

      anchoPDF:
        13,
    },

    {
      titulo:
        "Valor pagos",

      clave:
        "valorPagos",

      tipo:
        "moneda",

      ancho:
        20,

      anchoPDF:
        21,
    },

    {
      titulo:
        "Total egresado",

      clave:
        "totalEgresado",

      tipo:
        "moneda",

      ancho:
        22,

      anchoPDF:
        23,
    },
  ];

  /* =======================================================
     FILAS RESUMEN
  ======================================================= */

  const filasTipos =
    useMemo(
      () => {
        return tiposVisibles.map(
          (
            item
          ) => ({
            tipo:
              nombreTipo(
                item.tipo
              ),

            movimientos:
              numero(
                item.cantidadMovimientos
              ),

            abonos:
              numero(
                item.cantidadAbonos
              ),

            valorAbonos:
              numero(
                item.valorAbonos
              ),

            pagos:
              numero(
                item.cantidadPagos
              ),

            valorPagos:
              numero(
                item.valorPagos
              ),

            totalEgresado:
              numero(
                item.totalEgresado
              ),
          })
        );
      },
      [
        tiposVisibles,
      ]
    );

  /* =======================================================
     COLUMNAS DETALLE
  ======================================================= */

  const columnasDetalle = [
    {
      titulo:
        "Egreso",

      clave:
        "codigo",

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
        15,

      anchoPDF:
        16,
    },

    {
      titulo:
        "Tipo",

      clave:
        "tipo",

      ancho:
        20,

      anchoPDF:
        19,
    },

    {
      titulo:
        "Movimiento",

      clave:
        "movimiento",

      ancho:
        16,

      anchoPDF:
        16,
    },

    {
      titulo:
        "Beneficiario",

      clave:
        "beneficiario",

      ancho:
        27,

      anchoPDF:
        25,
    },

    {
      titulo:
        "Documento",

      clave:
        "documento",

      ancho:
        18,

      anchoPDF:
        18,
    },

    {
      titulo:
        "Concepto",

      clave:
        "concepto",

      ancho:
        35,

      anchoPDF:
        32,
    },

    {
      titulo:
        "Valor",

      clave:
        "valor",

      tipo:
        "moneda",

      ancho:
        20,

      anchoPDF:
        21,
    },

    {
      titulo:
        "Saldo antes",

      clave:
        "saldoAntes",

      tipo:
        "moneda",

      ancho:
        20,

      anchoPDF:
        21,
    },

    {
      titulo:
        "Saldo después",

      clave:
        "saldoDespues",

      tipo:
        "moneda",

      ancho:
        20,

      anchoPDF:
        21,
    },

    {
      titulo:
        "Forma pago",

      clave:
        "formaPago",

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
        "Origen",

      clave:
        "origen",

      ancho:
        24,

      anchoPDF:
        22,
    },
  ];

  /* =======================================================
     ORIGEN
  ======================================================= */

  const obtenerOrigen = (
    registro
  ) => {
    if (
      registro.tipo ===
      "Comision"
    ) {
      const partes = [
        registro.comision
          ?.codigo,

        registro.venta
          ?.codigo,

        registro.lote
          ?.codigo,
      ].filter(Boolean);

      return (
        partes.join(
          " · "
        ) ||
        "Comisión"
      );
    }

    if (
      registro.tipo ===
      "HorasMaquinaria"
    ) {
      const partes = [
        registro.maquinaria
          ?.codigo,

        registro.maquinaria
          ?.nombre,

        registro.horaMaquinaria
          ?.operario,
      ].filter(Boolean);

      return (
        partes.join(
          " · "
        ) ||
        "Maquinaria"
      );
    }

    return "Otro";
  };

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
            codigo:
              registro.codigo ||
              "—",

            fecha:
              registro.fecha,

            tipo:
              nombreTipo(
                registro.tipo
              ),

            movimiento:
              registro.tipoMovimiento ||
              "—",

            beneficiario:
              registro.beneficiario
                ?.nombre ||
              "—",

            documento:
              registro.beneficiario
                ?.documento ||
              "—",

            concepto:
              registro.concepto ||
              "—",

            valor:
              numero(
                registro.valor
              ),

            saldoAntes:
              numero(
                registro.saldoAntes
              ),

            saldoDespues:
              numero(
                registro.saldoDespues
              ),

            formaPago:
              registro.formaPago ||
              "—",

            referencia:
              registro.referenciaPago ||
              "—",

            origen:
              obtenerOrigen(
                registro
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
        "Movimientos",

      valor:
        resumen.movimientos,

      tipo:
        "numero",

      color:
        "azul",

      detalle:
        "Movimientos de egreso registrados",
    },

    {
      label:
        "Total egresos",

      valor:
        resumen.totalEgresos,

      tipo:
        "moneda",

      color:
        "rojo",

      detalle:
        "Total de dinero salido",
    },

    {
      label:
        "Comisiones",

      valor:
        resumen.totalComisiones,

      tipo:
        "moneda",

      color:
        "dorado",

      detalle:
        "Egresos por comisiones",
    },

    {
      label:
        "Maquinaria",

      valor:
        resumen.totalMaquinaria,

      tipo:
        "moneda",

      color:
        "azul",

      detalle:
        "Egresos por horas de maquinaria",
    },

    {
      label:
        "Otros",

      valor:
        resumen.totalOtros,

      tipo:
        "moneda",

      detalle:
        "Otros egresos registrados",
    },

    {
      label:
        "Abonos",

      valor:
        resumen.valorAbonos,

      tipo:
        "moneda",

      color:
        "dorado",

      detalle:
        `${resumen.cantidadAbonos} movimiento(s)`,
    },

    {
      label:
        "Pagos",

      valor:
        resumen.valorPagos,

      tipo:
        "moneda",

      color:
        "verde",

      detalle:
        `${resumen.cantidadPagos} movimiento(s)`,
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
              "Tipo",

            valor:
              tipo
                ? nombreTipo(
                    tipo
                  )
                : "Todos",
          },

          {
            label:
              "Movimiento",

            valor:
              tipoMovimiento ||
              "Todos",
          },

          {
            label:
              "Forma de pago",

            valor:
              formaPago ||
              "Todas",
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
                ? "Detalle de movimientos"
                : "Resumen por tipo",
          },
        ];
      },
      [
        desde,
        hasta,
        tipo,
        tipoMovimiento,
        formaPago,
        buscar,
        vista,
      ]
    );

  /* =======================================================
     EXPORTACIÓN
  ======================================================= */

  const columnasExportacion =
    vista ===
    "detalle"
      ? columnasDetalle
      : columnasTipos;

  const filasExportacion =
    vista ===
    "detalle"
      ? filasDetalle
      : filasTipos;

  /* =======================================================
     EXCEL
  ======================================================= */

  const generarExcel =
    () => {
      const correcto =
        exportarExcel({
          titulo:
            "Informe de egresos",

          subtitulo:
            vista ===
            "detalle"
              ? "Detalle de movimientos de tesorería"
              : "Resumen consolidado por tipo de egreso",

          nombreArchivo:
            "InformeEgresos",

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
            "Informe de egresos",

          subtitulo:
            vista ===
            "detalle"
              ? "Detalle de egresos, beneficiarios y movimientos"
              : "Resumen consolidado por tipo de egreso",

          nombreArchivo:
            "InformeEgresos",

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
            "Informe de egresos",

          subtitulo:
            vista ===
            "detalle"
              ? "Detalle de movimientos de egreso"
              : "Resumen consolidado de egresos",

          nombreArchivo:
            "InformeEgresos",

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
    <div className="reporte-egresos">

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

      <header className="reporte-egresos-header">

        <div className="reporte-egresos-header-left">

          {onVolver && (
            <button
              type="button"
              className="reporte-egresos-back"
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

            <span className="reporte-egresos-kicker">
              Tesorería
            </span>

            <h1>
              Informe de egresos
            </h1>

            <p>
              Consulta salidas de dinero por comisiones, maquinaria y otros conceptos, incluyendo beneficiarios, movimientos y formas de pago.
            </p>

          </div>

        </div>

        <button
          type="button"
          className="reporte-egresos-refresh"
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
                ? "reporte-egresos-spin"
                : ""
            }
          />

          Actualizar
        </button>

      </header>

      {/* ===================================================
          TARJETAS RESUMEN
      =================================================== */}

      <section className="reporte-egresos-stats">

        <article className="reporte-egresos-stat">

          <i className="azul">
            <ArrowDownCircle
              size={20}
            />
          </i>

          <div>

            <span>
              Movimientos
            </span>

            <strong>
              {formatearNumero(
                resumen.movimientos
              )}
            </strong>

            <small>
              Egresos registrados
            </small>

          </div>

        </article>

        <article className="reporte-egresos-stat">

          <i className="rojo">
            <Banknote
              size={20}
            />
          </i>

          <div>

            <span>
              Total egresos
            </span>

            <strong className="texto-rojo">
              {formatearDinero(
                resumen.totalEgresos
              )}
            </strong>

            <small>
              Dinero total salido
            </small>

          </div>

        </article>

        <article className="reporte-egresos-stat">

          <i className="dorado">
            <BadgeDollarSign
              size={20}
            />
          </i>

          <div>

            <span>
              Comisiones
            </span>

            <strong>
              {formatearDinero(
                resumen.totalComisiones
              )}
            </strong>

            <small>
              Pagos a vendedores
            </small>

          </div>

        </article>

        <article className="reporte-egresos-stat">

          <i className="azul">
            <Tractor
              size={20}
            />
          </i>

          <div>

            <span>
              Maquinaria
            </span>

            <strong>
              {formatearDinero(
                resumen.totalMaquinaria
              )}
            </strong>

            <small>
              Horas de maquinaria
            </small>

          </div>

        </article>

        <article className="reporte-egresos-stat">

          <i>
            <WalletCards
              size={20}
            />
          </i>

          <div>

            <span>
              Otros
            </span>

            <strong>
              {formatearDinero(
                resumen.totalOtros
              )}
            </strong>

            <small>
              Otros conceptos
            </small>

          </div>

        </article>

        <article className="reporte-egresos-stat">

          <i className="verde">
            <Banknote
              size={20}
            />
          </i>

          <div>

            <span>
              Pagos completos
            </span>

            <strong className="texto-verde">
              {formatearDinero(
                resumen.valorPagos
              )}
            </strong>

            <small>
              {resumen.cantidadPagos} movimiento(s)
            </small>

          </div>

        </article>

      </section>

      {/* ===================================================
          FILTROS
      =================================================== */}

      <section className="reporte-egresos-filtros">

        <div className="reporte-egresos-search">

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
            placeholder="Código, beneficiario, concepto, vendedor..."
          />

        </div>

        <label className="reporte-egresos-field">

          <span>
            Desde
          </span>

          <div className="reporte-egresos-date">

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

        <label className="reporte-egresos-field">

          <span>
            Hasta
          </span>

          <div className="reporte-egresos-date">

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

        <label className="reporte-egresos-field">

          <span>
            Tipo
          </span>

          <select
            value={
              tipo
            }
            onChange={(
              event
            ) =>
              setTipo(
                event.target.value
              )
            }
          >
            <option value="">
              Todos
            </option>

            <option value="Comision">
              Comisiones
            </option>

            <option value="HorasMaquinaria">
              Horas de maquinaria
            </option>

            <option value="Otro">
              Otros
            </option>

          </select>

        </label>

        <label className="reporte-egresos-field">

          <span>
            Movimiento
          </span>

          <select
            value={
              tipoMovimiento
            }
            onChange={(
              event
            ) =>
              setTipoMovimiento(
                event.target.value
              )
            }
          >
            <option value="">
              Todos
            </option>

            <option value="Abono">
              Abono
            </option>

            <option value="Pago">
              Pago
            </option>

          </select>

        </label>

        <label className="reporte-egresos-field">

          <span>
            Forma de pago
          </span>

          <select
            value={
              formaPago
            }
            onChange={(
              event
            ) =>
              setFormaPago(
                event.target.value
              )
            }
          >
            <option value="">
              Todas
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

            <option value="Otro">
              Otro
            </option>

          </select>

        </label>

        <button
          type="button"
          className="reporte-egresos-aplicar"
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
          className="reporte-egresos-limpiar"
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

      <section className="reporte-egresos-vistas">

        <button
          type="button"
          className={
            vista ===
            "tipos"
              ? "active"
              : ""
          }
          onClick={() =>
            cambiarVista(
              "tipos"
            )
          }
        >
          <WalletCards
            size={15}
          />

          Resumen por tipo

          <span>
            {tiposVisibles.length}
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

          Detalle de egresos

          <span>
            {registrosVisibles.length}
          </span>

        </button>

      </section>

      {/* ===================================================
          EXPORTAR
      =================================================== */}

      <section className="reporte-egresos-export">

        <div>

          <strong>
            Movimientos de tesorería
          </strong>

          <span>
            {datosVista.length} registro(s) en la vista actual
          </span>

        </div>

        <div className="reporte-egresos-export-buttons">

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
        <div className="reporte-egresos-error">

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

      <section className="reporte-egresos-panel">

        {cargando ? (
          <div className="reporte-egresos-loading">

            <RefreshCw
              size={25}
              className="reporte-egresos-spin"
            />

            <span>
              Generando informe...
            </span>

          </div>
        ) : vista ===
          "detalle" ? (
          <div className="reporte-egresos-table-wrapper">

            <table className="reporte-egresos-table detalle">

              <thead>

                <tr>
                  <th>Egreso</th>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Movimiento</th>
                  <th>Beneficiario</th>
                  <th>Documento</th>
                  <th>Concepto</th>
                  <th>Valor</th>
                  <th>Saldo antes</th>
                  <th>Saldo después</th>
                  <th>Forma pago</th>
                  <th>Referencia</th>
                  <th>Origen</th>
                </tr>

              </thead>

              <tbody>

                {datosPagina.length ===
                0 ? (
                  <tr>

                    <td
                      colSpan={13}
                      className="reporte-egresos-empty"
                    >
                      No hay egresos que coincidan con los filtros seleccionados.
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
                          <strong className="reporte-egresos-codigo">
                            {registro.codigo ||
                              "—"}
                          </strong>
                        </td>

                        <td>
                          {formatearFecha(
                            registro.fecha
                          )}
                        </td>

                        <td>
                          <span
                            className={`reporte-egresos-tipo ${String(
                              registro.tipo ||
                                ""
                            ).toLowerCase()}`}
                          >
                            {nombreTipo(
                              registro.tipo
                            )}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`reporte-egresos-movimiento ${String(
                              registro.tipoMovimiento ||
                                ""
                            ).toLowerCase()}`}
                          >
                            {registro.tipoMovimiento ||
                              "—"}
                          </span>
                        </td>

                        <td>
                          <div className="reporte-egresos-beneficiario">

                            <strong>
                              {registro.beneficiario
                                ?.nombre ||
                                "—"}
                            </strong>

                            {registro.tipo ===
                              "Comision" &&
                              registro.vendedor
                                ?.codigo && (
                                <span>
                                  {registro.vendedor.codigo}
                                </span>
                              )}

                          </div>
                        </td>

                        <td>
                          {registro.beneficiario
                            ?.documento ||
                            "—"}
                        </td>

                        <td>
                          <span className="reporte-egresos-concepto">
                            {registro.concepto ||
                              "—"}
                          </span>
                        </td>

                        <td>
                          <strong className="reporte-egresos-money principal">
                            {formatearDinero(
                              registro.valor
                            )}
                          </strong>
                        </td>

                        <td>
                          <strong className="reporte-egresos-money">
                            {formatearDinero(
                              registro.saldoAntes
                            )}
                          </strong>
                        </td>

                        <td>
                          <strong className="reporte-egresos-money saldo">
                            {formatearDinero(
                              registro.saldoDespues
                            )}
                          </strong>
                        </td>

                        <td>
                          <span className="reporte-egresos-forma">
                            {registro.formaPago ||
                              "—"}
                          </span>
                        </td>

                        <td>
                          {registro.referenciaPago ||
                            "—"}
                        </td>

                        <td>
                          <div className="reporte-egresos-origen">

                            <strong>
                              {obtenerOrigen(
                                registro
                              )}
                            </strong>

                            {registro.tipo ===
                              "Comision" &&
                              registro.manzana
                                ?.codigo && (
                                <span>
                                  Manzana{" "}
                                  {registro.manzana.codigo}
                                </span>
                              )}

                            {registro.tipo ===
                              "HorasMaquinaria" &&
                              registro.horaMaquinaria
                                ?.codigo && (
                                <span>
                                  {registro.horaMaquinaria.codigo}
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
        ) : (
          <div className="reporte-egresos-table-wrapper">

            <table className="reporte-egresos-table tipos">

              <thead>

                <tr>
                  <th>Tipo de egreso</th>
                  <th>Movimientos</th>
                  <th>Abonos</th>
                  <th>Valor abonos</th>
                  <th>Pagos</th>
                  <th>Valor pagos</th>
                  <th>Total egresado</th>
                </tr>

              </thead>

              <tbody>

                {datosPagina.length ===
                0 ? (
                  <tr>

                    <td
                      colSpan={7}
                      className="reporte-egresos-empty"
                    >
                      No hay egresos que coincidan con los filtros seleccionados.
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
                          item.tipo ||
                          indice
                        }
                      >

                        <td>
                          <div className="reporte-egresos-tipo-info">

                            <strong>
                              {nombreTipo(
                                item.tipo
                              )}
                            </strong>

                            <span>
                              Categoría de egreso
                            </span>

                          </div>
                        </td>

                        <td>
                          <span className="reporte-egresos-contador principal">
                            {item.cantidadMovimientos ||
                              0}
                          </span>
                        </td>

                        <td>
                          <span className="reporte-egresos-contador abono">
                            {item.cantidadAbonos ||
                              0}
                          </span>
                        </td>

                        <td>
                          <strong className="reporte-egresos-money abono">
                            {formatearDinero(
                              item.valorAbonos
                            )}
                          </strong>
                        </td>

                        <td>
                          <span className="reporte-egresos-contador pago">
                            {item.cantidadPagos ||
                              0}
                          </span>
                        </td>

                        <td>
                          <strong className="reporte-egresos-money pago">
                            {formatearDinero(
                              item.valorPagos
                            )}
                          </strong>
                        </td>

                        <td>
                          <strong className="reporte-egresos-money principal">
                            {formatearDinero(
                              item.totalEgresado
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
          <footer className="reporte-egresos-table-footer">

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

            <div className="reporte-egresos-pagination">

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