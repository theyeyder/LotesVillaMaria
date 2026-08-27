import { useEffect, useMemo, useState } from "react";
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

export default function Clientes() {
  const [clientes, setClientes] = useState([]);

  const [busqueda, setBusqueda] = useState("");

  const [filtroEstado, setFiltroEstado] = useState("");

  const [cargando, setCargando] = useState(true);

  const [guardando, setGuardando] = useState(false);

  const [error, setError] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);

  const [clienteEditar, setClienteEditar] = useState(null);

  const [notificacion, setNotificacion] = useState({
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

  const cerrarNotificacion = () => {
    setNotificacion((prev) => ({
      ...prev,
      visible: false,
    }));
  };

  const cargarClientes = async () => {
    try {
      setCargando(true);
      setError("");

      const datos = await obtenerClientes();

      setClientes(Array.isArray(datos) ? datos : []);
    } catch (error) {
      console.error("Error cargando clientes:", error);

      setError(
        error?.response?.data?.message ||
          "No fue posible cargar los clientes."
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  const clientesFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return clientes.filter((cliente) => {
      const coincideEstado =
        !filtroEstado || cliente.estado === filtroEstado;

      if (!coincideEstado) {
        return false;
      }

      if (!texto) {
        return true;
      }

      const nombreCompleto =
        `${cliente.nombres || ""} ${cliente.apellidos || ""}`.toLowerCase();

      const documento = String(
        cliente.documento || ""
      ).toLowerCase();

      const telefono = String(
        cliente.telefono || ""
      ).toLowerCase();

      const correo = String(
        cliente.correo || ""
      ).toLowerCase();

      const ciudad = String(
        cliente.ciudad || ""
      ).toLowerCase();

      return (
        nombreCompleto.includes(texto) ||
        documento.includes(texto) ||
        telefono.includes(texto) ||
        correo.includes(texto) ||
        ciudad.includes(texto)
      );
    });
  }, [clientes, busqueda, filtroEstado]);

  const totalClientes = clientes.length;

  const clientesActivos = clientes.filter(
    (cliente) => cliente.estado === "Activo"
  ).length;

  const clientesInactivos = clientes.filter(
    (cliente) => cliente.estado === "Inactivo"
  ).length;

  const abrirNuevoCliente = () => {
    setClienteEditar(null);
    setModalAbierto(true);
  };

  const abrirEditarCliente = (cliente) => {
    setClienteEditar(cliente);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    if (guardando) {
      return;
    }

    setModalAbierto(false);
    setClienteEditar(null);
  };

  const guardarCliente = async (datos) => {
    try {
      setGuardando(true);

      if (clienteEditar?._id) {
        const respuesta = await actualizarCliente(
          clienteEditar._id,
          datos
        );

        mostrarNotificacion(
          respuesta?.message ||
            "Cliente actualizado correctamente",
          "success"
        );
      } else {
        const respuesta = await crearCliente(datos);

        mostrarNotificacion(
          respuesta?.message ||
            "Cliente guardado correctamente",
          "success"
        );
      }

      await cargarClientes();

      setModalAbierto(false);
      setClienteEditar(null);
    } catch (error) {
      console.error(
        "Error guardando cliente:",
        error
      );

      mostrarNotificacion(
        error?.response?.data?.message ||
          "No fue posible guardar el cliente.",
        "error"
      );
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (cliente) => {
    const nombre =
      `${cliente.nombres || ""} ${cliente.apellidos || ""}`.trim();

    const confirmar = window.confirm(
      `¿Está seguro de eliminar al cliente ${nombre}?`
    );

    if (!confirmar) {
      return;
    }

    try {
      const respuesta = await eliminarCliente(
        cliente._id
      );

      setClientes((actuales) =>
        actuales.filter(
          (item) => item._id !== cliente._id
        )
      );

      mostrarNotificacion(
        respuesta?.message ||
          "Cliente eliminado correctamente",
        "success"
      );
    } catch (error) {
      console.error(
        "Error eliminando cliente:",
        error
      );

      mostrarNotificacion(
        error?.response?.data?.message ||
          "No fue posible eliminar el cliente.",
        "error"
      );
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  return (
    <section className="clientes-page">
      <div className="clientes-header">
        <div>
          <span className="clientes-kicker">
            Gestión comercial
          </span>

          <h1>Clientes</h1>

          <p>
            Administra los compradores y clientes de
            Lotes Villa María.
          </p>
        </div>

        <button
          type="button"
          className="clientes-new-button"
          onClick={abrirNuevoCliente}
        >
          <Plus size={19} />
          Nuevo cliente
        </button>
      </div>

      <div className="clientes-stats">
        <article className="cliente-stat-card">
          <div className="cliente-stat-icon">
            <Users size={22} />
          </div>

          <div>
            <span>Total clientes</span>
            <strong>{totalClientes}</strong>
          </div>
        </article>

        <article className="cliente-stat-card">
          <div className="cliente-stat-icon">
            <UserCheck size={22} />
          </div>

          <div>
            <span>Activos</span>
            <strong>{clientesActivos}</strong>
          </div>
        </article>

        <article className="cliente-stat-card">
          <div className="cliente-stat-icon">
            <UserX size={22} />
          </div>

          <div>
            <span>Inactivos</span>
            <strong>{clientesInactivos}</strong>
          </div>
        </article>
      </div>

      <div className="clientes-panel">
        <div className="clientes-toolbar">
          <div className="clientes-search">
            <Search size={19} />

            <input
              type="text"
              value={busqueda}
              onChange={(e) =>
                setBusqueda(e.target.value)
              }
              placeholder="Buscar por nombre, documento, teléfono, correo o ciudad..."
            />
          </div>

          <div className="clientes-toolbar-actions">
            <button
              type="button"
              className="clientes-print-button"
              onClick={handleImprimir}
              title="Imprimir clientes"
            >
              <Printer size={18} />
              Imprimir
            </button>

            <select
              value={filtroEstado}
              onChange={(e) =>
                setFiltroEstado(e.target.value)
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
              onClick={cargarClientes}
              title="Actualizar clientes"
            >
              <RefreshCw
                size={18}
                className={
                  cargando ? "clientes-spin" : ""
                }
              />
            </button>
          </div>
        </div>

        {error && (
          <div className="clientes-error">
            <span>{error}</span>

            <button
              type="button"
              onClick={cargarClientes}
            >
              Reintentar
            </button>
          </div>
        )}

        <div className="clientes-print-header">
          <h1>Lotes Villa María</h1>
          <h2>Listado de clientes</h2>

          <p>
            Total de registros: {clientesFiltrados.length}
          </p>
        </div>

        <div className="clientes-table-wrapper">
          <table className="clientes-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Documento</th>
                <th>Contacto</th>
                <th>Ciudad</th>
                <th>Estado</th>
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
              ) : clientesFiltrados.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="clientes-empty"
                  >
                    <Users size={30} />

                    <strong>
                      No hay clientes para mostrar
                    </strong>

                    <span>
                      {busqueda || filtroEstado
                        ? "No se encontraron resultados con los filtros seleccionados."
                        : "Registra el primer cliente de Lotes Villa María."}
                    </span>
                  </td>
                </tr>
              ) : (
                clientesFiltrados.map((cliente) => (
                  <tr key={cliente._id}>
                    <td>
                      <div className="cliente-name-cell">
                        <div className="cliente-avatar">
                          {cliente.nombres
                            ?.charAt(0)
                            ?.toUpperCase() || "C"}
                        </div>

                        <div>
                          <strong>
                            {cliente.nombres}{" "}
                            {cliente.apellidos}
                          </strong>

                          {cliente.correo && (
                            <span>
                              {cliente.correo}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="cliente-documento">
                        {cliente.documento}
                      </span>
                    </td>

                    <td>
                      <div className="cliente-contact-cell">
                        {cliente.telefono ? (
                          <span>
                            <Phone size={15} />
                            {cliente.telefono}
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
                          <MapPin size={15} />
                          {cliente.ciudad}
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
                        {cliente.estado}
                      </span>
                    </td>

                    <td>
                      <div className="cliente-actions">
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
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          className="cliente-action-button delete"
                          onClick={() =>
                            handleEliminar(cliente)
                          }
                          title="Eliminar cliente"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!cargando && (
          <div className="clientes-table-footer">
            Mostrando{" "}
            <strong>
              {clientesFiltrados.length}
            </strong>{" "}
            de <strong>{clientes.length}</strong>{" "}
            clientes
          </div>
        )}
      </div>

      <ClienteModal
        abierto={modalAbierto}
        onCerrar={cerrarModal}
        onGuardar={guardarCliente}
        clienteEditar={clienteEditar}
        guardando={guardando}
      />

      <Toast
        visible={notificacion.visible}
        mensaje={notificacion.mensaje}
        tipo={notificacion.tipo}
        onClose={cerrarNotificacion}
      />
    </section>
  );
}