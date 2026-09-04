import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  CircleDollarSign,
  FileSpreadsheet,
  FileText,
  Globe2,
  MapPinned,
  RefreshCw,
  Search,
  TriangleAlert,
  Users,
  WalletCards,
  X,
} from "lucide-react";

import Toast from "../../../components/ui/Toast";

import {
  obtenerClientesLotesVendidos,
} from "../../../services/reportes/clientesLotes.service";

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

import "./ClientesLotesVendidos.css";

/* =========================================================
   CONSTANTES
========================================================= */

const REGISTROS_POR_PAGINA =
  8;

/* =========================================================
   COMPONENTE
========================================================= */

export default function ClientesLotesVendidos({
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
    resumen,
    setResumen,
  ] = useState({
    clientesCompradores: 0,
    lotesVendidos: 0,

    totalVendido: 0,
    totalCuotaInicial: 0,
    totalPagado: 0,

    saldoPendiente: 0,
    valorVencido: 0,

    ventasPagadas: 0,
    ventasPendientes: 0,
    ventasVencidas: 0,
  });

  /* =======================================================
     CATÁLOGOS PARA FILTROS
  ======================================================= */

  const [
    opcionesManzana,
    setOpcionesManzana,
  ] = useState([]);

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
    manzana,
    setManzana,
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
     CONSTRUIR CATÁLOGOS
  ======================================================= */

  const actualizarCatalogos = (
    datos
  ) => {
    const mapaManzanas =
      new Map();

    const mapaVendedores =
      new Map();

    datos.forEach(
      (registro) => {
        const manzanaRegistro =
          registro.manzana;

        if (
          manzanaRegistro
            ?.codigo
        ) {
          const clave =
            String(
              manzanaRegistro._id ||
                manzanaRegistro.codigo
            );

          mapaManzanas.set(
            clave,
            {
              id:
                manzanaRegistro._id ||
                manzanaRegistro.codigo,

              nombre:
                manzanaRegistro.codigo,
            }
          );
        }

        const vendedorRegistro =
          registro.vendedor;

        if (
          vendedorRegistro
            ?.nombre &&
          vendedorRegistro
            .nombre !==
            "Sin vendedor"
        ) {
          const clave =
            String(
              vendedorRegistro._id ||
                vendedorRegistro.codigo ||
                vendedorRegistro.nombre
            );

          mapaVendedores.set(
            clave,
            {
              id:
                vendedorRegistro._id ||
                vendedorRegistro.codigo ||
                vendedorRegistro.nombre,

              codigo:
                vendedorRegistro.codigo ||
                "",

              nombre:
                vendedorRegistro.nombre,
            }
          );
        }
      }
    );

    setOpcionesManzana(
      Array.from(
        mapaManzanas.values()
      ).sort(
        (a, b) =>
          String(
            a.nombre
          ).localeCompare(
            String(
              b.nombre
            ),
            "es",
            {
              numeric: true,
            }
          )
      )
    );

    setOpcionesVendedor(
      Array.from(
        mapaVendedores.values()
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
          await obtenerClientesLotesVendidos(
            filtros
          );

        const nuevosRegistros =
          Array.isArray(
            respuesta?.registros
          )
            ? respuesta.registros
            : [];

        setRegistros(
          nuevosRegistros
        );

        setResumen({
          clientesCompradores:
            numero(
              respuesta
                ?.resumen
                ?.clientesCompradores
            ),

          lotesVendidos:
            numero(
              respuesta
                ?.resumen
                ?.lotesVendidos
            ),

          totalVendido:
            numero(
              respuesta
                ?.resumen
                ?.totalVendido
            ),

          totalCuotaInicial:
            numero(
              respuesta
                ?.resumen
                ?.totalCuotaInicial
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

          ventasPagadas:
            numero(
              respuesta
                ?.resumen
                ?.ventasPagadas
            ),

          ventasPendientes:
            numero(
              respuesta
                ?.resumen
                ?.ventasPendientes
            ),

          ventasVencidas:
            numero(
              respuesta
                ?.resumen
                ?.ventasVencidas
            ),
        });

        if (
          actualizarOpciones
        ) {
          actualizarCatalogos(
            nuevosRegistros
          );
        }

        setPagina(
          1
        );
      } catch (error) {
        console.error(
          "Error cargando clientes por lotes vendidos:",
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
        manzana,
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

      setManzana(
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
     FILTRO LOCAL ADICIONAL

     Permite que el buscador responda inmediatamente sin
     tener que consultar el backend en cada tecla.
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
              registro.codigoVenta,

              registro
                .cliente
                ?.nombre,

              registro
                .cliente
                ?.documento,

              registro
                .cliente
                ?.telefono,

              registro
                .cliente
                ?.ciudad,

              registro
                .manzana
                ?.codigo,

              registro
                .lote
                ?.codigo,

              registro
                .lote
                ?.tipo,

              registro
                .vendedor
                ?.nombre,

              registro
                .vendedor
                ?.codigo,

              registro.formaPago,

              registro.estadoCartera,
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
     PAGINACIÓN
  ======================================================= */

  const totalPaginas =
    Math.max(
      1,
      Math.ceil(
        registrosVisibles.length /
          REGISTROS_POR_PAGINA
      )
    );

  const paginaActual =
    Math.min(
      pagina,
      totalPaginas
    );

  const registrosPagina =
    useMemo(
      () => {
        const inicio =
          (
            paginaActual -
            1
          ) *
          REGISTROS_POR_PAGINA;

        return registrosVisibles.slice(
          inicio,
          inicio +
            REGISTROS_POR_PAGINA
        );
      },
      [
        registrosVisibles,
        paginaActual,
      ]
    );

  /* =======================================================
     COLUMNAS COMPARTIDAS
     PDF / EXCEL / HTML

     Importante:
     "filasExportacion" se aplana para que las utilidades
     compartidas no necesiten conocer la estructura del
     objeto original.
  ======================================================= */

  const columnasExportacion = [
    {
      titulo:
        "Venta",
      clave:
        "codigoVenta",
      ancho:
        14,
      anchoPDF:
        15,
    },

    {
      titulo:
        "Fecha",
      clave:
        "fechaVenta",
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
        12,
      anchoPDF:
        13,
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
        "Cuota inicial",
      clave:
        "cuotaInicial",
      tipo:
        "moneda",
      ancho:
        19,
      anchoPDF:
        21,
    },

    {
      titulo:
        "Total pagado",
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
        "Cuotas vencidas",
      clave:
        "cuotasVencidas",
      tipo:
        "numero",
      ancho:
        16,
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
        19,
      anchoPDF:
        21,
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
  ];

  /* =======================================================
     FILAS PARA EXPORTACIÓN

     Usamos todos los registros filtrados, NO únicamente
     la página visible.
  ======================================================= */

  const filasExportacion =
    useMemo(
      () => {
        return registrosVisibles.map(
          (registro) => ({
            codigoVenta:
              registro.codigoVenta ||
              "—",

            fechaVenta:
              registro.fechaVenta,

            cliente:
              registro.cliente
                ?.nombre ||
              "—",

            documento:
              registro.cliente
                ?.documento ||
              "—",

            telefono:
              registro.cliente
                ?.telefono ||
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
                  ?.area
              ),

            valorVenta:
              numero(
                registro.valorVenta
              ),

            formaPago:
              registro.formaPago ||
              "—",

            cuotaInicial:
              numero(
                registro.cuotaInicial
              ),

            totalPagado:
              numero(
                registro.totalPagado
              ),

            saldoPendiente:
              numero(
                registro.saldoPendiente
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

            vendedor:
              registro.vendedor
                ?.nombre ||
              "Sin vendedor",
          })
        );
      },
      [
        registrosVisibles,
      ]
    );

  /* =======================================================
     RESUMEN PARA EXPORTACIONES
  ======================================================= */

  const resumenExportacion = [
    {
      label:
        "Clientes compradores",

      valor:
        resumen.clientesCompradores,

      tipo:
        "numero",

      color:
        "azul",

      detalle:
        "Clientes únicos con compra registrada",
    },

    {
      label:
        "Lotes vendidos",

      valor:
        resumen.lotesVendidos,

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
        "Valor comercial de las ventas",
    },

    {
      label:
        "Total pagado",

      valor:
        resumen.totalPagado,

      tipo:
        "moneda",

      detalle:
        "Cuota inicial más abonos registrados",
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
        `${resumen.ventasPendientes} venta(s) pendiente(s)`,
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
        `${resumen.ventasVencidas} venta(s) vencida(s)`,
    },
  ];

  /* =======================================================
     FILTROS PARA EXPORTACIONES
  ======================================================= */

  const filtrosExportacion =
    useMemo(
      () => {
        const opcionManzana =
          opcionesManzana.find(
            (item) =>
              String(
                item.id
              ) ===
              String(
                manzana
              )
          );

        const opcionVendedor =
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
              "Manzana",

            valor:
              opcionManzana
                ?.nombre ||
              "Todas",
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
        ];
      },
      [
        desde,
        hasta,
        manzana,
        vendedor,
        estado,
        buscar,
        opcionesManzana,
        opcionesVendedor,
      ]
    );

  /* =======================================================
     EXPORTAR EXCEL
  ======================================================= */

  const generarExcel =
    () => {
      const correcto =
        exportarExcel({
          titulo:
            "Clientes por lotes vendidos",

          subtitulo:
            "Detalle de compradores, lotes adquiridos y estado de cartera",

          nombreArchivo:
            "ClientesLotesVendidos",

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
            "Clientes por lotes vendidos",

          subtitulo:
            "Compradores, ventas, cartera y vendedores",

          nombreArchivo:
            "ClientesLotesVendidos",

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
            "Clientes por lotes vendidos",

          subtitulo:
            "Compradores, lotes adquiridos y estado de cartera",

          nombreArchivo:
            "ClientesLotesVendidos",

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
    <div className="clientes-lotes-reporte">

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

      <header className="clientes-lotes-header">

        <div className="clientes-lotes-header-left">

          {onVolver && (
            <button
              type="button"
              className="clientes-lotes-back"
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

            <span className="clientes-lotes-kicker">
              Informe independiente
            </span>

            <h1>
              Clientes por lotes vendidos
            </h1>

            <p>
              Consulta compradores, lotes adquiridos, valores de venta, pagos, cartera y vendedor asociado.
            </p>

          </div>

        </div>

        <button
          type="button"
          className="clientes-lotes-refresh"
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
                ? "clientes-lotes-spin"
                : ""
            }
          />

          Actualizar
        </button>

      </header>

      {/* ===================================================
          RESUMEN
      =================================================== */}

      <section className="clientes-lotes-stats">

        <article className="clientes-lotes-stat">

          <i className="azul">
            <Users
              size={20}
            />
          </i>

          <div>
            <span>
              Clientes compradores
            </span>

            <strong>
              {formatearNumero(
                resumen.clientesCompradores
              )}
            </strong>

            <small>
              Clientes únicos
            </small>
          </div>

        </article>

        <article className="clientes-lotes-stat">

          <i>
            <MapPinned
              size={20}
            />
          </i>

          <div>
            <span>
              Lotes vendidos
            </span>

            <strong>
              {formatearNumero(
                resumen.lotesVendidos
              )}
            </strong>

            <small>
              Ventas registradas
            </small>
          </div>

        </article>

        <article className="clientes-lotes-stat">

          <i>
            <Banknote
              size={20}
            />
          </i>

          <div>
            <span>
              Total vendido
            </span>

            <strong>
              {formatearDinero(
                resumen.totalVendido
              )}
            </strong>

            <small>
              Valor de las ventas
            </small>
          </div>

        </article>

        <article className="clientes-lotes-stat">

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
              Recaudado en las ventas
            </small>
          </div>

        </article>

        <article className="clientes-lotes-stat">

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
              {resumen.ventasPendientes} venta(s) pendiente(s)
            </small>
          </div>

        </article>

        <article className="clientes-lotes-stat">

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
              {resumen.ventasVencidas} venta(s) vencida(s)
            </small>
          </div>

        </article>

      </section>

      {/* ===================================================
          FILTROS
      =================================================== */}

      <section className="clientes-lotes-filtros">

        <div className="clientes-lotes-search">

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
            placeholder="Cliente, documento, teléfono, lote, vendedor..."
          />

        </div>

        <label className="clientes-lotes-field">

          <span>
            Desde
          </span>

          <div className="clientes-lotes-date">

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

        <label className="clientes-lotes-field">

          <span>
            Hasta
          </span>

          <div className="clientes-lotes-date">

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

        <label className="clientes-lotes-field">

          <span>
            Manzana
          </span>

          <select
            value={
              manzana
            }
            onChange={(
              event
            ) =>
              setManzana(
                event.target.value
              )
            }
          >
            <option value="">
              Todas
            </option>

            {opcionesManzana.map(
              (opcion) => (
                <option
                  key={
                    opcion.id
                  }
                  value={
                    opcion.id
                  }
                >
                  {opcion.nombre}
                </option>
              )
            )}

          </select>

        </label>

        <label className="clientes-lotes-field">

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

        <label className="clientes-lotes-field">

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
          className="clientes-lotes-aplicar"
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
          className="clientes-lotes-limpiar"
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
          EXPORTACIONES
      =================================================== */}

      <section className="clientes-lotes-export">

        <div>

          <strong>
            Informe generado
          </strong>

          <span>
            {registrosVisibles.length} registro(s) encontrados
          </span>

        </div>

        <div className="clientes-lotes-export-buttons">

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
        <div className="clientes-lotes-error">

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

      <section className="clientes-lotes-panel">

        {cargando ? (
          <div className="clientes-lotes-loading">

            <RefreshCw
              size={25}
              className="clientes-lotes-spin"
            />

            <span>
              Generando informe...
            </span>

          </div>
        ) : (
          <>
            <div className="clientes-lotes-table-wrapper">

              <table className="clientes-lotes-table">

                <thead>

                  <tr>
                    <th>
                      Venta
                    </th>

                    <th>
                      Fecha
                    </th>

                    <th>
                      Cliente
                    </th>

                    <th>
                      Documento
                    </th>

                    <th>
                      Teléfono
                    </th>

                    <th>
                      Manzana
                    </th>

                    <th>
                      Lote
                    </th>

                    <th>
                      Área
                    </th>

                    <th>
                      Valor venta
                    </th>

                    <th>
                      Forma pago
                    </th>

                    <th>
                      Cuota inicial
                    </th>

                    <th>
                      Pagado
                    </th>

                    <th>
                      Saldo
                    </th>

                    <th>
                      C. vencidas
                    </th>

                    <th>
                      Valor vencido
                    </th>

                    <th>
                      Estado
                    </th>

                    <th>
                      Vendedor
                    </th>
                  </tr>

                </thead>

                <tbody>

                  {registrosPagina.length ===
                  0 ? (
                    <tr>

                      <td
                        colSpan={17}
                        className="clientes-lotes-empty"
                      >
                        No hay ventas que coincidan con los filtros seleccionados.
                      </td>

                    </tr>
                  ) : (
                    registrosPagina.map(
                      (registro) => (
                        <tr
                          key={
                            registro._id
                          }
                        >

                          <td>
                            <strong className="clientes-lotes-codigo">
                              {registro.codigoVenta}
                            </strong>
                          </td>

                          <td>
                            {formatearFecha(
                              registro.fechaVenta
                            )}
                          </td>

                          <td>
                            <div className="clientes-lotes-cliente">

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
                            {registro.cliente
                              ?.telefono ||
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
                                ?.area
                            )}{" "}
                            m²
                          </td>

                          <td>
                            <strong className="clientes-lotes-money">
                              {formatearDinero(
                                registro.valorVenta
                              )}
                            </strong>
                          </td>

                          <td>
                            {registro.formaPago ||
                              "—"}
                          </td>

                          <td>
                            <strong className="clientes-lotes-money">
                              {formatearDinero(
                                registro.cuotaInicial
                              )}
                            </strong>
                          </td>

                          <td>
                            <strong className="clientes-lotes-money pagado">
                              {formatearDinero(
                                registro.totalPagado
                              )}
                            </strong>
                          </td>

                          <td>
                            <strong
                              className={`clientes-lotes-money ${
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
                            <span
                              className={`clientes-lotes-cuotas ${
                                numero(
                                  registro.cuotasVencidas
                                ) >
                                0
                                  ? "vencidas"
                                  : ""
                              }`}
                            >
                              {registro.cuotasVencidas ||
                                0}
                            </span>
                          </td>

                          <td>
                            <strong
                              className={`clientes-lotes-money ${
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
                              className={`clientes-lotes-estado ${String(
                                registro.estadoCartera ||
                                  ""
                              ).toLowerCase()}`}
                            >
                              {registro.estadoCartera ||
                                "—"}
                            </span>
                          </td>

                          <td>
                            <div className="clientes-lotes-vendedor">

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

                        </tr>
                      )
                    )
                  )}

                </tbody>

              </table>

            </div>

            {/* ===============================================
                PAGINACIÓN
            =============================================== */}

            <footer className="clientes-lotes-table-footer">

              <span>
                Mostrando{" "}
                {registrosVisibles.length ===
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
                  registrosVisibles.length
                )}
                {" de "}
                {registrosVisibles.length}
              </span>

              <div className="clientes-lotes-pagination">

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
          </>
        )}

      </section>

    </div>
  );
}