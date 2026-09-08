import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  Clock3,
  FileSpreadsheet,
  FileText,
  Globe2,
  List,
  RefreshCw,
  Search,
  Tractor,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";

import Toast from "../../../components/ui/Toast";

import {
  obtenerReporteMaquinaria,
} from "../../../services/reportes/maquinariaReporte.service";

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

import "./ReporteMaquinaria.css";

/* =========================================================
   CONSTANTES
========================================================= */

const REGISTROS_POR_PAGINA = 8;

/* =========================================================
   COMPONENTE
========================================================= */

export default function ReporteMaquinaria({
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
    maquinas,
    setMaquinas,
  ] = useState([]);

  const [
    registros,
    setRegistros,
  ] = useState([]);

  const [
    resumen,
    setResumen,
  ] = useState({
    maquinas: 0,
    registros: 0,
    operarios: 0,
    totalMinutos: 0,
    totalHoras: 0,
    valorCausado: 0,
    totalPagado: 0,
    saldoPendiente: 0,
    pendientes: 0,
    abonadas: 0,
    pagadas: 0,
  });

  /* =======================================================
     VISTA
  ======================================================= */

  const [
    vista,
    setVista,
  ] = useState(
    "maquinas"
  );

  /* =======================================================
     FILTROS
  ======================================================= */

  const [
    buscar,
    setBuscar,
  ] = useState("");

  const [
    maquinaria,
    setMaquinaria,
  ] = useState("");

  const [
    operario,
    setOperario,
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
    estadoPago,
    setEstadoPago,
  ] = useState("");

  /* =======================================================
     CATÁLOGO DE MÁQUINAS
  ======================================================= */

  const [
    opcionesMaquinaria,
    setOpcionesMaquinaria,
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
     CATÁLOGO DE MAQUINARIA
  ======================================================= */

  const actualizarCatalogoMaquinaria = (
    registrosInforme
  ) => {
    const mapa =
      new Map();

    registrosInforme.forEach(
      (registro) => {
        const maquina =
          registro.maquinaria;

        if (
          !maquina?._id
        ) {
          return;
        }

        mapa.set(
          String(
            maquina._id
          ),
          {
            id:
              maquina._id,

            codigo:
              maquina.codigo ||
              "—",

            nombre:
              maquina.nombre ||
              maquina.tipo ||
              "",
          }
        );
      }
    );

    setOpcionesMaquinaria(
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
          await obtenerReporteMaquinaria(
            filtros
          );

        const nuevasMaquinas =
          Array.isArray(
            respuesta?.maquinas
          )
            ? respuesta.maquinas
            : [];

        const nuevosRegistros =
          Array.isArray(
            respuesta?.registros
          )
            ? respuesta.registros
            : [];

        setMaquinas(
          nuevasMaquinas
        );

        setRegistros(
          nuevosRegistros
        );

        setResumen({
          maquinas:
            numero(
              respuesta
                ?.resumen
                ?.maquinas
            ),

          registros:
            numero(
              respuesta
                ?.resumen
                ?.registros
            ),

          operarios:
            numero(
              respuesta
                ?.resumen
                ?.operarios
            ),

          totalMinutos:
            numero(
              respuesta
                ?.resumen
                ?.totalMinutos
            ),

          totalHoras:
            numero(
              respuesta
                ?.resumen
                ?.totalHoras
            ),

          valorCausado:
            numero(
              respuesta
                ?.resumen
                ?.valorCausado
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

          pendientes:
            numero(
              respuesta
                ?.resumen
                ?.pendientes
            ),

          abonadas:
            numero(
              respuesta
                ?.resumen
                ?.abonadas
            ),

          pagadas:
            numero(
              respuesta
                ?.resumen
                ?.pagadas
            ),
        });

        if (
          actualizarOpciones
        ) {
          actualizarCatalogoMaquinaria(
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
          "Error cargando informe de maquinaria:",
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
        maquinaria,
        operario,
        desde,
        hasta,
        estadoPago,
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

      setMaquinaria(
        ""
      );

      setOperario(
        ""
      );

      setDesde(
        ""
      );

      setHasta(
        ""
      );

      setEstadoPago(
        ""
      );

      await cargarInforme(
        {},
        true
      );
    };

  /* =======================================================
     BÚSQUEDA LOCAL RESUMEN
  ======================================================= */

  const maquinasVisibles =
    useMemo(
      () => {
        const busqueda =
          normalizarTexto(
            buscar
          );

        if (
          !busqueda
        ) {
          return maquinas;
        }

        return maquinas.filter(
          (item) => {
            const campos = [
              item.maquinaria
                ?.codigo,

              item.maquinaria
                ?.nombre,

              item.maquinaria
                ?.tipo,

              item.maquinaria
                ?.placa,

              item.maquinaria
                ?.marca,

              item.maquinaria
                ?.modelo,

              ...(Array.isArray(
                item.operarios
              )
                ? item.operarios
                : []),
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
        maquinas,
        buscar,
      ]
    );

  /* =======================================================
     BÚSQUEDA LOCAL DETALLE
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

              registro.operario,

              registro.estadoPago,

              registro.observaciones,

              registro.maquinaria
                ?.codigo,

              registro.maquinaria
                ?.nombre,

              registro.maquinaria
                ?.tipo,

              registro.maquinaria
                ?.placa,

              registro.maquinaria
                ?.marca,

              registro.maquinaria
                ?.modelo,

              ...(Array.isArray(
                registro.turnos
              )
                ? registro.turnos.map(
                    (turno) =>
                      turno.periodo
                  )
                : []),
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
     DATOS VISTA
  ======================================================= */

  const datosVista =
    vista ===
    "detalle"
      ? registrosVisibles
      : maquinasVisibles;

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
     TURNOS
  ======================================================= */

  const obtenerTextoTurnos = (
    turnos
  ) => {
    if (
      !Array.isArray(
        turnos
      ) ||
      turnos.length ===
        0
    ) {
      return "—";
    }

    return turnos
      .map(
        (turno) => {
          const horario =
            turno.horaInicio &&
            turno.horaFinal
              ? `${turno.horaInicio} - ${turno.horaFinal}`
              : "";

          return [
            turno.periodo,
            horario,
          ]
            .filter(Boolean)
            .join(" ");
        }
      )
      .join(" · ");
  };

  /* =======================================================
     ESTADO TEXTO
  ======================================================= */

  const normalizarEstado = (
    valor
  ) => {
    return (
      valor ||
      "Pendiente"
    );
  };

  /* =======================================================
     COLUMNAS RESUMEN POR MÁQUINA
  ======================================================= */

  const columnasMaquinas = [
    {
      titulo:
        "Máquina",
      clave:
        "maquina",
      ancho:
        16,
      anchoPDF:
        16,
    },

    {
      titulo:
        "Nombre",
      clave:
        "nombre",
      ancho:
        24,
      anchoPDF:
        22,
    },

    {
      titulo:
        "Registros",
      clave:
        "registros",
      tipo:
        "numero",
      ancho:
        13,
      anchoPDF:
        13,
    },

    {
      titulo:
        "Operarios",
      clave:
        "operarios",
      tipo:
        "numero",
      ancho:
        13,
      anchoPDF:
        13,
    },

    {
      titulo:
        "Horas",
      clave:
        "horas",
      tipo:
        "numero",
      ancho:
        14,
      anchoPDF:
        14,
    },

    {
      titulo:
        "Valor causado",
      clave:
        "valorCausado",
      tipo:
        "moneda",
      ancho:
        21,
      anchoPDF:
        21,
    },

    {
      titulo:
        "Pagado",
      clave:
        "pagado",
      tipo:
        "moneda",
      ancho:
        20,
      anchoPDF:
        20,
    },

    {
      titulo:
        "Saldo",
      clave:
        "saldo",
      tipo:
        "moneda-pendiente",
      ancho:
        20,
      anchoPDF:
        20,
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
        14,
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
        14,
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
        14,
    },
  ];

  /* =======================================================
     FILAS RESUMEN
  ======================================================= */

  const filasMaquinas =
    useMemo(
      () => {
        return maquinasVisibles.map(
          (item) => ({
            maquina:
              item.maquinaria
                ?.codigo ||
              "—",

            nombre:
              item.maquinaria
                ?.nombre ||
              item.maquinaria
                ?.tipo ||
              "—",

            registros:
              numero(
                item.registros
              ),

            operarios:
              numero(
                item.cantidadOperarios
              ),

            horas:
              numero(
                item.totalHoras
              ),

            valorCausado:
              numero(
                item.valorCausado
              ),

            pagado:
              numero(
                item.totalPagado
              ),

            saldo:
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
        maquinasVisibles,
      ]
    );

  /* =======================================================
     COLUMNAS DETALLE
  ======================================================= */

  const columnasDetalle = [
    {
      titulo:
        "Registro",
      clave:
        "codigo",
      ancho:
        15,
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
        15,
    },

    {
      titulo:
        "Máquina",
      clave:
        "maquina",
      ancho:
        16,
      anchoPDF:
        16,
    },

    {
      titulo:
        "Nombre",
      clave:
        "nombre",
      ancho:
        24,
      anchoPDF:
        22,
    },

    {
      titulo:
        "Operario",
      clave:
        "operario",
      ancho:
        25,
      anchoPDF:
        22,
    },

    {
      titulo:
        "Turnos",
      clave:
        "turnos",
      ancho:
        36,
      anchoPDF:
        32,
    },

    {
      titulo:
        "Horas",
      clave:
        "horas",
      tipo:
        "numero",
      ancho:
        14,
      anchoPDF:
        14,
    },

    {
      titulo:
        "Valor hora",
      clave:
        "valorHora",
      tipo:
        "moneda",
      ancho:
        18,
      anchoPDF:
        18,
    },

    {
      titulo:
        "Valor causado",
      clave:
        "valorPagar",
      tipo:
        "moneda",
      ancho:
        21,
      anchoPDF:
        20,
    },

    {
      titulo:
        "Pagado",
      clave:
        "pagado",
      tipo:
        "moneda",
      ancho:
        19,
      anchoPDF:
        19,
    },

    {
      titulo:
        "Saldo",
      clave:
        "saldo",
      tipo:
        "moneda-pendiente",
      ancho:
        19,
      anchoPDF:
        19,
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
          (registro) => ({
            codigo:
              registro.codigo ||
              "—",

            fecha:
              registro.fecha,

            maquina:
              registro.maquinaria
                ?.codigo ||
              "—",

            nombre:
              registro.maquinaria
                ?.nombre ||
              registro.maquinaria
                ?.tipo ||
              "—",

            operario:
              registro.operario ||
              "—",

            turnos:
              obtenerTextoTurnos(
                registro.turnos
              ),

            horas:
              numero(
                registro.totalHoras
              ),

            valorHora:
              numero(
                registro.valorHora
              ),

            valorPagar:
              numero(
                registro.valorPagar
              ),

            pagado:
              numero(
                registro.totalPagado
              ),

            saldo:
              numero(
                registro.saldoPendiente
              ),

            estado:
              normalizarEstado(
                registro.estadoPago
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
        "Máquinas",
      valor:
        resumen.maquinas,
      tipo:
        "numero",
      color:
        "azul",
      detalle:
        "Máquinas con registros",
    },

    {
      label:
        "Registros",
      valor:
        resumen.registros,
      tipo:
        "numero",
      detalle:
        "Registros de horas",
    },

    {
      label:
        "Operarios",
      valor:
        resumen.operarios,
      tipo:
        "numero",
      color:
        "verde",
      detalle:
        "Operarios diferentes",
    },

    {
      label:
        "Horas trabajadas",
      valor:
        resumen.totalHoras,
      tipo:
        "numero",
      color:
        "dorado",
      detalle:
        "Total de horas registradas",
    },

    {
      label:
        "Valor causado",
      valor:
        resumen.valorCausado,
      tipo:
        "moneda",
      color:
        "dorado",
      detalle:
        "Valor total causado",
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
        "Pagos realizados",
    },

    {
      label:
        "Saldo pendiente",
      valor:
        resumen.saldoPendiente,
      tipo:
        "moneda",
      color:
        "rojo",
      detalle:
        "Valor pendiente por pagar",
    },
  ];

  /* =======================================================
     FILTROS EXPORTACIÓN
  ======================================================= */

  const filtrosExportacion =
    useMemo(
      () => {
        const opcion =
          opcionesMaquinaria.find(
            (item) =>
              String(
                item.id
              ) ===
              String(
                maquinaria
              )
          );

        return [
          {
            label:
              "Máquina",

            valor:
              opcion
                ? `${opcion.codigo}${
                    opcion.nombre
                      ? ` · ${opcion.nombre}`
                      : ""
                  }`
                : "Todas",
          },

          {
            label:
              "Operario",

            valor:
              operario ||
              "Todos",
          },

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
              "Estado pago",

            valor:
              estadoPago ||
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
                ? "Detalle de horas"
                : "Resumen por máquina",
          },
        ];
      },
      [
        maquinaria,
        operario,
        desde,
        hasta,
        estadoPago,
        buscar,
        vista,
        opcionesMaquinaria,
      ]
    );

  /* =======================================================
     EXPORTACIÓN
  ======================================================= */

  const columnasExportacion =
    vista ===
    "detalle"
      ? columnasDetalle
      : columnasMaquinas;

  const filasExportacion =
    vista ===
    "detalle"
      ? filasDetalle
      : filasMaquinas;

  /* =======================================================
     EXCEL
  ======================================================= */

  const generarExcel =
    () => {
      const correcto =
        exportarExcel({
          titulo:
            "Informe de maquinaria",

          subtitulo:
            vista ===
            "detalle"
              ? "Detalle de horas trabajadas"
              : "Resumen por máquina",

          nombreArchivo:
            "InformeMaquinaria",

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
            "Informe de maquinaria",

          subtitulo:
            vista ===
            "detalle"
              ? "Detalle de horas trabajadas, pagos y saldos"
              : "Resumen consolidado por máquina",

          nombreArchivo:
            "InformeMaquinaria",

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
            "Informe de maquinaria",

          subtitulo:
            vista ===
            "detalle"
              ? "Detalle de horas trabajadas"
              : "Resumen por máquina",

          nombreArchivo:
            "InformeMaquinaria",

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
    <div className="reporte-maquinaria">

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

      <header className="reporte-maquinaria-header">

        <div className="reporte-maquinaria-header-left">

          {onVolver && (
            <button
              type="button"
              className="reporte-maquinaria-back"
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

            <span className="reporte-maquinaria-kicker">
              Operación
            </span>

            <h1>
              Informe de maquinaria
            </h1>

            <p>
              Consulta máquinas, operarios, turnos, horas trabajadas, valores causados, pagos realizados y saldos pendientes.
            </p>

          </div>

        </div>

        <button
          type="button"
          className="reporte-maquinaria-refresh"
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
                ? "reporte-maquinaria-spin"
                : ""
            }
          />

          Actualizar
        </button>

      </header>

      {/* ===================================================
          RESUMEN
      =================================================== */}

      <section className="reporte-maquinaria-stats">

        <article className="reporte-maquinaria-stat">

          <i className="azul">
            <Tractor
              size={20}
            />
          </i>

          <div>

            <span>
              Máquinas
            </span>

            <strong>
              {formatearNumero(
                resumen.maquinas
              )}
            </strong>

            <small>
              Con registros
            </small>

          </div>

        </article>

        <article className="reporte-maquinaria-stat">

          <i className="verde">
            <UserRound
              size={20}
            />
          </i>

          <div>

            <span>
              Operarios
            </span>

            <strong>
              {formatearNumero(
                resumen.operarios
              )}
            </strong>

            <small>
              Diferentes operarios
            </small>

          </div>

        </article>

        <article className="reporte-maquinaria-stat">

          <i className="dorado">
            <Clock3
              size={20}
            />
          </i>

          <div>

            <span>
              Horas trabajadas
            </span>

            <strong>
              {formatearNumero(
                resumen.totalHoras,
                2
              )}
            </strong>

            <small>
              {formatearNumero(
                resumen.totalMinutos
              )} minutos
            </small>

          </div>

        </article>

        <article className="reporte-maquinaria-stat">

          <i className="dorado">
            <Banknote
              size={20}
            />
          </i>

          <div>

            <span>
              Valor causado
            </span>

            <strong>
              {formatearDinero(
                resumen.valorCausado
              )}
            </strong>

            <small>
              Total generado
            </small>

          </div>

        </article>

        <article className="reporte-maquinaria-stat">

          <i className="verde">
            <WalletCards
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
              {resumen.pagadas} pagadas
            </small>

          </div>

        </article>

        <article className="reporte-maquinaria-stat">

          <i className="rojo">
            <Banknote
              size={20}
            />
          </i>

          <div>

            <span>
              Saldo pendiente
            </span>

            <strong className="texto-rojo">
              {formatearDinero(
                resumen.saldoPendiente
              )}
            </strong>

            <small>
              {resumen.pendientes} pendientes ·{" "}
              {resumen.abonadas} abonadas
            </small>

          </div>

        </article>

      </section>

      {/* ===================================================
          FILTROS
      =================================================== */}

      <section className="reporte-maquinaria-filtros">

        <div className="reporte-maquinaria-search">

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
            placeholder="Máquina, operario, placa, turno..."
          />

        </div>

        <label className="reporte-maquinaria-field">

          <span>
            Máquina
          </span>

          <select
            value={
              maquinaria
            }
            onChange={(
              event
            ) =>
              setMaquinaria(
                event.target.value
              )
            }
          >
            <option value="">
              Todas
            </option>

            {opcionesMaquinaria.map(
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
                  {opcion.nombre
                    ? ` · ${opcion.nombre}`
                    : ""}
                </option>
              )
            )}

          </select>

        </label>

        <label className="reporte-maquinaria-field">

          <span>
            Operario
          </span>

          <input
            type="text"
            value={
              operario
            }
            onChange={(
              event
            ) =>
              setOperario(
                event.target.value
              )
            }
            placeholder="Nombre"
          />

        </label>

        <label className="reporte-maquinaria-field">

          <span>
            Desde
          </span>

          <div className="reporte-maquinaria-date">

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

        <label className="reporte-maquinaria-field">

          <span>
            Hasta
          </span>

          <div className="reporte-maquinaria-date">

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

        <label className="reporte-maquinaria-field">

          <span>
            Estado pago
          </span>

          <select
            value={
              estadoPago
            }
            onChange={(
              event
            ) =>
              setEstadoPago(
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
          className="reporte-maquinaria-aplicar"
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
          className="reporte-maquinaria-limpiar"
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

      <section className="reporte-maquinaria-vistas">

        <button
          type="button"
          className={
            vista ===
            "maquinas"
              ? "active"
              : ""
          }
          onClick={() =>
            cambiarVista(
              "maquinas"
            )
          }
        >
          <Tractor
            size={15}
          />

          Resumen por máquina

          <span>
            {maquinasVisibles.length}
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

          Detalle de horas

          <span>
            {registrosVisibles.length}
          </span>

        </button>

      </section>

      {/* ===================================================
          EXPORTACIÓN
      =================================================== */}

      <section className="reporte-maquinaria-export">

        <div>

          <strong>
            Control de maquinaria
          </strong>

          <span>
            {datosVista.length} registro(s) en la vista actual
          </span>

        </div>

        <div className="reporte-maquinaria-export-buttons">

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
        <div className="reporte-maquinaria-error">

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

      <section className="reporte-maquinaria-panel">

        {cargando ? (
          <div className="reporte-maquinaria-loading">

            <RefreshCw
              size={25}
              className="reporte-maquinaria-spin"
            />

            <span>
              Generando informe...
            </span>

          </div>
        ) : vista ===
          "detalle" ? (
          <div className="reporte-maquinaria-table-wrapper">

            <table className="reporte-maquinaria-table detalle">

              <thead>

                <tr>
                  <th>Registro</th>
                  <th>Fecha</th>
                  <th>Máquina</th>
                  <th>Nombre</th>
                  <th>Operario</th>
                  <th>Turnos</th>
                  <th>Horas</th>
                  <th>Valor hora</th>
                  <th>Valor causado</th>
                  <th>Pagado</th>
                  <th>Saldo</th>
                  <th>Estado</th>
                </tr>

              </thead>

              <tbody>

                {datosPagina.length ===
                0 ? (
                  <tr>

                    <td
                      colSpan={12}
                      className="reporte-maquinaria-empty"
                    >
                      No hay registros de maquinaria que coincidan con los filtros.
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
                          <strong className="reporte-maquinaria-codigo">
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
                          <strong className="reporte-maquinaria-maquina">
                            {registro.maquinaria
                              ?.codigo ||
                              "—"}
                          </strong>
                        </td>

                        <td>
                          <div className="reporte-maquinaria-maquina-info">

                            <strong>
                              {registro.maquinaria
                                ?.nombre ||
                                registro.maquinaria
                                  ?.tipo ||
                                "—"}
                            </strong>

                            {registro.maquinaria
                              ?.placa && (
                              <span>
                                Placa:{" "}
                                {registro.maquinaria.placa}
                              </span>
                            )}

                          </div>
                        </td>

                        <td>
                          <div className="reporte-maquinaria-operario">

                            <strong>
                              {registro.operario ||
                                "—"}
                            </strong>

                          </div>
                        </td>

                        <td>
                          <div className="reporte-maquinaria-turnos">

                            {Array.isArray(
                              registro.turnos
                            ) &&
                            registro.turnos.length >
                              0 ? (
                              registro.turnos.map(
                                (
                                  turno,
                                  index
                                ) => (
                                  <span
                                    key={`${turno.periodo}-${index}`}
                                  >
                                    <b>
                                      {turno.periodo}
                                    </b>

                                    {turno.horaInicio &&
                                      turno.horaFinal && (
                                        <>
                                          {" "}
                                          {turno.horaInicio}
                                          {" - "}
                                          {turno.horaFinal}
                                        </>
                                      )}
                                  </span>
                                )
                              )
                            ) : (
                              <span>
                                —
                              </span>
                            )}

                          </div>
                        </td>

                        <td>
                          <strong className="reporte-maquinaria-horas">
                            {formatearNumero(
                              registro.totalHoras,
                              2
                            )}{" "}
                            h
                          </strong>
                        </td>

                        <td>
                          <strong className="reporte-maquinaria-money">
                            {formatearDinero(
                              registro.valorHora
                            )}
                          </strong>
                        </td>

                        <td>
                          <strong className="reporte-maquinaria-money causado">
                            {formatearDinero(
                              registro.valorPagar
                            )}
                          </strong>
                        </td>

                        <td>
                          <strong className="reporte-maquinaria-money pagado">
                            {formatearDinero(
                              registro.totalPagado
                            )}
                          </strong>
                        </td>

                        <td>
                          <strong className="reporte-maquinaria-money saldo">
                            {formatearDinero(
                              registro.saldoPendiente
                            )}
                          </strong>
                        </td>

                        <td>
                          <span
                            className={`reporte-maquinaria-estado ${String(
                              normalizarEstado(
                                registro.estadoPago
                              )
                            ).toLowerCase()}`}
                          >
                            {normalizarEstado(
                              registro.estadoPago
                            )}
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
          <div className="reporte-maquinaria-table-wrapper">

            <table className="reporte-maquinaria-table maquinas">

              <thead>

                <tr>
                  <th>Máquina</th>
                  <th>Nombre</th>
                  <th>Registros</th>
                  <th>Operarios</th>
                  <th>Horas</th>
                  <th>Valor causado</th>
                  <th>Pagado</th>
                  <th>Saldo</th>
                  <th>Pendientes</th>
                  <th>Abonadas</th>
                  <th>Pagadas</th>
                </tr>

              </thead>

              <tbody>

                {datosPagina.length ===
                0 ? (
                  <tr>

                    <td
                      colSpan={11}
                      className="reporte-maquinaria-empty"
                    >
                      No hay máquinas que coincidan con los filtros.
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
                          item.maquinaria
                            ?._id ||
                          item.maquinaria
                            ?.codigo ||
                          indice
                        }
                      >

                        <td>
                          <strong className="reporte-maquinaria-maquina">
                            {item.maquinaria
                              ?.codigo ||
                              "—"}
                          </strong>
                        </td>

                        <td>
                          <div className="reporte-maquinaria-maquina-info">

                            <strong>
                              {item.maquinaria
                                ?.nombre ||
                                item.maquinaria
                                  ?.tipo ||
                                "—"}
                            </strong>

                            {item.maquinaria
                              ?.marca && (
                              <span>
                                {item.maquinaria.marca}
                                {item.maquinaria
                                  ?.modelo
                                  ? ` · ${item.maquinaria.modelo}`
                                  : ""}
                              </span>
                            )}

                          </div>
                        </td>

                        <td>
                          <span className="reporte-maquinaria-contador principal">
                            {item.registros ||
                              0}
                          </span>
                        </td>

                        <td>
                          <span className="reporte-maquinaria-contador">
                            {item.cantidadOperarios ||
                              0}
                          </span>
                        </td>

                        <td>
                          <strong className="reporte-maquinaria-horas">
                            {formatearNumero(
                              item.totalHoras,
                              2
                            )}{" "}
                            h
                          </strong>
                        </td>

                        <td>
                          <strong className="reporte-maquinaria-money causado">
                            {formatearDinero(
                              item.valorCausado
                            )}
                          </strong>
                        </td>

                        <td>
                          <strong className="reporte-maquinaria-money pagado">
                            {formatearDinero(
                              item.totalPagado
                            )}
                          </strong>
                        </td>

                        <td>
                          <strong className="reporte-maquinaria-money saldo">
                            {formatearDinero(
                              item.saldoPendiente
                            )}
                          </strong>
                        </td>

                        <td>
                          <span className="reporte-maquinaria-contador pendiente">
                            {item.pendientes ||
                              0}
                          </span>
                        </td>

                        <td>
                          <span className="reporte-maquinaria-contador abonada">
                            {item.abonadas ||
                              0}
                          </span>
                        </td>

                        <td>
                          <span className="reporte-maquinaria-contador pagada">
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
        )}

        {/* =================================================
            PAGINACIÓN
        ================================================= */}

        {!cargando && (
          <footer className="reporte-maquinaria-table-footer">

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

            <div className="reporte-maquinaria-pagination">

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