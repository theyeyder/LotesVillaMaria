import {
  useEffect,
  useState,
} from "react";

import {
  BadgeDollarSign,
  IdCard,
  Mail,
  Pencil,
  Phone,
  Plus,
  Power,
  RefreshCw,
  Save,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react";

import "./Vendedores.css";

import Toast from "../../components/ui/Toast";

import {
  actualizarVendedor,
  cambiarEstadoVendedor,
  crearVendedor,
  obtenerVendedores,
} from "../../services/vendedor.service";

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
   FORMULARIO INICIAL
========================================================= */

const formularioInicial = {
  nombres: "",
  apellidos: "",
  documento: "",
  telefono: "",
  correo: "",
  valorComision: "2000000",
  observaciones: "",
};

/* =========================================================
   COMPONENTE
========================================================= */

export default function Vendedores() {
  /* =======================================================
     DATOS
  ======================================================= */

  const [
    vendedores,
    setVendedores,
  ] = useState([]);

  const [
    cargando,
    setCargando,
  ] = useState(true);

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
     MODAL
  ======================================================= */

  const [
    modalAbierto,
    setModalAbierto,
  ] = useState(false);

  const [
    vendedorEditando,
    setVendedorEditando,
  ] = useState(null);

  const [
    formulario,
    setFormulario,
  ] = useState(
    formularioInicial
  );

  const [
    guardando,
    setGuardando,
  ] = useState(false);

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
          visible: false,
        })
      );
    };

  /* =======================================================
     CARGAR VENDEDORES
  ======================================================= */

  const cargarVendedores =
    async () => {
      try {
        setCargando(
          true
        );

        const datos =
          await obtenerVendedores({
            search:
              busqueda.trim(),

            estado:
              filtroEstado,
          });

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
          error?.response?.data
            ?.message ||
            "No fue posible cargar los vendedores.",
          "error"
        );
      } finally {
        setCargando(
          false
        );
      }
    };

  /* =======================================================
     BUSCAR CON PEQUEÑO RETARDO
  ======================================================= */

  useEffect(() => {
    const temporizador =
      setTimeout(
        () => {
          cargarVendedores();
        },
        300
      );

    return () =>
      clearTimeout(
        temporizador
      );
  }, [
    busqueda,
    filtroEstado,
  ]);

  /* =======================================================
     ABRIR NUEVO
  ======================================================= */

  const abrirNuevo =
    () => {
      setVendedorEditando(
        null
      );

      setFormulario(
        formularioInicial
      );

      setModalAbierto(
        true
      );
    };

  /* =======================================================
     ABRIR EDICIÓN
  ======================================================= */

  const abrirEditar =
    (vendedor) => {
      setVendedorEditando(
        vendedor
      );

      setFormulario({
        nombres:
          vendedor.nombres ||
          "",

        apellidos:
          vendedor.apellidos ||
          "",

        documento:
          vendedor.documento ||
          "",

        telefono:
          vendedor.telefono ||
          "",

        correo:
          vendedor.correo ||
          "",

        valorComision:
          vendedor.valorComision ??
          2000000,

        observaciones:
          vendedor.observaciones ||
          "",
      });

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

      setVendedorEditando(
        null
      );

      setFormulario(
        formularioInicial
      );
    };

  /* =======================================================
     CAMBIAR FORMULARIO
  ======================================================= */

  const handleChange =
    (e) => {
      const {
        name,
        value,
      } = e.target;

      setFormulario(
        (prev) => ({
          ...prev,

          [name]:
            value,
        })
      );
    };

  /* =======================================================
     GUARDAR
  ======================================================= */

  const guardarVendedor =
    async (
      e
    ) => {
      e.preventDefault();

      if (
        !formulario.nombres.trim()
      ) {
        mostrarNotificacion(
          "Digite los nombres del vendedor.",
          "error"
        );

        return;
      }

      if (
        !formulario.apellidos.trim()
      ) {
        mostrarNotificacion(
          "Digite los apellidos del vendedor.",
          "error"
        );

        return;
      }

      if (
        !formulario.documento.trim()
      ) {
        mostrarNotificacion(
          "Digite el documento del vendedor.",
          "error"
        );

        return;
      }

      const valorComision =
        Number(
          formulario.valorComision
        );

      if (
        !Number.isFinite(
          valorComision
        ) ||
        valorComision < 0
      ) {
        mostrarNotificacion(
          "Digite un valor de comisión válido.",
          "error"
        );

        return;
      }

      try {
        setGuardando(
          true
        );

        const datos = {
          nombres:
            formulario.nombres.trim(),

          apellidos:
            formulario.apellidos.trim(),

          documento:
            formulario.documento.trim(),

          telefono:
            formulario.telefono.trim(),

          correo:
            formulario.correo.trim(),

          valorComision,

          observaciones:
            formulario.observaciones.trim(),
        };

        let respuesta;

        if (
          vendedorEditando
        ) {
          respuesta =
            await actualizarVendedor(
              vendedorEditando._id,
              datos
            );
        } else {
          respuesta =
            await crearVendedor(
              datos
            );
        }

        mostrarNotificacion(
          respuesta?.message ||
            (
              vendedorEditando
                ? "Vendedor actualizado correctamente."
                : "Vendedor creado correctamente."
            )
        );

        setModalAbierto(
          false
        );

        setVendedorEditando(
          null
        );

        setFormulario(
          formularioInicial
        );

        await cargarVendedores();
      } catch (error) {
        console.error(
          "Error guardando vendedor:",
          error
        );

        mostrarNotificacion(
          error?.response?.data
            ?.message ||
            "No fue posible guardar el vendedor.",
          "error"
        );
      } finally {
        setGuardando(
          false
        );
      }
    };

  /* =======================================================
     ACTIVAR / INACTIVAR
  ======================================================= */

  const cambiarEstado =
    async (
      vendedor
    ) => {
      const nuevoEstado =
        vendedor.estado ===
        "Activo"
          ? "Inactivo"
          : "Activo";

      const confirmar =
        window.confirm(
          `¿Desea cambiar el vendedor ${vendedor.codigo} a ${nuevoEstado}?`
        );

      if (
        !confirmar
      ) {
        return;
      }

      try {
        const respuesta =
          await cambiarEstadoVendedor(
            vendedor._id
          );

        mostrarNotificacion(
          respuesta?.message ||
            "Estado actualizado correctamente."
        );

        await cargarVendedores();
      } catch (error) {
        console.error(
          "Error cambiando estado:",
          error
        );

        mostrarNotificacion(
          error?.response?.data
            ?.message ||
            "No fue posible cambiar el estado del vendedor.",
          "error"
        );
      }
    };

  /* =======================================================
     ESTADÍSTICAS
  ======================================================= */

  const totalActivos =
    vendedores.filter(
      (vendedor) =>
        vendedor.estado ===
        "Activo"
    ).length;

  const totalInactivos =
    vendedores.filter(
      (vendedor) =>
        vendedor.estado ===
        "Inactivo"
    ).length;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <section className="vendedores-page">

      {/* =================================================
          CABECERA
      ================================================= */}

      <div className="vendedores-header">

        <div>
          <span className="vendedores-kicker">
            Comercial
          </span>

          <h1>
            Vendedores
          </h1>

          <p>
            Administra las personas
            encargadas de vender los
            lotes y el valor de comisión
            asignado por cada venta.
          </p>
        </div>

        <div className="vendedores-header-actions">

          <button
            type="button"
            className="vendedores-refresh"
            onClick={
              cargarVendedores
            }
            disabled={
              cargando
            }
          >
            <RefreshCw
              size={17}
              className={
                cargando
                  ? "vendedores-spin"
                  : ""
              }
            />

            Actualizar
          </button>

          <button
            type="button"
            className="vendedores-new-button"
            onClick={
              abrirNuevo
            }
          >
            <Plus
              size={18}
            />

            Nuevo vendedor
          </button>

        </div>

      </div>

      {/* =================================================
          ESTADÍSTICAS
      ================================================= */}

      <div className="vendedores-stats">

        <article className="vendedores-stat">

          <div className="vendedores-stat-icon">
            <Users
              size={20}
            />
          </div>

          <div>
            <span>
              Total vendedores
            </span>

            <strong>
              {
                vendedores.length
              }
            </strong>
          </div>

        </article>

        <article className="vendedores-stat activo">

          <div className="vendedores-stat-icon">
            <UserRound
              size={20}
            />
          </div>

          <div>
            <span>
              Activos
            </span>

            <strong>
              {
                totalActivos
              }
            </strong>
          </div>

        </article>

        <article className="vendedores-stat inactivo">

          <div className="vendedores-stat-icon">
            <Power
              size={20}
            />
          </div>

          <div>
            <span>
              Inactivos
            </span>

            <strong>
              {
                totalInactivos
              }
            </strong>
          </div>

        </article>

      </div>

      {/* =================================================
          PANEL
      ================================================= */}

      <div className="vendedores-panel">

        {/* =============================================
            FILTROS
        ============================================= */}

        <div className="vendedores-toolbar">

          <div className="vendedores-search">

            <Search
              size={17}
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
              placeholder="Buscar código, nombre, documento o teléfono..."
            />

          </div>

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

            <option value="Activo">
              Activos
            </option>

            <option value="Inactivo">
              Inactivos
            </option>
          </select>

        </div>

        {/* =============================================
            TABLA
        ============================================= */}

        <div className="vendedores-table-wrapper">

          <table className="vendedores-table">

            <thead>
              <tr>
                <th>
                  Código
                </th>

                <th>
                  Vendedor
                </th>

                <th>
                  Documento
                </th>

                <th>
                  Teléfono
                </th>

                <th>
                  Comisión por lote
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
                    colSpan="7"
                    className="vendedores-empty"
                  >
                    <RefreshCw
                      size={26}
                      className="vendedores-spin"
                    />

                    <strong>
                      Cargando vendedores...
                    </strong>
                  </td>
                </tr>
              ) : vendedores.length ===
                0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="vendedores-empty"
                  >
                    <Users
                      size={38}
                    />

                    <strong>
                      No hay vendedores registrados
                    </strong>

                    <span>
                      Cree el primer vendedor
                      para comenzar.
                    </span>
                  </td>
                </tr>
              ) : (
                vendedores.map(
                  (vendedor) => (
                    <tr
                      key={
                        vendedor._id
                      }
                    >

                      {/* CÓDIGO */}

                      <td>
                        <strong className="vendedor-code">
                          {
                            vendedor.codigo ||
                            "—"
                          }
                        </strong>
                      </td>

                      {/* VENDEDOR */}

                      <td>
                        <div className="vendedor-name">

                          <div className="vendedor-avatar">
                            {String(
                              vendedor.nombres ||
                                "V"
                            )
                              .charAt(
                                0
                              )
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {
                                vendedor.nombres
                              }{" "}
                              {
                                vendedor.apellidos
                              }
                            </strong>

                            <span>
                              {vendedor.correo ||
                                "Sin correo"}
                            </span>
                          </div>

                        </div>
                      </td>

                      {/* DOCUMENTO */}

                      <td>
                        <div className="vendedor-info-cell">
                          <IdCard
                            size={14}
                          />

                          <span>
                            {
                              vendedor.documento
                            }
                          </span>
                        </div>
                      </td>

                      {/* TELÉFONO */}

                      <td>
                        <div className="vendedor-info-cell">
                          <Phone
                            size={14}
                          />

                          <span>
                            {vendedor.telefono ||
                              "—"}
                          </span>
                        </div>
                      </td>

                      {/* COMISIÓN */}

                      <td>
                        <div className="vendedor-comision">
                          <BadgeDollarSign
                            size={15}
                          />

                          <strong>
                            {formatearDinero(
                              vendedor.valorComision
                            )}
                          </strong>
                        </div>
                      </td>

                      {/* ESTADO */}

                      <td>
                        <span
                          className={`vendedor-status vendedor-status-${String(
                            vendedor.estado
                          ).toLowerCase()}`}
                        >
                          {
                            vendedor.estado
                          }
                        </span>
                      </td>

                      {/* ACCIONES */}

                      <td>
                        <div className="vendedores-actions">

                          <button
                            type="button"
                            className="edit"
                            title="Editar vendedor"
                            onClick={() =>
                              abrirEditar(
                                vendedor
                              )
                            }
                          >
                            <Pencil
                              size={15}
                            />
                          </button>

                          <button
                            type="button"
                            className={
                              vendedor.estado ===
                              "Activo"
                                ? "disable"
                                : "enable"
                            }
                            title={
                              vendedor.estado ===
                              "Activo"
                                ? "Inactivar vendedor"
                                : "Activar vendedor"
                            }
                            onClick={() =>
                              cambiarEstado(
                                vendedor
                              )
                            }
                          >
                            <Power
                              size={15}
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

        <div className="vendedores-footer">
          <span>
            <strong>
              {
                vendedores.length
              }
            </strong>{" "}
            vendedor(es)
          </span>
        </div>

      </div>

      {/* =================================================
          MODAL
      ================================================= */}

      {modalAbierto && (
        <div
          className="vendedor-modal-backdrop"
          onMouseDown={
            cerrarModal
          }
        >

          <div
            className="vendedor-modal"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            {/* CABECERA */}

            <div className="vendedor-modal-header">

              <div>
                <span>
                  {
                    vendedorEditando
                      ? vendedorEditando.codigo
                      : "Nuevo registro"
                  }
                </span>

                <h2>
                  {vendedorEditando
                    ? "Editar vendedor"
                    : "Nuevo vendedor"}
                </h2>
              </div>

              <button
                type="button"
                className="vendedor-modal-close"
                onClick={
                  cerrarModal
                }
                disabled={
                  guardando
                }
              >
                <X
                  size={19}
                />
              </button>

            </div>

            {/* FORMULARIO */}

            <form
              onSubmit={
                guardarVendedor
              }
              className="vendedor-form"
            >

              <div className="vendedor-form-grid">

                {/* NOMBRES */}

                <div className="vendedor-field">

                  <label>
                    Nombres *
                  </label>

                  <div className="vendedor-input-icon">

                    <UserRound
                      size={15}
                    />

                    <input
                      type="text"
                      name="nombres"
                      value={
                        formulario.nombres
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Nombres"
                      autoFocus
                    />

                  </div>

                </div>

                {/* APELLIDOS */}

                <div className="vendedor-field">

                  <label>
                    Apellidos *
                  </label>

                  <div className="vendedor-input-icon">

                    <UserRound
                      size={15}
                    />

                    <input
                      type="text"
                      name="apellidos"
                      value={
                        formulario.apellidos
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Apellidos"
                    />

                  </div>

                </div>

                {/* DOCUMENTO */}

                <div className="vendedor-field">

                  <label>
                    Documento *
                  </label>

                  <div className="vendedor-input-icon">

                    <IdCard
                      size={15}
                    />

                    <input
                      type="text"
                      name="documento"
                      value={
                        formulario.documento
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Número de documento"
                    />

                  </div>

                </div>

                {/* TELÉFONO */}

                <div className="vendedor-field">

                  <label>
                    Teléfono
                  </label>

                  <div className="vendedor-input-icon">

                    <Phone
                      size={15}
                    />

                    <input
                      type="text"
                      name="telefono"
                      value={
                        formulario.telefono
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Número de teléfono"
                    />

                  </div>

                </div>

                {/* CORREO */}

                <div className="vendedor-field">

                  <label>
                    Correo
                  </label>

                  <div className="vendedor-input-icon">

                    <Mail
                      size={15}
                    />

                    <input
                      type="email"
                      name="correo"
                      value={
                        formulario.correo
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="correo@ejemplo.com"
                    />

                  </div>

                </div>

                {/* COMISIÓN */}

                <div className="vendedor-field">

                  <label>
                    Comisión por lote *
                  </label>

                  <div className="vendedor-input-icon">

                    <BadgeDollarSign
                      size={15}
                    />

                    <input
                      type="number"
                      name="valorComision"
                      value={
                        formulario.valorComision
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Ej: 2000000"
                      min="0"
                      step="1000"
                    />

                  </div>

                  <small>
                    Valor que recibe el vendedor
                    por cada lote vendido.
                  </small>

                </div>

              </div>

              {/* OBSERVACIONES */}

              <div className="vendedor-field vendedor-field-full">

                <label>
                  Observaciones
                </label>

                <textarea
                  name="observaciones"
                  value={
                    formulario.observaciones
                  }
                  onChange={
                    handleChange
                  }
                  rows="3"
                  placeholder="Observaciones adicionales..."
                />

              </div>

              {/* PIE */}

              <div className="vendedor-modal-footer">

                <button
                  type="button"
                  className="vendedor-cancel-button"
                  onClick={
                    cerrarModal
                  }
                  disabled={
                    guardando
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="vendedor-save-button"
                  disabled={
                    guardando
                  }
                >

                  {guardando ? (
                    <RefreshCw
                      size={17}
                      className="vendedores-spin"
                    />
                  ) : (
                    <Save
                      size={17}
                    />
                  )}

                  {guardando
                    ? "Guardando..."
                    : vendedorEditando
                      ? "Guardar cambios"
                      : "Guardar vendedor"}

                </button>

              </div>

            </form>

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