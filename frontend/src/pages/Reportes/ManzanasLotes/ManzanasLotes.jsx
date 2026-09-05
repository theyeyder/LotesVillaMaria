import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  Banknote,
  FileSpreadsheet,
  FileText,
  Globe2,
  Grid2X2,
  LandPlot,
  LayoutList,
  MapPinned,
  RefreshCw,
  Ruler,
  Search,
  TriangleAlert,
  X,
} from "lucide-react";

import Toast from "../../../components/ui/Toast";

import {
  obtenerReporteManzanasLotes,
} from "../../../services/reportes/manzanasLotes.service";

import exportarExcel from "../utils/exportarExcel";
import exportarPDF from "../utils/exportarPDF";
import exportarHTML from "../utils/exportarHTML";

import {
  formatearDinero,
  formatearNumero,
  normalizarTexto,
  numero,
} from "../utils/formatos";

import "./ManzanasLotes.css";

/* =========================================================
   CONFIGURACIÓN
========================================================= */

const REGISTROS_POR_PAGINA =
  8;

/* =========================================================
   COMPONENTE
========================================================= */

export default function ManzanasLotes({
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
    detalleLotes,
    setDetalleLotes,
  ] = useState([]);

  const [
    resumen,
    setResumen,
  ] = useState({
    totalManzanas: 0,
    totalLotes: 0,

    lotesDisponibles: 0,
    lotesVendidos: 0,

    lotesRegulares: 0,
    lotesIrregulares: 0,

    areaTotalManzanas: 0,
    areaTotalLotes: 0,
    diferenciaArea: 0,

    valorTotalLotes: 0,
    valorDisponible: 0,
  });

  /* =======================================================
     VISTA
  ======================================================= */

  const [
    vista,
    setVista,
  ] = useState(
    "manzanas"
  );

  /* =======================================================
     CATÁLOGO DE MANZANAS
  ======================================================= */

  const [
    opcionesManzana,
    setOpcionesManzana,
  ] = useState([]);

  /* =======================================================
     FILTROS
  ======================================================= */

  const [
    buscar,
    setBuscar,
  ] = useState("");

  const [
    manzana,
    setManzana,
  ] = useState("");

  const [
    estado,
    setEstado,
  ] = useState("");

  const [
    tipo,
    setTipo,
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
     OPCIONES DE MANZANA
  ======================================================= */

  const actualizarManzanas = (
    datos = []
  ) => {
    const mapa =
      new Map();

    datos.forEach(
      (registro) => {
        if (
          !registro?._id ||
          !registro?.codigo
        ) {
          return;
        }

        mapa.set(
          String(
            registro._id
          ),
          {
            id:
              registro._id,

            codigo:
              registro.codigo,
          }
        );
      }
    );

    setOpcionesManzana(
      Array.from(
        mapa.values()
      ).sort(
        (a, b) =>
          String(
            a.codigo
          ).localeCompare(
            String(
              b.codigo
            ),
            "es",
            {
              numeric: true,
            }
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
          await obtenerReporteManzanasLotes(
            filtros
          );

        const nuevasManzanas =
          Array.isArray(
            respuesta?.registros
          )
            ? respuesta.registros
            : [];

        const nuevosLotes =
          Array.isArray(
            respuesta?.detalleLotes
          )
            ? respuesta.detalleLotes
            : [];

        setRegistros(
          nuevasManzanas
        );

        setDetalleLotes(
          nuevosLotes
        );

        setResumen({
          totalManzanas:
            numero(
              respuesta
                ?.resumen
                ?.totalManzanas
            ),

          totalLotes:
            numero(
              respuesta
                ?.resumen
                ?.totalLotes
            ),

          lotesDisponibles:
            numero(
              respuesta
                ?.resumen
                ?.lotesDisponibles
            ),

          lotesVendidos:
            numero(
              respuesta
                ?.resumen
                ?.lotesVendidos
            ),

          lotesRegulares:
            numero(
              respuesta
                ?.resumen
                ?.lotesRegulares
            ),

          lotesIrregulares:
            numero(
              respuesta
                ?.resumen
                ?.lotesIrregulares
            ),

          areaTotalManzanas:
            numero(
              respuesta
                ?.resumen
                ?.areaTotalManzanas
            ),

          areaTotalLotes:
            numero(
              respuesta
                ?.resumen
                ?.areaTotalLotes
            ),

          diferenciaArea:
            numero(
              respuesta
                ?.resumen
                ?.diferenciaArea
            ),

          valorTotalLotes:
            numero(
              respuesta
                ?.resumen
                ?.valorTotalLotes
            ),

          valorDisponible:
            numero(
              respuesta
                ?.resumen
                ?.valorDisponible
            ),
        });

        if (
          actualizarOpciones
        ) {
          actualizarManzanas(
            nuevasManzanas
          );
        }

        setPagina(
          1
        );
      } catch (error) {
        console.error(
          "Error cargando informe de manzanas y lotes:",
          error
        );

        const mensaje =
          error?.response
            ?.data
            ?.message ||
          "No fue posible cargar el informe de manzanas y lotes.";

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
        manzana,
        estado,
        tipo,
      });
    };

  /* =======================================================
     LIMPIAR
  ======================================================= */

  const limpiarFiltros =
    async () => {
      setBuscar(
        ""
      );

      setManzana(
        ""
      );

      setEstado(
        ""
      );

      setTipo(
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
     BÚSQUEDA LOCAL MANZANAS
  ======================================================= */

  const manzanasVisibles =
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
              registro.metrosTotales,
              registro.cantidadLotes,
              registro.lotesDisponibles,
              registro.lotesVendidos,
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
     BÚSQUEDA LOCAL LOTES
  ======================================================= */

  const lotesVisibles =
    useMemo(
      () => {
        const busqueda =
          normalizarTexto(
            buscar
          );

        if (
          !busqueda
        ) {
          return detalleLotes;
        }

        return detalleLotes.filter(
          (lote) => {
            const campos = [
              lote.manzana
                ?.codigo,

              lote.codigo,
              lote.tipo,
              lote.area,
              lote.valor,
              lote.estado,
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
        detalleLotes,
        buscar,
      ]
    );

  /* =======================================================
     DATOS SEGÚN VISTA
  ======================================================= */

  const datosVista =
    vista ===
    "lotes"
      ? lotesVisibles
      : manzanasVisibles;

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
     COLUMNAS MANZANAS
  ======================================================= */

  const columnasManzanas = [
    {
      titulo:
        "Manzana",
      clave:
        "codigo",
      ancho:
        16,
      anchoPDF:
        18,
    },

    {
      titulo:
        "Metros totales",
      clave:
        "metrosTotales",
      tipo:
        "numero",
      ancho:
        17,
      anchoPDF:
        18,
    },

    {
      titulo:
        "Cantidad lotes",
      clave:
        "cantidadLotes",
      tipo:
        "numero",
      ancho:
        16,
      anchoPDF:
        17,
    },

    {
      titulo:
        "Disponibles",
      clave:
        "lotesDisponibles",
      tipo:
        "numero",
      ancho:
        15,
      anchoPDF:
        16,
    },

    {
      titulo:
        "Vendidos",
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
        "Área lotes",
      clave:
        "areaLotes",
      tipo:
        "numero",
      ancho:
        16,
      anchoPDF:
        18,
    },

    {
      titulo:
        "Diferencia área",
      clave:
        "diferenciaArea",
      tipo:
        "numero",
      ancho:
        17,
      anchoPDF:
        18,
    },

    {
      titulo:
        "Valor total lotes",
      clave:
        "valorTotalLotes",
      tipo:
        "moneda",
      ancho:
        21,
      anchoPDF:
        24,
    },

    {
      titulo:
        "Inventario disponible",
      clave:
        "valorInventarioDisponible",
      tipo:
        "moneda",
      ancho:
        23,
      anchoPDF:
        25,
    },
  ];

  /* =======================================================
     FILAS MANZANAS
  ======================================================= */

  const filasManzanas =
    useMemo(
      () => {
        return manzanasVisibles.map(
          (registro) => ({
            codigo:
              registro.codigo ||
              "—",

            metrosTotales:
              numero(
                registro.metrosTotales
              ),

            cantidadLotes:
              numero(
                registro.cantidadLotes
              ),

            lotesDisponibles:
              numero(
                registro.lotesDisponibles
              ),

            lotesVendidos:
              numero(
                registro.lotesVendidos
              ),

            areaLotes:
              numero(
                registro.areaLotes
              ),

            diferenciaArea:
              numero(
                registro.diferenciaArea
              ),

            valorTotalLotes:
              numero(
                registro.valorTotalLotes
              ),

            valorInventarioDisponible:
              numero(
                registro.valorInventarioDisponible
              ),
          })
        );
      },
      [
        manzanasVisibles,
      ]
    );

  /* =======================================================
     COLUMNAS LOTES
  ======================================================= */

  const columnasLotes = [
    {
      titulo:
        "Manzana",
      clave:
        "manzana",
      ancho:
        17,
      anchoPDF:
        18,
    },

    {
      titulo:
        "Lote",
      clave:
        "codigo",
      ancho:
        16,
      anchoPDF:
        17,
    },

    {
      titulo:
        "Tipo",
      clave:
        "tipo",
      ancho:
        15,
      anchoPDF:
        16,
    },

    {
      titulo:
        "Área m²",
      clave:
        "area",
      tipo:
        "numero",
      ancho:
        15,
      anchoPDF:
        17,
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
        23,
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
        17,
    },
  ];

  /* =======================================================
     FILAS LOTES
  ======================================================= */

  const filasLotes =
    useMemo(
      () => {
        return lotesVisibles.map(
          (lote) => ({
            manzana:
              lote.manzana
                ?.codigo ||
              "—",

            codigo:
              lote.codigo ||
              "—",

            tipo:
              lote.tipo ||
              "—",

            area:
              numero(
                lote.area
              ),

            valor:
              numero(
                lote.valor
              ),

            estado:
              lote.estado ||
              "—",
          })
        );
      },
      [
        lotesVisibles,
      ]
    );

  /* =======================================================
     RESUMEN EXPORTACIÓN
  ======================================================= */

  const resumenExportacion = [
    {
      label:
        "Manzanas",

      valor:
        resumen.totalManzanas,

      tipo:
        "numero",

      color:
        "azul",

      detalle:
        "Manzanas incluidas en el informe",
    },

    {
      label:
        "Total lotes",

      valor:
        resumen.totalLotes,

      tipo:
        "numero",

      color:
        "azul",

      detalle:
        `${resumen.lotesDisponibles} disponible(s) · ${resumen.lotesVendidos} vendido(s)`,
    },

    {
      label:
        "Área de lotes",

      valor:
        resumen.areaTotalLotes,

      tipo:
        "numero",

      detalle:
        `${formatearNumero(
          resumen.areaTotalLotes
        )} m² distribuidos`,
    },

    {
      label:
        "Diferencia de área",

      valor:
        resumen.diferenciaArea,

      tipo:
        "numero",

      color:
        resumen.diferenciaArea <
        0
          ? "rojo"
          : "dorado",

      detalle:
        "Diferencia entre área registrada y lotes",
    },

    {
      label:
        "Valor total lotes",

      valor:
        resumen.valorTotalLotes,

      tipo:
        "moneda",

      detalle:
        "Valor total registrado",
    },

    {
      label:
        "Inventario disponible",

      valor:
        resumen.valorDisponible,

      tipo:
        "moneda",

      color:
        "dorado",

      detalle:
        "Valor de lotes disponibles",
    },
  ];

  /* =======================================================
     FILTROS EXPORTACIÓN
  ======================================================= */

  const filtrosExportacion =
    useMemo(
      () => {
        const seleccionada =
          opcionesManzana.find(
            (item) =>
              String(
                item.id
              ) ===
              String(
                manzana
              )
          );

        return [
          {
            label:
              "Manzana",

            valor:
              seleccionada
                ?.codigo ||
              "Todas",
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
              "Tipo",

            valor:
              tipo ||
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
              "lotes"
                ? "Detalle de lotes"
                : "Resumen por manzana",
          },
        ];
      },
      [
        opcionesManzana,
        manzana,
        estado,
        tipo,
        buscar,
        vista,
      ]
    );

  /* =======================================================
     CONFIGURACIÓN EXPORTACIÓN
  ======================================================= */

  const obtenerConfiguracionExportacion =
    () => {
      if (
        vista ===
        "lotes"
      ) {
        return {
          titulo:
            "Detalle de lotes por manzana",

          subtitulo:
            "Inventario de lotes, áreas, valores y estados",

          nombreArchivo:
            "DetalleLotes",

          columnas:
            columnasLotes,

          filas:
            filasLotes,
        };
      }

      return {
        titulo:
          "Informe de manzanas y lotes",

        subtitulo:
          "Resumen de manzanas, lotes, áreas e inventario",

        nombreArchivo:
          "ManzanasLotes",

        columnas:
          columnasManzanas,

        filas:
          filasManzanas,
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
    <div className="manzanas-lotes-reporte">

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

      <header className="manzanas-lotes-header">

        <div className="manzanas-lotes-header-left">

          {onVolver && (
            <button
              type="button"
              className="manzanas-lotes-back"
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

            <span className="manzanas-lotes-kicker">
              Informe independiente
            </span>

            <h1>
              Manzanas y sus lotes
            </h1>

            <p>
              Consulta la distribución de lotes por manzana, áreas registradas, disponibilidad, ventas y valor del inventario.
            </p>

          </div>

        </div>

        <button
          type="button"
          className="manzanas-lotes-refresh"
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
                ? "manzanas-lotes-spin"
                : ""
            }
          />

          Actualizar
        </button>

      </header>

      {/* ===================================================
          INDICADORES
      =================================================== */}

      <section className="manzanas-lotes-stats">

        <article className="manzanas-lotes-stat">

          <i className="azul">
            <MapPinned
              size={20}
            />
          </i>

          <div>
            <span>
              Manzanas
            </span>

            <strong>
              {formatearNumero(
                resumen.totalManzanas
              )}
            </strong>

            <small>
              Registradas
            </small>
          </div>

        </article>

        <article className="manzanas-lotes-stat">

          <i>
            <Grid2X2
              size={20}
            />
          </i>

          <div>
            <span>
              Total lotes
            </span>

            <strong>
              {formatearNumero(
                resumen.totalLotes
              )}
            </strong>

            <small>
              {resumen.lotesRegulares} regular(es) · {resumen.lotesIrregulares} irregular(es)
            </small>
          </div>

        </article>

        <article className="manzanas-lotes-stat">

          <i className="verde">
            <LandPlot
              size={20}
            />
          </i>

          <div>
            <span>
              Disponibles
            </span>

            <strong className="texto-verde">
              {formatearNumero(
                resumen.lotesDisponibles
              )}
            </strong>

            <small>
              Lotes disponibles
            </small>
          </div>

        </article>

        <article className="manzanas-lotes-stat">

          <i className="dorado">
            <LandPlot
              size={20}
            />
          </i>

          <div>
            <span>
              Vendidos
            </span>

            <strong className="texto-dorado">
              {formatearNumero(
                resumen.lotesVendidos
              )}
            </strong>

            <small>
              Lotes vendidos
            </small>
          </div>

        </article>

        <article className="manzanas-lotes-stat">

          <i className="azul">
            <Ruler
              size={20}
            />
          </i>

          <div>
            <span>
              Área distribuida
            </span>

            <strong>
              {formatearNumero(
                resumen.areaTotalLotes
              )} m²
            </strong>

            <small>
              Área total de lotes
            </small>
          </div>

        </article>

        <article className="manzanas-lotes-stat">

          <i className="dorado">
            <Banknote
              size={20}
            />
          </i>

          <div>
            <span>
              Inventario disponible
            </span>

            <strong className="texto-dorado">
              {formatearDinero(
                resumen.valorDisponible
              )}
            </strong>

            <small>
              Valor de lotes disponibles
            </small>
          </div>

        </article>

      </section>

      {/* ===================================================
          FILTROS
      =================================================== */}

      <section className="manzanas-lotes-filtros">

        <div className="manzanas-lotes-search">

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
            placeholder="Buscar manzana, lote, tipo, estado..."
          />

        </div>

        <label className="manzanas-lotes-field">

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
                  {opcion.codigo}
                </option>
              )
            )}

          </select>

        </label>

        <label className="manzanas-lotes-field">

          <span>
            Estado lote
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

            <option value="Disponible">
              Disponible
            </option>

            <option value="Vendido">
              Vendido
            </option>

          </select>

        </label>

        <label className="manzanas-lotes-field">

          <span>
            Tipo de lote
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

            <option value="Regular">
              Regular
            </option>

            <option value="Irregular">
              Irregular
            </option>

          </select>

        </label>

        <button
          type="button"
          className="manzanas-lotes-aplicar"
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
          className="manzanas-lotes-limpiar"
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

      <section className="manzanas-lotes-vistas">

        <button
          type="button"
          className={
            vista ===
            "manzanas"
              ? "active"
              : ""
          }
          onClick={() =>
            cambiarVista(
              "manzanas"
            )
          }
        >
          <MapPinned
            size={16}
          />

          Resumen por manzana

          <span>
            {manzanasVisibles.length}
          </span>
        </button>

        <button
          type="button"
          className={
            vista ===
            "lotes"
              ? "active"
              : ""
          }
          onClick={() =>
            cambiarVista(
              "lotes"
            )
          }
        >
          <LayoutList
            size={16}
          />

          Detalle de lotes

          <span>
            {lotesVisibles.length}
          </span>
        </button>

      </section>

      {/* ===================================================
          EXPORTACIÓN
      =================================================== */}

      <section className="manzanas-lotes-export">

        <div>

          <strong>
            {vista ===
            "lotes"
              ? "Detalle de lotes"
              : "Resumen por manzana"}
          </strong>

          <span>
            {datosVista.length} registro(s) encontrados
          </span>

        </div>

        <div className="manzanas-lotes-export-buttons">

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
        <div className="manzanas-lotes-error">

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

      <section className="manzanas-lotes-panel">

        {cargando ? (
          <div className="manzanas-lotes-loading">

            <RefreshCw
              size={25}
              className="manzanas-lotes-spin"
            />

            <span>
              Generando informe...
            </span>

          </div>
        ) : vista ===
          "lotes" ? (
          <>
            <div className="manzanas-lotes-table-wrapper">

              <table className="manzanas-lotes-table lotes">

                <thead>

                  <tr>
                    <th>Manzana</th>
                    <th>Lote</th>
                    <th>Tipo</th>
                    <th>Área</th>
                    <th>Valor</th>
                    <th>Estado</th>
                  </tr>

                </thead>

                <tbody>

                  {datosPagina.length ===
                  0 ? (
                    <tr>

                      <td
                        colSpan={6}
                        className="manzanas-lotes-empty"
                      >
                        No hay lotes que coincidan con los filtros seleccionados.
                      </td>

                    </tr>
                  ) : (
                    datosPagina.map(
                      (
                        lote,
                        indice
                      ) => (
                        <tr
                          key={
                            lote._id ||
                            indice
                          }
                        >

                          <td>
                            <strong className="manzanas-lotes-codigo">
                              {lote.manzana
                                ?.codigo ||
                                "—"}
                            </strong>
                          </td>

                          <td>
                            <strong>
                              {lote.codigo ||
                                "—"}
                            </strong>
                          </td>

                          <td>
                            <span className="manzanas-lotes-tipo">
                              {lote.tipo ||
                                "—"}
                            </span>
                          </td>

                          <td>
                            {formatearNumero(
                              lote.area
                            )}{" "}
                            m²
                          </td>

                          <td>
                            <strong className="manzanas-lotes-money">
                              {formatearDinero(
                                lote.valor
                              )}
                            </strong>
                          </td>

                          <td>
                            <span
                              className={`manzanas-lotes-estado ${String(
                                lote.estado ||
                                  ""
                              ).toLowerCase()}`}
                            >
                              {lote.estado ||
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
            <div className="manzanas-lotes-table-wrapper">

              <table className="manzanas-lotes-table manzanas">

                <thead>

                  <tr>
                    <th>Manzana</th>
                    <th>Metros totales</th>
                    <th>Lotes</th>
                    <th>Disponibles</th>
                    <th>Vendidos</th>
                    <th>Área lotes</th>
                    <th>Diferencia área</th>
                    <th>Valor total</th>
                    <th>Inventario disponible</th>
                  </tr>

                </thead>

                <tbody>

                  {datosPagina.length ===
                  0 ? (
                    <tr>

                      <td
                        colSpan={9}
                        className="manzanas-lotes-empty"
                      >
                        No hay manzanas que coincidan con los filtros seleccionados.
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
                            <strong className="manzanas-lotes-codigo">
                              {registro.codigo ||
                                "—"}
                            </strong>
                          </td>

                          <td>
                            {formatearNumero(
                              registro.metrosTotales
                            )}{" "}
                            m²
                          </td>

                          <td>
                            <span className="manzanas-lotes-contador">
                              {registro.cantidadLotes ||
                                0}
                            </span>
                          </td>

                          <td>
                            <span className="manzanas-lotes-contador disponible">
                              {registro.lotesDisponibles ||
                                0}
                            </span>
                          </td>

                          <td>
                            <span className="manzanas-lotes-contador vendido">
                              {registro.lotesVendidos ||
                                0}
                            </span>
                          </td>

                          <td>
                            {formatearNumero(
                              registro.areaLotes
                            )}{" "}
                            m²
                          </td>

                          <td>
                            <strong
                              className={
                                numero(
                                  registro.diferenciaArea
                                ) <
                                0
                                  ? "manzanas-lotes-diferencia negativa"
                                  : "manzanas-lotes-diferencia"
                              }
                            >
                              {formatearNumero(
                                registro.diferenciaArea
                              )}{" "}
                              m²
                            </strong>
                          </td>

                          <td>
                            <strong className="manzanas-lotes-money">
                              {formatearDinero(
                                registro.valorTotalLotes
                              )}
                            </strong>
                          </td>

                          <td>
                            <strong className="manzanas-lotes-money disponible">
                              {formatearDinero(
                                registro.valorInventarioDisponible
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
          </>
        )}

        {!cargando && (
          <footer className="manzanas-lotes-table-footer">

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

            <div className="manzanas-lotes-pagination">

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