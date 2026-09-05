import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  BadgeDollarSign,
  Banknote,
  CalendarDays,
  CircleDollarSign,
  FileSpreadsheet,
  FileText,
  Globe2,
  LayoutList,
  RefreshCw,
  Search,
  TriangleAlert,
  UserRoundCheck,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";

import Toast from "../../../components/ui/Toast";

import {
  obtenerReporteComisiones,
} from "../../../services/reportes/comisionesReporte.service";

import exportarExcel from "../utils/exportarExcel";
import exportarPDF from "../utils/exportarPDF";
import exportarHTML from "../utils/exportarHTML";

import {
  formatearDinero,
  formatearFecha,
  formatearNumero,
  formatearPorcentaje,
  normalizarTexto,
  numero,
} from "../utils/formatos";

import "./ReporteComisiones.css";

/* =========================================================
   CONFIGURACIÓN
========================================================= */

const REGISTROS_POR_PAGINA =
  8;

/* =========================================================
   COMPONENTE
========================================================= */

export default function ReporteComisiones({
  onVolver,
}) {
  /* =======================================================
     ESTADO GENERAL
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
    registros,
    setRegistros,
  ] = useState([]);

  const [
    resumenVendedores,
    setResumenVendedores,
  ] = useState([]);

  const [
    resumen,
    setResumen,
  ] = useState({
    vendedores: 0,
    lotesVendidos: 0,
    comisionesGeneradas: 0,

    totalGenerado: 0,
    totalPagado: 0,
    saldoPendiente: 0,

    comisionesPendientes: 0,
    comisionesAbonadas: 0,
    comisionesPagadas: 0,

    porcentajePagado: 0,
  });

  /* =======================================================
     VISTA
  ======================================================= */

  const [
    vista,
    setVista,
  ] = useState(
    "detalle"
  );

  /* =======================================================
     OPCIONES DE VENDEDORES
  ======================================================= */

  const [
    opcionesVendedor,
    setOpcionesVendedor,
  ] = useState([]);

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
    vendedor,
    setVendedor,
  ] = useState("");

  const [
    estado,
    setEstado,
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
    tipo = "success"
  ) => {
    setToast({
      mensaje,
      tipo,
    });
  };

  /* =======================================================
     CONSTRUIR OPCIONES DE VENDEDORES
  ======================================================= */

  const actualizarVendedores = (
    vendedores = [],
    movimientos = []
  ) => {
    const mapa =
      new Map();

    vendedores.forEach(
      (item) => {
        const vendedorItem =
          item?.vendedor;

        if (
          !vendedorItem
        ) {
          return;
        }

        const id =
          vendedorItem._id ||
          vendedorItem.codigo ||
          vendedorItem.nombre;

        if (
          !id
        ) {
          return;
        }

        mapa.set(
          String(id),
          {
            id,
            codigo:
              vendedorItem.codigo ||
              "",

            nombre:
              vendedorItem.nombre ||
              "Sin vendedor",

            documento:
              vendedorItem.documento ||
              "",
          }
        );
      }
    );

    movimientos.forEach(
      (registro) => {
        const vendedorItem =
          registro?.vendedor;

        if (
          !vendedorItem
        ) {
          return;
        }

        const id =
          vendedorItem._id ||
          vendedorItem.codigo ||
          vendedorItem.nombre;

        if (
          !id
        ) {
          return;
        }

        mapa.set(
          String(id),
          {
            id,
            codigo:
              vendedorItem.codigo ||
              "",

            nombre:
              vendedorItem.nombre ||
              "Sin vendedor",

            documento:
              vendedorItem.documento ||
              "",
          }
        );
      }
    );

    setOpcionesVendedor(
      Array.from(
        mapa.values()
      ).sort(
        (a, b) =>
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
          await obtenerReporteComisiones(
            filtros
          );

        const nuevosRegistros =
          Array.isArray(
            respuesta?.registros
          )
            ? respuesta.registros
            : [];

        const nuevosVendedores =
          Array.isArray(
            respuesta?.resumenVendedores
          )
            ? respuesta.resumenVendedores
            : [];

        setRegistros(
          nuevosRegistros
        );

        setResumenVendedores(
          nuevosVendedores
        );

        setResumen({
          vendedores:
            numero(
              respuesta
                ?.resumen
                ?.vendedores
            ),

          lotesVendidos:
            numero(
              respuesta
                ?.resumen
                ?.lotesVendidos
            ),

          comisionesGeneradas:
            numero(
              respuesta
                ?.resumen
                ?.comisionesGeneradas
            ),

          totalGenerado:
            numero(
              respuesta
                ?.resumen
                ?.totalGenerado
            ),

          totalPagado:
            numero(
              respuesta
                ?.resumen
                ?.totalPagado
            ),

          saldoPendiente:
            numero(
              respuesta
                ?.resumen
                ?.saldoPendiente
            ),

          comisionesPendientes:
            numero(
              respuesta
                ?.resumen
                ?.comisionesPendientes
            ),

          comisionesAbonadas:
            numero(
              respuesta
                ?.resumen
                ?.comisionesAbonadas
            ),

          comisionesPagadas:
            numero(
              respuesta
                ?.resumen
                ?.comisionesPagadas
            ),

          porcentajePagado:
            numero(
              respuesta
                ?.resumen
                ?.porcentajePagado
            ),
        });

        if (
          actualizarOpciones
        ) {
          actualizarVendedores(
            nuevosVendedores,
            nuevosRegistros
          );
        }

        setPagina(
          1
        );
      } catch (error) {
        console.error(
          "Error cargando informe de comisiones:",
          error
        );

        const mensaje =
          error?.response
            ?.data
            ?.message ||
          "No fue posible cargar el informe de comisiones.";

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

  useEffect(() => {
    cargarInforme(
      {},
      true
    );
  }, []);

  /* =======================================================
     APLICAR FILTROS
  ======================================================= */

  const aplicarFiltros =
    () => {
      cargarInforme({
        buscar,
        desde,
        hasta,
        vendedor,
        estado,
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

      setVendedor(
        ""
      );

      setEstado(
        ""
      );

      setPagina(
        1
      );

      await cargarInforme(
        {},
        true
      );
    };

  /* =======================================================
     BUSCADOR LOCAL - DETALLE
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
          (registro) => {
            const campos = [
              registro.codigo,

              registro.venta
                ?.codigo,

              registro.vendedor
                ?.codigo,

              registro.vendedor
                ?.nombre,

              registro.vendedor
                ?.documento,

              registro.cliente
                ?.nombre,

              registro.cliente
                ?.documento,

              registro.manzana
                ?.codigo,

              registro.lote
                ?.codigo,

              registro.lote
                ?.tipo,

              registro.estado,

              registro.observaciones,
            ];

            return campos.some(
              (campo) =>
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
     BUSCADOR LOCAL - CONSOLIDADO
  ======================================================= */

  const vendedoresVisibles =
    useMemo(
      () => {
        const busqueda =
          normalizarTexto(
            buscar
          );

        if (
          !busqueda
        ) {
          return resumenVendedores;
        }

        return resumenVendedores.filter(
          (item) => {
            const campos = [
              item.vendedor
                ?.codigo,

              item.vendedor
                ?.nombre,

              item.vendedor
                ?.documento,
            ];

            return campos.some(
              (campo) =>
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
        resumenVendedores,
        buscar,
      ]
    );

  /* =======================================================
     DATOS DE LA VISTA ACTUAL
  ======================================================= */

  const datosVista =
    vista ===
    "vendedores"
      ? vendedoresVisibles
      : registrosVisibles;

  /* =======================================================
     PAGINACIÓN
  ======================================================= */

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
     COLUMNAS - DETALLE
  ======================================================= */

  const columnasDetalle = [
    {
      titulo:
        "Comisión",
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
        "fechaGeneracion",
      tipo:
        "fecha",
      ancho:
        14,
      anchoPDF:
        16,
    },

    {
      titulo:
        "Vendedor",
      clave:
        "vendedor",
      ancho:
        29,
      anchoPDF:
        28,
    },

    {
      titulo:
        "Documento vendedor",
      clave:
        "documentoVendedor",
      ancho:
        20,
      anchoPDF:
        21,
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
        "Cliente",
      clave:
        "cliente",
      ancho:
        28,
      anchoPDF:
        27,
    },

    {
      titulo:
        "Documento cliente",
      clave:
        "documentoCliente",
      ancho:
        19,
      anchoPDF:
        20,
    },

    {
      titulo:
        "Manzana",
      clave:
        "manzana",
      ancho:
        13,
      anchoPDF:
        14,
    },

    {
      titulo:
        "Lote",
      clave:
        "lote",
      ancho:
        13,
      anchoPDF:
        14,
    },

    {
      titulo:
        "Valor venta",
      clave:
        "valorVenta",
      tipo:
        "moneda",
      ancho:
        19,
      anchoPDF:
        22,
    },

    {
      titulo:
        "Comisión generada",
      clave:
        "valorComision",
      tipo:
        "moneda",
      ancho:
        20,
      anchoPDF:
        22,
    },

    {
      titulo:
        "Pagado",
      clave:
        "totalPagado",
      tipo:
        "moneda",
      ancho:
        19,
      anchoPDF:
        21,
    },

    {
      titulo:
        "Saldo pendiente",
      clave:
        "saldoPendiente",
      tipo:
        "moneda-pendiente",
      ancho:
        20,
      anchoPDF:
        22,
    },

    {
      titulo:
        "% pagado",
      clave:
        "porcentajePagado",
      ancho:
        13,
      anchoPDF:
        14,
    },

    {
      titulo:
        "Estado",
      clave:
        "estado",
      tipo:
        "estado",
      ancho:
        14,
      anchoPDF:
        15,
    },

    {
      titulo:
        "Último pago",
      clave:
        "fechaUltimoPago",
      tipo:
        "fecha",
      ancho:
        15,
      anchoPDF:
        17,
    },
  ];

  /* =======================================================
     FILAS - DETALLE
  ======================================================= */

  const filasDetalle =
    useMemo(
      () => {
        return registrosVisibles.map(
          (registro) => ({
            codigo:
              registro.codigo ||
              "—",

            fechaGeneracion:
              registro.fechaGeneracion,

            vendedor:
              registro.vendedor
                ?.nombre ||
              "Sin vendedor",

            documentoVendedor:
              registro.vendedor
                ?.documento ||
              "—",

            venta:
              registro.venta
                ?.codigo ||
              "—",

            cliente:
              registro.cliente
                ?.nombre ||
              "—",

            documentoCliente:
              registro.cliente
                ?.documento ||
              "—",

            manzana:
              registro.manzana
                ?.codigo ||
              "—",

            lote:
              registro.lote
                ?.codigo ||
              "—",

            valorVenta:
              numero(
                registro.venta
                  ?.valorVenta
              ),

            valorComision:
              numero(
                registro.valorComision
              ),

            totalPagado:
              numero(
                registro.totalPagado
              ),

            saldoPendiente:
              numero(
                registro.saldoPendiente
              ),

            porcentajePagado:
              formatearPorcentaje(
                registro.porcentajePagado,
                1
              ),

            estado:
              registro.estado ||
              "—",

            fechaUltimoPago:
              registro.fechaUltimoPago,
          })
        );
      },
      [
        registrosVisibles,
      ]
    );

  /* =======================================================
     COLUMNAS - CONSOLIDADO VENDEDORES
  ======================================================= */

  const columnasVendedores = [
    {
      titulo:
        "Código",
      clave:
        "codigo",
      ancho:
        14,
      anchoPDF:
        15,
    },

    {
      titulo:
        "Vendedor",
      clave:
        "vendedor",
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
        19,
      anchoPDF:
        20,
    },

    {
      titulo:
        "Lotes vendidos",
      clave:
        "lotesVendidos",
      tipo:
        "numero",
      ancho:
        15,
      anchoPDF:
        16,
    },

    {
      titulo:
        "Comisiones",
      clave:
        "comisionesGeneradas",
      tipo:
        "numero",
      ancho:
        15,
      anchoPDF:
        16,
    },

    {
      titulo:
        "Total generado",
      clave:
        "totalGenerado",
      tipo:
        "moneda",
      ancho:
        20,
      anchoPDF:
        23,
    },

    {
      titulo:
        "Total pagado",
      clave:
        "totalPagado",
      tipo:
        "moneda",
      ancho:
        20,
      anchoPDF:
        23,
    },

    {
      titulo:
        "Saldo pendiente",
      clave:
        "saldoPendiente",
      tipo:
        "moneda-pendiente",
      ancho:
        20,
      anchoPDF:
        23,
    },

    {
      titulo:
        "Pendientes",
      clave:
        "pendientes",
      tipo:
        "numero",
      ancho:
        14,
      anchoPDF:
        15,
    },

    {
      titulo:
        "Abonadas",
      clave:
        "abonadas",
      tipo:
        "numero",
      ancho:
        14,
      anchoPDF:
        15,
    },

    {
      titulo:
        "Pagadas",
      clave:
        "pagadas",
      tipo:
        "numero",
      ancho:
        14,
      anchoPDF:
        15,
    },
  ];

  /* =======================================================
     FILAS - CONSOLIDADO VENDEDORES
  ======================================================= */

  const filasVendedores =
    useMemo(
      () => {
        return vendedoresVisibles.map(
          (item) => ({
            codigo:
              item.vendedor
                ?.codigo ||
              "—",

            vendedor:
              item.vendedor
                ?.nombre ||
              "Sin vendedor",

            documento:
              item.vendedor
                ?.documento ||
              "—",

            lotesVendidos:
              numero(
                item.lotesVendidos
              ),

            comisionesGeneradas:
              numero(
                item.comisionesGeneradas
              ),

            totalGenerado:
              numero(
                item.totalGenerado
              ),

            totalPagado:
              numero(
                item.totalPagado
              ),

            saldoPendiente:
              numero(
                item.saldoPendiente
              ),

            pendientes:
              numero(
                item.pendientes
              ),

            abonadas:
              numero(
                item.abonadas
              ),

            pagadas:
              numero(
                item.pagadas
              ),
          })
        );
      },
      [
        vendedoresVisibles,
      ]
    );

  /* =======================================================
     RESUMEN PARA EXPORTACIÓN
  ======================================================= */

  const resumenExportacion = [
    {
      label:
        "Vendedores",

      valor:
        resumen.vendedores,

      tipo:
        "numero",

      color:
        "azul",

      detalle:
        "Vendedores con comisión generada",
    },

    {
      label:
        "Comisiones generadas",

      valor:
        resumen.comisionesGeneradas,

      tipo:
        "numero",

      color:
        "azul",

      detalle:
        `${resumen.lotesVendidos} lote(s) vendido(s)`,
    },

    {
      label:
        "Total generado",

      valor:
        resumen.totalGenerado,

      tipo:
        "moneda",

      detalle:
        "Valor histórico de las comisiones",
    },

    {
      label:
        "Total pagado",

      valor:
        resumen.totalPagado,

      tipo:
        "moneda",

      detalle:
        `${formatearPorcentaje(
          resumen.porcentajePagado,
          1
        )} del total`,
    },

    {
      label:
        "Saldo pendiente",

      valor:
        resumen.saldoPendiente,

      tipo:
        "moneda",

      color:
        "dorado",

      detalle:
        `${resumen.comisionesPendientes} pendiente(s) · ${resumen.comisionesAbonadas} abonada(s)`,
    },

    {
      label:
        "Comisiones pagadas",

      valor:
        resumen.comisionesPagadas,

      tipo:
        "numero",

      detalle:
        "Comisiones completamente pagadas",
    },
  ];

  /* =======================================================
     FILTROS PARA EXPORTACIÓN
  ======================================================= */

  const filtrosExportacion =
    useMemo(
      () => {
        const vendedorSeleccionado =
          opcionesVendedor.find(
            (item) =>
              String(
                item.id
              ) ===
              String(
                vendedor
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
              "Vendedor",

            valor:
              vendedorSeleccionado
                ?.nombre ||
              "Todos",
          },

          {
            label:
              "Estado",

            valor:
              estado ||
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
              "vendedores"
                ? "Consolidado por vendedor"
                : "Detalle de comisiones",
          },
        ];
      },
      [
        desde,
        hasta,
        vendedor,
        estado,
        buscar,
        vista,
        opcionesVendedor,
      ]
    );

  /* =======================================================
     CONFIGURACIÓN DE EXPORTACIÓN SEGÚN VISTA
  ======================================================= */

  const obtenerConfiguracionExportacion =
    () => {
      if (
        vista ===
        "vendedores"
      ) {
        return {
          titulo:
            "Comisiones por vendedor",

          subtitulo:
            "Consolidado de comisiones generadas, pagos y saldos por vendedor",

          nombreArchivo:
            "ComisionesPorVendedor",

          columnas:
            columnasVendedores,

          filas:
            filasVendedores,
        };
      }

      return {
        titulo:
          "Informe de comisiones",

        subtitulo:
          "Detalle de comisiones por venta, vendedor, cliente y lote",

        nombreArchivo:
          "InformeComisiones",

        columnas:
          columnasDetalle,

        filas:
          filasDetalle,
      };
    };

  /* =======================================================
     EXCEL
  ======================================================= */

  const generarExcel =
    () => {
      const configuracion =
        obtenerConfiguracionExportacion();

      const correcto =
        exportarExcel({
          ...configuracion,

          resumen:
            resumenExportacion,

          filtros:
            filtrosExportacion,
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
      const configuracion =
        obtenerConfiguracionExportacion();

      const correcto =
        exportarPDF({
          ...configuracion,

          resumen:
            resumenExportacion,

          filtros:
            filtrosExportacion,

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
      const configuracion =
        obtenerConfiguracionExportacion();

      const correcto =
        exportarHTML({
          ...configuracion,

          resumen:
            resumenExportacion,

          filtros:
            filtrosExportacion,

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
    <div className="reporte-comisiones">

      {/* ===================================================
          TOAST
      =================================================== */}

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

      <header className="reporte-comisiones-header">

        <div className="reporte-comisiones-header-left">

          {onVolver && (
            <button
              type="button"
              className="reporte-comisiones-back"
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

            <span className="reporte-comisiones-kicker">
              Informe independiente
            </span>

            <h1>
              Informe de comisiones
            </h1>

            <p>
              Consulta las comisiones generadas por cada venta, pagos realizados, saldos pendientes y consolidado por vendedor.
            </p>

          </div>

        </div>

        <button
          type="button"
          className="reporte-comisiones-refresh"
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
                ? "reporte-comisiones-spin"
                : ""
            }
          />

          Actualizar
        </button>

      </header>

      {/* ===================================================
          RESUMEN
      =================================================== */}

      <section className="reporte-comisiones-stats">

        <article className="reporte-comisiones-stat">

          <i className="azul">
            <UsersRound
              size={20}
            />
          </i>

          <div>
            <span>
              Vendedores
            </span>

            <strong>
              {formatearNumero(
                resumen.vendedores
              )}
            </strong>

            <small>
              Con comisión generada
            </small>
          </div>

        </article>

        <article className="reporte-comisiones-stat">

          <i>
            <BadgeDollarSign
              size={20}
            />
          </i>

          <div>
            <span>
              Comisiones
            </span>

            <strong>
              {formatearNumero(
                resumen.comisionesGeneradas
              )}
            </strong>

            <small>
              {resumen.lotesVendidos} lote(s) vendido(s)
            </small>
          </div>

        </article>

        <article className="reporte-comisiones-stat">

          <i>
            <Banknote
              size={20}
            />
          </i>

          <div>
            <span>
              Total generado
            </span>

            <strong>
              {formatearDinero(
                resumen.totalGenerado
              )}
            </strong>

            <small>
              Comisiones causadas
            </small>
          </div>

        </article>

        <article className="reporte-comisiones-stat">

          <i className="verde">
            <CircleDollarSign
              size={20}
            />
          </i>

          <div>
            <span>
              Total pagado
            </span>

            <strong className="texto-verde">
              {formatearDinero(
                resumen.totalPagado
              )}
            </strong>

            <small>
              {formatearPorcentaje(
                resumen.porcentajePagado,
                1
              )} pagado
            </small>
          </div>

        </article>

        <article className="reporte-comisiones-stat">

          <i className="dorado">
            <WalletCards
              size={20}
            />
          </i>

          <div>
            <span>
              Saldo pendiente
            </span>

            <strong className="texto-dorado">
              {formatearDinero(
                resumen.saldoPendiente
              )}
            </strong>

            <small>
              {resumen.comisionesPendientes} pendiente(s)
            </small>
          </div>

        </article>

        <article className="reporte-comisiones-stat">

          <i className="verde">
            <UserRoundCheck
              size={20}
            />
          </i>

          <div>
            <span>
              Pagadas
            </span>

            <strong className="texto-verde">
              {formatearNumero(
                resumen.comisionesPagadas
              )}
            </strong>

            <small>
              {resumen.comisionesAbonadas} abonada(s)
            </small>
          </div>

        </article>

      </section>

      {/* ===================================================
          FILTROS
      =================================================== */}

      <section className="reporte-comisiones-filtros">

        <div className="reporte-comisiones-search">

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
            placeholder="Comisión, venta, vendedor, cliente, lote..."
          />

        </div>

        <label className="reporte-comisiones-field">

          <span>
            Desde
          </span>

          <div className="reporte-comisiones-date">

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

        <label className="reporte-comisiones-field">

          <span>
            Hasta
          </span>

          <div className="reporte-comisiones-date">

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

        <label className="reporte-comisiones-field">

          <span>
            Vendedor
          </span>

          <select
            value={
              vendedor
            }
            onChange={(
              event
            ) =>
              setVendedor(
                event.target.value
              )
            }
          >
            <option value="">
              Todos
            </option>

            {opcionesVendedor.map(
              (opcion) => (
                <option
                  key={
                    opcion.id
                  }
                  value={
                    opcion.id
                  }
                >
                  {opcion.codigo
                    ? `${opcion.codigo} · `
                    : ""}
                  {opcion.nombre}
                </option>
              )
            )}

          </select>

        </label>

        <label className="reporte-comisiones-field">

          <span>
            Estado
          </span>

          <select
            value={
              estado
            }
            onChange={(
              event
            ) =>
              setEstado(
                event.target.value
              )
            }
          >
            <option value="">
              Todos
            </option>

            <option value="Pendiente">
              Pendiente
            </option>

            <option value="Abonada">
              Abonada
            </option>

            <option value="Pagada">
              Pagada
            </option>

          </select>

        </label>

        <button
          type="button"
          className="reporte-comisiones-aplicar"
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
          className="reporte-comisiones-limpiar"
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

      <section className="reporte-comisiones-vistas">

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
          <LayoutList
            size={16}
          />

          Detalle de comisiones

          <span>
            {registrosVisibles.length}
          </span>
        </button>

        <button
          type="button"
          className={
            vista ===
            "vendedores"
              ? "active"
              : ""
          }
          onClick={() =>
            cambiarVista(
              "vendedores"
            )
          }
        >
          <UsersRound
            size={16}
          />

          Consolidado por vendedor

          <span>
            {vendedoresVisibles.length}
          </span>
        </button>

      </section>

      {/* ===================================================
          EXPORTAR
      =================================================== */}

      <section className="reporte-comisiones-export">

        <div>

          <strong>
            {vista ===
            "vendedores"
              ? "Consolidado por vendedor"
              : "Detalle de comisiones"}
          </strong>

          <span>
            {datosVista.length} registro(s) encontrados
          </span>

        </div>

        <div className="reporte-comisiones-export-buttons">

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
        <div className="reporte-comisiones-error">

          <TriangleAlert
            size={17}
          />

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
          PANEL
      =================================================== */}

      <section className="reporte-comisiones-panel">

        {cargando ? (
          <div className="reporte-comisiones-loading">

            <RefreshCw
              size={25}
              className="reporte-comisiones-spin"
            />

            <span>
              Generando informe...
            </span>

          </div>
        ) : vista ===
          "vendedores" ? (
          /* =================================================
             TABLA CONSOLIDADO VENDEDORES
          ================================================= */

          <>
            <div className="reporte-comisiones-table-wrapper">

              <table className="reporte-comisiones-table vendedores">

                <thead>

                  <tr>
                    <th>
                      Código
                    </th>

                    <th>
                      Vendedor
                    </th>

                    <th>
                      Documento
                    </th>

                    <th>
                      Lotes vendidos
                    </th>

                    <th>
                      Comisiones
                    </th>

                    <th>
                      Generado
                    </th>

                    <th>
                      Pagado
                    </th>

                    <th>
                      Saldo
                    </th>

                    <th>
                      Pendientes
                    </th>

                    <th>
                      Abonadas
                    </th>

                    <th>
                      Pagadas
                    </th>
                  </tr>

                </thead>

                <tbody>

                  {datosPagina.length ===
                  0 ? (
                    <tr>

                      <td
                        colSpan={11}
                        className="reporte-comisiones-empty"
                      >
                        No hay vendedores para mostrar.
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
                            item.vendedor
                              ?._id ||
                            item.vendedor
                              ?.codigo ||
                            indice
                          }
                        >

                          <td>
                            <strong className="reporte-comisiones-codigo">
                              {item.vendedor
                                ?.codigo ||
                                "—"}
                            </strong>
                          </td>

                          <td>
                            <div className="reporte-comisiones-persona">

                              <strong>
                                {item.vendedor
                                  ?.nombre ||
                                  "Sin vendedor"}
                              </strong>

                            </div>
                          </td>

                          <td>
                            {item.vendedor
                              ?.documento ||
                              "—"}
                          </td>

                          <td>
                            <span className="reporte-comisiones-contador">
                              {formatearNumero(
                                item.lotesVendidos
                              )}
                            </span>
                          </td>

                          <td>
                            <span className="reporte-comisiones-contador">
                              {formatearNumero(
                                item.comisionesGeneradas
                              )}
                            </span>
                          </td>

                          <td>
                            <strong className="reporte-comisiones-money">
                              {formatearDinero(
                                item.totalGenerado
                              )}
                            </strong>
                          </td>

                          <td>
                            <strong className="reporte-comisiones-money pagado">
                              {formatearDinero(
                                item.totalPagado
                              )}
                            </strong>
                          </td>

                          <td>
                            <strong
                              className={`reporte-comisiones-money ${
                                numero(
                                  item.saldoPendiente
                                ) >
                                0
                                  ? "pendiente"
                                  : "pagado"
                              }`}
                            >
                              {formatearDinero(
                                item.saldoPendiente
                              )}
                            </strong>
                          </td>

                          <td>
                            <span className="reporte-comisiones-mini estado-pendiente">
                              {item.pendientes ||
                                0}
                            </span>
                          </td>

                          <td>
                            <span className="reporte-comisiones-mini estado-abonada">
                              {item.abonadas ||
                                0}
                            </span>
                          </td>

                          <td>
                            <span className="reporte-comisiones-mini estado-pagada">
                              {item.pagadas ||
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
          </>
        ) : (
          /* =================================================
             TABLA DETALLE
          ================================================= */

          <>
            <div className="reporte-comisiones-table-wrapper">

              <table className="reporte-comisiones-table detalle">

                <thead>

                  <tr>
                    <th>
                      Comisión
                    </th>

                    <th>
                      Fecha
                    </th>

                    <th>
                      Vendedor
                    </th>

                    <th>
                      Documento
                    </th>

                    <th>
                      Venta
                    </th>

                    <th>
                      Cliente
                    </th>

                    <th>
                      Manzana
                    </th>

                    <th>
                      Lote
                    </th>

                    <th>
                      Valor venta
                    </th>

                    <th>
                      Comisión
                    </th>

                    <th>
                      Pagado
                    </th>

                    <th>
                      Saldo
                    </th>

                    <th>
                      % pagado
                    </th>

                    <th>
                      Estado
                    </th>

                    <th>
                      Último pago
                    </th>
                  </tr>

                </thead>

                <tbody>

                  {datosPagina.length ===
                  0 ? (
                    <tr>

                      <td
                        colSpan={15}
                        className="reporte-comisiones-empty"
                      >
                        No hay comisiones que coincidan con los filtros seleccionados.
                      </td>

                    </tr>
                  ) : (
                    datosPagina.map(
                      (registro) => (
                        <tr
                          key={
                            registro._id
                          }
                        >

                          <td>
                            <strong className="reporte-comisiones-codigo">
                              {registro.codigo ||
                                "—"}
                            </strong>
                          </td>

                          <td>
                            {formatearFecha(
                              registro.fechaGeneracion
                            )}
                          </td>

                          <td>
                            <div className="reporte-comisiones-persona">

                              <strong>
                                {registro.vendedor
                                  ?.nombre ||
                                  "Sin vendedor"}
                              </strong>

                              {registro.vendedor
                                ?.codigo && (
                                <span>
                                  {registro.vendedor.codigo}
                                </span>
                              )}

                            </div>
                          </td>

                          <td>
                            {registro.vendedor
                              ?.documento ||
                              "—"}
                          </td>

                          <td>
                            <strong className="reporte-comisiones-venta">
                              {registro.venta
                                ?.codigo ||
                                "—"}
                            </strong>
                          </td>

                          <td>
                            <div className="reporte-comisiones-persona">

                              <strong>
                                {registro.cliente
                                  ?.nombre ||
                                  "—"}
                              </strong>

                              <span>
                                {registro.cliente
                                  ?.documento ||
                                  "—"}
                              </span>

                            </div>
                          </td>

                          <td>
                            <strong>
                              {registro.manzana
                                ?.codigo ||
                                "—"}
                            </strong>
                          </td>

                          <td>
                            <strong>
                              {registro.lote
                                ?.codigo ||
                                "—"}
                            </strong>
                          </td>

                          <td>
                            <strong className="reporte-comisiones-money">
                              {formatearDinero(
                                registro.venta
                                  ?.valorVenta
                              )}
                            </strong>
                          </td>

                          <td>
                            <strong className="reporte-comisiones-money generado">
                              {formatearDinero(
                                registro.valorComision
                              )}
                            </strong>
                          </td>

                          <td>
                            <strong className="reporte-comisiones-money pagado">
                              {formatearDinero(
                                registro.totalPagado
                              )}
                            </strong>
                          </td>

                          <td>
                            <strong
                              className={`reporte-comisiones-money ${
                                numero(
                                  registro.saldoPendiente
                                ) >
                                0
                                  ? "pendiente"
                                  : "pagado"
                              }`}
                            >
                              {formatearDinero(
                                registro.saldoPendiente
                              )}
                            </strong>
                          </td>

                          <td>
                            <span className="reporte-comisiones-porcentaje">
                              {formatearPorcentaje(
                                registro.porcentajePagado,
                                1
                              )}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`reporte-comisiones-estado ${String(
                                registro.estado ||
                                  ""
                              ).toLowerCase()}`}
                            >
                              {registro.estado ||
                                "—"}
                            </span>
                          </td>

                          <td>
                            {formatearFecha(
                              registro.fechaUltimoPago
                            )}
                          </td>

                        </tr>
                      )
                    )
                  )}

                </tbody>

              </table>

            </div>
          </>
        )}

        {/* =================================================
            PAGINACIÓN
        ================================================= */}

        {!cargando && (
          <footer className="reporte-comisiones-table-footer">

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

            <div className="reporte-comisiones-pagination">

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