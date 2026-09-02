import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BadgeDollarSign,
  CircleCheckBig,
  Clock3,
  HandCoins,
  History,
  Pencil,
  Printer,
  RefreshCw,
  Save,
  Search,
  Trash2,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";

import {
  obtenerComisiones,
  sincronizarComisiones,
} from "../../services/comision.service";

import {
  abonarComision,
  editarAbonoComision,
  eliminarMovimientoComision,
  obtenerPagosComision,
  pagarSaldoComision,
} from "../../services/egreso.service";

import Toast from "../../components/ui/Toast";

import "./Comisiones.css";

/* =========================================================
   FORMATEAR DINERO
========================================================= */

const formatearDinero = (
  valor = 0
) => {
  return new Intl.NumberFormat(
    "es-CO",
    {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }
  ).format(
    Number(valor) || 0
  );
};

/* =========================================================
   ESCAPAR HTML PARA IMPRESIÓN
========================================================= */

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

/* =========================================================
   FORMATEAR VALOR EN INPUT

   1000000
   ↓
   1.000.000
========================================================= */

const formatearValorInput = (
  valor = ""
) => {
  const limpio =
    String(
      valor ?? ""
    ).replace(
      /\D/g,
      ""
    );

  if (!limpio) {
    return "";
  }

  return new Intl.NumberFormat(
    "es-CO"
  ).format(
    Number(limpio)
  );
};

/* =========================================================
   FECHA PARA INPUT
========================================================= */

const obtenerFechaInput =
  (
    fecha
  ) => {
    if (!fecha) {
      return obtenerFechaActual();
    }

    const texto =
      String(
        fecha
      );

    /*
      Si viene de Mongo:
      2026-09-01T00:00:00.000Z

      conservamos:
      2026-09-01
    */

    if (
      /^\d{4}-\d{2}-\d{2}/.test(
        texto
      )
    ) {
      return texto.slice(
        0,
        10
      );
    }

    return obtenerFechaActual();
  };

/* =========================================================
   FORMATEAR FECHA
========================================================= */

const formatearFecha = (
  fecha
) => {
  if (!fecha) {
    return "—";
  }

  const fechaConvertida =
    new Date(fecha);

  if (
    Number.isNaN(
      fechaConvertida.getTime()
    )
  ) {
    return "—";
  }

  return fechaConvertida
    .toLocaleDateString(
      "es-CO",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
};

/* =========================================================
   FECHA ACTUAL PARA INPUT
========================================================= */

const obtenerFechaActual =
  () => {
    const fecha =
      new Date();

    const year =
      fecha.getFullYear();

    const month =
      String(
        fecha.getMonth() + 1
      ).padStart(
        2,
        "0"
      );

    const day =
      String(
        fecha.getDate()
      ).padStart(
        2,
        "0"
      );

    return `${year}-${month}-${day}`;
  };

/* =========================================================
   NOMBRE COMPLETO
========================================================= */

const obtenerNombreCompleto = (
  persona
) => {
  if (!persona) {
    return "—";
  }

  const nombre = [
    persona.nombres,
    persona.apellidos,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return nombre || "—";
};

/* =========================================================
   TEXTO DEL LOTE
========================================================= */

const obtenerNombreLote = (
  lote
) => {
  if (!lote) {
    return "—";
  }

  const codigoLote =
    lote.codigo ||
    lote.numero ||
    lote.nombre ||
    "Lote";

  const manzana =
    lote.manzana;

  if (!manzana) {
    return codigoLote;
  }

  const nombreManzana =
    manzana.codigo ||
    manzana.nombre ||
    "";

  if (!nombreManzana) {
    return codigoLote;
  }

  return `${nombreManzana} - ${codigoLote}`;
};

/* =========================================================
   FORMULARIO INICIAL DEL PAGO
========================================================= */

const formularioPagoInicial = {
  valor: "",
  formaPago: "Efectivo",
  referenciaPago: "",
  fechaPago: obtenerFechaActual(),
  observaciones: "",
};

/* =========================================================
   COMPONENTE
========================================================= */

export default function Comisiones() {
  /* =======================================================
     DATOS
  ======================================================= */

  const [
    comisiones,
    setComisiones,
  ] = useState([]);

  const [
    resumen,
    setResumen,
  ] = useState({
    totalComisiones: 0,
    valorGenerado: 0,
    valorPagado: 0,
    saldoPendiente: 0,
    pendientes: 0,
    abonadas: 0,
    pagadas: 0,
  });

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    sincronizando,
    setSincronizando,
  ] = useState(false);

  /* =======================================================
     FILTROS
  ======================================================= */

  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  const [
    filtroEstado,
    setFiltroEstado,
  ] = useState("");

  /* =======================================================
     MODAL PAGO / ABONO
  ======================================================= */

  const [
    modalPagoAbierto,
    setModalPagoAbierto,
  ] = useState(false);

  const [
    comisionSeleccionada,
    setComisionSeleccionada,
  ] = useState(null);

  const [
    tipoOperacion,
    setTipoOperacion,
  ] = useState("Abono");

  const [
    formularioPago,
    setFormularioPago,
  ] = useState(
    formularioPagoInicial
  );

  const [
    guardandoPago,
    setGuardandoPago,
  ] = useState(false);

  /* =======================================================
     MODAL HISTORIAL
  ======================================================= */

  const [
    modalHistorialAbierto,
    setModalHistorialAbierto,
  ] = useState(false);

  const [
    historial,
    setHistorial,
  ] = useState(null);

  const [
    cargandoHistorial,
    setCargandoHistorial,
  ] = useState(false);

  /* =======================================================
     EDITAR ABONO
  ======================================================= */

  const [
    modalEditarAbonoAbierto,
    setModalEditarAbonoAbierto,
  ] = useState(false);

  const [
    movimientoSeleccionado,
    setMovimientoSeleccionado,
  ] = useState(null);

  const [
    formularioEditarAbono,
    setFormularioEditarAbono,
  ] = useState({
    valor: "",
    formaPago: "Efectivo",
    fechaPago: obtenerFechaActual(),
    referenciaPago: "",
    observaciones: "",
  });

  const [
    guardandoEdicion,
    setGuardandoEdicion,
  ] = useState(false);

  /* =======================================================
     ELIMINAR MOVIMIENTO
  ======================================================= */

  const [
    modalEliminarAbierto,
    setModalEliminarAbierto,
  ] = useState(false);

  const [
    movimientoEliminar,
    setMovimientoEliminar,
  ] = useState(null);

  const [
    eliminandoMovimiento,
    setEliminandoMovimiento,
  ] = useState(false);

  /* =======================================================
     NOTIFICACIÓN
  ======================================================= */

  const [
    notificacion,
    setNotificacion,
  ] = useState({
    visible: false,
    mensaje: "",
    tipo: "success",
  });

  const mostrarNotificacion =
    (
      mensaje,
      tipo = "success"
    ) => {
      setNotificacion({
        visible: true,
        mensaje,
        tipo,
      });
    };

  const cerrarNotificacion =
    () => {
      setNotificacion(
        (
          anterior
        ) => ({
          ...anterior,
          visible: false,
        })
      );
    };

  /* =======================================================
     CARGAR COMISIONES
  ======================================================= */

  const cargarComisiones =
    async () => {
      try {
        setCargando(
          true
        );

        const datos =
          await obtenerComisiones({
            estado:
              filtroEstado ||
              undefined,
          });

        setComisiones(
          Array.isArray(
            datos?.comisiones
          )
            ? datos.comisiones
            : []
        );

        setResumen({
          totalComisiones:
            Number(
              datos?.resumen
                ?.totalComisiones
            ) || 0,

          valorGenerado:
            Number(
              datos?.resumen
                ?.valorGenerado
            ) || 0,

          valorPagado:
            Number(
              datos?.resumen
                ?.valorPagado
            ) || 0,

          saldoPendiente:
            Number(
              datos?.resumen
                ?.saldoPendiente
            ) || 0,

          pendientes:
            Number(
              datos?.resumen
                ?.pendientes
            ) || 0,

          abonadas:
            Number(
              datos?.resumen
                ?.abonadas
            ) || 0,

          pagadas:
            Number(
              datos?.resumen
                ?.pagadas
            ) || 0,
        });
      } catch (error) {
        console.error(
          "Error cargando comisiones:",
          error
        );

        mostrarNotificacion(
          error?.response?.data
            ?.message ||
            "No fue posible cargar las comisiones.",
          "error"
        );

        setComisiones(
          []
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
      cargarComisiones();
    },
    [
      filtroEstado,
    ]
  );

  /* =======================================================
     SINCRONIZAR
  ======================================================= */

  const sincronizar =
    async () => {
      try {
        setSincronizando(
          true
        );

        const respuesta =
          await sincronizarComisiones();

        mostrarNotificacion(
          respuesta?.message ||
            "Comisiones sincronizadas correctamente."
        );

        await cargarComisiones();
      } catch (error) {
        console.error(
          "Error sincronizando comisiones:",
          error
        );

        mostrarNotificacion(
          error?.response?.data
            ?.message ||
            "No fue posible sincronizar las comisiones.",
          "error"
        );
      } finally {
        setSincronizando(
          false
        );
      }
    };

  /* =======================================================
     ABRIR MODAL DE ABONO
  ======================================================= */

  const abrirAbono =
    (
      comision
    ) => {
      const saldo =
        Number(
          comision.saldoPendiente
        ) || 0;

      if (
        saldo <= 0
      ) {
        mostrarNotificacion(
          "Esta comisión ya se encuentra pagada.",
          "error"
        );

        return;
      }

      setComisionSeleccionada(
        comision
      );

      setTipoOperacion(
        "Abono"
      );

      setFormularioPago({
        ...formularioPagoInicial,

        fechaPago:
          obtenerFechaActual(),
      });

      setModalPagoAbierto(
        true
      );
    };

  /* =======================================================
     ABRIR MODAL PAGO TOTAL
  ======================================================= */

  const abrirPagoTotal =
    (
      comision
    ) => {
      const saldo =
        Number(
          comision.saldoPendiente
        ) || 0;

      if (
        saldo <= 0
      ) {
        mostrarNotificacion(
          "Esta comisión ya se encuentra pagada.",
          "error"
        );

        return;
      }

      setComisionSeleccionada(
        comision
      );

      setTipoOperacion(
        "Pago"
      );

      setFormularioPago({
        ...formularioPagoInicial,

        valor:
          String(
            saldo
          ),

        fechaPago:
          obtenerFechaActual(),
      });

      setModalPagoAbierto(
        true
      );
    };

  /* =======================================================
     CERRAR MODAL PAGO
  ======================================================= */

  const cerrarModalPago =
    () => {
      if (
        guardandoPago
      ) {
        return;
      }

      setModalPagoAbierto(
        false
      );

      setComisionSeleccionada(
        null
      );

      setTipoOperacion(
        "Abono"
      );

      setFormularioPago(
        formularioPagoInicial
      );
    };

  /* =======================================================
     CAMBIAR FORMULARIO PAGO
  ======================================================= */

  const cambiarFormularioPago =
    (
      e
    ) => {
      const {
        name,
        value,
      } = e.target;

      /* =====================================================
         VALOR DEL ABONO

         Quitamos puntos, letras, $, espacios, etc.

         Visual:
         1.000.000

         Internamente:
         1000000
      ===================================================== */

      if (
        name ===
        "valor"
      ) {
        const valorLimpio =
          String(
            value
          ).replace(
            /\D/g,
            ""
          );

        setFormularioPago(
          (
            anterior
          ) => ({
            ...anterior,

            valor:
              valorLimpio,
          })
        );

        return;
      }

      setFormularioPago(
        (
          anterior
        ) => ({
          ...anterior,

          [name]:
            value,
        })
      );
    };

  /* =======================================================
     REGISTRAR PAGO / ABONO
  ======================================================= */

  const guardarPago =
    async (
      e
    ) => {
      e.preventDefault();

      if (
        !comisionSeleccionada
      ) {
        return;
      }

      const saldo =
        Number(
          comisionSeleccionada
            .saldoPendiente
        ) || 0;

      if (
        saldo <= 0
      ) {
        mostrarNotificacion(
          "La comisión ya está pagada.",
          "error"
        );

        return;
      }

      /* =====================================================
         VALIDAR ABONO
      ===================================================== */

      if (
        tipoOperacion ===
        "Abono"
      ) {
        const valor =
          Number(
            formularioPago.valor
          );

        if (
          !Number.isFinite(
            valor
          ) ||
          valor <= 0
        ) {
          mostrarNotificacion(
            "Digite un valor de abono válido.",
            "error"
          );

          return;
        }

        if (
          valor >= saldo
        ) {
          mostrarNotificacion(
            "Si desea cancelar todo el saldo utilice Pagar saldo.",
            "error"
          );

          return;
        }
      }

      try {
        setGuardandoPago(
          true
        );

        const datos = {
          formaPago:
            formularioPago.formaPago,

          referenciaPago:
            formularioPago
              .referenciaPago
              .trim(),

          fechaPago:
            formularioPago.fechaPago,

          observaciones:
            formularioPago
              .observaciones
              .trim(),
        };

        let respuesta;

        if (
          tipoOperacion ===
          "Abono"
        ) {
          respuesta =
            await abonarComision(
              comisionSeleccionada._id,
              {
                ...datos,

                valor:
                  Number(
                    formularioPago.valor
                  ),
              }
            );
        } else {
          respuesta =
            await pagarSaldoComision(
              comisionSeleccionada._id,
              datos
            );
        }

        mostrarNotificacion(
          respuesta?.message ||
            (
              tipoOperacion ===
              "Abono"
                ? "Abono registrado correctamente."
                : "Comisión pagada correctamente."
            )
        );

        setModalPagoAbierto(
          false
        );

        setComisionSeleccionada(
          null
        );

        setFormularioPago(
          formularioPagoInicial
        );

        await cargarComisiones();
      } catch (error) {
        console.error(
          "Error registrando pago:",
          error
        );

        mostrarNotificacion(
          error?.response?.data
            ?.message ||
            "No fue posible registrar el movimiento.",
          "error"
        );
      } finally {
        setGuardandoPago(
          false
        );
      }
    };

  /* =======================================================
     ABRIR HISTORIAL
  ======================================================= */

  const abrirHistorial =
    async (
      comision
    ) => {
      try {
        setComisionSeleccionada(
          comision
        );

        setHistorial(
          null
        );

        setModalHistorialAbierto(
          true
        );

        setCargandoHistorial(
          true
        );

        const datos =
          await obtenerPagosComision(
            comision._id
          );

        setHistorial(
          datos
        );
      } catch (error) {
        console.error(
          "Error cargando historial:",
          error
        );

        mostrarNotificacion(
          error?.response?.data
            ?.message ||
            "No fue posible cargar el historial.",
          "error"
        );

        setModalHistorialAbierto(
          false
        );
      } finally {
        setCargandoHistorial(
          false
        );
      }
    };

  /* =======================================================
     CERRAR HISTORIAL
  ======================================================= */

  const cerrarHistorial =
    () => {
      setModalHistorialAbierto(
        false
      );

      setHistorial(
        null
      );

      setComisionSeleccionada(
        null
      );
    };

  /* =======================================================
     ABRIR EDITAR ABONO
  ======================================================= */

  const abrirEditarAbono =
    (
      movimiento
    ) => {
      if (
        movimiento
          ?.tipoMovimiento !==
        "Abono"
      ) {
        mostrarNotificacion(
          "El pago total no se puede editar.",
          "error"
        );

        return;
      }

      if (
        movimiento
          ?.puedeEditar !==
        true
      ) {
        mostrarNotificacion(
          "Solo se puede editar el último abono registrado.",
          "error"
        );

        return;
      }

      setMovimientoSeleccionado(
        movimiento
      );

      setFormularioEditarAbono({
        valor:
          String(
            Number(
              movimiento.valor
            ) || ""
          ),

        formaPago:
          movimiento.formaPago ||
          "Efectivo",

        fechaPago:
          obtenerFechaInput(
            movimiento.fechaPago
          ),

        referenciaPago:
          movimiento.referenciaPago ||
          "",

        observaciones:
          movimiento.observaciones ||
          "",
      });

      setModalEditarAbonoAbierto(
        true
      );
    };

  /* =======================================================
     CERRAR EDITAR
  ======================================================= */

  const cerrarEditarAbono =
    () => {
      if (
        guardandoEdicion
      ) {
        return;
      }

      setModalEditarAbonoAbierto(
        false
      );

      setMovimientoSeleccionado(
        null
      );
    };

  /* =======================================================
     CAMBIAR FORMULARIO EDICIÓN
  ======================================================= */

  const cambiarFormularioEditarAbono =
    (
      e
    ) => {
      const {
        name,
        value,
      } = e.target;

      if (
        name ===
        "valor"
      ) {
        const valorLimpio =
          String(
            value
          ).replace(
            /\D/g,
            ""
          );

        setFormularioEditarAbono(
          (
            anterior
          ) => ({
            ...anterior,

            valor:
              valorLimpio,
          })
        );

        return;
      }

      setFormularioEditarAbono(
        (
          anterior
        ) => ({
          ...anterior,

          [name]:
            value,
        })
      );
    };

  /* =======================================================
     GUARDAR EDICIÓN
  ======================================================= */

  const guardarEdicionAbono =
    async (
      e
    ) => {
      e.preventDefault();

      if (
        !movimientoSeleccionado
          ?._id
      ) {
        return;
      }

      const valor =
        Number(
          formularioEditarAbono.valor
        );

      if (
        !Number.isFinite(
          valor
        ) ||
        valor <= 0
      ) {
        mostrarNotificacion(
          "Digite un valor de abono válido.",
          "error"
        );

        return;
      }

      try {
        setGuardandoEdicion(
          true
        );

        const respuesta =
          await editarAbonoComision(
            movimientoSeleccionado._id,
            {
              ...formularioEditarAbono,

              valor,
            }
          );

        mostrarNotificacion(
          respuesta?.message ||
            "Abono actualizado correctamente."
        );

        /*
          Actualizar historial sin cerrar
          la ventana principal.
        */

        if (
          comisionSeleccionada
            ?._id
        ) {
          const datosHistorial =
            await obtenerPagosComision(
              comisionSeleccionada._id
            );

          setHistorial(
            datosHistorial
          );
        }

        await cargarComisiones();

        setModalEditarAbonoAbierto(
          false
        );

        setMovimientoSeleccionado(
          null
        );
      } catch (error) {
        console.error(
          "Error editando abono:",
          error
        );

        mostrarNotificacion(
          error?.response?.data
            ?.message ||
            "No fue posible editar el abono.",
          "error"
        );
      } finally {
        setGuardandoEdicion(
          false
        );
      }
    };

  /* =======================================================
     ABRIR CONFIRMACIÓN DE ELIMINACIÓN
  ======================================================= */

  const abrirEliminarMovimiento =
    (
      movimiento
    ) => {
      if (
        movimiento
          ?.puedeEliminar !==
        true
      ) {
        mostrarNotificacion(
          "Solo se puede eliminar el último movimiento registrado.",
          "error"
        );

        return;
      }

      setMovimientoEliminar(
        movimiento
      );

      setModalEliminarAbierto(
        true
      );
    };

  /* =======================================================
     CERRAR ELIMINAR
  ======================================================= */

  const cerrarEliminarMovimiento =
    () => {
      if (
        eliminandoMovimiento
      ) {
        return;
      }

      setModalEliminarAbierto(
        false
      );

      setMovimientoEliminar(
        null
      );
    };

  /* =======================================================
     CONFIRMAR ELIMINACIÓN
  ======================================================= */

  const confirmarEliminarMovimiento =
    async () => {
      if (
        !movimientoEliminar
          ?._id
      ) {
        return;
      }

      try {
        setEliminandoMovimiento(
          true
        );

        const respuesta =
          await eliminarMovimientoComision(
            movimientoEliminar._id
          );

        mostrarNotificacion(
          respuesta?.message ||
            "Movimiento eliminado correctamente."
        );

        /*
          Actualizamos inmediatamente el historial.
        */

        if (
          comisionSeleccionada
            ?._id
        ) {
          const datosHistorial =
            await obtenerPagosComision(
              comisionSeleccionada._id
            );

          setHistorial(
            datosHistorial
          );
        }

        /*
          También actualizamos:
          - Pagado
          - Saldo
          - Estado
          - estadísticas
        */

        await cargarComisiones();

        setModalEliminarAbierto(
          false
        );

        setMovimientoEliminar(
          null
        );
      } catch (error) {
        console.error(
          "Error eliminando movimiento:",
          error
        );

        mostrarNotificacion(
          error?.response?.data
            ?.message ||
            "No fue posible eliminar el movimiento.",
          "error"
        );
      } finally {
        setEliminandoMovimiento(
          false
        );
      }
    };

  /* =======================================================
     FILTRAR BÚSQUEDA LOCAL
  ======================================================= */

  const comisionesFiltradas =
    useMemo(
      () => {
        const texto =
          busqueda
            .trim()
            .toLowerCase();

        if (!texto) {
          return comisiones;
        }

        return comisiones.filter(
          (
            comision
          ) => {
            const vendedor =
              obtenerNombreCompleto(
                comision.vendedor
              );

            const cliente =
              obtenerNombreCompleto(
                comision.cliente
              );

            const codigo =
              comision.codigo ||
              "";

            const venta =
              comision.venta
                ?.codigo ||
              "";

            const documentoVendedor =
              comision.vendedor
                ?.documento ||
              "";

            const documentoCliente =
              comision.cliente
                ?.documento ||
              "";

            const lote =
              obtenerNombreLote(
                comision.lote
              );

            const contenido = `
              ${codigo}
              ${venta}
              ${vendedor}
              ${cliente}
              ${documentoVendedor}
              ${documentoCliente}
              ${lote}
            `.toLowerCase();

            return contenido.includes(
              texto
            );
          }
        );
      },
      [
        comisiones,
        busqueda,
      ]
    );

  /* =======================================================
     ABRIR VENTANA DE IMPRESIÓN
  ======================================================= */

  const abrirVentanaImpresion =
    (
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

      const rutaEstilos =
        `${window.location.origin}/styles/comisiones-impresion.css`;

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

            <link
              rel="stylesheet"
              href="${rutaEstilos}"
            />

          </head>

          <body>

            <div class="acciones">

              <button
                type="button"
                class="cerrar"
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

            <main class="reporte">
              ${contenido}
            </main>

          </body>

        </html>
      `);

      ventana.document.close();

      ventana.focus();
    };

  /* =======================================================
     IMPRIMIR REPORTE GENERAL
  ======================================================= */

  const imprimirGeneral =
    async () => {
      try {
        const datos =
          await obtenerComisiones(
            {}
          );

        const todas =
          Array.isArray(
            datos?.comisiones
          )
            ? datos.comisiones
            : [];

        if (
          todas.length ===
          0
        ) {
          mostrarNotificacion(
            "No hay comisiones para imprimir.",
            "error"
          );

          return;
        }

        /* =====================================================
           AGRUPAR POR VENDEDOR
        ===================================================== */

        const vendedores =
          new Map();

        for (
          const comision
          of todas
        ) {
          const vendedor =
            comision.vendedor;

          const id =
            vendedor?._id ||
            "sin-vendedor";

          if (
            !vendedores.has(
              id
            )
          ) {
            vendedores.set(
              id,
              {
                vendedor,

                lotesVendidos:
                  0,

                generado:
                  0,

                pagado:
                  0,

                pendiente:
                  0,
              }
            );
          }

          const item =
            vendedores.get(
              id
            );

          item.lotesVendidos +=
            1;

          item.generado +=
            Number(
              comision.valorComision
            ) || 0;

          item.pagado +=
            Number(
              comision.totalPagado
            ) || 0;

          item.pendiente +=
            Number(
              comision.saldoPendiente
            ) || 0;
        }

        const lista =
          Array.from(
            vendedores.values()
          );

        const filas =
          lista
            .map(
              (
                item
              ) => `
                <tr>

                  <td>
                    ${escaparHTML(
                      item.vendedor
                        ?.codigo ||
                        "—"
                    )}
                  </td>

                  <td class="nombre">
                    <strong>
                      ${escaparHTML(
                        obtenerNombreCompleto(
                          item.vendedor
                        )
                      )}
                    </strong>

                    <br />

                    <span>
                      ${escaparHTML(
                        item.vendedor
                          ?.documento ||
                          ""
                      )}
                    </span>
                  </td>

                  <td>
                    ${
                      item.lotesVendidos
                    }
                  </td>

                  <td class="dinero">
                    ${escaparHTML(
                      formatearDinero(
                        item.generado
                      )
                    )}
                  </td>

                  <td class="dinero pagado">
                    ${escaparHTML(
                      formatearDinero(
                        item.pagado
                      )
                    )}
                  </td>

                  <td class="dinero pendiente">
                    ${escaparHTML(
                      formatearDinero(
                        item.pendiente
                      )
                    )}
                  </td>

                </tr>
              `
            )
            .join("");

        const totalGenerado =
          lista.reduce(
            (
              total,
              item
            ) =>
              total +
              item.generado,
            0
          );

        const totalPagado =
          lista.reduce(
            (
              total,
              item
            ) =>
              total +
              item.pagado,
            0
          );

        const totalPendiente =
          lista.reduce(
            (
              total,
              item
            ) =>
              total +
              item.pendiente,
            0
          );

        const contenido = `
          <div class="reporte-header">

            <h1>
              LOTES VILLA MARÍA
            </h1>

            <h2>
              Reporte general de comisiones
            </h2>

          </div>

          <div class="resumen-general">

            <div>
              <span>
                Vendedores
              </span>

              <strong>
                ${lista.length}
              </strong>
            </div>

            <div>
              <span>
                Generado
              </span>

              <strong>
                ${escaparHTML(
                  formatearDinero(
                    totalGenerado
                  )
                )}
              </strong>
            </div>

            <div>
              <span>
                Pagado
              </span>

              <strong>
                ${escaparHTML(
                  formatearDinero(
                    totalPagado
                  )
                )}
              </strong>
            </div>

            <div>
              <span>
                Pendiente
              </span>

              <strong>
                ${escaparHTML(
                  formatearDinero(
                    totalPendiente
                  )
                )}
              </strong>
            </div>

          </div>

          <table>

            <thead>

              <tr>
                <th>Código</th>
                <th>Vendedor</th>
                <th>Lotes vendidos</th>
                <th>Generado</th>
                <th>Pagado</th>
                <th>Pendiente</th>
              </tr>

            </thead>

            <tbody>
              ${filas}
            </tbody>

            <tfoot>

              <tr>

                <td colspan="3">
                  <strong>
                    TOTALES
                  </strong>
                </td>

                <td class="dinero">
                  ${escaparHTML(
                    formatearDinero(
                      totalGenerado
                    )
                  )}
                </td>

                <td class="dinero pagado">
                  ${escaparHTML(
                    formatearDinero(
                      totalPagado
                    )
                  )}
                </td>

                <td class="dinero pendiente">
                  ${escaparHTML(
                    formatearDinero(
                      totalPendiente
                    )
                  )}
                </td>

              </tr>

            </tfoot>

          </table>
        `;

        abrirVentanaImpresion(
          "Reporte general de comisiones",
          contenido
        );
      } catch (error) {
        console.error(
          "Error imprimiendo reporte general:",
          error
        );

        mostrarNotificacion(
          "No fue posible generar el reporte general.",
          "error"
        );
      }
    };

  /* =======================================================
     IMPRIMIR COMISIONES DE UN VENDEDOR
  ======================================================= */

  const imprimirVendedor =
    async (
      vendedor
    ) => {
      try {
        if (
          !vendedor?._id
        ) {
          mostrarNotificacion(
            "No fue posible identificar el vendedor.",
            "error"
          );

          return;
        }

        const datos =
          await obtenerComisiones({
            vendedor:
              vendedor._id,
          });

        const lista =
          Array.isArray(
            datos?.comisiones
          )
            ? datos.comisiones
            : [];

        if (
          lista.length ===
          0
        ) {
          mostrarNotificacion(
            "Este vendedor no tiene comisiones.",
            "error"
          );

          return;
        }

        const generado =
          lista.reduce(
            (
              total,
              comision
            ) =>
              total +
              (
                Number(
                  comision.valorComision
                ) || 0
              ),
            0
          );

        const pagado =
          lista.reduce(
            (
              total,
              comision
            ) =>
              total +
              (
                Number(
                  comision.totalPagado
                ) || 0
              ),
            0
          );

        const pendiente =
          lista.reduce(
            (
              total,
              comision
            ) =>
              total +
              (
                Number(
                  comision.saldoPendiente
                ) || 0
              ),
            0
          );

        const filas =
          lista
            .map(
              (
                comision              ) => `
                <tr>

                  <td>
                    ${escaparHTML(
                      comision.codigo ||
                      "—"
                    )}
                  </td>

                  <td>
                    ${escaparHTML(
                      comision.venta
                        ?.codigo ||
                        "—"
                    )}
                  </td>

                  <td class="nombre">
                    ${escaparHTML(
                      obtenerNombreCompleto(
                        comision.cliente
                      )
                    )}
                  </td>

                  <td>
                    ${escaparHTML(
                      obtenerNombreLote(
                        comision.lote
                      )
                    )}
                  </td>

                  <td class="dinero">
                    ${escaparHTML(
                      formatearDinero(
                        comision.valorComision
                      )
                    )}
                  </td>

                  <td class="dinero pagado">
                    ${escaparHTML(
                      formatearDinero(
                        comision.totalPagado
                      )
                    )}
                  </td>

                  <td class="dinero pendiente">
                    ${escaparHTML(
                      formatearDinero(
                        comision.saldoPendiente
                      )
                    )}
                  </td>

                  <td>
                    ${escaparHTML(
                      comision.estado ||
                      "—"
                    )}
                  </td>

                </tr>
              `
            )
            .join("");

        const contenido = `
          <div class="reporte-header">

            <h1>
              LOTES VILLA MARÍA
            </h1>

            <h2>
              Comisiones del vendedor
            </h2>

          </div>

          <div class="vendedor-ficha">

            <div>
              <span>
                Código
              </span>

              <strong>
                ${escaparHTML(
                  vendedor.codigo ||
                  "—"
                )}
              </strong>
            </div>

            <div>
              <span>
                Vendedor
              </span>

              <strong>
                ${escaparHTML(
                  obtenerNombreCompleto(
                    vendedor
                  )
                )}
              </strong>
            </div>

            <div>
              <span>
                Documento
              </span>

              <strong>
                ${escaparHTML(
                  vendedor.documento ||
                  "—"
                )}
              </strong>
            </div>

          </div>

          <div class="resumen-general">

            <div>
              <span>
                Lotes vendidos
              </span>

              <strong>
                ${lista.length}
              </strong>
            </div>

            <div>
              <span>
                Generado
              </span>

              <strong>
                ${escaparHTML(
                  formatearDinero(
                    generado
                  )
                )}
              </strong>
            </div>

            <div>
              <span>
                Pagado
              </span>

              <strong>
                ${escaparHTML(
                  formatearDinero(
                    pagado
                  )
                )}
              </strong>
            </div>

            <div>
              <span>
                Pendiente
              </span>

              <strong>
                ${escaparHTML(
                  formatearDinero(
                    pendiente
                  )
                )}
              </strong>
            </div>

          </div>

          <table>

            <thead>

              <tr>
                <th>Comisión</th>
                <th>Venta</th>
                <th>Cliente</th>
                <th>Lote</th>
                <th>Generado</th>
                <th>Pagado</th>
                <th>Saldo</th>
                <th>Estado</th>
              </tr>

            </thead>

            <tbody>
              ${filas}
            </tbody>

          </table>
        `;

        abrirVentanaImpresion(
          `Comisiones ${obtenerNombreCompleto(
            vendedor
          )}`,
          contenido
        );
      } catch (error) {
        console.error(
          "Error imprimiendo vendedor:",
          error
        );

        mostrarNotificacion(
          "No fue posible imprimir las comisiones del vendedor.",
          "error"
        );
      }
    };

  /* =======================================================
     IMPRIMIR HISTORIAL DE UNA COMISIÓN
  ======================================================= */

  const imprimirHistorial =
    () => {
      if (
        !historial ||
        !comisionSeleccionada
      ) {
        mostrarNotificacion(
          "No hay historial disponible para imprimir.",
          "error"
        );

        return;
      }

      const movimientos =
        Array.isArray(
          historial.movimientos
        )
          ? historial.movimientos
          : [];

      const filas =
        movimientos.length >
        0
          ? movimientos
              .map(
                (
                  movimiento
                ) => `
                  <tr>

                    <td>
                      ${escaparHTML(
                        movimiento.codigo ||
                        "—"
                      )}
                    </td>

                    <td>
                      ${escaparHTML(
                        formatearFecha(
                          movimiento.fechaPago
                        )
                      )}
                    </td>

                    <td>
                      ${escaparHTML(
                        movimiento.tipoMovimiento ||
                        "—"
                      )}
                    </td>

                    <td>
                      ${escaparHTML(
                        movimiento.formaPago ||
                        "—"
                      )}
                    </td>

                    <td>
                      ${escaparHTML(
                        movimiento.referenciaPago ||
                        "—"
                      )}
                    </td>

                    <td class="dinero">
                      ${escaparHTML(
                        formatearDinero(
                          movimiento.valor
                        )
                      )}
                    </td>

                    <td class="dinero pendiente">
                      ${escaparHTML(
                        formatearDinero(
                          movimiento.saldoDespues
                        )
                      )}
                    </td>

                  </tr>
                `
              )
              .join("")
          : `
              <tr>
                <td
                  colspan="7"
                  class="sin-registros"
                >
                  No hay pagos o abonos registrados.
                </td>
              </tr>
            `;

      const contenido = `
        <div class="reporte-header">

          <h1>
            LOTES VILLA MARÍA
          </h1>

          <h2>
            Historial de pagos de comisión
          </h2>

        </div>

        <div class="vendedor-ficha">

          <div>
            <span>
              Comisión
            </span>

            <strong>
              ${escaparHTML(
                comisionSeleccionada.codigo ||
                "—"
              )}
            </strong>
          </div>

          <div>
            <span>
              Vendedor
            </span>

            <strong>
              ${escaparHTML(
                obtenerNombreCompleto(
                  comisionSeleccionada.vendedor
                )
              )}
            </strong>
          </div>

          <div>
            <span>
              Venta
            </span>

            <strong>
              ${escaparHTML(
                comisionSeleccionada.venta
                  ?.codigo ||
                  "—"
              )}
            </strong>
          </div>

        </div>

        <div class="resumen-general">

          <div>
            <span>
              Comisión
            </span>

            <strong>
              ${escaparHTML(
                formatearDinero(
                  historial.resumen
                    ?.valorComision
                )
              )}
            </strong>
          </div>

          <div>
            <span>
              Pagado
            </span>

            <strong>
              ${escaparHTML(
                formatearDinero(
                  historial.resumen
                    ?.totalPagado
                )
              )}
            </strong>
          </div>

          <div>
            <span>
              Pendiente
            </span>

            <strong>
              ${escaparHTML(
                formatearDinero(
                  historial.resumen
                    ?.saldoPendiente
                )
              )}
            </strong>
          </div>

          <div>
            <span>
              Estado
            </span>

            <strong>
              ${escaparHTML(
                historial.resumen
                  ?.estado ||
                  "—"
              )}
            </strong>
          </div>

        </div>

        <table>

          <thead>

            <tr>
              <th>Egreso</th>
              <th>Fecha</th>
              <th>Movimiento</th>
              <th>Forma de pago</th>
              <th>Referencia</th>
              <th>Valor</th>
              <th>Saldo después</th>
            </tr>

          </thead>

          <tbody>
            ${filas}
          </tbody>

        </table>
      `;

      abrirVentanaImpresion(
        `Historial ${comisionSeleccionada.codigo}`,
        contenido
      );
    };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <section className="comisiones-page">

      {/* =================================================
          CABECERA
      ================================================= */}

      <div className="comisiones-header">

        <div>

          <span className="comisiones-kicker">
            Comercial
          </span>

          <h1>
            Comisiones
          </h1>

          <p>
            Control de las comisiones
            generadas por las ventas de
            lotes y los saldos pendientes
            por pagar a cada vendedor.
          </p>

        </div>

        <div className="comisiones-header-actions">

          <button
            type="button"
            className="comisiones-refresh"
            onClick={
              cargarComisiones
            }
            disabled={
              cargando ||
              sincronizando
            }
          >
            <RefreshCw
              size={17}
              className={
                cargando
                  ? "comisiones-spin"
                  : ""
              }
            />

            Actualizar
          </button>

          <button
            type="button"
            className="comisiones-print"
            onClick={
              imprimirGeneral
            }
          >
            <Printer
              size={17}
            />

            Imprimir general
          </button>

          <button
            type="button"
            className="comisiones-sync"
            onClick={
              sincronizar
            }
            disabled={
              sincronizando ||
              cargando
            }
          >
            <RefreshCw
              size={17}
              className={
                sincronizando
                  ? "comisiones-spin"
                  : ""
              }
            />

            {sincronizando
              ? "Sincronizando..."
              : "Sincronizar ventas"}
          </button>

        </div>

      </div>

      {/* =================================================
          ESTADÍSTICAS
      ================================================= */}

      <div className="comisiones-stats">

        <article className="comisiones-stat generado">

          <div className="comisiones-stat-icon">
            <BadgeDollarSign
              size={21}
            />
          </div>

          <div>
            <span>
              Comisiones generadas
            </span>

            <strong>
              {formatearDinero(
                resumen.valorGenerado
              )}
            </strong>

            <small>
              {resumen.totalComisiones} comisión(es)
            </small>
          </div>

        </article>

        <article className="comisiones-stat pagado">

          <div className="comisiones-stat-icon">
            <CircleCheckBig
              size={20}
            />
          </div>

          <div>
            <span>
              Total pagado
            </span>

            <strong>
              {formatearDinero(
                resumen.valorPagado
              )}
            </strong>

            <small>
              {resumen.pagadas} pagada(s)
            </small>
          </div>

        </article>

        <article className="comisiones-stat pendiente">

          <div className="comisiones-stat-icon">
            <WalletCards
              size={20}
            />
          </div>

          <div>
            <span>
              Saldo pendiente
            </span>

            <strong>
              {formatearDinero(
                resumen.saldoPendiente
              )}
            </strong>

            <small>
              {resumen.pendientes} pendiente(s)
            </small>
          </div>

        </article>

        <article className="comisiones-stat abonado">

          <div className="comisiones-stat-icon">
            <Clock3
              size={20}
            />
          </div>

          <div>
            <span>
              Con abonos
            </span>

            <strong>
              {resumen.abonadas}
            </strong>

            <small>
              Comisiones abonadas
            </small>
          </div>

        </article>

      </div>

      {/* =================================================
          PANEL
      ================================================= */}

      <div className="comisiones-panel">

        <div className="comisiones-toolbar">

          <div className="comisiones-search">

            <Search
              size={17}
            />

            <input
              type="text"
              value={
                busqueda
              }
              onChange={
                (
                  e
                ) =>
                  setBusqueda(
                    e.target.value
                  )
              }
              placeholder="Buscar comisión, venta, vendedor, cliente o lote..."
            />

          </div>

          <select
            value={
              filtroEstado
            }
            onChange={
              (
                e
              ) =>
                setFiltroEstado(
                  e.target.value
                )
            }
          >
            <option value="">
              Todos los estados
            </option>

            <option value="Pendiente">
              Pendientes
            </option>

            <option value="Abonada">
              Abonadas
            </option>

            <option value="Pagada">
              Pagadas
            </option>

          </select>

        </div>

        {/* =============================================
            TABLA
        ============================================= */}

        <div className="comisiones-table-wrapper">

          <table className="comisiones-table">

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
                  Venta
                </th>

                <th>
                  Cliente
                </th>

                <th>
                  Lote
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
                  Estado
                </th>

                <th>
                  Acciones
                </th>

              </tr>

            </thead>

            <tbody>

              {cargando ? (

                <tr>

                  <td
                    colSpan="11"
                    className="comisiones-empty"
                  >

                    <RefreshCw
                      size={27}
                      className="comisiones-spin"
                    />

                    <strong>
                      Cargando comisiones...
                    </strong>

                  </td>

                </tr>

              ) : comisionesFiltradas.length ===
                0 ? (

                <tr>

                  <td
                    colSpan="11"
                    className="comisiones-empty"
                  >

                    <BadgeDollarSign
                      size={38}
                    />

                    <strong>
                      No hay comisiones para mostrar
                    </strong>

                    <span>
                      Las comisiones se generan
                      a partir de las ventas que
                      tengan un vendedor asignado.
                    </span>

                  </td>

                </tr>

              ) : (

                comisionesFiltradas.map(
                  (
                    comision
                  ) => (

                    <tr
                      key={
                        comision._id
                      }
                    >

                      <td>
                        <strong className="comision-code">
                          {comision.codigo || "—"}
                        </strong>
                      </td>

                      <td>
                        <span className="comision-fecha">
                          {formatearFecha(
                            comision.fechaGeneracion
                          )}
                        </span>
                      </td>

                      <td>

                        <div className="comision-persona">

                          <div className="comision-avatar">
                            {String(
                              comision.vendedor
                                ?.nombres ||
                                "V"
                            )
                              .charAt(
                                0
                              )
                              .toUpperCase()}
                          </div>

                          <div>

                            <strong>
                              {obtenerNombreCompleto(
                                comision.vendedor
                              )}
                            </strong>

                            <span>
                              {comision.vendedor
                                ?.codigo ||
                                comision.vendedor
                                  ?.documento ||
                                "—"}
                            </span>

                          </div>

                        </div>

                      </td>

                      <td>
                        <strong className="comision-venta">
                          {comision.venta
                            ?.codigo ||
                            "—"}
                        </strong>
                      </td>

                      <td>

                        <div className="comision-cliente">

                          <UserRound
                            size={14}
                          />

                          <div>

                            <strong>
                              {obtenerNombreCompleto(
                                comision.cliente
                              )}
                            </strong>

                            <span>
                              {comision.cliente
                                ?.documento ||
                                ""}
                            </span>

                          </div>

                        </div>

                      </td>

                      <td>
                        <span className="comision-lote">
                          {obtenerNombreLote(
                            comision.lote
                          )}
                        </span>
                      </td>

                      <td>
                        <strong className="comision-valor generado">
                          {formatearDinero(
                            comision.valorComision
                          )}
                        </strong>
                      </td>

                      <td>
                        <strong className="comision-valor pagado">
                          {formatearDinero(
                            comision.totalPagado
                          )}
                        </strong>
                      </td>

                      <td>
                        <strong className="comision-valor saldo">
                          {formatearDinero(
                            comision.saldoPendiente
                          )}
                        </strong>
                      </td>

                      <td>

                        <span
                          className={`comision-status comision-status-${String(
                            comision.estado ||
                              "Pendiente"
                          )
                            .toLowerCase()
                            .replace(
                              /\s+/g,
                              "-"
                            )}`}
                        >
                          {comision.estado ||
                            "Pendiente"}
                        </span>

                      </td>

                      {/* ACCIONES */}

                      <td>

                        <div className="comisiones-actions">

                          <button
                            type="button"
                            className="historial"
                            title="Ver historial"
                            onClick={() =>
                              abrirHistorial(
                                comision
                              )
                            }
                          >
                            <History
                              size={15}
                            />
                          </button>

                          <button
                            type="button"
                            className="imprimir-vendedor"
                            title="Imprimir vendedor"
                            onClick={() =>
                              imprimirVendedor(
                                comision.vendedor
                              )
                            }
                          >
                            <Printer
                              size={15}
                            />
                          </button>

                          {Number(
                            comision.saldoPendiente
                          ) > 0 && (
                            <>
                              <button
                                type="button"
                                className="abonar"
                                title="Abonar comisión"
                                onClick={() =>
                                  abrirAbono(
                                    comision
                                  )
                                }
                              >
                                <HandCoins
                                  size={15}
                                />
                              </button>

                              <button
                                type="button"
                                className="pagar"
                                title="Pagar saldo completo"
                                onClick={() =>
                                  abrirPagoTotal(
                                    comision
                                  )
                                }
                              >
                                <CircleCheckBig
                                  size={15}
                                />
                              </button>
                            </>
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

        <div className="comisiones-footer">

          <span>
            Mostrando{" "}
            <strong>
              {
                comisionesFiltradas.length
              }
            </strong>{" "}
            de{" "}
            <strong>
              {
                comisiones.length
              }
            </strong>{" "}
            comisión(es)
          </span>

        </div>

      </div>

      {/* =================================================
          MODAL ABONO / PAGO
      ================================================= */}

      {modalPagoAbierto &&
        comisionSeleccionada && (

          <div
            className="comision-modal-backdrop"
            onMouseDown={
              cerrarModalPago
            }
          >

            <div
              className="comision-pago-modal"
              onMouseDown={
                (
                  e
                ) =>
                  e.stopPropagation()
              }
            >

              <div className="comision-modal-header">

                <div>

                  <span>
                    {
                      comisionSeleccionada.codigo
                    }
                  </span>

                  <h2>
                    {tipoOperacion ===
                    "Abono"
                      ? "Abonar comisión"
                      : "Pagar saldo"}
                  </h2>

                </div>

                <button
                  type="button"
                  className="comision-modal-close"
                  onClick={
                    cerrarModalPago
                  }
                  disabled={
                    guardandoPago
                  }
                >
                  <X
                    size={19}
                  />
                </button>

              </div>

              <form
                className="comision-pago-form"
                onSubmit={
                  guardarPago
                }
              >

                {/* RESUMEN */}

                <div className="comision-pago-resumen">

                  <div>
                    <span>
                      Vendedor
                    </span>

                    <strong>
                      {obtenerNombreCompleto(
                        comisionSeleccionada
                          .vendedor
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Comisión
                    </span>

                    <strong>
                      {formatearDinero(
                        comisionSeleccionada
                          .valorComision
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Pagado
                    </span>

                    <strong>
                      {formatearDinero(
                        comisionSeleccionada
                          .totalPagado
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Saldo
                    </span>

                    <strong>
                      {formatearDinero(
                        comisionSeleccionada
                          .saldoPendiente
                      )}
                    </strong>
                  </div>

                </div>

                <div className="comision-pago-grid">

                  {/* VALOR */}

                  <div className="comision-pago-field">

                    <label>
                      {tipoOperacion ===
                      "Abono"
                        ? "Valor del abono *"
                        : "Valor a pagar"}
                    </label>

                    <input
                      type="text"
                      inputMode="numeric"
                      name="valor"
                      value={
                        tipoOperacion ===
                        "Pago"
                          ? formatearValorInput(
                              comisionSeleccionada
                                .saldoPendiente
                            )
                          : formatearValorInput(
                              formularioPago.valor
                            )
                      }
                      onChange={
                        cambiarFormularioPago
                      }
                      disabled={
                        tipoOperacion ===
                        "Pago"
                      }
                      placeholder="Ej: 1.000.000"
                      autoComplete="off"
                    />

                  </div>

                  {/* FORMA PAGO */}

                  <div className="comision-pago-field">

                    <label>
                      Forma de pago *
                    </label>

                    <select
                      name="formaPago"
                      value={
                        formularioPago.formaPago
                      }
                      onChange={
                        cambiarFormularioPago
                      }
                    >
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

                  {/* FECHA */}

                  <div className="comision-pago-field">

                    <label>
                      Fecha *
                    </label>

                    <input
                      type="date"
                      name="fechaPago"
                      value={
                        formularioPago.fechaPago
                      }
                      onChange={
                        cambiarFormularioPago
                      }
                    />

                  </div>

                  {/* REFERENCIA */}

                  <div className="comision-pago-field">

                    <label>
                      Referencia
                    </label>

                    <input
                      type="text"
                      name="referenciaPago"
                      value={
                        formularioPago.referenciaPago
                      }
                      onChange={
                        cambiarFormularioPago
                      }
                      placeholder="Transferencia, recibo..."
                    />

                  </div>

                </div>

                {/* OBSERVACIONES */}

                <div className="comision-pago-field comision-pago-field-full">

                  <label>
                    Observaciones
                  </label>

                  <textarea
                    name="observaciones"
                    rows="3"
                    value={
                      formularioPago.observaciones
                    }
                    onChange={
                      cambiarFormularioPago
                    }
                    placeholder="Observaciones del movimiento..."
                  />

                </div>

                <div className="comision-modal-footer">

                  <button
                    type="button"
                    className="comision-cancel-button"
                    onClick={
                      cerrarModalPago
                    }
                    disabled={
                      guardandoPago
                    }
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="comision-save-button"
                    disabled={
                      guardandoPago
                    }
                  >

                    {guardandoPago ? (
                      <RefreshCw
                        size={17}
                        className="comisiones-spin"
                      />
                    ) : (
                      <Save
                        size={17}
                      />
                    )}

                    {guardandoPago
                      ? "Guardando..."
                      : tipoOperacion ===
                          "Abono"
                        ? "Registrar abono"
                        : "Pagar saldo"}

                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

      {/* =================================================
          MODAL HISTORIAL
      ================================================= */}

      {modalHistorialAbierto &&
        comisionSeleccionada && (

          <div
            className="comision-modal-backdrop"
            onMouseDown={
              cerrarHistorial
            }
          >

            <div
              className="comision-historial-modal"
              onMouseDown={
                (
                  e
                ) =>
                  e.stopPropagation()
              }
            >

              <div className="comision-modal-header">

                <div>

                  <span>
                    {
                      comisionSeleccionada.codigo
                    }
                  </span>

                  <h2>
                    Historial de pagos
                  </h2>

                </div>

                <div className="comision-historial-header-actions">

                  <button
                    type="button"
                    className="comision-imprimir-historial"
                    onClick={
                      imprimirHistorial
                    }
                    disabled={
                      cargandoHistorial ||
                      !historial
                    }
                  >
                    <Printer
                      size={16}
                    />

                    Imprimir historial
                  </button>

                  <button
                    type="button"
                    className="comision-modal-close"
                    onClick={
                      cerrarHistorial
                    }
                  >
                    <X
                      size={19}
                    />
                  </button>

                </div>

              </div>

              <div className="comision-historial-body">

                {cargandoHistorial ? (

                  <div className="comision-historial-loading">

                    <RefreshCw
                      size={26}
                      className="comisiones-spin"
                    />

                    <strong>
                      Cargando historial...
                    </strong>

                  </div>

                ) : historial ? (

                  <>

                    <div className="comision-historial-resumen">

                      <div>
                        <span>
                          Comisión
                        </span>

                        <strong>
                          {formatearDinero(
                            historial.resumen
                              ?.valorComision
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Pagado
                        </span>

                        <strong>
                          {formatearDinero(
                            historial.resumen
                              ?.totalPagado
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Saldo
                        </span>

                        <strong>
                          {formatearDinero(
                            historial.resumen
                              ?.saldoPendiente
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Estado
                        </span>

                        <strong>
                          {historial.resumen
                            ?.estado ||
                            "—"}
                        </strong>
                      </div>

                    </div>

                    <div className="comision-historial-table-wrapper">

                      <table className="comision-historial-table">

                        <thead>
                          <tr>
                            <th>
                              Egreso
                            </th>

                            <th>
                              Fecha
                            </th>

                            <th>
                              Movimiento
                            </th>

                            <th>
                              Forma
                            </th>

                            <th>
                              Valor
                            </th>

                            <th>
                              Saldo después
                            </th>

                            <th>
                              Referencia
                            </th>

                            <th>
                              Acciones
                            </th>
                          </tr>
                        </thead>

                        <tbody>

                          {Array.isArray(
                            historial.movimientos
                          ) &&
                          historial.movimientos
                            .length >
                            0 ? (

                            historial.movimientos.map(
                              (
                                movimiento
                              ) => (

                                <tr
                                  key={
                                    movimiento._id
                                  }
                                >

                                  <td>
                                    <strong>
                                      {movimiento.codigo ||
                                        "—"}
                                    </strong>
                                  </td>

                                  <td>
                                    {formatearFecha(
                                      movimiento.fechaPago
                                    )}
                                  </td>

                                  <td>
                                    {
                                      movimiento.tipoMovimiento
                                    }
                                  </td>

                                  <td>
                                    {
                                      movimiento.formaPago
                                    }
                                  </td>

                                  <td>
                                    <strong>
                                      {formatearDinero(
                                        movimiento.valor
                                      )}
                                    </strong>
                                  </td>

                                  <td>
                                    {formatearDinero(
                                      movimiento.saldoDespues
                                    )}
                                  </td>

                                  <td>
                                    {movimiento.referenciaPago ||
                                      "—"}
                                  </td>

                                  <td>

                                    <div className="comision-historial-actions">

                                      {movimiento.puedeEditar && (
                                        <button
                                          type="button"
                                          className="comision-historial-edit"
                                          title="Editar abono"
                                          onClick={() =>
                                            abrirEditarAbono(
                                              movimiento
                                            )
                                          }
                                        >
                                          <Pencil
                                            size={14}
                                          />
                                        </button>
                                      )}

                                      {movimiento.puedeEliminar && (
                                        <button
                                          type="button"
                                          className="comision-historial-delete"
                                          title={
                                            movimiento.tipoMovimiento ===
                                            "Pago"
                                              ? "Eliminar pago total"
                                              : "Eliminar abono"
                                          }
                                          onClick={() =>
                                            abrirEliminarMovimiento(
                                              movimiento
                                            )
                                          }
                                        >
                                          <Trash2
                                            size={14}
                                          />
                                        </button>
                                      )}

                                      {!movimiento.puedeEditar &&
                                        !movimiento.puedeEliminar && (
                                          <span className="comision-historial-sin-acciones">
                                            —
                                          </span>
                                        )}

                                    </div>

                                  </td>

                                </tr>

                              )
                            )

                          ) : (

                            <tr>

                              <td
                                colSpan="8"
                                className="comision-historial-empty"
                              >
                                Esta comisión todavía no tiene pagos ni abonos registrados.
                              </td>

                            </tr>

                          )}

                        </tbody>

                      </table>

                    </div>

                  </>

                ) : null}

              </div>

            </div>

          </div>

        )}

      {/* =================================================
          EDITAR ABONO
      ================================================= */}

      {modalEditarAbonoAbierto &&
        movimientoSeleccionado && (

          <div className="comision-modal-backdrop">

            <div className="comision-pago-modal comision-editar-abono-modal">

              <div className="comision-modal-header">

                <div>

                  <span>
                    {
                      movimientoSeleccionado.codigo
                    }
                  </span>

                  <h2>
                    Editar abono
                  </h2>

                </div>

                <button
                  type="button"
                  className="comision-modal-close"
                  onClick={
                    cerrarEditarAbono
                  }
                  disabled={
                    guardandoEdicion
                  }
                >
                  <X
                    size={19}
                  />
                </button>

              </div>

              <form
                onSubmit={
                  guardarEdicionAbono
                }
              >

                <div className="comision-pago-body">

                  <div className="comision-pago-resumen">

                    <div>
                      <span>
                        Egreso
                      </span>

                      <strong>
                        {
                          movimientoSeleccionado.codigo
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Valor actual
                      </span>

                      <strong>
                        {formatearDinero(
                          movimientoSeleccionado.valor
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Movimiento
                      </span>

                      <strong>
                        Abono
                      </strong>
                    </div>

                  </div>

                  <div className="comision-pago-grid">

                    {/* VALOR */}

                    <div className="comision-pago-field">

                      <label>
                        Valor del abono *
                      </label>

                      <input
                        type="text"
                        inputMode="numeric"
                        name="valor"
                        value={
                          formatearValorInput(
                            formularioEditarAbono.valor
                          )
                        }
                        onChange={
                          cambiarFormularioEditarAbono
                        }
                        placeholder="Ej: 500.000"
                        autoComplete="off"
                        disabled={
                          guardandoEdicion
                        }
                      />

                    </div>

                    {/* FORMA */}

                    <div className="comision-pago-field">

                      <label>
                        Forma de pago *
                      </label>

                      <select
                        name="formaPago"
                        value={
                          formularioEditarAbono.formaPago
                        }
                        onChange={
                          cambiarFormularioEditarAbono
                        }
                        disabled={
                          guardandoEdicion
                        }
                      >
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

                    {/* FECHA */}

                    <div className="comision-pago-field">

                      <label>
                        Fecha *
                      </label>

                      <input
                        type="date"
                        name="fechaPago"
                        value={
                          formularioEditarAbono.fechaPago
                        }
                        onChange={
                          cambiarFormularioEditarAbono
                        }
                        disabled={
                          guardandoEdicion
                        }
                      />

                    </div>

                    {/* REFERENCIA */}

                    <div className="comision-pago-field">

                      <label>
                        Referencia
                      </label>

                      <input
                        type="text"
                        name="referenciaPago"
                        value={
                          formularioEditarAbono.referenciaPago
                        }
                        onChange={
                          cambiarFormularioEditarAbono
                        }
                        placeholder="Ej: TRX-001"
                        disabled={
                          guardandoEdicion
                        }
                      />

                    </div>

                    {/* OBSERVACIONES */}

                    <div className="comision-pago-field comision-pago-field-full">

                      <label>
                        Observaciones
                      </label>

                      <textarea
                        name="observaciones"
                        rows="3"
                        value={
                          formularioEditarAbono.observaciones
                        }
                        onChange={
                          cambiarFormularioEditarAbono
                        }
                        placeholder="Observaciones del abono..."
                        disabled={
                          guardandoEdicion
                        }
                      />

                    </div>

                  </div>

                </div>

                <div className="comision-pago-footer">

                  <button
                    type="button"
                    className="comision-pago-cancelar"
                    onClick={
                      cerrarEditarAbono
                    }
                    disabled={
                      guardandoEdicion
                    }
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="comision-pago-guardar"
                    disabled={
                      guardandoEdicion
                    }
                  >
                    <Save
                      size={16}
                    />

                    {guardandoEdicion
                      ? "Guardando..."
                      : "Guardar cambios"}
                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

      {/* =================================================
          ELIMINAR MOVIMIENTO
      ================================================= */}

      {modalEliminarAbierto &&
        movimientoEliminar && (

          <div className="comision-modal-backdrop">

            <div className="comision-pago-modal comision-eliminar-modal">

              <div className="comision-modal-header">

                <div>

                  <span>
                    {
                      movimientoEliminar.codigo
                    }
                  </span>

                  <h2>
                    {movimientoEliminar.tipoMovimiento ===
                    "Pago"
                      ? "Eliminar pago total"
                      : "Eliminar abono"}
                  </h2>

                </div>

                <button
                  type="button"
                  className="comision-modal-close"
                  onClick={
                    cerrarEliminarMovimiento
                  }
                  disabled={
                    eliminandoMovimiento
                  }
                >
                  <X
                    size={19}
                  />
                </button>

              </div>

              <div className="comision-pago-body">

                <div className="comision-eliminar-alerta">

                  <Trash2
                    size={25}
                  />

                  <div>

                    <strong>
                      ¿Desea eliminar este movimiento?
                    </strong>

                    <p>
                      {movimientoEliminar.tipoMovimiento ===
                      "Pago"
                        ? "Al eliminar este pago total, la comisión volverá a tener saldo pendiente."
                        : "Al eliminar este abono, el valor pagado y el saldo de la comisión serán recalculados."}
                    </p>

                  </div>

                </div>

                <div className="comision-pago-resumen">

                  <div>
                    <span>
                      Egreso
                    </span>

                    <strong>
                      {
                        movimientoEliminar.codigo
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Movimiento
                    </span>

                    <strong>
                      {movimientoEliminar.tipoMovimiento ===
                      "Pago"
                        ? "Pago total"
                        : "Abono"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Valor
                    </span>

                    <strong>
                      {formatearDinero(
                        movimientoEliminar.valor
                      )}
                    </strong>
                  </div>

                </div>

              </div>

              <div className="comision-pago-footer">

                <button
                  type="button"
                  className="comision-pago-cancelar"
                  onClick={
                    cerrarEliminarMovimiento
                  }
                  disabled={
                    eliminandoMovimiento
                  }
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="comision-eliminar-confirmar"
                  onClick={
                    confirmarEliminarMovimiento
                  }
                  disabled={
                    eliminandoMovimiento
                  }
                >
                  <Trash2
                    size={16}
                  />

                  {eliminandoMovimiento
                    ? "Eliminando..."
                    : "Sí, eliminar"}
                </button>

              </div>

            </div>

          </div>

        )}

      {/* =================================================
          TOAST
      ================================================= */}

      <Toast
        visible={
          notificacion.visible
        }
        mensaje={
          notificacion.mensaje
        }
        tipo={
          notificacion.tipo
        }
        onClose={
          cerrarNotificacion
        }
      />

    </section>
  );
}
