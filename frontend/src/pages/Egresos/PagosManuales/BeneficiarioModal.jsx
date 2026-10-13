import {
  LoaderCircle,
  Save,
  UserRoundPlus,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  actualizarBeneficiario,
  crearBeneficiario,
} from "../../../services/beneficiario.service.js";

/* =========================================================
   DATOS INICIALES
========================================================= */

const DATOS_INICIALES = {
  nombre: "",
  tipoDocumento: "CC",
  documento: "",
  telefono: "",
  observaciones: "",
  estado: "Activo",
};

/* =========================================================
   BENEFICIARIO MODAL
========================================================= */

export default function BeneficiarioModal({
  abierto,
  onCerrar,
  beneficiarioEditar = null,
  onGuardado,
}) {
  /* =======================================================
     ESTADOS
  ======================================================= */

  const [
    formulario,
    setFormulario,
  ] = useState(
    DATOS_INICIALES
  );

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /* =======================================================
     MODO EDICIÓN
  ======================================================= */

  const esEdicion =
    Boolean(
      beneficiarioEditar?._id
    );

  /* =======================================================
     CARGAR DATOS
  ======================================================= */

  useEffect(
    () => {
      if (!abierto) {
        return;
      }

      setError("");

      if (
        beneficiarioEditar?._id
      ) {
        setFormulario({
          nombre:
            beneficiarioEditar.nombre ||
            "",

          tipoDocumento:
            beneficiarioEditar.tipoDocumento ||
            "CC",

          documento:
            beneficiarioEditar.documento ||
            "",

          telefono:
            beneficiarioEditar.telefono ||
            "",

          observaciones:
            beneficiarioEditar.observaciones ||
            "",

          estado:
            beneficiarioEditar.estado ||
            "Activo",
        });

        return;
      }

      setFormulario(
        DATOS_INICIALES
      );
    },
    [
      abierto,
      beneficiarioEditar,
    ]
  );

  /* =======================================================
     CAMBIOS
  ======================================================= */

  const manejarCambio = (
    evento
  ) => {
    const {
      name,
      value,
    } = evento.target;

    setFormulario(
      (
        anterior
      ) => ({
        ...anterior,

        [name]:
          value,
      })
    );

    if (error) {
      setError("");
    }
  };

  /* =======================================================
     VALIDAR
  ======================================================= */

  const validarFormulario =
    () => {
      if (
        !formulario.nombre.trim()
      ) {
        return "Digite el nombre del beneficiario.";
      }

      if (
        !formulario.documento.trim()
      ) {
        return "Digite el documento del beneficiario.";
      }

      return "";
    };

  /* =======================================================
     GUARDAR
  ======================================================= */

  const manejarGuardar = async (
    evento
  ) => {
    evento.preventDefault();

    const mensajeValidacion =
      validarFormulario();

    if (mensajeValidacion) {
      setError(
        mensajeValidacion
      );

      return;
    }

    setGuardando(true);

    setError("");

    try {
      const datos = {
        nombre:
          formulario.nombre.trim(),

        tipoDocumento:
          formulario.tipoDocumento,

        documento:
          formulario.documento
            .trim()
            .toUpperCase(),

        telefono:
          formulario.telefono.trim(),

        observaciones:
          formulario.observaciones.trim(),

        estado:
          formulario.estado,
      };

      let respuesta;

      /* ===================================================
         EDITAR
      =================================================== */

      if (esEdicion) {
        respuesta =
          await actualizarBeneficiario(
            beneficiarioEditar._id,
            datos
          );
      }

      /* ===================================================
         CREAR
      =================================================== */

      if (!esEdicion) {
        respuesta =
          await crearBeneficiario(
            datos
          );
      }

      const beneficiarioGuardado =
        respuesta?.beneficiario ||
        respuesta;

      if (onGuardado) {
        onGuardado(
          beneficiarioGuardado
        );
      }

      setFormulario(
        DATOS_INICIALES
      );

      onCerrar?.();
    } catch (errorPeticion) {
      console.error(
        "Error guardando beneficiario:",
        errorPeticion
      );

      const mensaje =
        errorPeticion
          ?.response
          ?.data
          ?.message ||
        "No fue posible guardar el beneficiario.";

      setError(
        mensaje
      );
    } finally {
      setGuardando(false);
    }
  };

  /* =======================================================
     CERRAR
  ======================================================= */

  const manejarCerrar = () => {
    if (guardando) {
      return;
    }

    setError("");

    onCerrar?.();
  };

  /* =======================================================
     NO MOSTRAR
  ======================================================= */

  if (!abierto) {
    return null;
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className="pagos-manuales-modal-overlay"
      onMouseDown={
        (evento) => {
          if (
            evento.target ===
            evento.currentTarget
          ) {
            manejarCerrar();
          }
        }
      }
    >
      <div
        className="pagos-manuales-modal beneficiario-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="beneficiario-modal-titulo"
      >
        {/* ===============================================
            HEADER
        =============================================== */}

        <div className="pagos-manuales-modal-header">
          <div className="pagos-manuales-modal-header-info">
            <div className="pagos-manuales-modal-icon">
              <UserRoundPlus
                size={21}
              />
            </div>

            <div>
              <h2
                id="beneficiario-modal-titulo"
              >
                {esEdicion
                  ? "Editar beneficiario"
                  : "Nuevo beneficiario"}
              </h2>

              <p>
                {esEdicion
                  ? "Actualice la información de la persona o empresa."
                  : "Registre la persona o empresa que recibirá el pago."}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="pagos-manuales-modal-close"
            onClick={
              manejarCerrar
            }
            disabled={
              guardando
            }
            title="Cerrar"
          >
            <X
              size={20}
            />
          </button>
        </div>

        {/* ===============================================
            FORMULARIO
        =============================================== */}

        <form
          onSubmit={
            manejarGuardar
          }
        >
          <div className="pagos-manuales-modal-body">
            {/* ===========================================
                ERROR
            =========================================== */}

            {error && (
              <div className="pagos-manuales-form-error">
                {error}
              </div>
            )}

            <div className="pagos-manuales-form-grid">
              {/* =========================================
                  NOMBRE
              ========================================= */}

              <div className="pagos-manuales-field full">
                <label
                  htmlFor="beneficiario-nombre"
                >
                  Nombre completo o empresa
                  <span>*</span>
                </label>

                <input
                  id="beneficiario-nombre"
                  name="nombre"
                  type="text"
                  value={
                    formulario.nombre
                  }
                  onChange={
                    manejarCambio
                  }
                  placeholder="Ej. Juan Pérez"
                  autoComplete="off"
                  maxLength={150}
                  disabled={
                    guardando
                  }
                />
              </div>

              {/* =========================================
                  TIPO DOCUMENTO
              ========================================= */}

              <div className="pagos-manuales-field">
                <label
                  htmlFor="beneficiario-tipo-documento"
                >
                  Tipo de documento
                  <span>*</span>
                </label>

                <select
                  id="beneficiario-tipo-documento"
                  name="tipoDocumento"
                  value={
                    formulario.tipoDocumento
                  }
                  onChange={
                    manejarCambio
                  }
                  disabled={
                    guardando
                  }
                >
                  <option value="CC">
                    Cédula de ciudadanía
                  </option>

                  <option value="CE">
                    Cédula de extranjería
                  </option>

                  <option value="NIT">
                    NIT
                  </option>

                  <option value="TI">
                    Tarjeta de identidad
                  </option>

                  <option value="PASAPORTE">
                    Pasaporte
                  </option>

                  <option value="OTRO">
                    Otro
                  </option>
                </select>
              </div>

              {/* =========================================
                  DOCUMENTO
              ========================================= */}

              <div className="pagos-manuales-field">
                <label
                  htmlFor="beneficiario-documento"
                >
                  Documento
                  <span>*</span>
                </label>

                <input
                  id="beneficiario-documento"
                  name="documento"
                  type="text"
                  value={
                    formulario.documento
                  }
                  onChange={
                    manejarCambio
                  }
                  placeholder="Ej. 1110555888"
                  autoComplete="off"
                  maxLength={30}
                  disabled={
                    guardando
                  }
                />
              </div>

              {/* =========================================
                  TELÉFONO
              ========================================= */}

              <div className="pagos-manuales-field">
                <label
                  htmlFor="beneficiario-telefono"
                >
                  Teléfono
                </label>

                <input
                  id="beneficiario-telefono"
                  name="telefono"
                  type="text"
                  value={
                    formulario.telefono
                  }
                  onChange={
                    manejarCambio
                  }
                  placeholder="Ej. 3001234567"
                  autoComplete="off"
                  maxLength={30}
                  disabled={
                    guardando
                  }
                />
              </div>

              {/* =========================================
                  ESTADO
              ========================================= */}

              <div className="pagos-manuales-field">
                <label
                  htmlFor="beneficiario-estado"
                >
                  Estado
                </label>

                <select
                  id="beneficiario-estado"
                  name="estado"
                  value={
                    formulario.estado
                  }
                  onChange={
                    manejarCambio
                  }
                  disabled={
                    guardando
                  }
                >
                  <option value="Activo">
                    Activo
                  </option>

                  <option value="Inactivo">
                    Inactivo
                  </option>
                </select>
              </div>

              {/* =========================================
                  OBSERVACIONES
              ========================================= */}

              <div className="pagos-manuales-field full">
                <label
                  htmlFor="beneficiario-observaciones"
                >
                  Observaciones
                </label>

                <textarea
                  id="beneficiario-observaciones"
                  name="observaciones"
                  value={
                    formulario.observaciones
                  }
                  onChange={
                    manejarCambio
                  }
                  placeholder="Ej. Proveedor ocasional de café"
                  rows={4}
                  maxLength={500}
                  disabled={
                    guardando
                  }
                />
              </div>
            </div>
          </div>

          {/* ===============================================
              FOOTER
          =============================================== */}

          <div className="pagos-manuales-modal-footer">
            <button
              type="button"
              className="pagos-manuales-btn-secondary"
              onClick={
                manejarCerrar
              }
              disabled={
                guardando
              }
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="pagos-manuales-btn-primary"
              disabled={
                guardando
              }
            >
              {guardando ? (
                <LoaderCircle
                  size={17}
                  className="pagos-manuales-spin"
                />
              ) : (
                <Save
                  size={17}
                />
              )}

              {guardando
                ? "Guardando..."
                : esEdicion
                  ? "Actualizar beneficiario"
                  : "Guardar beneficiario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}