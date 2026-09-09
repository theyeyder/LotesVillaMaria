import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Users,
  UserCheck,
  UserX,
  RefreshCw,
  Phone,
  MapPin,
  Printer,
} from "lucide-react";

import ClienteModal from "./ClienteModal";
import Toast from "../../components/ui/Toast";

import "./Clientes.css";

import {
  obtenerClientes,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
} from "../../services/cliente.service";

/* =========================================================
   HELPERS IMPRESIÓN
========================================================= */

const escaparHTML = (
  valor
) => {
  return String(
    valor ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
};

const textoImpresion = (
  valor
) => {
  const texto =
    String(
      valor ?? ""
    ).trim();

  return texto
    ? escaparHTML(
        texto
      )
    : "—";
};

const formatearFecha = (
  valor
) => {
  if (!valor) {
    return "—";
  }

  const fecha =
    new Date(valor);

  if (
    Number.isNaN(
      fecha.getTime()
    )
  ) {
    return "—";
  }

  return fecha.toLocaleDateString(
    "es-CO",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );
};

/* =========================================================
   CLIENTES
========================================================= */

export default function Clientes() {
  const [
    clientes,
    setClientes,
  ] = useState([]);

  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  const [
    filtroEstado,
    setFiltroEstado,
  ] = useState("");

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    modalAbierto,
    setModalAbierto,
  ] = useState(false);

  const [
    clienteEditar,
    setClienteEditar,
  ] = useState(null);

  const [
    notificacion,
    setNotificacion,
  ] = useState({
    visible: false,
    mensaje: "",
    tipo: "success",
  });

  /* =======================================================
     NOTIFICACIONES
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
  };

  const cerrarNotificacion =
    () => {
      setNotificacion(
        (prev) => ({
          ...prev,
          visible: false,
        })
      );
    };

  /* =======================================================
     CARGAR CLIENTES
  ======================================================= */

  const cargarClientes =
    async () => {
      try {
        setCargando(
          true
        );

        setError(
          ""
        );

        const datos =
          await obtenerClientes();

        setClientes(
          Array.isArray(
            datos
          )
            ? datos
            : []
        );
      } catch (
        error
      ) {
        console.error(
          "Error cargando clientes:",
          error
        );

        setError(
          error?.response
            ?.data
            ?.message ||
            "No fue posible cargar los clientes."
        );
      } finally {
        setCargando(
          false
        );
      }
    };

  useEffect(
    () => {
      cargarClientes();
    },
    []
  );

  /* =======================================================
     FILTROS
  ======================================================= */

  const clientesFiltrados =
    useMemo(
      () => {
        const texto =
          busqueda
            .trim()
            .toLowerCase();

        return clientes.filter(
          (cliente) => {
            const coincideEstado =
              !filtroEstado ||
              cliente.estado ===
                filtroEstado;

            if (
              !coincideEstado
            ) {
              return false;
            }

            if (!texto) {
              return true;
            }

            const nombreCompleto =
              `${cliente.nombres || ""} ${cliente.apellidos || ""}`
                .toLowerCase();

            const documento =
              String(
                cliente.documento ||
                  ""
              ).toLowerCase();

            const telefono =
              String(
                cliente.telefono ||
                  ""
              ).toLowerCase();

            const correo =
              String(
                cliente.correo ||
                  ""
              ).toLowerCase();

            const ciudad =
              String(
                cliente.ciudad ||
                  ""
              ).toLowerCase();

            return (
              nombreCompleto.includes(
                texto
              ) ||
              documento.includes(
                texto
              ) ||
              telefono.includes(
                texto
              ) ||
              correo.includes(
                texto
              ) ||
              ciudad.includes(
                texto
              )
            );
          }
        );
      },
      [
        clientes,
        busqueda,
        filtroEstado,
      ]
    );

  /* =======================================================
     TOTALES
  ======================================================= */

  const totalClientes =
    clientes.length;

  const clientesActivos =
    clientes.filter(
      (cliente) =>
        cliente.estado ===
        "Activo"
    ).length;

  const clientesInactivos =
    clientes.filter(
      (cliente) =>
        cliente.estado ===
        "Inactivo"
    ).length;

  /* =======================================================
     NUEVO CLIENTE
  ======================================================= */

  const abrirNuevoCliente =
    () => {
      setClienteEditar(
        null
      );

      setModalAbierto(
        true
      );
    };

  /* =======================================================
     EDITAR
  ======================================================= */

  const abrirEditarCliente =
    (
      cliente
    ) => {
      setClienteEditar(
        cliente
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

      setClienteEditar(
        null
      );
    };

  /* =======================================================
     GUARDAR
  ======================================================= */

  const guardarCliente =
    async (
      datos
    ) => {
      try {
        setGuardando(
          true
        );

        if (
          clienteEditar?._id
        ) {
          const respuesta =
            await actualizarCliente(
              clienteEditar._id,
              datos
            );

          mostrarNotificacion(
            respuesta?.message ||
              "Cliente actualizado correctamente",
            "success"
          );
        } else {
          const respuesta =
            await crearCliente(
              datos
            );

          mostrarNotificacion(
            respuesta?.message ||
              "Cliente guardado correctamente",
            "success"
          );
        }

        await cargarClientes();

        setModalAbierto(
          false
        );

        setClienteEditar(
          null
        );
      } catch (
        error
      ) {
        console.error(
          "Error guardando cliente:",
          error
        );

        mostrarNotificacion(
          error?.response
            ?.data
            ?.message ||
            "No fue posible guardar el cliente.",
          "error"
        );
      } finally {
        setGuardando(
          false
        );
      }
    };

  /* =======================================================
     ELIMINAR
  ======================================================= */

  const handleEliminar =
    async (
      cliente
    ) => {
      const nombre =
        `${cliente.nombres || ""} ${cliente.apellidos || ""}`
          .trim();

      const confirmar =
        window.confirm(
          `¿Está seguro de eliminar al cliente ${nombre}?`
        );

      if (
        !confirmar
      ) {
        return;
      }

      try {
        const respuesta =
          await eliminarCliente(
            cliente._id
          );

        setClientes(
          (actuales) =>
            actuales.filter(
              (item) =>
                item._id !==
                cliente._id
            )
        );

        mostrarNotificacion(
          respuesta?.message ||
            "Cliente eliminado correctamente",
          "success"
        );
      } catch (
        error
      ) {
        console.error(
          "Error eliminando cliente:",
          error
        );

        mostrarNotificacion(
          error?.response
            ?.data
            ?.message ||
            "No fue posible eliminar el cliente.",
          "error"
        );
      }
    };

  /* =======================================================
     IMPRIMIR TODOS LOS CLIENTES
  ======================================================= */

  const imprimirTodosClientes = () => {
    const ventana = window.open(
      "",
      "_blank",
      "width=1200,height=800,scrollbars=yes,resizable=yes"
    );

    if (!ventana) {
      mostrarNotificacion(
        "El navegador bloqueó la ventana de impresión.",
        "error"
      );

      return;
    }

    const estilosImpresion =
      `${window.location.origin}/styles/Clientes-impresion.css`;

    const filas = clientes
      .map((cliente, index) => {
        const nombreCompleto =
          `${cliente.nombres || ""} ${cliente.apellidos || ""}`.trim();

        return `
          <tr>
            <td>${index + 1}</td>

            <td>
              ${textoImpresion(nombreCompleto)}
            </td>

            <td>
              ${textoImpresion(cliente.tipoDocumento)}
            </td>

            <td>
              ${textoImpresion(cliente.documento)}
            </td>

            <td>
              ${textoImpresion(cliente.telefono)}
            </td>

            <td>
              ${textoImpresion(cliente.correo)}
            </td>

            <td>
              ${textoImpresion(cliente.ciudad)}
            </td>

            <td>
              ${textoImpresion(cliente.direccion)}
            </td>

            <td>
              ${textoImpresion(cliente.estado)}
            </td>
          </tr>
        `;
      })
      .join("");

    ventana.document.open();

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
            Listado general de clientes
          </title>

          <link
            rel="stylesheet"
            href="${estilosImpresion}"
          />

        </head>

        <body>

          <main class="clientes-impresion-pagina">

            <header class="clientes-impresion-cabecera">

              <div>

                <div class="clientes-impresion-marca">
                  Lotes Villa María
                </div>

                <h1>
                  Listado general de clientes
                </h1>

                <p>
                  Registro completo de clientes
                </p>

              </div>

              <div class="clientes-impresion-total">
                Total clientes: ${clientes.length}
              </div>

            </header>

            <div class="clientes-impresion-tabla-wrapper">

              <table class="clientes-impresion-tabla">

                <thead>

                  <tr>
                    <th>#</th>
                    <th>Cliente</th>
                    <th>Tipo</th>
                    <th>Documento</th>
                    <th>Teléfono</th>
                    <th>Correo</th>
                    <th>Ciudad</th>
                    <th>Dirección</th>
                    <th>Estado</th>
                  </tr>

                </thead>

                <tbody>

                  ${
                    filas ||
                    `
                      <tr>
                        <td
                          colspan="9"
                          class="clientes-impresion-vacio"
                        >
                          No hay clientes registrados.
                        </td>
                      </tr>
                    `
                  }

                </tbody>

              </table>

            </div>

            <footer class="clientes-impresion-pie">

              <span>
                Lotes Villa María
              </span>

              <span>
                Total registros: ${clientes.length}
              </span>

            </footer>

          </main>

          <div class="clientes-impresion-acciones">

            <button
              type="button"
              class="clientes-impresion-cerrar"
              onclick="window.close()"
            >
              Cerrar
            </button>

            <button
              type="button"
              class="clientes-impresion-imprimir"
              onclick="window.print()"
            >
              Imprimir
            </button>

          </div>

        </body>

      </html>
    `);

    ventana.document.close();
    ventana.focus();
  };

  /* =======================================================
     IMPRIMIR CLIENTE INDIVIDUAL
  ======================================================= */

  const imprimirCliente = (cliente) => {
    const ventana = window.open(
      "",
      "_blank",
      "width=950,height=760,scrollbars=yes,resizable=yes"
    );

    if (!ventana) {
      mostrarNotificacion(
        "El navegador bloqueó la ventana de impresión.",
        "error"
      );

      return;
    }

    const estilosImpresion =
      `${window.location.origin}/styles/Clientes-impresion.css`;

    const nombreCompleto =
      `${cliente.nombres || ""} ${cliente.apellidos || ""}`.trim();

    const fechaRegistro =
      cliente.createdAt
        ? formatearFecha(cliente.createdAt)
        : "—";

    const estadoClase =
      cliente.estado === "Activo"
        ? "activo"
        : "inactivo";

    ventana.document.open();

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
            Cliente - ${textoImpresion(nombreCompleto)}
          </title>

          <link
            rel="stylesheet"
            href="${estilosImpresion}"
          />

        </head>

        <body>

          <main class="clientes-impresion-pagina">

            <header class="clientes-impresion-cabecera">

              <div>

                <div class="clientes-impresion-marca">
                  Lotes Villa María
                </div>

                <h1>
                  Datos del cliente
                </h1>

                <p>
                  Información registrada del cliente
                </p>

              </div>

              <span
                class="clientes-impresion-estado ${estadoClase}"
              >
                ${textoImpresion(cliente.estado)}
              </span>

            </header>

            <!-- ============================================
                 INFORMACIÓN PERSONAL
            ============================================= -->

            <section class="clientes-impresion-seccion">

              <h2 class="clientes-impresion-seccion-titulo">
                Información personal
              </h2>

              <div class="clientes-impresion-grid">

                <div class="clientes-impresion-campo">

                  <span>
                    Nombres
                  </span>

                  <strong>
                    ${textoImpresion(cliente.nombres)}
                  </strong>

                </div>

                <div class="clientes-impresion-campo">

                  <span>
                    Apellidos
                  </span>

                  <strong>
                    ${textoImpresion(cliente.apellidos)}
                  </strong>

                </div>

                <div class="clientes-impresion-campo">

                  <span>
                    Tipo de documento
                  </span>

                  <strong>
                    ${textoImpresion(cliente.tipoDocumento)}
                  </strong>

                </div>

                <div class="clientes-impresion-campo">

                  <span>
                    Número de documento
                  </span>

                  <strong>
                    ${textoImpresion(cliente.documento)}
                  </strong>

                </div>

              </div>

            </section>

            <!-- ============================================
                 INFORMACIÓN DE CONTACTO
            ============================================= -->

            <section class="clientes-impresion-seccion">

              <h2 class="clientes-impresion-seccion-titulo">
                Información de contacto
              </h2>

              <div class="clientes-impresion-grid">

                <div class="clientes-impresion-campo">

                  <span>
                    Teléfono
                  </span>

                  <strong>
                    ${textoImpresion(cliente.telefono)}
                  </strong>

                </div>

                <div class="clientes-impresion-campo">

                  <span>
                    Correo
                  </span>

                  <strong>
                    ${textoImpresion(cliente.correo)}
                  </strong>

                </div>

                <div class="clientes-impresion-campo">

                  <span>
                    Ciudad
                  </span>

                  <strong>
                    ${textoImpresion(cliente.ciudad)}
                  </strong>

                </div>

                <div class="clientes-impresion-campo">

                  <span>
                    Dirección
                  </span>

                  <strong>
                    ${textoImpresion(cliente.direccion)}
                  </strong>

                </div>

              </div>

            </section>

            <!-- ============================================
                 INFORMACIÓN ADICIONAL
            ============================================= -->

            <section class="clientes-impresion-seccion">

              <h2 class="clientes-impresion-seccion-titulo">
                Información adicional
              </h2>

              <div class="clientes-impresion-grid">

                <div class="clientes-impresion-campo">

                  <span>
                    Estado
                  </span>

                  <strong>
                    ${textoImpresion(cliente.estado)}
                  </strong>

                </div>

                <div class="clientes-impresion-campo">

                  <span>
                    Fecha de registro
                  </span>

                  <strong>
                    ${fechaRegistro}
                  </strong>

                </div>

                <div
                  class="
                    clientes-impresion-campo
                    clientes-impresion-observaciones
                    full
                  "
                >

                  <span>
                    Observaciones
                  </span>

                  <strong>
                    ${textoImpresion(cliente.observaciones)}
                  </strong>

                </div>

              </div>

            </section>

            <!-- ============================================
                 PIE
            ============================================= -->

            <footer class="clientes-impresion-pie">

              <span>
                Cliente:
                ${textoImpresion(nombreCompleto)}
              </span>

              <span>
                Documento:
                ${textoImpresion(cliente.documento)}
              </span>

            </footer>

          </main>

          <!-- ==============================================
               ACCIONES
          =============================================== -->

          <div class="clientes-impresion-acciones">

            <button
              type="button"
              class="clientes-impresion-cerrar"
              onclick="window.close()"
            >
              Cerrar
            </button>

            <button
              type="button"
              class="clientes-impresion-imprimir"
              onclick="window.print()"
            >
              Imprimir
            </button>

          </div>

        </body>

      </html>
    `);

    ventana.document.close();

    ventana.focus();
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <section className="clientes-page">

      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="clientes-header">

        <div>

          <span className="clientes-kicker">
            Gestión comercial
          </span>

          <h1>
            Clientes
          </h1>

          <p>
            Administra los compradores y clientes de
            Lotes Villa María.
          </p>

        </div>

        <button
          type="button"
          className="clientes-new-button"
          onClick={
            abrirNuevoCliente
          }
        >
          <Plus
            size={19}
          />

          Nuevo cliente
        </button>

      </div>

      {/* ===================================================
          ESTADÍSTICAS
      =================================================== */}

      <div className="clientes-stats">

        <article className="cliente-stat-card">

          <div className="cliente-stat-icon">
            <Users
              size={22}
            />
          </div>

          <div>
            <span>
              Total clientes
            </span>

            <strong>
              {totalClientes}
            </strong>
          </div>

        </article>

        <article className="cliente-stat-card">

          <div className="cliente-stat-icon">
            <UserCheck
              size={22}
            />
          </div>

          <div>
            <span>
              Activos
            </span>

            <strong>
              {clientesActivos}
            </strong>
          </div>

        </article>

        <article className="cliente-stat-card">

          <div className="cliente-stat-icon">
            <UserX
              size={22}
            />
          </div>

          <div>
            <span>
              Inactivos
            </span>

            <strong>
              {clientesInactivos}
            </strong>
          </div>

        </article>

      </div>

      {/* ===================================================
          PANEL
      =================================================== */}

      <div className="clientes-panel">

        <div className="clientes-toolbar">

          <div className="clientes-search">

            <Search
              size={19}
            />

            <input
              type="text"
              value={
                busqueda
              }
              onChange={(
                e
              ) =>
                setBusqueda(
                  e.target.value
                )
              }
              placeholder="Buscar por nombre, documento, teléfono, correo o ciudad..."
            />

          </div>

          <div className="clientes-toolbar-actions">

            <button
              type="button"
              className="clientes-print-button"
              onClick={imprimirTodosClientes}
              title="Imprimir todos los clientes"
            >
              <Printer size={18} />
              Imprimir clientes
            </button>

            <select
              value={
                filtroEstado
              }
              onChange={(
                e
              ) =>
                setFiltroEstado(
                  e.target.value
                )
              }
              className="clientes-filter"
            >

              <option value="">
                Todos los estados
              </option>

              <option value="Activo">
                Activos
              </option>

              <option value="Inactivo">
                Inactivos
              </option>

            </select>

            <button
              type="button"
              className="clientes-refresh-button"
              onClick={
                cargarClientes
              }
              title="Actualizar clientes"
            >
              <RefreshCw
                size={18}
                className={
                  cargando
                    ? "clientes-spin"
                    : ""
                }
              />
            </button>

          </div>

        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="clientes-error">

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={
                cargarClientes
              }
            >
              Reintentar
            </button>

          </div>
        )}

        {/* =================================================
            TABLA
        ================================================= */}

        <div className="clientes-table-wrapper">

          <table className="clientes-table">

            <thead>

              <tr>
                <th>
                  Cliente
                </th>

                <th>
                  Documento
                </th>

                <th>
                  Contacto
                </th>

                <th>
                  Ciudad
                </th>

                <th>
                  Estado
                </th>

                <th className="clientes-actions-title">
                  Acciones
                </th>
              </tr>

            </thead>

            <tbody>

              {cargando ? (
                <tr>

                  <td
                    colSpan="6"
                    className="clientes-empty"
                  >
                    <RefreshCw
                      size={24}
                      className="clientes-spin"
                    />

                    <span>
                      Cargando clientes...
                    </span>
                  </td>

                </tr>
              ) : clientesFiltrados.length ===
                0 ? (
                <tr>

                  <td
                    colSpan="6"
                    className="clientes-empty"
                  >

                    <Users
                      size={30}
                    />

                    <strong>
                      No hay clientes para mostrar
                    </strong>

                    <span>
                      {busqueda ||
                      filtroEstado
                        ? "No se encontraron resultados con los filtros seleccionados."
                        : "Registra el primer cliente de Lotes Villa María."}
                    </span>

                  </td>

                </tr>
              ) : (
                clientesFiltrados.map(
                  (
                    cliente
                  ) => (
                    <tr
                      key={
                        cliente._id
                      }
                    >

                      <td>

                        <div className="cliente-name-cell">

                          <div className="cliente-avatar">
                            {cliente.nombres
                              ?.charAt(
                                0
                              )
                              ?.toUpperCase() ||
                              "C"}
                          </div>

                          <div>

                            <strong>
                              {
                                cliente.nombres
                              }{" "}
                              {
                                cliente.apellidos
                              }
                            </strong>

                            {cliente.correo && (
                              <span>
                                {
                                  cliente.correo
                                }
                              </span>
                            )}

                          </div>

                        </div>

                      </td>

                      <td>

                        <span className="cliente-documento">
                          {
                            cliente.documento
                          }
                        </span>

                      </td>

                      <td>

                        <div className="cliente-contact-cell">

                          {cliente.telefono ? (
                            <span>
                              <Phone
                                size={15}
                              />

                              {
                                cliente.telefono
                              }
                            </span>
                          ) : (
                            <span className="cliente-muted">
                              Sin teléfono
                            </span>
                          )}

                        </div>

                      </td>

                      <td>

                        {cliente.ciudad ? (
                          <span className="cliente-city">

                            <MapPin
                              size={15}
                            />

                            {
                              cliente.ciudad
                            }

                          </span>
                        ) : (
                          <span className="cliente-muted">
                            Sin ciudad
                          </span>
                        )}

                      </td>

                      <td>

                        <span
                          className={`cliente-status ${
                            cliente.estado ===
                            "Activo"
                              ? "cliente-status-active"
                              : "cliente-status-inactive"
                          }`}
                        >
                          {
                            cliente.estado
                          }
                        </span>

                      </td>

                      {/* =====================================
                          ACCIONES
                      ===================================== */}

                      <td>

                        <div className="cliente-actions">

                          <button
                            type="button"
                            className="cliente-action-button print"
                            onClick={() =>
                              imprimirCliente(
                                cliente
                              )
                            }
                            title="Imprimir cliente"
                          >
                            <Printer
                              size={17}
                            />
                          </button>

                          <button
                            type="button"
                            className="cliente-action-button edit"
                            onClick={() =>
                              abrirEditarCliente(
                                cliente
                              )
                            }
                            title="Editar cliente"
                          >
                            <Pencil
                              size={17}
                            />
                          </button>

                          <button
                            type="button"
                            className="cliente-action-button delete"
                            onClick={() =>
                              handleEliminar(
                                cliente
                              )
                            }
                            title="Eliminar cliente"
                          >
                            <Trash2
                              size={17}
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

        {!cargando && (
          <div className="clientes-table-footer">

            Mostrando{" "}

            <strong>
              {
                clientesFiltrados.length
              }
            </strong>

            {" "}de{" "}

            <strong>
              {
                clientes.length
              }
            </strong>

            {" "}clientes

          </div>
        )}

      </div>

      {/* ===================================================
          MODAL
      =================================================== */}

      <ClienteModal
        abierto={
          modalAbierto
        }
        onCerrar={
          cerrarModal
        }
        onGuardar={
          guardarCliente
        }
        clienteEditar={
          clienteEditar
        }
        guardando={
          guardando
        }
      />

      {/* ===================================================
          TOAST
      =================================================== */}

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