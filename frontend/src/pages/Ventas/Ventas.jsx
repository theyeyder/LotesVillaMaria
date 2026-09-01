import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BadgeDollarSign,
  CalendarDays,
  CheckCircle2,
  Edit3,
  LandPlot,
  Plus,
  Printer,
  RefreshCw,
  Search,
  ShoppingCart,
  Trash2,
  UserRound,
  WalletCards,
} from "lucide-react";

import "./Ventas.css";

import Toast from "../../components/ui/Toast";
import VentaModal from "./VentaModal";

import {
  obtenerVentas,
  crearVenta,
  actualizarVenta,
  eliminarVenta,
} from "../../services/venta.service";

import {
  obtenerClientes,
} from "../../services/cliente.service";

import {
  obtenerVendedores,
} from "../../services/vendedor.service";

import {
  obtenerManzanas,
} from "../../services/manzana.service";

import {
  obtenerLotes,
} from "../../services/lote.service";

/* =========================================================
   FORMATEADORES
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

const formatearFecha = (
  fecha
) => {
  if (!fecha) {
    return "—";
  }

  const date = new Date(
    fecha
  );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleDateString(
    "es-CO",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "UTC",
    }
  );
};

const obtenerNombreCliente = (
  cliente
) => {
  if (!cliente) {
    return "Sin cliente";
  }

  const nombre = [
    cliente.nombres,
    cliente.apellidos,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    nombre ||
    cliente.nombre ||
    cliente.razonSocial ||
    "Cliente"
  );
};

/* =========================================================
   NOMBRE DEL VENDEDOR
========================================================= */

const obtenerNombreVendedor = (
  vendedor
) => {
  if (!vendedor) {
    return "Sin vendedor";
  }

  const nombre = [
    vendedor.nombres,
    vendedor.apellidos,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    nombre ||
    "Vendedor"
  );
};

/* =========================================================
   ESCAPAR HTML PARA IMPRESIÓN
========================================================= */

const escaparHTML = (
  valor = ""
) => {
  return String(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/* =========================================================
   COMPONENTE
========================================================= */

export default function Ventas() {
  /* =======================================================
     DATOS
  ======================================================= */

  const [
    ventas,
    setVentas,
  ] = useState([]);

  const [
    clientes,
    setClientes,
  ] = useState([]);

  const [
    vendedores,
    setVendedores,
  ] = useState([]);

  const [
    manzanas,
    setManzanas,
  ] = useState([]);

  const [
    lotes,
    setLotes,
  ] = useState([]);

  /* =======================================================
     ESTADOS
  ======================================================= */

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    modalAbierto,
    setModalAbierto,
  ] = useState(false);

  const [
    ventaEditar,
    setVentaEditar,
  ] = useState(null);

  /* =======================================================
     ELIMINAR VENTA
  ======================================================= */

  const [
    ventaParaEliminar,
    setVentaParaEliminar,
  ] = useState(null);

  const [
    eliminandoVenta,
    setEliminandoVenta,
  ] = useState(false);

  /* =======================================================
     BÚSQUEDA DE CLIENTE
  ======================================================= */

  const [
    busquedaClienteVenta,
    setBusquedaClienteVenta,
  ] = useState("");

  const [
    mostrarResultadosClientes,
    setMostrarResultadosClientes,
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

  const [
    filtroFormaPago,
    setFiltroFormaPago,
  ] = useState("");

  /* =======================================================
     PAGINACIÓN
  ======================================================= */

  const [
    paginaActual,
    setPaginaActual,
  ] = useState(1);

  const VENTAS_POR_PAGINA =
    8;

  /* =======================================================
     NOTIFICACIONES
  ======================================================= */

  const [
    notificacion,
    setNotificacion,
  ] = useState({
    visible: false,
    mensaje: "",
    tipo: "success",
  });

  const mostrarNotificacion = (
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
        (prev) => ({
          ...prev,

          visible:
            false,
        })
      );
    };

  /* =======================================================
     FORMULARIO
  ======================================================= */

  const [
    formulario,
    setFormulario,
  ] = useState({
    cliente: "",
    vendedor: "",
    lote: "",
    fechaVenta: "",
    valorVenta: "",
    cuotaInicial: "",
    formaPago: "Financiado",
    numeroCuotas: "",
    observaciones: "",
  });

  /* =======================================================
     CARGAR VENTAS
  ======================================================= */

  const cargarVentas =
    async () => {
      try {
        const datos =
          await obtenerVentas();

        setVentas(
          Array.isArray(datos)
            ? datos
            : []
        );
      } catch (error) {
        console.error(
          "Error cargando ventas:",
          error
        );

        mostrarNotificacion(
          error?.response?.data
            ?.message ||
            "No fue posible cargar las ventas.",
          "error"
        );
      }
    };

  /* =======================================================
     CARGAR CLIENTES
  ======================================================= */

  const cargarClientes =
    async () => {
      try {
        const datos =
          await obtenerClientes();

        if (
          Array.isArray(
            datos
          )
        ) {
          setClientes(
            datos
          );

          return;
        }

        setClientes(
          Array.isArray(
            datos?.clientes
          )
            ? datos.clientes
            : []
        );
      } catch (error) {
        console.error(
          "Error cargando clientes:",
          error
        );

        mostrarNotificacion(
          "No fue posible cargar los clientes.",
          "error"
        );
      }
    };

  /* =======================================================
     CARGAR VENDEDORES
  ======================================================= */

  const cargarVendedores =
    async () => {
      try {
        const datos =
          await obtenerVendedores();

        setVendedores(
          Array.isArray(
            datos
          )
            ? datos
            : []
        );
      } catch (error) {
        console.error(
          "Error cargando vendedores:",
          error
        );

        mostrarNotificacion(
          "No fue posible cargar los vendedores.",
          "error"
        );
      }
    };

  /* =======================================================
     CARGAR MANZANAS
  ======================================================= */

  const cargarManzanas =
    async () => {
      try {
        const datos =
          await obtenerManzanas();

        setManzanas(
          Array.isArray(datos)
            ? datos
            : []
        );
      } catch (error) {
        console.error(
          "Error cargando manzanas:",
          error
        );

        mostrarNotificacion(
          "No fue posible cargar las manzanas.",
          "error"
        );
      }
    };

  /* =======================================================
     CARGAR LOTES
  ======================================================= */

  const cargarLotes =
    async () => {
      try {
        const datos =
          await obtenerLotes();

        setLotes(
          Array.isArray(datos)
            ? datos
            : []
        );
      } catch (error) {
        console.error(
          "Error cargando lotes:",
          error
        );

        mostrarNotificacion(
          "No fue posible cargar los lotes.",
          "error"
        );
      }
    };

  /* =======================================================
     CARGAR TODO
  ======================================================= */

  const cargarTodo =
    async () => {
      try {
        setCargando(
          true
        );

        await Promise.all([
          cargarVentas(),
          cargarClientes(),
          cargarVendedores(),
          cargarManzanas(),
          cargarLotes(),
        ]);
      } finally {
        setCargando(
          false
        );
      }
    };

  useEffect(() => {
    cargarTodo();
  }, []);

  /* =======================================================
     FILTRAR VENTAS
  ======================================================= */

  const ventasFiltradas =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      return ventas.filter(
        (venta) => {
          if (
            filtroEstado &&
            venta.estado !==
              filtroEstado
          ) {
            return false;
          }

          if (
            filtroFormaPago &&
            venta.formaPago !==
              filtroFormaPago
          ) {
            return false;
          }

          if (!texto) {
            return true;
          }

          const cliente =
            obtenerNombreCliente(
              venta.cliente
            );

          const documento =
            venta.cliente
              ?.documento ||
            "";

          const lote =
            venta.lote;

          const manzana =
            lote?.manzana;

          const contenido = [
            venta.codigo,

            cliente,

            documento,

            venta.vendedor?.codigo,

            obtenerNombreVendedor(
              venta.vendedor
            ),

            venta.vendedor?.documento,

            lote?.codigo,

            lote?.numeroLote,

            manzana?.codigo,

            manzana?.nombre,

            venta.estado,

            venta.formaPago,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return contenido.includes(
            texto
          );
        }
      );
    }, [
      ventas,
      busqueda,
      filtroEstado,
      filtroFormaPago,
    ]);

  /* =======================================================
     BUSCAR CLIENTE NUEVA / EDITAR VENTA
  ======================================================= */

  const clientesFiltradosVenta =
    useMemo(() => {
      const texto =
        busquedaClienteVenta
          .trim()
          .toLowerCase();

      if (!texto) {
        return [];
      }

      return clientes.filter(
        (cliente) => {
          const nombreCompleto = [
            cliente.nombres,
            cliente.apellidos,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          const documento =
            String(
              cliente.documento ||
                ""
            ).toLowerCase();

          return (
            nombreCompleto.includes(
              texto
            ) ||
            documento.includes(
              texto
            )
          );
        }
      );
    }, [
      clientes,
      busquedaClienteVenta,
    ]);

  /* =======================================================
     SELECCIONAR CLIENTE
  ======================================================= */

  const seleccionarClienteVenta =
    (cliente) => {
      setFormulario(
        (prev) => ({
          ...prev,

          cliente:
            cliente._id,
        })
      );

      setBusquedaClienteVenta(
        [
          cliente.nombres,
          cliente.apellidos,
        ]
          .filter(Boolean)
          .join(" ")
      );

      setMostrarResultadosClientes(
        false
      );
    };

  /* =======================================================
     LIMPIAR CLIENTE
  ======================================================= */

  const limpiarClienteVenta =
    () => {
      setBusquedaClienteVenta(
        ""
      );

      setMostrarResultadosClientes(
        false
      );

      setFormulario(
        (prev) => ({
          ...prev,

          cliente:
            "",
        })
      );
    };

  /* =======================================================
     ESTADÍSTICAS

     Ya NO existen ventas anuladas.

     Si una venta se elimina, deja de existir
     y automáticamente desaparece de estos totales.
  ======================================================= */

  const estadisticas =
    useMemo(() => {
      return ventas.reduce(
        (
          acc,
          venta
        ) => {
          acc.total +=
            1;

          acc.valorVentas +=
            Number(
              venta.valorVenta
            ) || 0;

          acc.iniciales +=
            Number(
              venta.cuotaInicial
            ) || 0;

          acc.saldo +=
            Number(
              venta.saldoFinanciar
            ) || 0;

          if (
            venta.estado ===
            "Activa"
          ) {
            acc.activas +=
              1;
          }

          if (
            venta.estado ===
            "Pagada"
          ) {
            acc.pagadas +=
              1;
          }

          return acc;
        },
        {
          total:
            0,

          activas:
            0,

          pagadas:
            0,

          valorVentas:
            0,

          iniciales:
            0,

          saldo:
            0,
        }
      );
    }, [
      ventas,
    ]);

  /* =======================================================
     PAGINACIÓN
  ======================================================= */

  const totalPaginas =
    Math.max(
      1,
      Math.ceil(
        ventasFiltradas.length /
          VENTAS_POR_PAGINA
      )
    );

  const indiceInicial =
    (
      paginaActual -
      1
    ) *
    VENTAS_POR_PAGINA;

  const ventasPaginadas =
    ventasFiltradas.slice(
      indiceInicial,
      indiceInicial +
        VENTAS_POR_PAGINA
    );

  useEffect(() => {
    setPaginaActual(
      1
    );
  }, [
    busqueda,
    filtroEstado,
    filtroFormaPago,
  ]);

  useEffect(() => {
    if (
      paginaActual >
      totalPaginas
    ) {
      setPaginaActual(
        totalPaginas
      );
    }
  }, [
    paginaActual,
    totalPaginas,
  ]);

  /* =======================================================
     NUEVA VENTA
  ======================================================= */

  const abrirNuevaVenta =
    () => {
      const disponibles =
        lotes.filter(
          (lote) =>
            lote.estado ===
            "Disponible"
        );

      const vendedoresActivos =
        vendedores.filter(
          (vendedor) =>
            vendedor.estado ===
            "Activo"
        );

      if (
        clientes.length ===
        0
      ) {
        mostrarNotificacion(
          "Debe registrar al menos un cliente antes de crear una venta.",
          "info"
        );

        return;
      }

      if (
        vendedoresActivos.length ===
        0
      ) {
        mostrarNotificacion(
          "Debe registrar al menos un vendedor activo antes de crear una venta.",
          "info"
        );

        return;
      }

      if (
        disponibles.length ===
        0
      ) {
        mostrarNotificacion(
          "No hay lotes disponibles para vender.",
          "info"
        );

        return;
      }

      setVentaEditar(
        null
      );

      setFormulario({
        cliente: "",
        vendedor: "",
        lote: "",
        fechaVenta: "",
        valorVenta: "",
        cuotaInicial: "",
        formaPago:
          "Financiado",
        numeroCuotas: "",
        observaciones: "",
      });

      setBusquedaClienteVenta(
        ""
      );

      setMostrarResultadosClientes(
        false
      );

      setModalAbierto(
        true
      );
    };

  /* =======================================================
     EDITAR VENTA
  ======================================================= */

  const abrirEditarVenta =
    (venta) => {
      setVentaEditar(
        venta
      );

      setFormulario({
        cliente:
          venta.cliente?._id ||
          venta.cliente ||
          "",

        vendedor:
          venta.vendedor?._id ||
          venta.vendedor ||
          "",

        lote:
          venta.lote?._id ||
          venta.lote ||
          "",

        fechaVenta:
          venta.fechaVenta
            ? venta.fechaVenta.split(
                "T"
              )[0]
            : "",

        valorVenta:
          venta.valorVenta ||
          "",

        cuotaInicial:
          venta.cuotaInicial ||
          "",

        formaPago:
          venta.formaPago ||
          "Financiado",

        numeroCuotas:
          venta.numeroCuotas ||
          "",

        observaciones:
          venta.observaciones ||
          "",
      });

      const clienteActual =
        venta.cliente;

      setBusquedaClienteVenta(
        [
          clienteActual?.nombres,
          clienteActual?.apellidos,
        ]
          .filter(Boolean)
          .join(" ")
      );

      setMostrarResultadosClientes(
        false
      );

      setModalAbierto(
        true
      );
    };

  /* =======================================================
     CERRAR MODAL
  ======================================================= */

  const cerrarModal =
    () => {
      if (
        guardando
      ) {
        return;
      }

      setModalAbierto(
        false
      );

      setVentaEditar(
        null
      );

      setBusquedaClienteVenta(
        ""
      );

      setMostrarResultadosClientes(
        false
      );
    };

  /* =======================================================
     GUARDAR
  ======================================================= */

  const guardarVenta =
    async (
      datos
    ) => {
      try {
        setGuardando(
          true
        );

        let respuesta;

        const esEdicion =
          Boolean(
            ventaEditar?._id
          );

        if (
          esEdicion
        ) {
          respuesta =
            await actualizarVenta(
              ventaEditar._id,
              datos
            );
        } else {
          respuesta =
            await crearVenta(
              datos
            );
        }

        await Promise.all([
          cargarVentas(),
          cargarLotes(),
        ]);

        setModalAbierto(
          false
        );

        setVentaEditar(
          null
        );

        setBusquedaClienteVenta(
          ""
        );

        setMostrarResultadosClientes(
          false
        );

        mostrarNotificacion(
          respuesta?.message ||
            (
              esEdicion
                ? "Venta actualizada correctamente."
                : "Venta registrada correctamente."
            )
        );
      } catch (error) {
        console.error(
          "Error guardando venta:",
          error
        );

        mostrarNotificacion(
          error?.response?.data
            ?.message ||
            "No fue posible guardar la venta.",
          "error"
        );
      } finally {
        setGuardando(
          false
        );
      }
    };

  /* =======================================================
     ABRIR CONFIRMACIÓN DE ELIMINACIÓN
  ======================================================= */

  const abrirEliminarVenta =
    (venta) => {
      setVentaParaEliminar(
        venta
      );
    };

  /* =======================================================
     CERRAR CONFIRMACIÓN
  ======================================================= */

  const cerrarEliminarVenta =
    () => {
      if (
        eliminandoVenta
      ) {
        return;
      }

      setVentaParaEliminar(
        null
      );
    };

  /* =======================================================
     CONFIRMAR ELIMINACIÓN

     El backend verificará primero si existen pagos.

     Si tiene pagos:
     → NO elimina.
     → muestra que deben eliminarse primero.

     Si no tiene pagos:
     → elimina cuotas.
     → elimina venta.
     → libera lote.
  ======================================================= */

  const confirmarEliminarVenta =
    async () => {
      if (
        !ventaParaEliminar?._id
      ) {
        return;
      }

      try {
        setEliminandoVenta(
          true
        );

        const respuesta =
          await eliminarVenta(
            ventaParaEliminar._id
          );

        setVentaParaEliminar(
          null
        );

        await cargarTodo();

        mostrarNotificacion(
          respuesta?.message ||
            "Venta eliminada correctamente.",
          "success"
        );
      } catch (error) {
        console.error(
          "Error eliminando venta:",
          error
        );

        mostrarNotificacion(
          error?.response?.data
            ?.message ||
            "No fue posible eliminar la venta.",
          "error"
        );
      } finally {
        setEliminandoVenta(
          false
        );
      }
    };

  /* =======================================================
     VENTANA DE IMPRESIÓN
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
          "width=1250,height=850"
        );

      if (!ventana) {
        mostrarNotificacion(
          "El navegador bloqueó la ventana de impresión. Permita las ventanas emergentes.",
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
                padding: 28px;

                background: #f1eee6;

                color: #28352e;

                font-family:
                  Arial,
                  Helvetica,
                  sans-serif;
              }

              .acciones {
                display: flex;
                justify-content: flex-end;

                gap: 10px;

                width: 100%;
                max-width: 1180px;

                margin: 0 auto 15px;
              }

              .acciones button {
                min-height: 40px;

                padding: 0 17px;

                border-radius: 9px;

                font-size: 12px;
                font-weight: 800;

                cursor: pointer;
              }

              .cerrar {
                border: 1px solid #d6d0c5;

                background: #ffffff;

                color: #58615b;
              }

              .imprimir {
                border: 1px solid #173f2e;

                background: #173f2e;

                color: #ffffff;
              }

              .reporte {
                width: 100%;
                max-width: 1180px;

                margin: 0 auto;

                padding: 32px 35px;

                border: 1px solid #e1ddd4;
                border-radius: 14px;

                background: #ffffff;

                box-shadow:
                  0 10px 30px
                  rgba(23, 63, 46, 0.08);
              }

              .reporte-header {
                position: relative;

                margin-bottom: 24px;
                padding-bottom: 17px;

                border-bottom:
                  3px solid #173f2e;

                text-align: center;
              }

              .reporte-header::after {
                content: "";

                position: absolute;

                left: 50%;
                bottom: -3px;

                width: 150px;
                height: 3px;

                transform:
                  translateX(-50%);

                background: #c99a4b;
              }

              .reporte-header h1 {
                margin: 0;

                color: #173f2e;

                font-size: 26px;
                font-weight: 900;

                text-transform: uppercase;
              }

              .reporte-header h2 {
                margin: 5px 0 0;

                color: #99702f;

                font-size: 15px;
              }

              .resumen {
                display: grid;

                grid-template-columns:
                  repeat(
                    5,
                    minmax(0, 1fr)
                  );

                gap: 8px;

                margin-bottom: 24px;
              }

              .dato {
                display: flex;
                flex-direction: column;

                gap: 4px;

                min-width: 0;

                padding: 10px 11px;

                border:
                  1px solid #ded8cd;
                border-radius: 8px;

                background: #faf8f3;
              }

              .dato span {
                color: #7d857f;

                font-size: 8px;
                font-weight: 900;

                text-transform: uppercase;
              }

              .dato strong {
                overflow: hidden;

                color: #173f2e;

                font-size: 11px;

                text-overflow: ellipsis;
              }

              h3 {
                margin: 0 0 10px;

                padding-left: 9px;

                border-left:
                  4px solid #c99a4b;

                color: #173f2e;

                font-size: 14px;
              }

              table {
                width: 100%;

                border-collapse: collapse;
              }

              th {
                padding: 8px 6px;

                border:
                  1px solid #d7d7d7;

                background: #173f2e;

                color: #ffffff;

                font-size: 8px;
                font-weight: 900;

                text-align: center;

                text-transform: uppercase;
              }

              td {
                padding: 8px 6px;

                border:
                  1px solid #e0ddd7;

                color: #3a463f;

                font-size: 8.5px;

                text-align: center;

                vertical-align: middle;
              }

              tbody
              tr:nth-child(even) {
                background: #faf8f3;
              }

              .texto-izquierda {
                text-align: left;
              }

              .dinero {
                color: #8b6527;

                font-weight: 900;

                white-space: nowrap;
              }

              .saldo {
                color: #173f2e;

                font-weight: 900;

                white-space: nowrap;
              }

              .estado {
                font-weight: 900;
              }

              .venta-ficha {
                display: grid;

                grid-template-columns:
                  repeat(
                    3,
                    minmax(0, 1fr)
                  );

                gap: 9px;
              }

              .venta-ficha
              .dato {
                min-height: 66px;
              }

              .venta-observacion {
                grid-column: 1 / -1;
              }

              .financiacion {
                grid-column: 1 / -1;

                display: grid;

                grid-template-columns:
                  repeat(
                    3,
                    minmax(0, 1fr)
                  );

                gap: 8px;

                margin-top: 4px;
                padding: 12px;

                border:
                  1px solid #d4e0d8;
                border-radius: 10px;

                background: #f1f6f3;
              }

              @media print {

                @page {
                  size: A4 landscape;
                  margin: 9mm;
                }

                body {
                  margin: 0;
                  padding: 0;

                  background:
                    #ffffff;
                }

                .acciones {
                  display: none;
                }

                .reporte {
                  width: 100%;
                  max-width: none;

                  margin: 0;
                  padding: 0;

                  border: none;
                  border-radius: 0;

                  box-shadow: none;
                }

                .reporte-header {
                  border-bottom:
                    2px solid #000000;
                }

                .reporte-header::after {
                  display: none;
                }

                .reporte-header h1,
                .reporte-header h2,
                h3,
                .dato strong {
                  color:
                    #000000 !important;
                }

                th {
                  padding: 5px;

                  border:
                    1px solid #777;

                  background:
                    #eeeeee !important;

                  color:
                    #000000 !important;

                  font-size: 7px;

                  -webkit-print-color-adjust:
                    exact;

                  print-color-adjust:
                    exact;
                }

                td {
                  padding: 5px;

                  border:
                    1px solid #999;

                  color: #000000;

                  font-size: 7px;
                }

                tr {
                  break-inside: avoid;

                  page-break-inside:
                    avoid;
                }
              }

            </style>

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
     IMPRIMIR TODAS LAS VENTAS

     IMPORTANTE:
     Usa "ventas", no ventasPaginadas.
     Por eso trae TODO el historial.
  ======================================================= */

  const imprimirTodasLasVentas =
    () => {
      if (
        ventas.length ===
        0
      ) {
        mostrarNotificacion(
          "No hay ventas registradas para imprimir.",
          "info"
        );

        return;
      }

      const filas =
        ventas
          .map(
            (
              venta
            ) => {
              const cliente =
                venta.cliente;

              const vendedor =
                venta.vendedor;

              const lote =
                venta.lote;

              const manzana =
                lote?.manzana;

              return `
                <tr>

                  <td>
                    <strong>
                      ${escaparHTML(
                        venta.codigo ||
                        "—"
                      )}
                    </strong>
                  </td>

                  <td class="texto-izquierda">

                    <strong>
                      ${escaparHTML(
                        obtenerNombreCliente(
                          cliente
                        )
                      )}
                    </strong>

                    <br />

                    ${escaparHTML(
                      cliente?.documento ||
                      "Sin documento"
                    )}

                  </td>

                  <td class="texto-izquierda">

                    <strong>
                      ${escaparHTML(
                        vendedor?.codigo ||
                        "—"
                      )}
                    </strong>

                    <br />

                    ${escaparHTML(
                      obtenerNombreVendedor(
                        vendedor
                      )
                    )}

                  </td>

                  <td class="texto-izquierda">

                    <strong>
                      ${escaparHTML(
                        lote?.codigo ||
                        "—"
                      )}
                    </strong>

                    <br />

                    ${escaparHTML(
                      manzana?.nombre ||
                      "Sin manzana"
                    )}

                    ${
                      lote?.numeroLote
                        ? ` · Lote ${escaparHTML(
                            lote.numeroLote
                          )}`
                        : ""
                    }

                  </td>

                  <td>
                    ${escaparHTML(
                      formatearFecha(
                        venta.fechaVenta
                      )
                    )}
                  </td>

                  <td class="dinero">
                    ${escaparHTML(
                      formatearDinero(
                        venta.valorVenta
                      )
                    )}
                  </td>

                  <td class="dinero">
                    ${escaparHTML(
                      formatearDinero(
                        venta.valorComision
                      )
                    )}
                  </td>

                  <td class="dinero">
                    ${escaparHTML(
                      formatearDinero(
                        venta.cuotaInicial
                      )
                    )}
                  </td>

                  <td class="saldo">
                    ${escaparHTML(
                      formatearDinero(
                        venta.saldoFinanciar
                      )
                    )}
                  </td>

                  <td>
                    ${escaparHTML(
                      venta.formaPago ||
                      "—"
                    )}

                    ${
                      venta.formaPago ===
                      "Financiado"
                        ? `
                            <br />

                            ${escaparHTML(
                              venta.numeroCuotas ||
                              0
                            )} cuotas

                            <br />

                            ${escaparHTML(
                              formatearDinero(
                                venta.valorCuota
                              )
                            )}
                          `
                        : ""
                    }
                  </td>

                  <td class="estado">
                    ${escaparHTML(
                      venta.estado ||
                      "—"
                    )}
                  </td>

                </tr>
              `;
            }
          )
          .join("");

      const contenido = `
        <div class="reporte-header">

          <h1>
            LOTES VILLA MARÍA
          </h1>

          <h2>
            Reporte general de ventas
          </h2>

        </div>

        <div class="resumen">

          <div class="dato">
            <span>
              Total ventas
            </span>

            <strong>
              ${ventas.length}
            </strong>
          </div>

          <div class="dato">
            <span>
              Activas
            </span>

            <strong>
              ${estadisticas.activas}
            </strong>
          </div>

          <div class="dato">
            <span>
              Pagadas
            </span>

            <strong>
              ${estadisticas.pagadas}
            </strong>
          </div>

          <div class="dato">
            <span>
              Valor vendido
            </span>

            <strong>
              ${escaparHTML(
                formatearDinero(
                  estadisticas.valorVentas
                )
              )}
            </strong>
          </div>

          <div class="dato">
            <span>
              Saldo financiado
            </span>

            <strong>
              ${escaparHTML(
                formatearDinero(
                  estadisticas.saldo
                )
              )}
            </strong>
          </div>

        </div>

        <h3>
          Ventas registradas
        </h3>

        <table>

          <thead>

            <tr>

              <th>
                Venta
              </th>

              <th>
                Cliente
              </th>

              <th>
                Vendedor
              </th>

              <th>
                Lote
              </th>

              <th>
                Fecha
              </th>

              <th>
                Valor venta
              </th>

              <th>
                Comisión
              </th>

              <th>
                Inicial
              </th>

              <th>
                Saldo
              </th>

              <th>
                Pago
              </th>

              <th>
                Estado
              </th>

            </tr>

          </thead>

          <tbody>
            ${filas}
          </tbody>

        </table>
      `;

      abrirVentanaImpresion(
        "Reporte general de ventas",
        contenido
      );
    };

  /* =======================================================
     IMPRIMIR UNA SOLA VENTA
  ======================================================= */

  const imprimirVenta =
    (
      venta
    ) => {
      const cliente =
        venta.cliente;

      const vendedor =
        venta.vendedor;

      const lote =
        venta.lote;

      const manzana =
        lote?.manzana;

      const contenido = `
        <div class="reporte-header">

          <h1>
            LOTES VILLA MARÍA
          </h1>

          <h2>
            Ficha individual de venta
          </h2>

        </div>

        <h3>
          Información de la venta
        </h3>

        <div class="venta-ficha">

          <div class="dato">
            <span>
              Código de venta
            </span>

            <strong>
              ${escaparHTML(
                venta.codigo ||
                "—"
              )}
            </strong>
          </div>

          <div class="dato">
            <span>
              Fecha de venta
            </span>

            <strong>
              ${escaparHTML(
                formatearFecha(
                  venta.fechaVenta
                )
              )}
            </strong>
          </div>

          <div class="dato">
            <span>
              Estado
            </span>

            <strong>
              ${escaparHTML(
                venta.estado ||
                "—"
              )}
            </strong>
          </div>

          <div class="dato">
            <span>
              Cliente
            </span>

            <strong>
              ${escaparHTML(
                obtenerNombreCliente(
                  cliente
                )
              )}
            </strong>
          </div>

          <div class="dato">
            <span>
              Documento
            </span>

            <strong>
              ${escaparHTML(
                cliente?.documento ||
                "—"
              )}
            </strong>
          </div>

          <div class="dato">
            <span>
              Vendedor
            </span>

            <strong>
              ${escaparHTML(
                vendedor
                  ? `${vendedor.codigo || ""} - ${obtenerNombreVendedor(
                      vendedor
                    )}`
                  : "Sin vendedor"
              )}
            </strong>
          </div>

          <div class="dato">
            <span>
              Lote
            </span>

            <strong>
              ${escaparHTML(
                lote?.codigo ||
                "—"
              )}

              ${
                lote?.numeroLote
                  ? ` · Lote ${escaparHTML(
                      lote.numeroLote
                    )}`
                  : ""
              }
            </strong>
          </div>

          <div class="dato">
            <span>
              Manzana
            </span>

            <strong>
              ${escaparHTML(
                manzana?.nombre ||
                "—"
              )}
            </strong>
          </div>

          <div class="dato">
            <span>
              Código manzana
            </span>

            <strong>
              ${escaparHTML(
                manzana?.codigo ||
                "—"
              )}
            </strong>
          </div>

          <div class="dato">
            <span>
              Forma de pago
            </span>

            <strong>
              ${escaparHTML(
                venta.formaPago ||
                "—"
              )}
            </strong>
          </div>

          <div class="dato">
            <span>
              Valor de venta
            </span>

            <strong>
              ${escaparHTML(
                formatearDinero(
                  venta.valorVenta
                )
              )}
            </strong>
          </div>

          <div class="dato">
            <span>
              Cuota inicial
            </span>

            <strong>
              ${escaparHTML(
                formatearDinero(
                  venta.cuotaInicial
                )
              )}
            </strong>
          </div>

          <div class="dato">
            <span>
              Saldo
            </span>

            <strong>
              ${escaparHTML(
                formatearDinero(
                  venta.saldoFinanciar
                )
              )}
            </strong>
          </div>

          ${
            venta.formaPago ===
            "Financiado"
              ? `
                  <div class="financiacion">

                    <div class="dato">
                      <span>
                        Número de cuotas
                      </span>

                      <strong>
                        ${escaparHTML(
                          venta.numeroCuotas ||
                          0
                        )}
                      </strong>
                    </div>

                    <div class="dato">
                      <span>
                        Valor por cuota
                      </span>

                      <strong>
                        ${escaparHTML(
                          formatearDinero(
                            venta.valorCuota
                          )
                        )}
                      </strong>
                    </div>

                    <div class="dato">
                      <span>
                        Saldo financiado
                      </span>

                      <strong>
                        ${escaparHTML(
                          formatearDinero(
                            venta.saldoFinanciar
                          )
                        )}
                      </strong>
                    </div>

                  </div>
                `
              : ""
          }

          <div class="dato venta-observacion">

            <span>
              Observaciones
            </span>

            <strong>
              ${escaparHTML(
                venta.observaciones ||
                "Sin observaciones"
              )}
            </strong>

          </div>

        </div>
      `;

      abrirVentanaImpresion(
        `Venta ${venta.codigo}`,
        contenido
      );
    };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <section className="ventas-page">

      {/* =================================================
          CABECERA
      ================================================= */}

      <div className="ventas-header">
        <div>
          <span className="ventas-kicker">
            Gestión comercial
          </span>

          <h1>
            Ventas de lotes
          </h1>

          <p>
            Registra compradores,
            lotes vendidos, valores,
            cuota inicial y
            financiación.
          </p>
        </div>

        <div className="ventas-header-actions">

          <button
            type="button"
            className="ventas-refresh"
            onClick={
              cargarTodo
            }
            title="Actualizar información"
          >
            <RefreshCw
              size={18}
              className={
                cargando
                  ? "ventas-spin"
                  : ""
              }
            />

            Actualizar
          </button>

          <button
            type="button"
            className="ventas-print-button"
            onClick={
              imprimirTodasLasVentas
            }
          >
            <Printer
              size={18}
            />

            Imprimir ventas
          </button>

          <button
            type="button"
            className="ventas-new-button"
            onClick={
              abrirNuevaVenta
            }
          >
            <Plus
              size={19}
            />

            Nueva venta
          </button>

        </div>
      </div>

      {/* =================================================
          ESTADÍSTICAS
      ================================================= */}

      <div className="ventas-stats">

        <article className="ventas-stat-card">
          <div className="ventas-stat-icon">
            <ShoppingCart
              size={20}
            />
          </div>

          <div>
            <span>
              Total ventas
            </span>

            <strong>
              {
                estadisticas.total
              }
            </strong>
          </div>
        </article>

        <article className="ventas-stat-card activa">
          <div className="ventas-stat-icon">
            <WalletCards
              size={20}
            />
          </div>

          <div>
            <span>
              Activas
            </span>

            <strong>
              {
                estadisticas.activas
              }
            </strong>
          </div>
        </article>

        <article className="ventas-stat-card pagada">
          <div className="ventas-stat-icon">
            <CheckCircle2
              size={20}
            />
          </div>

          <div>
            <span>
              Pagadas
            </span>

            <strong>
              {
                estadisticas.pagadas
              }
            </strong>
          </div>
        </article>

        <article className="ventas-stat-card valor">
          <div className="ventas-stat-icon">
            $
          </div>

          <div>
            <span>
              Valor vendido
            </span>

            <strong>
              {formatearDinero(
                estadisticas.valorVentas
              )}
            </strong>
          </div>
        </article>

        <article className="ventas-stat-card saldo">
          <div className="ventas-stat-icon">
            $
          </div>

          <div>
            <span>
              Saldo financiado
            </span>

            <strong>
              {formatearDinero(
                estadisticas.saldo
              )}
            </strong>
          </div>
        </article>

      </div>

      {/* =================================================
          PANEL
      ================================================= */}

      <div className="ventas-panel">

        {/* =============================================
            FILTROS
        ============================================= */}

        <div className="ventas-toolbar">

          <div className="ventas-search">
            <Search
              size={18}
            />

            <input
              type="text"
              value={
                busqueda
              }
              onChange={(e) =>
                setBusqueda(
                  e.target.value
                )
              }
              placeholder="Buscar por venta, cliente, vendedor, documento, lote o manzana..."
            />
          </div>

          <div className="ventas-filters">

            <select
              value={
                filtroEstado
              }
              onChange={(e) =>
                setFiltroEstado(
                  e.target.value
                )
              }
            >
              <option value="">
                Todos los estados
              </option>

              <option value="Activa">
                Activa
              </option>

              <option value="Pagada">
                Pagada
              </option>
            </select>

            <select
              value={
                filtroFormaPago
              }
              onChange={(e) =>
                setFiltroFormaPago(
                  e.target.value
                )
              }
            >
              <option value="">
                Todas las formas
              </option>

              <option value="Contado">
                Contado
              </option>

              <option value="Financiado">
                Financiado
              </option>
            </select>

          </div>
        </div>

        {/* =================================================
            TABLA
        ================================================= */}

        <div className="ventas-table-wrapper">

          <table className="ventas-table">

            <thead>
              <tr>
                <th>
                  Venta
                </th>

                <th>
                  Cliente
                </th>

                <th>
                  Vendedor
                </th>

                <th>
                  Lote
                </th>

                <th>
                  Fecha
                </th>

                <th>
                  Valor venta
                </th>

                <th>
                  Comisión
                </th>

                <th>
                  Inicial
                </th>

                <th>
                  Saldo
                </th>

                <th>
                  Pago
                </th>

                <th>
                  Estado
                </th>

                <th className="ventas-th-actions">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>

              {cargando ? (
                <tr>
                  <td
                    colSpan="12"
                    className="ventas-empty"
                  >
                    <RefreshCw
                      size={27}
                      className="ventas-spin"
                    />

                    <strong>
                      Cargando ventas...
                    </strong>
                  </td>
                </tr>
              ) : ventasPaginadas.length ===
                0 ? (
                <tr>
                  <td
                    colSpan="12"
                    className="ventas-empty"
                  >
                    <ShoppingCart
                      size={38}
                    />

                    <strong>
                      No hay ventas
                    </strong>

                    <span>
                      No existen registros
                      para los filtros
                      seleccionados.
                    </span>
                  </td>
                </tr>
              ) : (
                ventasPaginadas.map(
                  (venta) => {
                    const cliente =
                      venta.cliente;

                    const vendedor =
                      venta.vendedor;

                    const lote =
                      venta.lote;

                    const manzana =
                      lote?.manzana;

                    return (
                      <tr
                        key={
                          venta._id
                        }
                      >

                        {/* VENTA */}

                        <td>
                          <div className="venta-code-cell">

                            <div className="venta-code-icon">
                              <ShoppingCart
                                size={17}
                              />
                            </div>

                            <div>
                              <strong>
                                {
                                  venta.codigo
                                }
                              </strong>

                              <span>
                                Venta
                              </span>
                            </div>

                          </div>
                        </td>

                        {/* CLIENTE */}

                        <td>
                          <div className="venta-cliente-cell">

                            <UserRound
                              size={16}
                            />

                            <div>
                              <strong>
                                {obtenerNombreCliente(
                                  cliente
                                )}
                              </strong>

                              <span>
                                {cliente?.documento ||
                                  "Sin documento"}
                              </span>
                            </div>

                          </div>
                        </td>

                        {/* VENDEDOR */}

                        <td>
                          <div className="venta-vendedor-cell">

                            <UserRound
                              size={16}
                            />

                            <div>

                              <strong>
                                {obtenerNombreVendedor(
                                  vendedor
                                )}
                              </strong>

                              <span>
                                {vendedor?.codigo ||
                                  "Venta antigua"}
                              </span>

                            </div>

                          </div>
                        </td>

                        {/* LOTE */}

                        <td>
                          <div className="venta-lote-cell">

                            <LandPlot
                              size={16}
                            />

                            <div>
                              <strong>
                                {lote?.codigo ||
                                  "—"}
                              </strong>

                              <span>
                                {manzana?.nombre ||
                                  "Sin manzana"}

                                {lote?.numeroLote
                                  ? ` · Lote ${lote.numeroLote}`
                                  : ""}
                              </span>
                            </div>

                          </div>
                        </td>

                        {/* FECHA */}

                        <td>
                          <div className="venta-fecha-cell">

                            <CalendarDays
                              size={15}
                            />

                            <span>
                              {formatearFecha(
                                venta.fechaVenta
                              )}
                            </span>

                          </div>
                        </td>

                        {/* VALOR */}

                        <td>
                          <strong className="venta-money">
                            {formatearDinero(
                              venta.valorVenta
                            )}
                          </strong>
                        </td>

                        {/* COMISIÓN */}

                        <td>
                          <div className="venta-comision-cell">

                            <BadgeDollarSign
                              size={15}
                            />

                            <strong>
                              {formatearDinero(
                                venta.valorComision
                              )}
                            </strong>

                          </div>
                        </td>

                        {/* INICIAL */}

                        <td>
                          <span className="venta-money-secondary">
                            {formatearDinero(
                              venta.cuotaInicial
                            )}
                          </span>
                        </td>

                        {/* SALDO */}

                        <td>
                          <strong
                            className={`venta-saldo ${(
                              Number(
                                venta.saldoFinanciar
                              ) === 0
                                ? "venta-saldo-cero"
                                : ""
                            )}`}
                          >
                            {formatearDinero(
                              venta.saldoFinanciar
                            )}
                          </strong>
                        </td>

                        {/* FORMA DE PAGO */}

                        <td>
                          <div className="venta-pago-cell">

                            <strong>
                              {
                                venta.formaPago
                              }
                            </strong>

                            {venta.formaPago ===
                              "Financiado" && (
                              <span>
                                {
                                  venta.numeroCuotas
                                }{" "}
                                cuotas ·{" "}
                                {formatearDinero(
                                  venta.valorCuota
                                )}
                              </span>
                            )}

                          </div>
                        </td>

                        {/* ESTADO */}

                        <td>
                          <span
                            className={`venta-status venta-status-${String(
                              venta.estado
                            ).toLowerCase()}`}
                          >
                            {
                              venta.estado
                            }
                          </span>
                        </td>

                        {/* ACCIONES */}

                        <td>
                          <div className="ventas-actions">

                            <button
                              type="button"
                              className="print"
                              title={`Imprimir ${venta.codigo}`}
                              onClick={() =>
                                imprimirVenta(
                                  venta
                                )
                              }
                            >
                              <Printer
                                size={16}
                              />
                            </button>

                            <button
                              type="button"
                              className="edit"
                              title="Editar venta"
                              onClick={() =>
                                abrirEditarVenta(
                                  venta
                                )
                              }
                            >
                              <Edit3
                                size={16}
                              />
                            </button>

                            <button
                              type="button"
                              className="delete"
                              title="Eliminar venta"
                              onClick={() =>
                                abrirEliminarVenta(
                                  venta
                                )
                              }
                            >
                              <Trash2
                                size={16}
                              />
                            </button>

                          </div>
                        </td>

                      </tr>
                    );
                  }
                )
              )}

            </tbody>
          </table>
        </div>

        {/* =================================================
            PIE / PAGINACIÓN
        ================================================= */}

        <div className="ventas-table-footer">

          <div>
            Mostrando{" "}
            <strong>
              {
                ventasFiltradas.length
              }
            </strong>{" "}
            de{" "}
            <strong>
              {
                ventas.length
              }
            </strong>{" "}
            ventas
          </div>

          <div className="ventas-pagination">

            <button
              type="button"
              disabled={
                paginaActual ===
                1
              }
              onClick={() =>
                setPaginaActual(
                  (pagina) =>
                    Math.max(
                      1,
                      pagina - 1
                    )
                )
              }
            >
              Anterior
            </button>

            <span>
              Página{" "}
              <strong>
                {
                  paginaActual
                }
              </strong>{" "}
              de{" "}
              <strong>
                {
                  totalPaginas
                }
              </strong>
            </span>

            <button
              type="button"
              disabled={
                paginaActual ===
                totalPaginas
              }
              onClick={() =>
                setPaginaActual(
                  (pagina) =>
                    Math.min(
                      totalPaginas,
                      pagina + 1
                    )
                )
              }
            >
              Siguiente
            </button>

          </div>
        </div>
      </div>

      {/* =================================================
          MODAL NUEVA / EDITAR VENTA
      ================================================= */}

      <VentaModal
        abierto={
          modalAbierto
        }
        onCerrar={
          cerrarModal
        }
        onGuardar={
          guardarVenta
        }
        ventaEditar={
          ventaEditar
        }
        guardando={
          guardando
        }
        clientes={
          clientes
        }
        vendedores={
          vendedores
        }
        manzanas={
          manzanas
        }
        lotes={
          lotes
        }
        formulario={
          formulario
        }
        setFormulario={
          setFormulario
        }
        busquedaClienteVenta={
          busquedaClienteVenta
        }
        setBusquedaClienteVenta={
          setBusquedaClienteVenta
        }
        mostrarResultadosClientes={
          mostrarResultadosClientes
        }
        setMostrarResultadosClientes={
          setMostrarResultadosClientes
        }
        clientesFiltradosVenta={
          clientesFiltradosVenta
        }
        seleccionarClienteVenta={
          seleccionarClienteVenta
        }
        limpiarClienteVenta={
          limpiarClienteVenta
        }
      />

      {/* =====================================================
          MODAL ELIMINAR VENTA
      ===================================================== */}

      {ventaParaEliminar && (
        <div
          className="venta-eliminar-overlay"
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              cerrarEliminarVenta();
            }
          }}
        >
          <div className="venta-eliminar-modal">

            {/* CABECERA */}

            <div className="venta-eliminar-header">

              <div className="venta-eliminar-icon">
                <Trash2
                  size={20}
                />
              </div>

              <div>
                <span>
                  ELIMINAR VENTA
                </span>

                <h3>
                  ¿Desea eliminar esta venta?
                </h3>
              </div>

              <button
                type="button"
                className="venta-eliminar-close"
                onClick={
                  cerrarEliminarVenta
                }
                disabled={
                  eliminandoVenta
                }
              >
                ×
              </button>

            </div>

            {/* ADVERTENCIA */}

            <div className="venta-eliminar-warning">
              Esta acción eliminará definitivamente la venta y sus cuotas.
              El lote volverá a quedar disponible.
            </div>

            {/* INFORMACIÓN */}

            <div className="venta-eliminar-info">

              <div>
                <span>
                  Venta
                </span>

                <strong>
                  {ventaParaEliminar.codigo ||
                    "—"}
                </strong>
              </div>

              <div>
                <span>
                  Cliente
                </span>

                <strong>
                  {obtenerNombreCliente(
                    ventaParaEliminar.cliente
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Lote
                </span>

                <strong>
                  {ventaParaEliminar.lote?.codigo ||
                    "—"}
                </strong>
              </div>

            </div>

            {/* IMPORTANTE */}

            <div className="venta-eliminar-after">

              <strong>
                Importante:
              </strong>

              <span>
                • La venta será eliminada definitivamente.
              </span>

              <span>
                • Sus cuotas serán eliminadas.
              </span>

              <span>
                • El lote volverá a estar disponible.
              </span>

              <span>
                • Si existen pagos registrados, el sistema no permitirá eliminar la venta.
              </span>

              <span>
                • En ese caso primero debe eliminar los pagos desde el módulo Pagos.
              </span>

            </div>

            {/* BOTONES */}

            <div className="venta-eliminar-actions">

              <button
                type="button"
                className="venta-eliminar-cancel"
                onClick={
                  cerrarEliminarVenta
                }
                disabled={
                  eliminandoVenta
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className="venta-eliminar-confirm"
                onClick={
                  confirmarEliminarVenta
                }
                disabled={
                  eliminandoVenta
                }
              >
                {eliminandoVenta
                  ? "Eliminando..."
                  : "Eliminar venta"}
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