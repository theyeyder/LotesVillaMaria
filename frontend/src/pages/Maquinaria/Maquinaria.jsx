import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Tractor,
  CheckCircle2,
  Wrench,
  XCircle,
  RefreshCw,
} from "lucide-react";

import MaquinariaModal from "./MaquinariaModal";
import Toast from "../../components/ui/Toast";
import "./Maquinaria.css";

import {
  obtenerMaquinarias,
  crearMaquinaria,
  actualizarMaquinaria,
  eliminarMaquinaria,
} from "../../services/maquinaria.service";

export default function Maquinaria() {
  const [maquinarias, setMaquinarias] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [maquinariaEditar, setMaquinariaEditar] = useState(null);

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

  const cargarMaquinarias = async () => {
    try {
      setCargando(true);
      setError("");

      const datos = await obtenerMaquinarias();

      setMaquinarias(
        Array.isArray(datos) ? datos : []
      );
    } catch (error) {
      console.error(
        "Error cargando maquinaria:",
        error
      );

      setError(
        error?.response?.data?.message ||
          "No fue posible cargar la maquinaria."
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarMaquinarias();
  }, []);

  const maquinariasFiltradas = useMemo(() => {
    const texto = busqueda
      .trim()
      .toLowerCase();

    return maquinarias.filter((maquina) => {
      const coincideEstado =
        !filtroEstado ||
        maquina.estado === filtroEstado;

      if (!coincideEstado) {
        return false;
      }

      if (!texto) {
        return true;
      }

      const datos = [
        maquina.nombre,
        maquina.codigo,
        maquina.tipo,
        maquina.placa,
        maquina.marca,
        maquina.modelo,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return datos.includes(texto);
    });
  }, [
    maquinarias,
    busqueda,
    filtroEstado,
  ]);

  const totalMaquinas = maquinarias.length;

  const maquinasActivas = maquinarias.filter(
    (maquina) => maquina.estado === "Activa"
  ).length;

  const maquinasMantenimiento =
    maquinarias.filter(
      (maquina) =>
        maquina.estado === "Mantenimiento"
    ).length;

  const maquinasInactivas = maquinarias.filter(
    (maquina) =>
      maquina.estado === "Inactiva"
  ).length;

  const abrirNuevaMaquina = () => {
    setMaquinariaEditar(null);
    setModalAbierto(true);
  };

  const abrirEditarMaquina = (maquina) => {
    setMaquinariaEditar(maquina);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    if (guardando) {
      return;
    }

    setModalAbierto(false);
    setMaquinariaEditar(null);
  };

  const guardarMaquinaria = async (datos) => {
    try {
      setGuardando(true);

      if (maquinariaEditar?._id) {
        const respuesta =
          await actualizarMaquinaria(
            maquinariaEditar._id,
            datos
          );

        mostrarNotificacion(
          respuesta?.message ||
            "Máquina actualizada correctamente"
        );
      } else {
        const respuesta =
          await crearMaquinaria(datos);

        mostrarNotificacion(
          respuesta?.message ||
            "Máquina creada correctamente"
        );
      }

      await cargarMaquinarias();

      setModalAbierto(false);
      setMaquinariaEditar(null);
    } catch (error) {
      console.error(
        "Error guardando maquinaria:",
        error
      );

      mostrarNotificacion(
        error?.response?.data?.message ||
          "No fue posible guardar la máquina.",
        "error"
      );
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (maquina) => {
    const confirmar = window.confirm(
      `¿Está seguro de eliminar la máquina ${maquina.nombre}?`
    );

    if (!confirmar) {
      return;
    }

    try {
      const respuesta =
        await eliminarMaquinaria(maquina._id);

      setMaquinarias((actuales) =>
        actuales.filter(
          (item) => item._id !== maquina._id
        )
      );

      mostrarNotificacion(
        respuesta?.message ||
          "Máquina eliminada correctamente"
      );
    } catch (error) {
      console.error(
        "Error eliminando maquinaria:",
        error
      );

      mostrarNotificacion(
        error?.response?.data?.message ||
          "No fue posible eliminar la máquina.",
        "error"
      );
    }
  };

  return (
    <section className="maquinaria-page">
      <div className="maquinaria-header">
        <div>
          <span className="maquinaria-kicker">
            Control operativo
          </span>

          <h1>Maquinaria</h1>

          <p>
            Administra las máquinas utilizadas en
            Lotes Villa María.
          </p>
        </div>

        <button
          type="button"
          className="maquinaria-new-button"
          onClick={abrirNuevaMaquina}
        >
          <Plus size={19} />
          Nueva máquina
        </button>
      </div>

      <div className="maquinaria-stats">
        <article className="maquinaria-stat-card">
          <div className="maquinaria-stat-icon">
            <Tractor size={22} />
          </div>

          <div>
            <span>Total máquinas</span>
            <strong>{totalMaquinas}</strong>
          </div>
        </article>

        <article className="maquinaria-stat-card">
          <div className="maquinaria-stat-icon">
            <CheckCircle2 size={22} />
          </div>

          <div>
            <span>Activas</span>
            <strong>{maquinasActivas}</strong>
          </div>
        </article>

        <article className="maquinaria-stat-card">
          <div className="maquinaria-stat-icon">
            <Wrench size={22} />
          </div>

          <div>
            <span>Mantenimiento</span>
            <strong>{maquinasMantenimiento}</strong>
          </div>
        </article>

        <article className="maquinaria-stat-card">
          <div className="maquinaria-stat-icon">
            <XCircle size={22} />
          </div>

          <div>
            <span>Inactivas</span>
            <strong>{maquinasInactivas}</strong>
          </div>
        </article>
      </div>

      <div className="maquinaria-panel">
        <div className="maquinaria-toolbar">
          <div className="maquinaria-search">
            <Search size={19} />

            <input
              type="text"
              value={busqueda}
              onChange={(e) =>
                setBusqueda(e.target.value)
              }
              placeholder="Buscar por nombre, código, tipo, placa, marca o modelo..."
            />
          </div>

          <div className="maquinaria-toolbar-actions">
            <select
              value={filtroEstado}
              onChange={(e) =>
                setFiltroEstado(e.target.value)
              }
              className="maquinaria-filter"
            >
              <option value="">
                Todos los estados
              </option>

              <option value="Activa">
                Activas
              </option>

              <option value="Mantenimiento">
                Mantenimiento
              </option>

              <option value="Inactiva">
                Inactivas
              </option>
            </select>

            <button
              type="button"
              className="maquinaria-refresh-button"
              onClick={cargarMaquinarias}
              title="Actualizar maquinaria"
            >
              <RefreshCw
                size={18}
                className={
                  cargando
                    ? "maquinaria-spin"
                    : ""
                }
              />
            </button>
          </div>
        </div>

        {error && (
          <div className="maquinaria-error">
            <span>{error}</span>

            <button
              type="button"
              onClick={cargarMaquinarias}
            >
              Reintentar
            </button>
          </div>
        )}

        <div className="maquinaria-table-wrapper">
          <table className="maquinaria-table">
            <thead>
              <tr>
                <th>Máquina</th>
                <th>Código</th>
                <th>Tipo</th>
                <th>Placa</th>
                <th>Marca / Modelo</th>
                <th>Estado</th>
                <th className="maquinaria-actions-title">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {cargando ? (
                <tr>
                  <td
                    colSpan="7"
                    className="maquinaria-empty"
                  >
                    <RefreshCw
                      size={25}
                      className="maquinaria-spin"
                    />

                    <span>
                      Cargando maquinaria...
                    </span>
                  </td>
                </tr>
              ) : maquinariasFiltradas.length ===
                0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="maquinaria-empty"
                  >
                    <Tractor size={32} />

                    <strong>
                      No hay máquinas para mostrar
                    </strong>

                    <span>
                      {busqueda || filtroEstado
                        ? "No se encontraron resultados con los filtros seleccionados."
                        : "Registra la primera máquina de Lotes Villa María."}
                    </span>
                  </td>
                </tr>
              ) : (
                maquinariasFiltradas.map(
                  (maquina) => (
                    <tr key={maquina._id}>
                      <td>
                        <div className="maquinaria-name-cell">
                          <div className="maquinaria-avatar">
                            <Tractor size={19} />
                          </div>

                          <div>
                            <strong>
                              {maquina.nombre}
                            </strong>

                            {maquina.descripcion && (
                              <span>
                                {
                                  maquina.descripcion
                                }
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="maquinaria-codigo">
                          {maquina.codigo}
                        </span>
                      </td>

                      <td>
                        {maquina.tipo || (
                          <span className="maquinaria-muted">
                            Sin tipo
                          </span>
                        )}
                      </td>

                      <td>
                        {maquina.placa || (
                          <span className="maquinaria-muted">
                            Sin placa
                          </span>
                        )}
                      </td>

                      <td>
                        <div className="maquinaria-brand-cell">
                          <strong>
                            {maquina.marca ||
                              "Sin marca"}
                          </strong>

                          <span>
                            {maquina.modelo ||
                              "Sin modelo"}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`maquinaria-status ${
                            maquina.estado ===
                            "Activa"
                              ? "maquinaria-status-active"
                              : maquina.estado ===
                                "Mantenimiento"
                              ? "maquinaria-status-maintenance"
                              : "maquinaria-status-inactive"
                          }`}
                        >
                          {maquina.estado}
                        </span>
                      </td>

                      <td>
                        <div className="maquinaria-actions">
                          <button
                            type="button"
                            className="maquinaria-action-button edit"
                            onClick={() =>
                              abrirEditarMaquina(
                                maquina
                              )
                            }
                            title="Editar máquina"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            type="button"
                            className="maquinaria-action-button delete"
                            onClick={() =>
                              handleEliminar(
                                maquina
                              )
                            }
                            title="Eliminar máquina"
                          >
                            <Trash2 size={17} />
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
          <div className="maquinaria-table-footer">
            Mostrando{" "}
            <strong>
              {maquinariasFiltradas.length}
            </strong>{" "}
            de{" "}
            <strong>
              {maquinarias.length}
            </strong>{" "}
            máquinas
          </div>
        )}
      </div>

      <MaquinariaModal
        abierto={modalAbierto}
        onCerrar={cerrarModal}
        onGuardar={guardarMaquinaria}
        maquinariaEditar={maquinariaEditar}
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