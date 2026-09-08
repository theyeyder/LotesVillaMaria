import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  Boxes,
  CircleDollarSign,
  FileSpreadsheet,
  FileText,
  Globe2,
  LandPlot,
  Layers3,
  List,
  MapPinned,
  RefreshCw,
  Ruler,
  Search,
  X,
} from "lucide-react";

import Toast from "../../../components/ui/Toast";

import {
  obtenerReporteLotesDisponibles,
} from "../../../services/reportes/lotesDisponibles.service";

import exportarExcel from "../utils/exportarExcel";
import exportarPDF from "../utils/exportarPDF";
import exportarHTML from "../utils/exportarHTML";

import {
  formatearDinero,
  formatearNumero,
  normalizarTexto,
  numero,
} from "../utils/formatos";

import "./LotesDisponibles.css";

/* =========================================================
   CONSTANTES
========================================================= */

const REGISTROS_POR_PAGINA =
  8;

/* =========================================================
   COMPONENTE
========================================================= */

export default function LotesDisponibles({
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
    manzanas,
    setManzanas,
  ] = useState([]);

  const [
    registros,
    setRegistros,
  ] = useState([]);

  const [
    resumen,
    setResumen,
  ] = useState({
    manzanas: 0,
    lotesDisponibles: 0,
    lotesRegulares: 0,
    lotesIrregulares: 0,
    areaDisponible: 0,
    areaPromedio: 0,
    valorInventario: 0,
    valorPromedio: 0,
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
    tipo,
    setTipo,
  ] = useState("");

  const [
    areaDesde,
    setAreaDesde,
  ] = useState("");

  const [
    areaHasta,
    setAreaHasta,
  ] = useState("");

  const [
    valorDesde,
    setValorDesde,
  ] = useState("");

  const [
    valorHasta,
    setValorHasta,
  ] = useState("");

  /* =======================================================
     CATÁLOGO MANZANAS
  ======================================================= */

  const [
    opcionesManzana,
    setOpcionesManzana,
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
    tipoToast = "success"
  ) => {
    setToast({
      mensaje,
      tipo:
        tipoToast,
    });
  };

  /* =======================================================
     CATÁLOGO DE MANZANAS
  ======================================================= */

  const actualizarCatalogoManzanas =
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
            registro.manzana;

          if (
            !item?._id
          ) {
            return;
          }

          mapa.set(
            String(
              item._id
            ),
            {
              id:
                item._id,

              codigo:
                item.codigo ||
                "—",

              nombre:
                item.nombre ||
                "",
            }
          );
        }
      );

      setOpcionesManzana(
        Array.from(
          mapa.values()
        ).sort(
          (
            a,
            b
          ) =>
            String(
              a.codigo
            ).localeCompare(
              String(
                b.codigo
              ),
              "es",
              {
                numeric:
                  true,
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
          await obtenerReporteLotesDisponibles(
            filtros
          );

        const nuevasManzanas =
          Array.isArray(
            respuesta?.manzanas
          )
            ? respuesta.manzanas
            : [];

        const nuevosRegistros =
          Array.isArray(
            respuesta?.registros
          )
            ? respuesta.registros
            : [];

        setManzanas(
          nuevasManzanas
        );

        setRegistros(
          nuevosRegistros
        );

        setResumen({
          manzanas:
            numero(
              respuesta
                ?.resumen
                ?.manzanas
            ),

          lotesDisponibles:
            numero(
              respuesta
                ?.resumen
                ?.lotesDisponibles
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

          areaDisponible:
            numero(
              respuesta
                ?.resumen
                ?.areaDisponible
            ),

          areaPromedio:
            numero(
              respuesta
                ?.resumen
                ?.areaPromedio
            ),

          valorInventario:
            numero(
              respuesta
                ?.resumen
                ?.valorInventario
            ),

          valorPromedio:
            numero(
              respuesta
                ?.resumen
                ?.valorPromedio
            ),
        });

        if (
          actualizarOpciones
        ) {
          actualizarCatalogoManzanas(
            nuevosRegistros
          );
        }

        setPagina(
          1
        );
      } catch (
        errorCargar
      ) {
        console.error(
          "Error cargando informe de lotes disponibles:",
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
        manzana,
        tipo,
        areaDesde,
        areaHasta,
        valorDesde,
        valorHasta,
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

      setManzana(
        ""
      );

      setTipo(
        ""
      );

      setAreaDesde(
        ""
      );

      setAreaHasta(
        ""
      );

      setValorDesde(
        ""
      );

      setValorHasta(
        ""
      );

      await cargarInforme(
        {},
        true
      );
    };

  /* =======================================================
     FILTRO LOCAL MANZANAS
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
          return manzanas;
        }

        return manzanas.filter(
          (
            item
          ) => {
            const campos = [
              item.manzana
                ?.codigo,

              item.manzana
                ?.nombre,

              item.manzana
                ?.estado,
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
        manzanas,
        buscar,
      ]
    );

  /* =======================================================
     FILTRO LOCAL LOTES
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

              registro.numeroLote,

              registro.tipo,

              registro.frente,

              registro.fondo,

              registro.estado,

              registro.manzana
                ?.codigo,

              registro.manzana
                ?.nombre,
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
      : manzanasVisibles;

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
     COLUMNAS MANZANAS
  ======================================================= */

  const columnasManzanas = [
    {
      titulo:
        "Manzana",
      clave:
        "manzana",
      ancho:
        18,
      anchoPDF:
        18,
    },

    {
      titulo:
        "Nombre",
      clave:
        "nombre",
      ancho:
        25,
      anchoPDF:
        22,
    },

    {
      titulo:
        "Lotes disponibles",
      clave:
        "lotes",
      tipo:
        "numero",
      ancho:
        16,
      anchoPDF:
        16,
    },

    {
      titulo:
        "Regulares",
      clave:
        "regulares",
      tipo:
        "numero",
      ancho:
        14,
      anchoPDF:
        14,
    },

    {
      titulo:
        "Irregulares",
      clave:
        "irregulares",
      tipo:
        "numero",
      ancho:
        14,
      anchoPDF:
        14,
    },

    {
      titulo:
        "Área disponible m²",
      clave:
        "areaDisponible",
      tipo:
        "numero",
      ancho:
        19,
      anchoPDF:
        18,
    },

    {
      titulo:
        "Valor inventario",
      clave:
        "valorInventario",
      tipo:
        "moneda",
      ancho:
        22,
      anchoPDF:
        22,
    },

    {
      titulo:
        "Valor promedio",
      clave:
        "valorPromedio",
      tipo:
        "moneda",
      ancho:
        21,
      anchoPDF:
        21,
    },
  ];

  /* =======================================================
     FILAS MANZANAS
  ======================================================= */

  const filasManzanas =
    useMemo(
      () => {
        return manzanasVisibles.map(
          (
            item
          ) => ({
            manzana:
              item.manzana
                ?.codigo ||
              "—",

            nombre:
              item.manzana
                ?.nombre ||
              "—",

            lotes:
              numero(
                item.cantidadLotes
              ),

            regulares:
              numero(
                item.lotesRegulares
              ),

            irregulares:
              numero(
                item.lotesIrregulares
              ),

            areaDisponible:
              numero(
                item.areaDisponible
              ),

            valorInventario:
              numero(
                item.valorInventario
              ),

            valorPromedio:
              numero(
                item.valorPromedio
              ),
          })
        );
      },
      [
        manzanasVisibles,
      ]
    );

  /* =======================================================
     COLUMNAS DETALLE
  ======================================================= */

  const columnasDetalle = [
    {
      titulo:
        "Manzana",
      clave:
        "manzana",
      ancho:
        16,
      anchoPDF:
        16,
    },

    {
      titulo:
        "Lote",
      clave:
        "lote",
      ancho:
        16,
      anchoPDF:
        16,
    },

    {
      titulo:
        "Número",
      clave:
        "numeroLote",
      ancho:
        14,
      anchoPDF:
        14,
    },

    {
      titulo:
        "Tipo",
      clave:
        "tipo",
      ancho:
        15,
      anchoPDF:
        15,
    },

    {
      titulo:
        "Frente",
      clave:
        "frente",
      ancho:
        16,
      anchoPDF:
        16,
    },

    {
      titulo:
        "Fondo",
      clave:
        "fondo",
      ancho:
        16,
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
        15,
    },

    {
      titulo:
        "Valor lote",
      clave:
        "valorLote",
      tipo:
        "moneda",
      ancho:
        22,
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
            manzana:
              registro.manzana
                ?.codigo ||
              "—",

            lote:
              registro.codigo ||
              "—",

            numeroLote:
              registro.numeroLote ||
              "—",

            tipo:
              registro.tipo ||
              "—",

            frente:
              registro.frente ||
              "—",

            fondo:
              registro.fondo ||
              "—",

            area:
              numero(
                registro.areaM2
              ),

            valorLote:
              numero(
                registro.valorLote
              ),

            estado:
              registro.estado ||
              "Disponible",
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
        "Manzanas",

      valor:
        resumen.manzanas,

      tipo:
        "numero",

      color:
        "azul",

      detalle:
        "Manzanas con lotes disponibles",
    },

    {
      label:
        "Lotes disponibles",

      valor:
        resumen.lotesDisponibles,

      tipo:
        "numero",

      color:
        "verde",

      detalle:
        `${resumen.lotesRegulares} regulares · ${resumen.lotesIrregulares} irregulares`,
    },

    {
      label:
        "Área disponible",

      valor:
        resumen.areaDisponible,

      tipo:
        "numero",

      color:
        "dorado",

      detalle:
        "Metros cuadrados disponibles",
    },

    {
      label:
        "Área promedio",

      valor:
        resumen.areaPromedio,

      tipo:
        "numero",

      detalle:
        "Promedio por lote",
    },

    {
      label:
        "Valor inventario",

      valor:
        resumen.valorInventario,

      tipo:
        "moneda",

      color:
        "verde",

      detalle:
        "Valor total de lotes disponibles",
    },

    {
      label:
        "Valor promedio",

      valor:
        resumen.valorPromedio,

      tipo:
        "moneda",

      color:
        "dorado",

      detalle:
        "Valor promedio por lote",
    },
  ];

  /* =======================================================
     FILTROS EXPORTACIÓN
  ======================================================= */

  const filtrosExportacion =
    useMemo(
      () => {
        const opcionManzana =
          opcionesManzana.find(
            (
              item
            ) =>
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
              opcionManzana
                ? `${opcionManzana.codigo}${
                    opcionManzana.nombre
                      ? ` · ${opcionManzana.nombre}`
                      : ""
                  }`
                : "Todas",
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
              "Área mínima",

            valor:
              areaDesde !== ""
                ? `${areaDesde} m²`
                : "Sin mínimo",
          },

          {
            label:
              "Área máxima",

            valor:
              areaHasta !== ""
                ? `${areaHasta} m²`
                : "Sin máximo",
          },

          {
            label:
              "Valor mínimo",

            valor:
              valorDesde !== ""
                ? formatearDinero(
                    valorDesde
                  )
                : "Sin mínimo",
          },

          {
            label:
              "Valor máximo",

            valor:
              valorHasta !== ""
                ? formatearDinero(
                    valorHasta
                  )
                : "Sin máximo",
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
                ? "Detalle de lotes"
                : "Resumen por manzana",
          },
        ];
      },
      [
        manzana,
        tipo,
        areaDesde,
        areaHasta,
        valorDesde,
        valorHasta,
        buscar,
        vista,
        opcionesManzana,
      ]
    );

  /* =======================================================
     DATOS EXPORTACIÓN
  ======================================================= */

  const columnasExportacion =
    vista ===
    "detalle"
      ? columnasDetalle
      : columnasManzanas;

  const filasExportacion =
    vista ===
    "detalle"
      ? filasDetalle
      : filasManzanas;

  /* =======================================================
     EXCEL
  ======================================================= */

  const generarExcel =
    () => {
      const correcto =
        exportarExcel({
          titulo:
            "Lotes disponibles",

          subtitulo:
            vista ===
            "detalle"
              ? "Detalle del inventario de lotes disponibles"
              : "Resumen de lotes disponibles por manzana",

          nombreArchivo:
            "LotesDisponibles",

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
            "Lotes disponibles",

          subtitulo:
            vista ===
            "detalle"
              ? "Detalle del inventario disponible"
              : "Resumen de disponibilidad por manzana",

          nombreArchivo:
            "LotesDisponibles",

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
            "Lotes disponibles",

          subtitulo:
            vista ===
            "detalle"
              ? "Detalle del inventario de lotes"
              : "Resumen de lotes disponibles por manzana",

          nombreArchivo:
            "LotesDisponibles",

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
    <div className="lotes-disponibles-reporte">

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

      <header className="lotes-disponibles-header">

        <div className="lotes-disponibles-header-left">

          {onVolver && (
            <button
              type="button"
              className="lotes-disponibles-back"
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

            <span className="lotes-disponibles-kicker">
              Informe independiente
            </span>

            <h1>
              Lotes disponibles
            </h1>

            <p>
              Consulta el inventario actual de lotes disponibles, sus medidas, áreas, valores y manzana correspondiente.
            </p>

          </div>

        </div>

        <button
          type="button"
          className="lotes-disponibles-refresh"
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
                ? "lotes-disponibles-spin"
                : ""
            }
          />

          Actualizar
        </button>

      </header>

      {/* ===================================================
          RESUMEN
      =================================================== */}

      <section className="lotes-disponibles-stats">

        <article className="lotes-disponibles-stat">

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
                resumen.manzanas
              )}
            </strong>

            <small>
              Con disponibilidad
            </small>

          </div>

        </article>

        <article className="lotes-disponibles-stat">

          <i className="verde">
            <LandPlot
              size={20}
            />
          </i>

          <div>

            <span>
              Lotes disponibles
            </span>

            <strong className="texto-verde">
              {formatearNumero(
                resumen.lotesDisponibles
              )}
            </strong>

            <small>
              {resumen.lotesRegulares} regulares ·{" "}
              {resumen.lotesIrregulares} irregulares
            </small>

          </div>

        </article>

        <article className="lotes-disponibles-stat">

          <i className="dorado">
            <Ruler
              size={20}
            />
          </i>

          <div>

            <span>
              Área disponible
            </span>

            <strong>
              {formatearNumero(
                resumen.areaDisponible,
                2
              )}{" "}
              m²
            </strong>

            <small>
              Área total disponible
            </small>

          </div>

        </article>

        <article className="lotes-disponibles-stat">

          <i>
            <Layers3
              size={20}
            />
          </i>

          <div>

            <span>
              Área promedio
            </span>

            <strong>
              {formatearNumero(
                resumen.areaPromedio,
                2
              )}{" "}
              m²
            </strong>

            <small>
              Promedio por lote
            </small>

          </div>

        </article>

        <article className="lotes-disponibles-stat">

          <i className="verde">
            <CircleDollarSign
              size={20}
            />
          </i>

          <div>

            <span>
              Valor inventario
            </span>

            <strong className="texto-verde">
              {formatearDinero(
                resumen.valorInventario
              )}
            </strong>

            <small>
              Total lotes disponibles
            </small>

          </div>

        </article>

        <article className="lotes-disponibles-stat">

          <i className="dorado">
            <CircleDollarSign
              size={20}
            />
          </i>

          <div>

            <span>
              Valor promedio
            </span>

            <strong>
              {formatearDinero(
                resumen.valorPromedio
              )}
            </strong>

            <small>
              Promedio por lote
            </small>

          </div>

        </article>

      </section>

      {/* ===================================================
          FILTROS
      =================================================== */}

      <section className="lotes-disponibles-filtros">

        <div className="lotes-disponibles-search">

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
            placeholder="Lote, manzana, tipo, medida..."
          />

        </div>

        <label className="lotes-disponibles-field">

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
                  {opcion.codigo}
                  {opcion.nombre
                    ? ` · ${opcion.nombre}`
                    : ""}
                </option>
              )
            )}

          </select>

        </label>

        <label className="lotes-disponibles-field">

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

            <option value="Regular">
              Regular
            </option>

            <option value="Irregular">
              Irregular
            </option>

          </select>

        </label>

        <label className="lotes-disponibles-field">

          <span>
            Área mínima m²
          </span>

          <input
            type="number"
            min="0"
            step="0.01"
            value={
              areaDesde
            }
            onChange={(
              event
            ) =>
              setAreaDesde(
                event.target.value
              )
            }
            placeholder="0"
          />

        </label>

        <label className="lotes-disponibles-field">

          <span>
            Área máxima m²
          </span>

          <input
            type="number"
            min="0"
            step="0.01"
            value={
              areaHasta
            }
            onChange={(
              event
            ) =>
              setAreaHasta(
                event.target.value
              )
            }
            placeholder="Sin límite"
          />

        </label>

        <label className="lotes-disponibles-field">

          <span>
            Valor mínimo
          </span>

          <input
            type="number"
            min="0"
            step="1000"
            value={
              valorDesde
            }
            onChange={(
              event
            ) =>
              setValorDesde(
                event.target.value
              )
            }
            placeholder="$ 0"
          />

        </label>

        <label className="lotes-disponibles-field">

          <span>
            Valor máximo
          </span>

          <input
            type="number"
            min="0"
            step="1000"
            value={
              valorHasta
            }
            onChange={(
              event
            ) =>
              setValorHasta(
                event.target.value
              )
            }
            placeholder="Sin límite"
          />

        </label>

        <button
          type="button"
          className="lotes-disponibles-aplicar"
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
          className="lotes-disponibles-limpiar"
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

      <section className="lotes-disponibles-vistas">

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
            size={15}
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

          Detalle de lotes

          <span>
            {registrosVisibles.length}
          </span>

        </button>

      </section>

      {/* ===================================================
          EXPORTACIONES
      =================================================== */}

      <section className="lotes-disponibles-export">

        <div>

          <strong>
            Inventario disponible
          </strong>

          <span>
            {datosVista.length} registro(s) en la vista actual
          </span>

        </div>

        <div className="lotes-disponibles-export-buttons">

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
        <div className="lotes-disponibles-error">

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

      <section className="lotes-disponibles-panel">

        {cargando ? (
          <div className="lotes-disponibles-loading">

            <RefreshCw
              size={25}
              className="lotes-disponibles-spin"
            />

            <span>
              Generando informe...
            </span>

          </div>
        ) : vista ===
          "detalle" ? (
          <div className="lotes-disponibles-table-wrapper">

            <table className="lotes-disponibles-table detalle">

              <thead>

                <tr>
                  <th>Manzana</th>
                  <th>Lote</th>
                  <th>Número</th>
                  <th>Tipo</th>
                  <th>Frente</th>
                  <th>Fondo</th>
                  <th>Área m²</th>
                  <th>Valor lote</th>
                  <th>Estado</th>
                </tr>

              </thead>

              <tbody>

                {datosPagina.length ===
                0 ? (
                  <tr>

                    <td
                      colSpan={9}
                      className="lotes-disponibles-empty"
                    >
                      No hay lotes disponibles que coincidan con los filtros.
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
                          <strong className="lotes-disponibles-manzana">
                            {registro.manzana
                              ?.codigo ||
                              "—"}
                          </strong>
                        </td>

                        <td>
                          <strong className="lotes-disponibles-codigo">
                            {registro.codigo ||
                              "—"}
                          </strong>
                        </td>

                        <td>
                          {registro.numeroLote ||
                            "—"}
                        </td>

                        <td>
                          <span
                            className={`lotes-disponibles-tipo ${String(
                              registro.tipo ||
                                ""
                            ).toLowerCase()}`}
                          >
                            {registro.tipo ||
                              "—"}
                          </span>
                        </td>

                        <td>
                          <span className="lotes-disponibles-medida">
                            {registro.frente ||
                              "—"}
                          </span>
                        </td>

                        <td>
                          <span className="lotes-disponibles-medida">
                            {registro.fondo ||
                              "—"}
                          </span>
                        </td>

                        <td>
                          <strong>
                            {formatearNumero(
                              registro.areaM2,
                              2
                            )}{" "}
                            m²
                          </strong>
                        </td>

                        <td>
                          <strong className="lotes-disponibles-money">
                            {formatearDinero(
                              registro.valorLote
                            )}
                          </strong>
                        </td>

                        <td>
                          <span className="lotes-disponibles-estado disponible">
                            {registro.estado ||
                              "Disponible"}
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
          <div className="lotes-disponibles-table-wrapper">

            <table className="lotes-disponibles-table manzanas">

              <thead>

                <tr>
                  <th>Manzana</th>
                  <th>Nombre</th>
                  <th>Lotes disponibles</th>
                  <th>Regulares</th>
                  <th>Irregulares</th>
                  <th>Área disponible m²</th>
                  <th>Valor inventario</th>
                  <th>Valor promedio</th>
                </tr>

              </thead>

              <tbody>

                {datosPagina.length ===
                0 ? (
                  <tr>

                    <td
                      colSpan={8}
                      className="lotes-disponibles-empty"
                    >
                      No hay manzanas con lotes disponibles que coincidan con los filtros.
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
                          item.manzana
                            ?._id ||
                          item.manzana
                            ?.codigo ||
                          indice
                        }
                      >

                        <td>
                          <div className="lotes-disponibles-manzana-info">

                            <strong>
                              {item.manzana
                                ?.codigo ||
                                "—"}
                            </strong>

                            {item.manzana
                              ?.estado && (
                              <span>
                                {item.manzana.estado}
                              </span>
                            )}

                          </div>
                        </td>

                        <td>
                          {item.manzana
                            ?.nombre ||
                            "—"}
                        </td>

                        <td>
                          <span className="lotes-disponibles-contador principal">
                            {item.cantidadLotes ||
                              0}
                          </span>
                        </td>

                        <td>
                          <span className="lotes-disponibles-contador">
                            {item.lotesRegulares ||
                              0}
                          </span>
                        </td>

                        <td>
                          <span className="lotes-disponibles-contador irregular">
                            {item.lotesIrregulares ||
                              0}
                          </span>
                        </td>

                        <td>
                          <strong className="lotes-disponibles-area">
                            {formatearNumero(
                              item.areaDisponible,
                              2
                            )}{" "}
                            m²
                          </strong>
                        </td>

                        <td>
                          <strong className="lotes-disponibles-money principal">
                            {formatearDinero(
                              item.valorInventario
                            )}
                          </strong>
                        </td>

                        <td>
                          <strong className="lotes-disponibles-money">
                            {formatearDinero(
                              item.valorPromedio
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
          <footer className="lotes-disponibles-table-footer">

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

            <div className="lotes-disponibles-pagination">

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