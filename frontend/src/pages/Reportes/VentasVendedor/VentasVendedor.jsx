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
  List,
  RefreshCw,
  Search,
  ShoppingCart,
  TriangleAlert,
  UserRound,
  Users,
  X,
} from "lucide-react";

import Toast from "../../../components/ui/Toast";

import {
  obtenerReporteVentasVendedor,
} from "../../../services/reportes/ventasVendedor.service";

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

import "./VentasVendedor.css";

/* =========================================================
   CONSTANTES
========================================================= */

const REGISTROS_POR_PAGINA =
  8;

/* =========================================================
   COMPONENTE
========================================================= */

export default function VentasVendedor({
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
    registros,
    setRegistros,
  ] = useState([]);

  const [
    vendedores,
    setVendedores,
  ] = useState([]);

  const [
    resumen,
    setResumen,
  ] = useState({
    vendedores: 0,
    totalVentas: 0,
    totalVendido: 0,
    promedioVenta: 0,
    totalCuotaInicial: 0,
    totalSaldoFinanciar: 0,
    totalComisiones: 0,
    ventasActivas: 0,
    ventasPagadas: 0,
  });

  /* =======================================================
     VISTA
  ======================================================= */

  const [
    vista,
    setVista,
  ] = useState(
    "vendedores"
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
    vendedor,
    setVendedor,
  ] = useState("");

  const [
    estado,
    setEstado,
  ] = useState("");

  /* =======================================================
     CATÁLOGO VENDEDORES
  ======================================================= */

  const [
    opcionesVendedor,
    setOpcionesVendedor,
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
     CATÁLOGO DE VENDEDORES
  ======================================================= */

  const actualizarCatalogoVendedores =
    (
      datos
    ) => {
      const mapa =
        new Map();

      datos.forEach(
        (registro) => {
          const item =
            registro.vendedor;

          if (
            !item?.nombre ||
            item.nombre ===
              "Sin vendedor"
          ) {
            return;
          }

          const clave =
            String(
              item._id ||
              item.codigo ||
              item.nombre
            );

          mapa.set(
            clave,
            {
              id:
                item._id ||
                item.codigo ||
                item.nombre,

              codigo:
                item.codigo ||
                "",

              nombre:
                item.nombre,
            }
          );
        }
      );

      setOpcionesVendedor(
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
          await obtenerReporteVentasVendedor(
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
            respuesta?.vendedores
          )
            ? respuesta.vendedores
            : [];

        setRegistros(
          nuevosRegistros
        );

        setVendedores(
          nuevosVendedores
        );

        setResumen({
          vendedores:
            numero(
              respuesta
                ?.resumen
                ?.vendedores
            ),

          totalVentas:
            numero(
              respuesta
                ?.resumen
                ?.totalVentas
            ),

          totalVendido:
            numero(
              respuesta
                ?.resumen
                ?.totalVendido
            ),

          promedioVenta:
            numero(
              respuesta
                ?.resumen
                ?.promedioVenta
            ),

          totalCuotaInicial:
            numero(
              respuesta
                ?.resumen
                ?.totalCuotaInicial
            ),

          totalSaldoFinanciar:
            numero(
              respuesta
                ?.resumen
                ?.totalSaldoFinanciar
            ),

          totalComisiones:
            numero(
              respuesta
                ?.resumen
                ?.totalComisiones
            ),

          ventasActivas:
            numero(
              respuesta
                ?.resumen
                ?.ventasActivas
            ),

          ventasPagadas:
            numero(
              respuesta
                ?.resumen
                ?.ventasPagadas
            ),
        });

        if (
          actualizarOpciones
        ) {
          actualizarCatalogoVendedores(
            nuevosRegistros
          );
        }

        setPagina(
          1
        );
      } catch (error) {
        console.error(
          "Error cargando informe de ventas por vendedor:",
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

      await cargarInforme(
        {},
        true
      );
    };

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
              registro.codigoVenta,

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

              registro.formaPago,

              registro.estadoVenta,
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
     FILTRO LOCAL RESUMEN VENDEDORES
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
          return vendedores;
        }

        return vendedores.filter(
          (
            item
          ) => {
            const campos = [
              item.vendedor
                ?.codigo,

              item.vendedor
                ?.nombre,

              item.vendedor
                ?.documento,
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
        vendedores,
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
      : vendedoresVisibles;

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
     COLUMNAS RESUMEN POR VENDEDOR
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
        18,
      anchoPDF:
        20,
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
        13,
    },

    {
      titulo:
        "Total vendido",
      clave:
        "totalVendido",
      tipo:
        "moneda",
      ancho:
        20,
      anchoPDF:
        23,
    },

    {
      titulo:
        "Promedio venta",
      clave:
        "promedioVenta",
      tipo:
        "moneda",
      ancho:
        20,
      anchoPDF:
        23,
    },

    {
      titulo:
        "Cuota inicial",
      clave:
        "cuotaInicial",
      tipo:
        "moneda",
      ancho:
        20,
      anchoPDF:
        22,
    },

    {
      titulo:
        "Saldo financiar",
      clave:
        "saldoFinanciar",
      tipo:
        "moneda-pendiente",
      ancho:
        20,
      anchoPDF:
        22,
    },

    {
      titulo:
        "Comisiones",
      clave:
        "comisiones",
      tipo:
        "moneda",
      ancho:
        20,
      anchoPDF:
        22,
    },

    {
      titulo:
        "Activas",
      clave:
        "activas",
      tipo:
        "numero",
      ancho:
        12,
      anchoPDF:
        13,
    },

    {
      titulo:
        "Pagadas",
      clave:
        "pagadas",
      tipo:
        "numero",
      ancho:
        12,
      anchoPDF:
        13,
    },
  ];

  /* =======================================================
     FILAS RESUMEN VENDEDORES
  ======================================================= */

  const filasVendedores =
    useMemo(
      () => {
        return vendedoresVisibles.map(
          (
            item
          ) => ({
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

            ventas:
              numero(
                item.cantidadVentas
              ),

            totalVendido:
              numero(
                item.totalVendido
              ),

            promedioVenta:
              numero(
                item.promedioVenta
              ),

            cuotaInicial:
              numero(
                item.totalCuotaInicial
              ),

            saldoFinanciar:
              numero(
                item.totalSaldoFinanciar
              ),

            comisiones:
              numero(
                item.comisionesGeneradas
              ),

            activas:
              numero(
                item.ventasActivas
              ),

            pagadas:
              numero(
                item.ventasPagadas
              ),
          })
        );
      },
      [
        vendedoresVisibles,
      ]
    );

  /* =======================================================
     COLUMNAS DETALLE DE VENTAS
  ======================================================= */

  const columnasDetalle = [
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
        "Vendedor",
      clave:
        "vendedor",
      ancho:
        28,
      anchoPDF:
        26,
    },

    {
      titulo:
        "Cliente",
      clave:
        "cliente",
      ancho:
        30,
      anchoPDF:
        28,
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
        14,
      anchoPDF:
        15,
    },

    {
      titulo:
        "Valor venta",
      clave:
        "valorVenta",
      tipo:
        "moneda",
      ancho:
        20,
      anchoPDF:
        22,
    },

    {
      titulo:
        "Cuota inicial",
      clave:
        "cuotaInicial",
      tipo:
        "moneda",
      ancho:
        20,
      anchoPDF:
        22,
    },

    {
      titulo:
        "Saldo financiar",
      clave:
        "saldoFinanciar",
      tipo:
        "moneda-pendiente",
      ancho:
        20,
      anchoPDF:
        22,
    },

    {
      titulo:
        "Forma pago",
      clave:
        "formaPago",
      ancho:
        16,
      anchoPDF:
        17,
    },

    {
      titulo:
        "Cuotas",
      clave:
        "cuotas",
      tipo:
        "numero",
      ancho:
        12,
      anchoPDF:
        13,
    },

    {
      titulo:
        "Comisión",
      clave:
        "comision",
      tipo:
        "moneda",
      ancho:
        20,
      anchoPDF:
        22,
    },

    {
      titulo:
        "Estado",
      clave:
        "estado",
      tipo:
        "estado",
      ancho:
        15,
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
            venta:
              registro.codigoVenta ||
              "—",

            fecha:
              registro.fechaVenta,

            vendedor:
              registro.vendedor
                ?.nombre ||
              "Sin vendedor",

            cliente:
              registro.cliente
                ?.nombre ||
              "—",

            documento:
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

            area:
              numero(
                registro.lote
                  ?.areaM2
              ),

            valorVenta:
              numero(
                registro.valorVenta
              ),

            cuotaInicial:
              numero(
                registro.cuotaInicial
              ),

            saldoFinanciar:
              numero(
                registro.saldoFinanciar
              ),

            formaPago:
              registro.formaPago ||
              "—",

            cuotas:
              numero(
                registro.numeroCuotas
              ),

            comision:
              numero(
                registro.valorComision
              ),

            estado:
              registro.estadoVenta ||
              "—",
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
        "Vendedores",

      valor:
        resumen.vendedores,

      tipo:
        "numero",

      color:
        "azul",

      detalle:
        "Vendedores con ventas registradas",
    },

    {
      label:
        "Total ventas",

      valor:
        resumen.totalVentas,

      tipo:
        "numero",

      color:
        "azul",

      detalle:
        "Ventas incluidas en el informe",
    },

    {
      label:
        "Total vendido",

      valor:
        resumen.totalVendido,

      tipo:
        "moneda",

      detalle:
        "Valor comercial vendido",
    },

    {
      label:
        "Promedio por venta",

      valor:
        resumen.promedioVenta,

      tipo:
        "moneda",

      detalle:
        "Promedio del valor de venta",
    },

    {
      label:
        "Saldo financiar",

      valor:
        resumen.totalSaldoFinanciar,

      tipo:
        "moneda",

      color:
        "dorado",

      detalle:
        "Valor financiado de las ventas",
    },

    {
      label:
        "Comisiones generadas",

      valor:
        resumen.totalComisiones,

      tipo:
        "moneda",

      color:
        "dorado",

      detalle:
        "Comisión histórica generada por las ventas",
    },
  ];

  /* =======================================================
     FILTROS EXPORTACIÓN
  ======================================================= */

  const filtrosExportacion =
    useMemo(
      () => {
        const opcionVendedor =
          opcionesVendedor.find(
            (
              item
            ) =>
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
              opcionVendedor
                ?.nombre ||
              "Todos",
          },

          {
            label:
              "Estado venta",

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
              "detalle"
                ? "Detalle de ventas"
                : "Resumen por vendedor",
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
     DATOS EXPORTACIÓN SEGÚN VISTA
  ======================================================= */

  const columnasExportacion =
    vista ===
    "detalle"
      ? columnasDetalle
      : columnasVendedores;

  const filasExportacion =
    vista ===
    "detalle"
      ? filasDetalle
      : filasVendedores;

  /* =======================================================
     EXCEL
  ======================================================= */

  const generarExcel =
    () => {
      const correcto =
        exportarExcel({
          titulo:
            "Ventas por vendedor",

          subtitulo:
            vista ===
            "detalle"
              ? "Detalle de ventas asociadas a vendedores"
              : "Resumen comercial agrupado por vendedor",

          nombreArchivo:
            "VentasPorVendedor",

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
            "Ventas por vendedor",

          subtitulo:
            vista ===
            "detalle"
              ? "Detalle de ventas, lotes, valores y comisiones"
              : "Resumen comercial agrupado por vendedor",

          nombreArchivo:
            "VentasPorVendedor",

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
            "Ventas por vendedor",

          subtitulo:
            vista ===
            "detalle"
              ? "Detalle de ventas asociadas a vendedores"
              : "Resumen comercial agrupado por vendedor",

          nombreArchivo:
            "VentasPorVendedor",

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
    <div className="ventas-vendedor-reporte">

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

      <header className="ventas-vendedor-header">

        <div className="ventas-vendedor-header-left">

          {onVolver && (
            <button
              type="button"
              className="ventas-vendedor-back"
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

            <span className="ventas-vendedor-kicker">
              Informe independiente
            </span>

            <h1>
              Ventas por vendedor
            </h1>

            <p>
              Consulta el desempeño comercial de cada vendedor, lotes vendidos, valores de venta y comisiones generadas.
            </p>

          </div>

        </div>

        <button
          type="button"
          className="ventas-vendedor-refresh"
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
                ? "ventas-vendedor-spin"
                : ""
            }
          />

          Actualizar
        </button>

      </header>

      {/* ===================================================
          RESUMEN
      =================================================== */}

      <section className="ventas-vendedor-stats">

        <article className="ventas-vendedor-stat">

          <i className="azul">
            <Users
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
              Con ventas registradas
            </small>
          </div>

        </article>

        <article className="ventas-vendedor-stat">

          <i>
            <ShoppingCart
              size={20}
            />
          </i>

          <div>
            <span>
              Total ventas
            </span>

            <strong>
              {formatearNumero(
                resumen.totalVentas
              )}
            </strong>

            <small>
              Operaciones registradas
            </small>
          </div>

        </article>

        <article className="ventas-vendedor-stat">

          <i className="verde">
            <Banknote
              size={20}
            />
          </i>

          <div>
            <span>
              Total vendido
            </span>

            <strong className="texto-verde">
              {formatearDinero(
                resumen.totalVendido
              )}
            </strong>

            <small>
              Valor comercial
            </small>
          </div>

        </article>

        <article className="ventas-vendedor-stat">

          <i className="azul">
            <CircleDollarSign
              size={20}
            />
          </i>

          <div>
            <span>
              Promedio por venta
            </span>

            <strong>
              {formatearDinero(
                resumen.promedioVenta
              )}
            </strong>

            <small>
              Promedio comercial
            </small>
          </div>

        </article>

        <article className="ventas-vendedor-stat">

          <i className="dorado">
            <BadgeDollarSign
              size={20}
            />
          </i>

          <div>
            <span>
              Comisiones generadas
            </span>

            <strong className="texto-dorado">
              {formatearDinero(
                resumen.totalComisiones
              )}
            </strong>

            <small>
              Comisión histórica
            </small>
          </div>

        </article>

        <article className="ventas-vendedor-stat">

          <i className="dorado">
            <Banknote
              size={20}
            />
          </i>

          <div>
            <span>
              Saldo financiar
            </span>

            <strong className="texto-dorado">
              {formatearDinero(
                resumen.totalSaldoFinanciar
              )}
            </strong>

            <small>
              Valor financiado
            </small>
          </div>

        </article>

      </section>

      {/* ===================================================
          FILTROS
      =================================================== */}

      <section className="ventas-vendedor-filtros">

        <div className="ventas-vendedor-search">

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
            placeholder="Vendedor, cliente, documento, lote..."
          />

        </div>

        <label className="ventas-vendedor-field">

          <span>
            Desde
          </span>

          <div className="ventas-vendedor-date">

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

        <label className="ventas-vendedor-field">

          <span>
            Hasta
          </span>

          <div className="ventas-vendedor-date">

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

        <label className="ventas-vendedor-field">

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
                  {opcion.codigo
                    ? `${opcion.codigo} · `
                    : ""}
                  {opcion.nombre}
                </option>
              )
            )}

          </select>

        </label>

        <label className="ventas-vendedor-field">

          <span>
            Estado venta
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

            <option value="Activa">
              Activa
            </option>

            <option value="Pagada">
              Pagada
            </option>

          </select>

        </label>

        <button
          type="button"
          className="ventas-vendedor-aplicar"
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
          className="ventas-vendedor-limpiar"
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

      <section className="ventas-vendedor-vistas">

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
          <UserRound
            size={15}
          />

          Resumen por vendedor

          <span>
            {vendedoresVisibles.length}
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

          Detalle de ventas

          <span>
            {registrosVisibles.length}
          </span>
        </button>

      </section>

      {/* ===================================================
          EXPORTACIONES
      =================================================== */}

      <section className="ventas-vendedor-export">

        <div>

          <strong>
            Informe generado
          </strong>

          <span>
            {datosVista.length} registro(s) en la vista actual
          </span>

        </div>

        <div className="ventas-vendedor-export-buttons">

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
        <div className="ventas-vendedor-error">

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
          TABLA
      =================================================== */}

      <section className="ventas-vendedor-panel">

        {cargando ? (
          <div className="ventas-vendedor-loading">

            <RefreshCw
              size={25}
              className="ventas-vendedor-spin"
            />

            <span>
              Generando informe...
            </span>

          </div>
        ) : vista ===
          "detalle" ? (
          <>

            <div className="ventas-vendedor-table-wrapper">

              <table className="ventas-vendedor-table detalle">

                <thead>

                  <tr>
                    <th>Venta</th>
                    <th>Fecha</th>
                    <th>Vendedor</th>
                    <th>Cliente</th>
                    <th>Documento</th>
                    <th>Manzana</th>
                    <th>Lote</th>
                    <th>Área m²</th>
                    <th>Valor venta</th>
                    <th>Cuota inicial</th>
                    <th>Saldo financiar</th>
                    <th>Forma pago</th>
                    <th>Cuotas</th>
                    <th>Comisión</th>
                    <th>Estado</th>
                  </tr>

                </thead>

                <tbody>

                  {datosPagina.length ===
                  0 ? (
                    <tr>

                      <td
                        colSpan={15}
                        className="ventas-vendedor-empty"
                      >
                        No hay ventas que coincidan con los filtros seleccionados.
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
                            <strong className="ventas-vendedor-codigo">
                              {registro.codigoVenta ||
                                "—"}
                            </strong>
                          </td>

                          <td>
                            {formatearFecha(
                              registro.fechaVenta
                            )}
                          </td>

                          <td>
                            <div className="ventas-vendedor-persona">

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
                            <strong>
                              {registro.cliente
                                ?.nombre ||
                                "—"}
                            </strong>
                          </td>

                          <td>
                            {registro.cliente
                              ?.documento ||
                              "—"}
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
                            {formatearNumero(
                              registro.lote
                                ?.areaM2,
                              2
                            )}{" "}
                            m²
                          </td>

                          <td>
                            <strong className="ventas-vendedor-money">
                              {formatearDinero(
                                registro.valorVenta
                              )}
                            </strong>
                          </td>

                          <td>
                            <strong className="ventas-vendedor-money">
                              {formatearDinero(
                                registro.cuotaInicial
                              )}
                            </strong>
                          </td>

                          <td>
                            <strong className="ventas-vendedor-money pendiente">
                              {formatearDinero(
                                registro.saldoFinanciar
                              )}
                            </strong>
                          </td>

                          <td>
                            {registro.formaPago ||
                              "—"}
                          </td>

                          <td>
                            <span className="ventas-vendedor-contador">
                              {registro.numeroCuotas ||
                                0}
                            </span>
                          </td>

                          <td>
                            <strong className="ventas-vendedor-money comision">
                              {formatearDinero(
                                registro.valorComision
                              )}
                            </strong>
                          </td>

                          <td>
                            <span
                              className={`ventas-vendedor-estado ${String(
                                registro.estadoVenta ||
                                  ""
                              ).toLowerCase()}`}
                            >
                              {registro.estadoVenta ||
                                "—"}
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
          <>

            <div className="ventas-vendedor-table-wrapper">

              <table className="ventas-vendedor-table vendedores">

                <thead>

                  <tr>
                    <th>Código</th>
                    <th>Vendedor</th>
                    <th>Documento</th>
                    <th>Ventas</th>
                    <th>Total vendido</th>
                    <th>Promedio venta</th>
                    <th>Cuota inicial</th>
                    <th>Saldo financiar</th>
                    <th>Comisiones</th>
                    <th>Activas</th>
                    <th>Pagadas</th>
                  </tr>

                </thead>

                <tbody>

                  {datosPagina.length ===
                  0 ? (
                    <tr>

                      <td
                        colSpan={11}
                        className="ventas-vendedor-empty"
                      >
                        No hay vendedores que coincidan con los filtros seleccionados.
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
                            <strong className="ventas-vendedor-codigo">
                              {item.vendedor
                                ?.codigo ||
                                "—"}
                            </strong>
                          </td>

                          <td>
                            <div className="ventas-vendedor-persona">

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
                            <span className="ventas-vendedor-contador">
                              {formatearNumero(
                                item.cantidadVentas
                              )}
                            </span>
                          </td>

                          <td>
                            <strong className="ventas-vendedor-money">
                              {formatearDinero(
                                item.totalVendido
                              )}
                            </strong>
                          </td>

                          <td>
                            <strong className="ventas-vendedor-money">
                              {formatearDinero(
                                item.promedioVenta
                              )}
                            </strong>
                          </td>

                          <td>
                            <strong className="ventas-vendedor-money">
                              {formatearDinero(
                                item.totalCuotaInicial
                              )}
                            </strong>
                          </td>

                          <td>
                            <strong className="ventas-vendedor-money pendiente">
                              {formatearDinero(
                                item.totalSaldoFinanciar
                              )}
                            </strong>
                          </td>

                          <td>
                            <strong className="ventas-vendedor-money comision">
                              {formatearDinero(
                                item.comisionesGeneradas
                              )}
                            </strong>
                          </td>

                          <td>
                            <span className="ventas-vendedor-contador activa">
                              {item.ventasActivas ||
                                0}
                            </span>
                          </td>

                          <td>
                            <span className="ventas-vendedor-contador pagada">
                              {item.ventasPagadas ||
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
        )}

        {!cargando && (
          <footer className="ventas-vendedor-table-footer">

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

            <div className="ventas-vendedor-pagination">

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