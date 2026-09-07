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
  RefreshCw,
  Search,
  TriangleAlert,
  UserRound,
  Users,
  WalletCards,
  X,
} from "lucide-react";

import Toast from "../../../components/ui/Toast";

import {
  obtenerReporteCarteraClientes,
} from "../../../services/reportes/carteraClientes.service";

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

import "./CarteraClientes.css";

/* =========================================================
   CONSTANTES
========================================================= */

const REGISTROS_POR_PAGINA =
  8;

/* =========================================================
   COMPONENTE
========================================================= */

export default function CarteraClientes({
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
    clientesConCartera: 0,
    clientesVencidos: 0,
    totalVentas: 0,

    totalComprado: 0,
    totalPagado: 0,
    saldoPendiente: 0,
    valorVencido: 0,

    cuotasPendientes: 0,
    cuotasVencidas: 0,
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
    estado,
    setEstado,
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
     CATÁLOGO DE CLIENTES
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
          await obtenerReporteCarteraClientes(
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

          clientesConCartera:
            numero(
              respuesta
                ?.resumen
                ?.clientesConCartera
            ),

          clientesVencidos:
            numero(
              respuesta
                ?.resumen
                ?.clientesVencidos
            ),

          totalVentas:
            numero(
              respuesta
                ?.resumen
                ?.totalVentas
            ),

          totalComprado:
            numero(
              respuesta
                ?.resumen
                ?.totalComprado
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

          valorVencido:
            numero(
              respuesta
                ?.resumen
                ?.valorVencido
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
          "Error cargando informe de cartera por cliente:",
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

      setCliente(
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

              item.estadoCartera,
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
              registro.codigoVenta,

              registro.cliente
                ?.nombre,

              registro.cliente
                ?.documento,

              registro.cliente
                ?.telefono,

              registro.manzana
                ?.codigo,

              registro.lote
                ?.codigo,

              registro.lote
                ?.tipo,

              registro.formaPago,

              registro.estadoVenta,

              registro.estadoCartera,
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
     COLUMNAS RESUMEN CLIENTES
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
        "Teléfono",
      clave:
        "telefono",
      ancho:
        17,
      anchoPDF:
        18,
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
        "Lotes",
      clave:
        "lotes",
      tipo:
        "numero",
      ancho:
        12,
      anchoPDF:
        13,
    },

    {
      titulo:
        "Valor comprado",
      clave:
        "valorComprado",
      tipo:
        "moneda",
      ancho:
        20,
      anchoPDF:
        22,
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
        22,
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
        "Cuotas pendientes",
      clave:
        "cuotasPendientes",
      tipo:
        "numero",
      ancho:
        17,
      anchoPDF:
        17,
    },

    {
      titulo:
        "Cuotas vencidas",
      clave:
        "cuotasVencidas",
      tipo:
        "numero",
      ancho:
        16,
      anchoPDF:
        16,
    },

    {
      titulo:
        "Valor vencido",
      clave:
        "valorVencido",
      tipo:
        "moneda-vencida",
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
     FILAS RESUMEN CLIENTES
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

            telefono:
              item.cliente
                ?.telefono ||
              "—",

            ventas:
              numero(
                item.cantidadVentas
              ),

            lotes:
              numero(
                item.lotesComprados
              ),

            valorComprado:
              numero(
                item.valorComprado
              ),

            totalPagado:
              numero(
                item.totalPagado
              ),

            saldoPendiente:
              numero(
                item.saldoPendiente
              ),

            cuotasPendientes:
              numero(
                item.cuotasPendientes
              ),

            cuotasVencidas:
              numero(
                item.cuotasVencidas
              ),

            valorVencido:
              numero(
                item.valorVencido
              ),

            estado:
              item.estadoCartera ||
              "—",
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
        "Total pagado",
      clave:
        "totalPagado",
      tipo:
        "moneda",
      ancho:
        20,
      anchoPDF:
        22,
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
        "C. pendientes",
      clave:
        "cuotasPendientes",
      tipo:
        "numero",
      ancho:
        16,
      anchoPDF:
        16,
    },

    {
      titulo:
        "C. vencidas",
      clave:
        "cuotasVencidas",
      tipo:
        "numero",
      ancho:
        15,
      anchoPDF:
        15,
    },

    {
      titulo:
        "Valor vencido",
      clave:
        "valorVencido",
      tipo:
        "moneda-vencida",
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

            totalPagado:
              numero(
                registro.totalPagado
              ),

            saldoPendiente:
              numero(
                registro.saldoPendiente
              ),

            cuotasPendientes:
              numero(
                registro.cuotasPendientes
              ),

            cuotasVencidas:
              numero(
                registro.cuotasVencidas
              ),

            valorVencido:
              numero(
                registro.valorVencido
              ),

            estado:
              registro.estadoCartera ||
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
        "Clientes",

      valor:
        resumen.clientes,

      tipo:
        "numero",

      color:
        "azul",

      detalle:
        "Clientes incluidos en el informe",
    },

    {
      label:
        "Clientes con cartera",

      valor:
        resumen.clientesConCartera,

      tipo:
        "numero",

      color:
        "dorado",

      detalle:
        "Clientes con saldo pendiente",
    },

    {
      label:
        "Total comprado",

      valor:
        resumen.totalComprado,

      tipo:
        "moneda",

      detalle:
        "Valor comercial de las ventas",
    },

    {
      label:
        "Total pagado",

      valor:
        resumen.totalPagado,

      tipo:
        "moneda",

      color:
        "verde",

      detalle:
        "Valor pagado por los clientes",
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
        `${resumen.cuotasPendientes} cuota(s) pendiente(s)`,
    },

    {
      label:
        "Valor vencido",

      valor:
        resumen.valorVencido,

      tipo:
        "moneda",

      color:
        "rojo",

      detalle:
        `${resumen.cuotasVencidas} cuota(s) vencida(s)`,
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
              "Estado cartera",

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
                : "Resumen por cliente",
          },
        ];
      },
      [
        desde,
        hasta,
        cliente,
        estado,
        buscar,
        vista,
        opcionesCliente,
      ]
    );

  /* =======================================================
     DATOS EXPORTACIÓN
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
     EXPORTAR EXCEL
  ======================================================= */

  const generarExcel =
    () => {
      const correcto =
        exportarExcel({
          titulo:
            "Cartera por cliente",

          subtitulo:
            vista ===
            "detalle"
              ? "Detalle de ventas, saldos y cuotas"
              : "Resumen consolidado de cartera por cliente",

          nombreArchivo:
            "CarteraPorCliente",

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
     EXPORTAR PDF
  ======================================================= */

  const generarPDF =
    () => {
      const correcto =
        exportarPDF({
          titulo:
            "Cartera por cliente",

          subtitulo:
            vista ===
            "detalle"
              ? "Detalle de ventas, saldos, cuotas pendientes y vencidas"
              : "Resumen consolidado de cartera por cliente",

          nombreArchivo:
            "CarteraPorCliente",

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
     EXPORTAR HTML
  ======================================================= */

  const generarHTML =
    () => {
      const correcto =
        exportarHTML({
          titulo:
            "Cartera por cliente",

          subtitulo:
            vista ===
            "detalle"
              ? "Detalle de ventas y estado de cartera"
              : "Resumen consolidado de cartera por cliente",

          nombreArchivo:
            "CarteraPorCliente",

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
    <div className="cartera-clientes-reporte">

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

      <header className="cartera-clientes-header">

        <div className="cartera-clientes-header-left">

          {onVolver && (
            <button
              type="button"
              className="cartera-clientes-back"
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

            <span className="cartera-clientes-kicker">
              Informe independiente
            </span>

            <h1>
              Cartera por cliente
            </h1>

            <p>
              Consulta valores comprados, pagos realizados, saldos pendientes y obligaciones vencidas de cada cliente.
            </p>

          </div>

        </div>

        <button
          type="button"
          className="cartera-clientes-refresh"
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
                ? "cartera-clientes-spin"
                : ""
            }
          />

          Actualizar
        </button>

      </header>

      {/* ===================================================
          RESUMEN
      =================================================== */}

      <section className="cartera-clientes-stats">

        <article className="cartera-clientes-stat">

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
              Incluidos en el informe
            </small>

          </div>

        </article>

        <article className="cartera-clientes-stat">

          <i className="dorado">
            <WalletCards
              size={20}
            />
          </i>

          <div>

            <span>
              Clientes con cartera
            </span>

            <strong className="texto-dorado">
              {formatearNumero(
                resumen.clientesConCartera
              )}
            </strong>

            <small>
              Con saldo pendiente
            </small>

          </div>

        </article>

        <article className="cartera-clientes-stat">

          <i>
            <CircleDollarSign
              size={20}
            />
          </i>

          <div>

            <span>
              Total comprado
            </span>

            <strong>
              {formatearDinero(
                resumen.totalComprado
              )}
            </strong>

            <small>
              Valor de las ventas
            </small>

          </div>

        </article>

        <article className="cartera-clientes-stat">

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
              Valor recaudado
            </small>

          </div>

        </article>

        <article className="cartera-clientes-stat">

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
              {resumen.cuotasPendientes} cuota(s) pendiente(s)
            </small>

          </div>

        </article>

        <article className="cartera-clientes-stat">

          <i className="rojo">
            <TriangleAlert
              size={20}
            />
          </i>

          <div>

            <span>
              Valor vencido
            </span>

            <strong className="texto-rojo">
              {formatearDinero(
                resumen.valorVencido
              )}
            </strong>

            <small>
              {resumen.clientesVencidos} cliente(s) vencido(s)
            </small>

          </div>

        </article>

      </section>

      {/* ===================================================
          FILTROS
      =================================================== */}

      <section className="cartera-clientes-filtros">

        <div className="cartera-clientes-search">

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
            placeholder="Cliente, documento, teléfono, lote..."
          />

        </div>

        <label className="cartera-clientes-field">

          <span>
            Desde
          </span>

          <div className="cartera-clientes-date">

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

        <label className="cartera-clientes-field">

          <span>
            Hasta
          </span>

          <div className="cartera-clientes-date">

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

        <label className="cartera-clientes-field">

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

        <label className="cartera-clientes-field">

          <span>
            Estado cartera
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

            <option value="Vencida">
              Vencida
            </option>

            <option value="Pagada">
              Pagada
            </option>

          </select>

        </label>

        <button
          type="button"
          className="cartera-clientes-aplicar"
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
          className="cartera-clientes-limpiar"
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

      <section className="cartera-clientes-vistas">

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

          Detalle de ventas

          <span>
            {registrosVisibles.length}
          </span>

        </button>

      </section>

      {/* ===================================================
          EXPORTACIONES
      =================================================== */}

      <section className="cartera-clientes-export">

        <div>

          <strong>
            Informe generado
          </strong>

          <span>
            {datosVista.length} registro(s) en la vista actual
          </span>

        </div>

        <div className="cartera-clientes-export-buttons">

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
        <div className="cartera-clientes-error">

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

      <section className="cartera-clientes-panel">

        {cargando ? (
          <div className="cartera-clientes-loading">

            <RefreshCw
              size={25}
              className="cartera-clientes-spin"
            />

            <span>
              Generando informe...
            </span>

          </div>
        ) : vista ===
          "detalle" ? (
          <>

            <div className="cartera-clientes-table-wrapper">

              <table className="cartera-clientes-table detalle">

                <thead>

                  <tr>
                    <th>Venta</th>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Documento</th>
                    <th>Manzana</th>
                    <th>Lote</th>
                    <th>Área m²</th>
                    <th>Valor venta</th>
                    <th>Pagado</th>
                    <th>Saldo</th>
                    <th>C. pendientes</th>
                    <th>C. vencidas</th>
                    <th>Valor vencido</th>
                    <th>Estado</th>
                  </tr>

                </thead>

                <tbody>

                  {datosPagina.length ===
                  0 ? (
                    <tr>

                      <td
                        colSpan={14}
                        className="cartera-clientes-empty"
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
                            <strong className="cartera-clientes-codigo">
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
                            <div className="cartera-clientes-persona">

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
                            <strong className="cartera-clientes-money">
                              {formatearDinero(
                                registro.valorVenta
                              )}
                            </strong>
                          </td>

                          <td>
                            <strong className="cartera-clientes-money pagado">
                              {formatearDinero(
                                registro.totalPagado
                              )}
                            </strong>
                          </td>

                          <td>
                            <strong className="cartera-clientes-money pendiente">
                              {formatearDinero(
                                registro.saldoPendiente
                              )}
                            </strong>
                          </td>

                          <td>
                            <span className="cartera-clientes-contador pendiente">
                              {registro.cuotasPendientes ||
                                0}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`cartera-clientes-contador ${
                                numero(
                                  registro.cuotasVencidas
                                ) >
                                0
                                  ? "vencida"
                                  : ""
                              }`}
                            >
                              {registro.cuotasVencidas ||
                                0}
                            </span>
                          </td>

                          <td>
                            <strong
                              className={`cartera-clientes-money ${
                                numero(
                                  registro.valorVencido
                                ) >
                                0
                                  ? "vencido"
                                  : "pagado"
                              }`}
                            >
                              {formatearDinero(
                                registro.valorVencido
                              )}
                            </strong>
                          </td>

                          <td>
                            <span
                              className={`cartera-clientes-estado ${String(
                                registro.estadoCartera ||
                                  ""
                              ).toLowerCase()}`}
                            >
                              {registro.estadoCartera ||
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

            <div className="cartera-clientes-table-wrapper">

              <table className="cartera-clientes-table clientes">

                <thead>

                  <tr>
                    <th>Cliente</th>
                    <th>Documento</th>
                    <th>Teléfono</th>
                    <th>Ventas</th>
                    <th>Lotes</th>
                    <th>Valor comprado</th>
                    <th>Total pagado</th>
                    <th>Saldo pendiente</th>
                    <th>C. pendientes</th>
                    <th>C. vencidas</th>
                    <th>Valor vencido</th>
                    <th>Estado</th>
                  </tr>

                </thead>

                <tbody>

                  {datosPagina.length ===
                  0 ? (
                    <tr>

                      <td
                        colSpan={12}
                        className="cartera-clientes-empty"
                      >
                        No hay clientes que coincidan con los filtros seleccionados.
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
                            <div className="cartera-clientes-persona">

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
                            {item.cliente
                              ?.telefono ||
                              "—"}
                          </td>

                          <td>
                            <span className="cartera-clientes-contador">
                              {item.cantidadVentas ||
                                0}
                            </span>
                          </td>

                          <td>
                            <span className="cartera-clientes-contador">
                              {item.lotesComprados ||
                                0}
                            </span>
                          </td>

                          <td>
                            <strong className="cartera-clientes-money">
                              {formatearDinero(
                                item.valorComprado
                              )}
                            </strong>
                          </td>

                          <td>
                            <strong className="cartera-clientes-money pagado">
                              {formatearDinero(
                                item.totalPagado
                              )}
                            </strong>
                          </td>

                          <td>
                            <strong className="cartera-clientes-money pendiente">
                              {formatearDinero(
                                item.saldoPendiente
                              )}
                            </strong>
                          </td>

                          <td>
                            <span className="cartera-clientes-contador pendiente">
                              {item.cuotasPendientes ||
                                0}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`cartera-clientes-contador ${
                                numero(
                                  item.cuotasVencidas
                                ) >
                                0
                                  ? "vencida"
                                  : ""
                              }`}
                            >
                              {item.cuotasVencidas ||
                                0}
                            </span>
                          </td>

                          <td>
                            <strong
                              className={`cartera-clientes-money ${
                                numero(
                                  item.valorVencido
                                ) >
                                0
                                  ? "vencido"
                                  : "pagado"
                              }`}
                            >
                              {formatearDinero(
                                item.valorVencido
                              )}
                            </strong>
                          </td>

                          <td>
                            <span
                              className={`cartera-clientes-estado ${String(
                                item.estadoCartera ||
                                  ""
                              ).toLowerCase()}`}
                            >
                              {item.estadoCartera ||
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
        )}

        {/* =================================================
            PAGINACIÓN
        ================================================= */}

        {!cargando && (
          <footer className="cartera-clientes-table-footer">

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

            <div className="cartera-clientes-pagination">

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