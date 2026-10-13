import {

  CalendarDays,

  ChevronLeft,

  ChevronRight,

  CircleDollarSign,

  Edit3,

  LoaderCircle,

  Plus,

  Printer,

  RefreshCw,

  Search,

  Trash2,

  UserRoundPlus,

  Users,

  WalletCards,

  X,

} from "lucide-react";



import {

  useEffect,

  useMemo,

  useState,

} from "react";



import {

  eliminarPagoManual,

  obtenerPagosManuales,

} from "../../../services/pagoManual.service.js";



import {

  eliminarBeneficiario,

  obtenerBeneficiarios,

} from "../../../services/beneficiario.service.js";



import PagoManualModal from "./PagoManualModal.jsx";



import BeneficiarioModal from "./BeneficiarioModal.jsx";



import "./PagosManuales.css";



/* =========================================================

   CONSTANTES

========================================================= */



const REGISTROS_POR_PAGINA = 10;



/* =========================================================

   HELPERS

========================================================= */



const formatearDinero = (

  valor

) => {

  const numero =

    Number(

      valor

    ) || 0;



  return new Intl.NumberFormat(

    "es-CO",

    {

      style: "currency",

      currency: "COP",

      maximumFractionDigits: 0,

    }

  ).format(

    numero

  );

};



const formatearFecha = (

  valor

) => {

  if (!valor) {

    return "—";

  }



  const texto =

    String(

      valor

    );



  const coincidencia =

    texto.match(

      /^(\d{4})-(\d{2})-(\d{2})/

    );



  if (coincidencia) {

    return `${coincidencia[3]}/${coincidencia[2]}/${coincidencia[1]}`;

  }



  return texto;

};




const escaparHTML = (
  valor = ""
) => {
  return String(
    valor ?? ""
  )
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};



const obtenerCodigoEgreso = (
  pago
) => {
  if (
    pago?.egreso &&
    typeof pago.egreso === "object"
  ) {
    return (
      pago.egreso.codigo ||
      "—"
    );
  }

  return (
    pago?.codigoEgreso ||
    "—"
  );
};



const obtenerMensajeError = (

  error,

  mensajeDefecto

) => {

  return (

    error

      ?.response

      ?.data

      ?.message ||

    mensajeDefecto

  );

};



/* =========================================================

   PAGOS MANUALES

========================================================= */



export default function PagosManuales() {

  /* =======================================================

     DATOS

  ======================================================= */



  const [

    pagos,

    setPagos,

  ] = useState([]);



  const [

    resumen,

    setResumen,

  ] = useState({

    cantidadMovimientos:

      0,



    totalPagado:

      0,

  });



  const [

    beneficiarios,

    setBeneficiarios,

  ] = useState([]);



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

    notificacion,

    setNotificacion,

  ] = useState({

    visible: false,

    tipo: "success",

    mensaje: "",

  });



  /* =======================================================

     FILTROS

  ======================================================= */



  const [

    filtros,

    setFiltros,

  ] = useState({

    buscar: "",

    formaPago: "",

    desde: "",

    hasta: "",

  });



  const [

    filtrosAplicados,

    setFiltrosAplicados,

  ] = useState({

    buscar: "",

    formaPago: "",

    desde: "",

    hasta: "",

  });



  /* =======================================================

     PAGINACIÓN

  ======================================================= */



  const [

    paginaActual,

    setPaginaActual,

  ] = useState(1);



  /* =======================================================

     MODAL PAGO

  ======================================================= */



  const [

    pagoModalAbierto,

    setPagoModalAbierto,

  ] = useState(false);



  const [

    pagoEditar,

    setPagoEditar,

  ] = useState(null);



  /* =======================================================

     ELIMINAR PAGO

  ======================================================= */



  const [

    pagoEliminar,

    setPagoEliminar,

  ] = useState(null);



  const [

    eliminandoPago,

    setEliminandoPago,

  ] = useState(false);



  /* =======================================================

     BENEFICIARIOS

  ======================================================= */



  const [

    panelBeneficiariosAbierto,

    setPanelBeneficiariosAbierto,

  ] = useState(false);



  const [

    beneficiarioModalAbierto,

    setBeneficiarioModalAbierto,

  ] = useState(false);



  const [

    beneficiarioEditar,

    setBeneficiarioEditar,

  ] = useState(null);



  const [

    beneficiarioEliminar,

    setBeneficiarioEliminar,

  ] = useState(null);



  const [

    eliminandoBeneficiario,

    setEliminandoBeneficiario,

  ] = useState(false);



  const [

    buscandoBeneficiario,

    setBuscandoBeneficiario,

  ] = useState("");



  /* =======================================================

     NOTIFICACIÓN

  ======================================================= */



  const mostrarNotificacion = (

    mensaje,

    tipo = "success"

  ) => {

    setNotificacion({

      visible: true,

      mensaje,

      tipo,

    });



    window.setTimeout(

      () => {

        setNotificacion(

          (

            actual

          ) => ({

            ...actual,

            visible: false,

          })

        );

      },

      3500

    );

  };



  /* =======================================================
     VENTANA DE IMPRESIÓN
  ======================================================= */

  const abrirVentanaImpresion = (
    titulo,
    contenido
  ) => {
    const ventana =
      window.open(
        "",
        "_blank",
        "width=1200,height=850"
      );

    if (!ventana) {
      mostrarNotificacion(
        "El navegador bloqueó la ventana de impresión.",
        "error"
      );

      return;
    }

    ventana.document.write(`
      <!DOCTYPE html>

      <html lang="es">
        <head>
          <meta charset="UTF-8" />

          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />

          <title>
            ${escaparHTML(titulo)}
          </title>

          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 24px;
              background: #f6f3ec;
              color: #28352e;
              font-family:
                Arial,
                Helvetica,
                sans-serif;
            }

            .acciones-impresion {
              display: flex;
              justify-content: flex-end;
              gap: 8px;
              max-width: 1180px;
              margin: 0 auto 14px;
            }

            .acciones-impresion button {
              min-height: 38px;
              padding: 0 15px;
              border: 1px solid #d5cec1;
              border-radius: 8px;
              background: #ffffff;
              color: #344139;
              font-weight: 700;
              cursor: pointer;
            }

            .acciones-impresion .imprimir {
              border-color: #1f6848;
              background: #1f6848;
              color: #ffffff;
            }

            .documento {
              width: 100%;
              max-width: 1180px;
              margin: 0 auto;
              padding: 28px;
              border: 1px solid #ded7ca;
              border-radius: 14px;
              background: #ffffff;
            }

            .encabezado {
              padding-bottom: 18px;
              border-bottom: 2px solid #173f2e;
              text-align: center;
            }

            .encabezado h1 {
              margin: 0;
              color: #173f2e;
              font-size: 24px;
              letter-spacing: 0.04em;
            }

            .encabezado h2 {
              margin: 5px 0 0;
              color: #956b29;
              font-size: 17px;
            }

            .encabezado p {
              margin: 8px 0 0;
              color: #707873;
              font-size: 12px;
            }

            .resumen {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 10px;
              margin: 18px 0;
            }

            .resumen > div,
            .dato {
              padding: 12px;
              border: 1px solid #e5dfd4;
              border-radius: 9px;
              background: #fbfaf7;
            }

            .resumen span,
            .dato span {
              display: block;
              margin-bottom: 5px;
              color: #818883;
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
            }

            .resumen strong,
            .dato strong {
              color: #173f2e;
              font-size: 14px;
            }

            .valor-principal {
              border-color: #d8c18d !important;
              background: #fff8e8 !important;
            }

            .valor-principal strong {
              color: #8b6527;
              font-size: 20px;
            }

            .seccion {
              margin-top: 18px;
            }

            .seccion h3 {
              margin: 0 0 9px;
              color: #173f2e;
              font-size: 13px;
              text-transform: uppercase;
            }

            .datos-grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 10px;
            }

            table {
              width: 100%;
              margin-top: 18px;
              border-collapse: collapse;
            }

            thead {
              background: #173f2e;
              color: #ffffff;
            }

            th,
            td {
              padding: 9px 8px;
              border: 1px solid #e4ded4;
              font-size: 10px;
              text-align: left;
              vertical-align: top;
            }

            th {
              font-size: 9px;
              text-transform: uppercase;
            }

            td.dinero,
            th.dinero {
              text-align: right;
              white-space: nowrap;
            }

            tfoot td {
              font-weight: 800;
              background: #fff8e8;
            }

            .firmas {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 60px;
              margin-top: 70px;
            }

            .firma {
              padding-top: 8px;
              border-top: 1px solid #555f59;
              color: #555f59;
              font-size: 11px;
              font-weight: 700;
              text-align: center;
            }

            @media print {
              body {
                padding: 0;
                background: #ffffff;
              }

              .acciones-impresion {
                display: none;
              }

              .documento {
                max-width: none;
                padding: 0;
                border: none;
                border-radius: 0;
              }
            }

            @media (max-width: 650px) {
              body {
                padding: 10px;
              }

              .documento {
                padding: 16px;
              }

              .resumen,
              .datos-grid {
                grid-template-columns: 1fr;
              }
            }
          </style>
        </head>

        <body>
          <div class="acciones-impresion">
            <button
              type="button"
              onclick="window.close()"
            >
              Cerrar
            </button>

            <button
              type="button"
              class="imprimir"
              onclick="window.print()"
            >
              Imprimir
            </button>
          </div>

          <main class="documento">
            ${contenido}
          </main>
        </body>
      </html>
    `);

    ventana.document.close();
    ventana.focus();
  };



  /* =======================================================
     IMPRIMIR GENERAL DE PAGOS MANUALES

     IMPORTANTE:
     Se imprime "pagos", que corresponde a los resultados
     actuales después de aplicar búsqueda y filtros.
  ======================================================= */

  const imprimirGeneralPagosManuales =
    () => {
      if (
        pagos.length === 0
      ) {
        mostrarNotificacion(
          "No hay pagos manuales para imprimir.",
          "error"
        );

        return;
      }

      const total =
        pagos.reduce(
          (
            acumulado,
            pago
          ) =>
            acumulado +
            (
              Number(
                pago.valor
              ) || 0
            ),
          0
        );

      const filtrosActivos = [];

      if (
        filtrosAplicados.buscar
          ?.trim()
      ) {
        filtrosActivos.push(
          `Búsqueda: ${filtrosAplicados.buscar.trim()}`
        );
      }

      if (
        filtrosAplicados.formaPago
      ) {
        filtrosActivos.push(
          `Forma: ${filtrosAplicados.formaPago}`
        );
      }

      if (
        filtrosAplicados.desde
      ) {
        filtrosActivos.push(
          `Desde: ${formatearFecha(
            filtrosAplicados.desde
          )}`
        );
      }

      if (
        filtrosAplicados.hasta
      ) {
        filtrosActivos.push(
          `Hasta: ${formatearFecha(
            filtrosAplicados.hasta
          )}`
        );
      }

      const filas =
        pagos
          .map(
            (
              pago
            ) => `
              <tr>
                <td>
                  ${escaparHTML(
                    obtenerCodigoEgreso(
                      pago
                    )
                  )}
                </td>

                <td>
                  ${escaparHTML(
                    formatearFecha(
                      pago.fechaPago
                    )
                  )}
                </td>

                <td>
                  ${escaparHTML(
                    pago.beneficiarioNombre ||
                    "—"
                  )}
                </td>

                <td>
                  ${escaparHTML(
                    pago.beneficiarioDocumento ||
                    "—"
                  )}
                </td>

                <td>
                  ${escaparHTML(
                    pago.motivo ||
                    "—"
                  )}
                </td>

                <td>
                  ${escaparHTML(
                    pago.formaPago ||
                    "—"
                  )}
                </td>

                <td>
                  ${escaparHTML(
                    pago.referenciaPago ||
                    "—"
                  )}
                </td>

                <td class="dinero">
                  ${escaparHTML(
                    formatearDinero(
                      pago.valor
                    )
                  )}
                </td>
              </tr>
            `
          )
          .join("");

      const contenido = `
        <div class="encabezado">
          <h1>
            LOTES VILLA MARÍA
          </h1>

          <h2>
            Reporte de pagos manuales
          </h2>

          <p>
            ${
              filtrosActivos.length > 0
                ? escaparHTML(
                    filtrosActivos.join(
                      " · "
                    )
                  )
                : "Todos los pagos manuales registrados"
            }
          </p>
        </div>

        <div class="resumen">
          <div>
            <span>
              Registros impresos
            </span>

            <strong>
              ${pagos.length}
            </strong>
          </div>

          <div class="valor-principal">
            <span>
              Total pagos manuales
            </span>

            <strong>
              ${escaparHTML(
                formatearDinero(
                  total
                )
              )}
            </strong>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Egreso</th>
              <th>Fecha</th>
              <th>Beneficiario</th>
              <th>Documento</th>
              <th>Motivo</th>
              <th>Forma</th>
              <th>Referencia</th>
              <th class="dinero">Valor</th>
            </tr>
          </thead>

          <tbody>
            ${filas}
          </tbody>

          <tfoot>
            <tr>
              <td colspan="7">
                TOTAL
              </td>

              <td class="dinero">
                ${escaparHTML(
                  formatearDinero(
                    total
                  )
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      `;

      abrirVentanaImpresion(
        "Reporte de pagos manuales",
        contenido
      );
    };



  /* =======================================================
     IMPRIMIR PAGO MANUAL INDIVIDUAL
  ======================================================= */

  const imprimirPagoManual = (
    pago
  ) => {
    if (!pago) {
      return;
    }

    const codigo =
      obtenerCodigoEgreso(
        pago
      );

    const contenido = `
      <div class="encabezado">
        <h1>
          LOTES VILLA MARÍA
        </h1>

        <h2>
          Comprobante de pago manual
        </h2>

        <p>
          Egreso ${escaparHTML(
            codigo
          )}
        </p>
      </div>

      <div class="resumen">
        <div>
          <span>
            Egreso
          </span>

          <strong>
            ${escaparHTML(
              codigo
            )}
          </strong>
        </div>

        <div>
          <span>
            Fecha
          </span>

          <strong>
            ${escaparHTML(
              formatearFecha(
                pago.fechaPago
              )
            )}
          </strong>
        </div>

        <div>
          <span>
            Forma de pago
          </span>

          <strong>
            ${escaparHTML(
              pago.formaPago ||
              "—"
            )}
          </strong>
        </div>

        <div class="valor-principal">
          <span>
            Valor pagado
          </span>

          <strong>
            ${escaparHTML(
              formatearDinero(
                pago.valor
              )
            )}
          </strong>
        </div>
      </div>

      <div class="seccion">
        <h3>
          Beneficiario
        </h3>

        <div class="datos-grid">
          <div class="dato">
            <span>
              Nombre
            </span>

            <strong>
              ${escaparHTML(
                pago.beneficiarioNombre ||
                "—"
              )}
            </strong>
          </div>

          <div class="dato">
            <span>
              Documento
            </span>

            <strong>
              ${escaparHTML(
                pago.beneficiarioDocumento ||
                "—"
              )}
            </strong>
          </div>

          <div class="dato">
            <span>
              Teléfono
            </span>

            <strong>
              ${escaparHTML(
                pago?.beneficiario?.telefono ||
                "—"
              )}
            </strong>
          </div>

          <div class="dato">
            <span>
              Referencia
            </span>

            <strong>
              ${escaparHTML(
                pago.referenciaPago ||
                "—"
              )}
            </strong>
          </div>
        </div>
      </div>

      <div class="seccion">
        <h3>
          Detalle del pago
        </h3>

        <div class="datos-grid">
          <div class="dato">
            <span>
              Motivo
            </span>

            <strong>
              ${escaparHTML(
                pago.motivo ||
                "—"
              )}
            </strong>
          </div>

          <div class="dato">
            <span>
              Observaciones
            </span>

            <strong>
              ${escaparHTML(
                pago.observaciones ||
                "Sin observaciones"
              )}
            </strong>
          </div>
        </div>
      </div>

      <div class="firmas">
        <div class="firma">
          Entregado por
        </div>

        <div class="firma">
          Recibido por
        </div>
      </div>
    `;

    abrirVentanaImpresion(
      `Pago manual ${codigo}`,
      contenido
    );
  };



  /* =======================================================

     CARGAR PAGOS

  ======================================================= */



  const cargarPagos =

    async (

      filtrosConsulta =

        filtrosAplicados

    ) => {

      setCargando(

        true

      );



      setError("");



      try {

        const parametros = {};



        if (

          filtrosConsulta.buscar

            ?.trim()

        ) {

          parametros.buscar =

            filtrosConsulta.buscar.trim();

        }



        if (

          filtrosConsulta.formaPago

        ) {

          parametros.formaPago =

            filtrosConsulta.formaPago;

        }



        if (

          filtrosConsulta.desde

        ) {

          parametros.desde =

            filtrosConsulta.desde;

        }



        if (

          filtrosConsulta.hasta

        ) {

          parametros.hasta =

            filtrosConsulta.hasta;

        }



        const respuesta =

          await obtenerPagosManuales(

            parametros

          );



        setPagos(

          respuesta

            ?.pagosManuales ||

          []

        );



        setResumen(

          respuesta

            ?.resumen || {

            cantidadMovimientos:

              0,



            totalPagado:

              0,

          }

        );

      } catch (errorPeticion) {

        console.error(

          "Error cargando pagos manuales:",

          errorPeticion

        );



        setError(

          obtenerMensajeError(

            errorPeticion,

            "No fue posible cargar los pagos manuales."

          )

        );

      } finally {

        setCargando(

          false

        );

      }

    };



  /* =======================================================

     CARGAR BENEFICIARIOS

  ======================================================= */



  const cargarBeneficiarios =

    async () => {

      try {

        const respuesta =

          await obtenerBeneficiarios();



        setBeneficiarios(

          Array.isArray(

            respuesta

          )

            ? respuesta

            : respuesta

                ?.beneficiarios ||

              []

        );

      } catch (errorPeticion) {

        console.error(

          "Error cargando beneficiarios:",

          errorPeticion

        );

      }

    };



  /* =======================================================

     INICIAL

  ======================================================= */



  useEffect(

    () => {

      cargarPagos(

        filtrosAplicados

      );



      cargarBeneficiarios();

    },

    []

  );



  /* =======================================================

     CAMBIOS FILTRO

  ======================================================= */



  const manejarCambioFiltro = (

    evento

  ) => {

    const {

      name,

      value,

    } = evento.target;



    setFiltros(

      (

        anteriores

      ) => ({

        ...anteriores,



        [name]:

          value,

      })

    );

  };



  const aplicarFiltros = async (

    evento

  ) => {

    evento?.preventDefault();



    const nuevosFiltros = {

      ...filtros,

    };



    setFiltrosAplicados(

      nuevosFiltros

    );



    setPaginaActual(

      1

    );



    await cargarPagos(

      nuevosFiltros

    );

  };



  const limpiarFiltros =

    async () => {

      const filtrosLimpios = {

        buscar: "",

        formaPago: "",

        desde: "",

        hasta: "",

      };



      setFiltros(

        filtrosLimpios

      );



      setFiltrosAplicados(

        filtrosLimpios

      );



      setPaginaActual(

        1

      );



      await cargarPagos(

        filtrosLimpios

      );

    };



  /* =======================================================

     NUEVO PAGO

  ======================================================= */



  const abrirNuevoPago =

    () => {

      setPagoEditar(

        null

      );



      setPagoModalAbierto(

        true

      );

    };



  /* =======================================================

     EDITAR PAGO

  ======================================================= */



  const abrirEditarPago = (

    pago

  ) => {

    setPagoEditar(

      pago

    );



    setPagoModalAbierto(

      true

    );

  };



  /* =======================================================

     PAGO GUARDADO

  ======================================================= */



  const pagoGuardado =

    async (

      _pago,

      respuesta

    ) => {

      setPagoModalAbierto(

        false

      );



      setPagoEditar(

        null

      );



      await cargarPagos();



      await cargarBeneficiarios();



      mostrarNotificacion(

        respuesta?.message ||

          "Pago manual guardado correctamente."

      );

    };



  /* =======================================================

     SOLICITAR ELIMINACIÓN PAGO

  ======================================================= */



  const solicitarEliminarPago = (

    pago

  ) => {

    setPagoEliminar(

      pago

    );

  };



  /* =======================================================

     CONFIRMAR ELIMINACIÓN PAGO

  ======================================================= */



  const confirmarEliminarPago =

    async () => {

      if (

        !pagoEliminar?._id

      ) {

        return;

      }



      setEliminandoPago(

        true

      );



      try {

        const respuesta =

          await eliminarPagoManual(

            pagoEliminar._id

          );



        setPagoEliminar(

          null

        );



        setPaginaActual(

          1

        );



        await cargarPagos();



        mostrarNotificacion(

          respuesta?.message ||

            "Pago manual eliminado correctamente."

        );

      } catch (errorPeticion) {

        console.error(

          "Error eliminando pago manual:",

          errorPeticion

        );



        mostrarNotificacion(

          obtenerMensajeError(

            errorPeticion,

            "No fue posible eliminar el pago manual."

          ),

          "error"

        );

      } finally {

        setEliminandoPago(

          false

        );

      }

    };



  /* =======================================================

     BENEFICIARIOS FILTRADOS

  ======================================================= */



  const beneficiariosFiltrados =

    useMemo(

      () => {

        const texto =

          buscandoBeneficiario

            .trim()

            .toLowerCase();



        if (!texto) {

          return beneficiarios;

        }



        return beneficiarios.filter(

          (

            beneficiario

          ) => {

            const campos = [

              beneficiario.nombre,

              beneficiario.tipoDocumento,

              beneficiario.documento,

              beneficiario.telefono,

              beneficiario.estado,

            ];



            return campos.some(

              (

                campo

              ) =>

                String(

                  campo || ""

                )

                  .toLowerCase()

                  .includes(

                    texto

                  )

            );

          }

        );

      },

      [

        beneficiarios,

        buscandoBeneficiario,

      ]

    );



  /* =======================================================

     NUEVO BENEFICIARIO

  ======================================================= */



  const abrirNuevoBeneficiario =

    () => {

      setBeneficiarioEditar(

        null

      );



      setBeneficiarioModalAbierto(

        true

      );

    };



  /* =======================================================

     EDITAR BENEFICIARIO

  ======================================================= */



  const abrirEditarBeneficiario = (

    beneficiario

  ) => {

    setBeneficiarioEditar(

      beneficiario

    );



    setBeneficiarioModalAbierto(

      true

    );

  };



  /* =======================================================

     BENEFICIARIO GUARDADO

  ======================================================= */



  const beneficiarioGuardado =

    async () => {

      setBeneficiarioModalAbierto(

        false

      );



      setBeneficiarioEditar(

        null

      );



      await cargarBeneficiarios();



      await cargarPagos();



      mostrarNotificacion(

        "Beneficiario guardado correctamente."

      );

    };



  /* =======================================================

     ELIMINAR BENEFICIARIO

  ======================================================= */



  const confirmarEliminarBeneficiario =

    async () => {

      if (

        !beneficiarioEliminar?._id

      ) {

        return;

      }



      setEliminandoBeneficiario(

        true

      );



      try {

        const respuesta =

          await eliminarBeneficiario(

            beneficiarioEliminar._id

          );



        setBeneficiarioEliminar(

          null

        );



        await cargarBeneficiarios();



        mostrarNotificacion(

          respuesta?.message ||

            "Beneficiario eliminado correctamente."

        );

      } catch (errorPeticion) {

        console.error(

          "Error eliminando beneficiario:",

          errorPeticion

        );



        mostrarNotificacion(

          obtenerMensajeError(

            errorPeticion,

            "No fue posible eliminar el beneficiario."

          ),

          "error"

        );

      } finally {

        setEliminandoBeneficiario(

          false

        );

      }

    };



  /* =======================================================

     PAGINACIÓN

  ======================================================= */



  const totalPaginas =

    Math.max(

      1,

      Math.ceil(

        pagos.length /

          REGISTROS_POR_PAGINA

      )

    );



  useEffect(

    () => {

      if (

        paginaActual >

        totalPaginas

      ) {

        setPaginaActual(

          totalPaginas

        );

      }

    },

    [

      paginaActual,

      totalPaginas,

    ]

  );



  const pagosPagina =

    useMemo(

      () => {

        const inicio =

          (

            paginaActual -

            1

          ) *

          REGISTROS_POR_PAGINA;



        return pagos.slice(

          inicio,

          inicio +

            REGISTROS_POR_PAGINA

        );

      },

      [

        pagos,

        paginaActual,

      ]

    );



  /* =======================================================

     RENDER

  ======================================================= */



  return (

    <section className="pagos-manuales-page">

      {/* =================================================

          NOTIFICACIÓN

      ================================================= */}



      {notificacion.visible && (

        <div

          className={

            `pagos-manuales-notificacion ${

              notificacion.tipo ===

              "error"

                ? "error"

                : "success"

            }`

          }

        >

          <span>

            {

              notificacion.mensaje

            }

          </span>



          <button

            type="button"

            onClick={

              () =>

                setNotificacion(

                  (

                    actual

                  ) => ({

                    ...actual,

                    visible: false,

                  })

                )

            }

          >

            <X

              size={16}

            />

          </button>

        </div>

      )}



      {/* =================================================

          ENCABEZADO

      ================================================= */}



      <div className="pagos-manuales-header">

        <div>

          <h1>

            Pagos manuales

          </h1>



          <p>

            Registra gastos ocasionales y genera automáticamente su egreso.

          </p>

        </div>



        <div className="pagos-manuales-header-actions">

          <button

            type="button"

            className="pagos-manuales-btn-beneficiarios"

            onClick={

              () => {

                setPanelBeneficiariosAbierto(

                  true

                );



                cargarBeneficiarios();

              }

            }

          >

            <Users

              size={18}

            />



            Beneficiarios

          </button>



          <button

            type="button"

            className="pagos-manuales-btn-beneficiarios"

            onClick={

              imprimirGeneralPagosManuales

            }

            disabled={

              cargando ||

              pagos.length === 0

            }

          >

            <Printer

              size={18}

            />



            Imprimir general

          </button>



          <button

            type="button"

            className="pagos-manuales-btn-new"

            onClick={

              abrirNuevoPago

            }

          >

            <Plus

              size={18}

            />



            Nuevo pago manual

          </button>

        </div>

      </div>



      {/* =================================================

          RESUMEN

      ================================================= */}



      <div className="pagos-manuales-summary">

        <article className="pagos-manuales-summary-card">

          <div className="pagos-manuales-summary-icon">

            <CircleDollarSign

              size={21}

            />

          </div>



          <div>

            <span>

              Total pagado

            </span>



            <strong>

              {formatearDinero(

                resumen.totalPagado

              )}

            </strong>

          </div>

        </article>



        <article className="pagos-manuales-summary-card">

          <div className="pagos-manuales-summary-icon">

            <WalletCards

              size={21}

            />

          </div>



          <div>

            <span>

              Movimientos

            </span>



            <strong>

              {

                resumen.cantidadMovimientos ||

                0

              }

            </strong>

          </div>

        </article>



        <article className="pagos-manuales-summary-card">

          <div className="pagos-manuales-summary-icon">

            <Users

              size={21}

            />

          </div>



          <div>

            <span>

              Beneficiarios

            </span>



            <strong>

              {

                beneficiarios.length

              }

            </strong>

          </div>

        </article>

      </div>



      {/* =================================================

          FILTROS

      ================================================= */}



      <form

        className="pagos-manuales-filters"

        onSubmit={

          aplicarFiltros

        }

      >

        <div className="pagos-manuales-filter-search">

          <Search

            size={17}

          />



          <input

            type="text"

            name="buscar"

            value={

              filtros.buscar

            }

            onChange={

              manejarCambioFiltro

            }

            placeholder="Buscar beneficiario, documento, motivo..."

          />

        </div>



        <div className="pagos-manuales-filter-field">

          <WalletCards

            size={16}

          />



          <select

            name="formaPago"

            value={

              filtros.formaPago

            }

            onChange={

              manejarCambioFiltro

            }

          >

            <option value="">

              Todas las formas

            </option>



            <option value="Efectivo">

              Efectivo

            </option>



            <option value="Transferencia">

              Transferencia

            </option>



            <option value="Consignacion">

              Consignación

            </option>



            <option value="Otro">

              Otro

            </option>

          </select>

        </div>



        <div className="pagos-manuales-filter-date">

          <CalendarDays

            size={16}

          />



          <input

            type="date"

            name="desde"

            value={

              filtros.desde

            }

            onChange={

              manejarCambioFiltro

            }

            title="Desde"

          />

        </div>



        <div className="pagos-manuales-filter-date">

          <CalendarDays

            size={16}

          />



          <input

            type="date"

            name="hasta"

            value={

              filtros.hasta

            }

            onChange={

              manejarCambioFiltro

            }

            title="Hasta"

          />

        </div>



        <button

          type="submit"

          className="pagos-manuales-btn-filter"

        >

          <Search

            size={17}

          />



          Buscar

        </button>



        <button

          type="button"

          className="pagos-manuales-btn-clear"

          onClick={

            limpiarFiltros

          }

        >

          <RefreshCw

            size={17}

          />



          Limpiar

        </button>

      </form>



      {/* =================================================

          ERROR

      ================================================= */}



      {error && (

        <div className="pagos-manuales-error">

          {error}

        </div>

      )}



      {/* =================================================

          TABLA

      ================================================= */}



      <div className="pagos-manuales-table-card">

        <div className="pagos-manuales-table-header">

          <div>

            <h2>

              Historial de pagos

            </h2>



            <span>

              {

                pagos.length

              }{" "}

              registro

              {pagos.length === 1

                ? ""

                : "s"}

            </span>

          </div>

        </div>



        {cargando ? (

          <div className="pagos-manuales-loading">

            <LoaderCircle

              size={30}

              className="pagos-manuales-spin"

            />



            <span>

              Cargando pagos...

            </span>

          </div>

        ) : pagosPagina.length ===

          0 ? (

          <div className="pagos-manuales-empty">

            <CircleDollarSign

              size={38}

            />



            <strong>

              No hay pagos manuales

            </strong>



            <span>

              Registra el primer gasto manual desde el botón superior.

            </span>

          </div>

        ) : (

          <>

            <div className="pagos-manuales-table-wrapper">

              <table className="pagos-manuales-table">

                <thead>

                  <tr>

                    <th>

                      Egreso

                    </th>



                    <th>

                      Fecha

                    </th>



                    <th>

                      Beneficiario

                    </th>



                    <th>

                      Documento

                    </th>



                    <th>

                      Motivo

                    </th>



                    <th>

                      Forma

                    </th>



                    <th className="text-right">

                      Valor

                    </th>



                    <th className="text-center">

                      Acciones

                    </th>

                  </tr>

                </thead>



                <tbody>

                  {pagosPagina.map(

                    (

                      pago

                    ) => (

                      <tr

                        key={

                          pago._id

                        }

                      >

                        <td>

                          <span className="pagos-manuales-egreso-code">

                            {

                              pago

                                ?.egreso

                                ?.codigo ||

                              "—"

                            }

                          </span>

                        </td>



                        <td>

                          {formatearFecha(

                            pago.fechaPago

                          )}

                        </td>



                        <td>

                          <div className="pagos-manuales-person">

                            <strong>

                              {

                                pago.beneficiarioNombre

                              }

                            </strong>



                            {pago

                              ?.beneficiario

                              ?.telefono && (

                              <small>

                                {

                                  pago

                                    .beneficiario

                                    .telefono

                                }

                              </small>

                            )}

                          </div>

                        </td>



                        <td>

                          {

                            pago.beneficiarioDocumento ||

                            "—"

                          }

                        </td>



                        <td>

                          <div className="pagos-manuales-concept">

                            <strong>

                              {

                                pago.motivo

                              }

                            </strong>



                            {pago.observaciones && (

                              <small>

                                {

                                  pago.observaciones

                                }

                              </small>

                            )}

                          </div>

                        </td>



                        <td>

                          <span className="pagos-manuales-payment-method">

                            {

                              pago.formaPago

                            }

                          </span>

                        </td>



                        <td className="text-right">

                          <strong className="pagos-manuales-money">

                            {formatearDinero(

                              pago.valor

                            )}

                          </strong>

                        </td>



                        <td>

                          <div className="pagos-manuales-actions">

                            <button

                              type="button"

                              className="pagos-manuales-action edit"

                              onClick={

                                () =>

                                  imprimirPagoManual(

                                    pago

                                  )

                              }

                              title="Imprimir pago"

                            >

                              <Printer

                                size={16}

                              />

                            </button>



                            <button

                              type="button"

                              className="pagos-manuales-action edit"

                              onClick={

                                () =>

                                  abrirEditarPago(

                                    pago

                                  )

                              }

                              title="Editar pago"

                            >

                              <Edit3

                                size={16}

                              />

                            </button>



                            <button

                              type="button"

                              className="pagos-manuales-action delete"

                              onClick={

                                () =>

                                  solicitarEliminarPago(

                                    pago

                                  )

                              }

                              title="Eliminar pago"

                            >

                              <Trash2

                                size={16}

                              />

                            </button>

                          </div>

                        </td>

                      </tr>

                    )

                  )}

                </tbody>

              </table>

            </div>



            {/* ===========================================

                PAGINACIÓN

            =========================================== */}



            <div className="pagos-manuales-pagination">

              <span>

                Página{" "}

                {

                  paginaActual

                }{" "}

                de{" "}

                {

                  totalPaginas

                }

              </span>



              <div>

                <button

                  type="button"

                  onClick={

                    () =>

                      setPaginaActual(

                        (

                          pagina

                        ) =>

                          Math.max(

                            1,

                            pagina -

                              1

                          )

                      )

                  }

                  disabled={

                    paginaActual <=

                    1

                  }

                >

                  <ChevronLeft

                    size={17}

                  />

                </button>



                <button

                  type="button"

                  onClick={

                    () =>

                      setPaginaActual(

                        (

                          pagina

                        ) =>

                          Math.min(

                            totalPaginas,

                            pagina +

                              1

                          )

                      )

                  }

                  disabled={

                    paginaActual >=

                    totalPaginas

                  }

                >

                  <ChevronRight

                    size={17}

                  />

                </button>

              </div>

            </div>

          </>

        )}

      </div>



      {/* =================================================

          MODAL PAGO

      ================================================= */}



      <PagoManualModal

        abierto={

          pagoModalAbierto

        }

        pagoEditar={

          pagoEditar

        }

        onCerrar={

          () => {

            setPagoModalAbierto(

              false

            );



            setPagoEditar(

              null

            );

          }

        }

        onGuardado={

          pagoGuardado

        }

      />



      {/* =================================================

          PANEL BENEFICIARIOS

      ================================================= */}



      {panelBeneficiariosAbierto && (

        <div className="pagos-manuales-modal-overlay">

          <div className="pagos-manuales-modal beneficiarios-list-modal">

            <div className="pagos-manuales-modal-header">

              <div className="pagos-manuales-modal-header-info">

                <div className="pagos-manuales-modal-icon">

                  <Users

                    size={21}

                  />

                </div>



                <div>

                  <h2>

                    Beneficiarios

                  </h2>



                  <p>

                    Personas y empresas disponibles para pagos manuales.

                  </p>

                </div>

              </div>



              <button

                type="button"

                className="pagos-manuales-modal-close"

                onClick={

                  () =>

                    setPanelBeneficiariosAbierto(

                      false

                    )

                }

              >

                <X

                  size={20}

                />

              </button>

            </div>



            <div className="pagos-manuales-modal-body">

              <div className="pagos-manuales-beneficiarios-toolbar">

                <div className="pagos-manuales-filter-search">

                  <Search

                    size={17}

                  />



                  <input

                    type="text"

                    value={

                      buscandoBeneficiario

                    }

                    onChange={

                      (

                        evento

                      ) =>

                        setBuscandoBeneficiario(

                          evento.target.value

                        )

                    }

                    placeholder="Buscar nombre, documento..."

                  />

                </div>



                <button

                  type="button"

                  className="pagos-manuales-btn-new"

                  onClick={

                    abrirNuevoBeneficiario

                  }

                >

                  <UserRoundPlus

                    size={17}

                  />



                  Nuevo beneficiario

                </button>

              </div>



              <div className="pagos-manuales-beneficiarios-table-wrapper">

                <table className="pagos-manuales-table">

                  <thead>

                    <tr>

                      <th>

                        Nombre

                      </th>



                      <th>

                        Documento

                      </th>



                      <th>

                        Teléfono

                      </th>



                      <th>

                        Estado

                      </th>



                      <th className="text-center">

                        Acciones

                      </th>

                    </tr>

                  </thead>



                  <tbody>

                    {beneficiariosFiltrados.length ===

                    0 ? (

                      <tr>

                        <td

                          colSpan={5}

                          className="pagos-manuales-table-empty"

                        >

                          No hay beneficiarios para mostrar.

                        </td>

                      </tr>

                    ) : (

                      beneficiariosFiltrados.map(

                        (

                          beneficiario

                        ) => (

                          <tr

                            key={

                              beneficiario._id

                            }

                          >

                            <td>

                              <strong>

                                {

                                  beneficiario.nombre

                                }

                              </strong>

                            </td>



                            <td>

                              {

                                beneficiario.tipoDocumento

                              }{" "}

                              {

                                beneficiario.documento

                              }

                            </td>



                            <td>

                              {

                                beneficiario.telefono ||

                                "—"

                              }

                            </td>



                            <td>

                              <span

                                className={

                                  `pagos-manuales-status ${

                                    beneficiario.estado ===

                                    "Activo"

                                      ? "active"

                                      : "inactive"

                                  }`

                                }

                              >

                                {

                                  beneficiario.estado

                                }

                              </span>

                            </td>



                            <td>

                              <div className="pagos-manuales-actions">

                                <button

                                  type="button"

                                  className="pagos-manuales-action edit"

                                  onClick={

                                    () =>

                                      abrirEditarBeneficiario(

                                        beneficiario

                                      )

                                  }

                                  title="Editar beneficiario"

                                >

                                  <Edit3

                                    size={16}

                                  />

                                </button>



                                <button

                                  type="button"

                                  className="pagos-manuales-action delete"

                                  onClick={

                                    () =>

                                      setBeneficiarioEliminar(

                                        beneficiario

                                      )

                                  }

                                  title="Eliminar beneficiario"

                                >

                                  <Trash2

                                    size={16}

                                  />

                                </button>

                              </div>

                            </td>

                          </tr>

                        )

                      )

                    )}

                  </tbody>

                </table>

              </div>

            </div>

          </div>

        </div>

      )}



      {/* =================================================

          MODAL BENEFICIARIO

      ================================================= */}



      <BeneficiarioModal

        abierto={

          beneficiarioModalAbierto

        }

        beneficiarioEditar={

          beneficiarioEditar

        }

        onCerrar={

          () => {

            setBeneficiarioModalAbierto(

              false

            );



            setBeneficiarioEditar(

              null

            );

          }

        }

        onGuardado={

          beneficiarioGuardado

        }

      />



      {/* =================================================

          CONFIRMAR ELIMINAR PAGO

      ================================================= */}



      {pagoEliminar && (

        <div className="pagos-manuales-modal-overlay confirm">

          <div className="pagos-manuales-confirm-modal">

            <div className="pagos-manuales-confirm-icon danger">

              <Trash2

                size={23}

              />

            </div>



            <h3>

              ¿Eliminar pago manual?

            </h3>



            <p>

              Se eliminará el pago de{" "}

              <strong>

                {

                  pagoEliminar.beneficiarioNombre

                }

              </strong>{" "}

              por{" "}

              <strong>

                {formatearDinero(

                  pagoEliminar.valor

                )}

              </strong>

              .

            </p>



            <p className="pagos-manuales-confirm-warning">

              También se eliminará el egreso{" "}

              <strong>

                {

                  pagoEliminar

                    ?.egreso

                    ?.codigo ||

                  "relacionado"

                }

              </strong>

              .

            </p>



            <div className="pagos-manuales-confirm-actions">

              <button

                type="button"

                className="pagos-manuales-btn-secondary"

                onClick={

                  () =>

                    setPagoEliminar(

                      null

                    )

                }

                disabled={

                  eliminandoPago

                }

              >

                Cancelar

              </button>



              <button

                type="button"

                className="pagos-manuales-btn-danger"

                onClick={

                  confirmarEliminarPago

                }

                disabled={

                  eliminandoPago

                }

              >

                {eliminandoPago ? (

                  <LoaderCircle

                    size={17}

                    className="pagos-manuales-spin"

                  />

                ) : (

                  <Trash2

                    size={17}

                  />

                )}



                {eliminandoPago

                  ? "Eliminando..."

                  : "Eliminar"}

              </button>

            </div>

          </div>

        </div>

      )}



      {/* =================================================

          CONFIRMAR ELIMINAR BENEFICIARIO

      ================================================= */}



      {beneficiarioEliminar && (

        <div className="pagos-manuales-modal-overlay confirm">

          <div className="pagos-manuales-confirm-modal">

            <div className="pagos-manuales-confirm-icon danger">

              <Trash2

                size={23}

              />

            </div>



            <h3>

              ¿Eliminar beneficiario?

            </h3>



            <p>

              Se intentará eliminar a{" "}

              <strong>

                {

                  beneficiarioEliminar.nombre

                }

              </strong>

              .

            </p>



            <p className="pagos-manuales-confirm-warning">

              Si ya tiene pagos registrados, el sistema no permitirá eliminarlo. En ese caso puedes editarlo y dejarlo como Inactivo.

            </p>



            <div className="pagos-manuales-confirm-actions">

              <button

                type="button"

                className="pagos-manuales-btn-secondary"

                onClick={

                  () =>

                    setBeneficiarioEliminar(

                      null

                    )

                }

                disabled={

                  eliminandoBeneficiario

                }

              >

                Cancelar

              </button>



              <button

                type="button"

                className="pagos-manuales-btn-danger"

                onClick={

                  confirmarEliminarBeneficiario

                }

                disabled={

                  eliminandoBeneficiario

                }

              >

                {eliminandoBeneficiario ? (

                  <LoaderCircle

                    size={17}

                    className="pagos-manuales-spin"

                  />

                ) : (

                  <Trash2

                    size={17}

                  />

                )}



                {eliminandoBeneficiario

                  ? "Eliminando..."

                  : "Eliminar"}

              </button>

            </div>

          </div>

        </div>

      )}

    </section>

  );

}