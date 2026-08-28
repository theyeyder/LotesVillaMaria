import { useEffect, useState } from "react";
import {
  Building2,
  Ruler,
  Save,
  X,
} from "lucide-react";

const estadoInicial = {
  nombre: "",
  areaM2: "",
  descripcion: "",
  estado: "Activa",
};

export default function ManzanaModal({
  abierto,
  onCerrar,
  onGuardar,
  manzanaEditar,
  guardando = false,
}) {
  const [form, setForm] =
    useState(estadoInicial);

  /* =======================================================
     CARGAR DATOS
  ======================================================= */

  useEffect(() => {
    if (!abierto) {
      return;
    }

    if (manzanaEditar) {
      setForm({
        nombre:
          manzanaEditar.nombre || "",

        areaM2:
          manzanaEditar.areaM2 ??
          "",

        descripcion:
          manzanaEditar.descripcion ||
          "",

        estado:
          manzanaEditar.estado ||
          "Activa",
      });

      return;
    }

    setForm({
      ...estadoInicial,
    });
  }, [
    abierto,
    manzanaEditar,
  ]);

  /* =======================================================
     CAMBIOS GENERALES
  ======================================================= */

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    let nuevoValor = value;

    if (name === "nombre") {
      nuevoValor =
        value.toUpperCase();
    }

    setForm((prev) => ({
      ...prev,
      [name]: nuevoValor,
    }));
  };

  /* =======================================================
     ÁREA
  ======================================================= */

  const handleAreaChange = (e) => {
    let valor =
      e.target.value;

    /*
      Permitimos números y punto decimal.
      Ejemplo:
      2500
      2500.50
    */

    valor = valor.replace(
      /[^0-9.]/g,
      ""
    );

    /*
      Evitamos más de un punto.
    */

    const partes =
      valor.split(".");

    if (partes.length > 2) {
      valor = `${partes[0]}.${partes
        .slice(1)
        .join("")}`;
    }

    setForm((prev) => ({
      ...prev,
      areaM2: valor,
    }));
  };

  /* =======================================================
     GUARDAR
  ======================================================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.nombre.trim()) {
      alert(
        "El nombre de la manzana es obligatorio"
      );

      return;
    }

    if (
      form.areaM2 !== "" &&
      Number(form.areaM2) < 0
    ) {
      alert(
        "El área de la manzana no puede ser negativa"
      );

      return;
    }

    await onGuardar({
      nombre:
        form.nombre.trim(),

      /*
        Si queda vacío enviamos null.
      */
      areaM2:
        form.areaM2 === ""
          ? null
          : Number(form.areaM2),

      descripcion:
        form.descripcion.trim(),

      estado:
        form.estado,
    });
  };

  if (!abierto) {
    return null;
  }

  return (
    <div className="lotes-modal-overlay">
      <div className="lotes-modal manzana-modal">

        {/* =========================================
            CABECERA
        ========================================= */}

        <div className="lotes-modal-header">
          <div className="lotes-modal-title">
            <div className="lotes-modal-icon">
              <Building2 size={21} />
            </div>

            <div>
              <span className="lotes-modal-kicker">
                {manzanaEditar
                  ? "Actualizar manzana"
                  : "Nueva manzana"}
              </span>

              <h2>
                {manzanaEditar
                  ? "Editar manzana"
                  : "Crear manzana"}
              </h2>
            </div>
          </div>

          <button
            type="button"
            className="lotes-modal-close"
            onClick={onCerrar}
            disabled={guardando}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* =========================================
            FORMULARIO
        ========================================= */}

        <form onSubmit={handleSubmit}>
          <div className="lotes-modal-body">

            {/* CÓDIGO */}

            {manzanaEditar?.codigo && (
              <div className="manzana-code-preview">
                <span>
                  Código de la manzana
                </span>

                <strong>
                  {manzanaEditar.codigo}
                </strong>

                <small>
                  El código se genera
                  automáticamente y no
                  puede modificarse.
                </small>
              </div>
            )}

            <div className="lotes-form-grid">

              {/* NOMBRE */}

              <div className="lotes-field lotes-field-full">
                <label htmlFor="nombre">
                  Nombre de la manzana *
                </label>

                <input
                  id="nombre"
                  type="text"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Ej. MANZANA A"
                  autoComplete="off"
                  maxLength={60}
                />

                <small className="lotes-field-help">
                  Ejemplo: MANZANA A,
                  MANZANA B, MANZANA C.
                </small>
              </div>

              {/* =====================================
                  ÁREA TOTAL
              ===================================== */}

              <div className="lotes-field lotes-field-full">
                <label htmlFor="areaM2">
                  Área total de la manzana
                </label>

                <div className="manzana-area-input">
                  <div className="manzana-area-icon">
                    <Ruler size={18} />
                  </div>

                  <input
                    id="areaM2"
                    type="text"
                    inputMode="decimal"
                    name="areaM2"
                    value={form.areaM2}
                    onChange={
                      handleAreaChange
                    }
                    placeholder="Ej. 2500"
                    autoComplete="off"
                  />

                  <span>
                    m²
                  </span>
                </div>

                <small className="lotes-field-help">
                  Campo opcional. Puede
                  dejarlo vacío si todavía
                  no conoce el área total.
                </small>
              </div>

              {/* ESTADO */}

              <div className="lotes-field lotes-field-full">
                <label htmlFor="estado">
                  Estado
                </label>

                <select
                  id="estado"
                  name="estado"
                  value={form.estado}
                  onChange={handleChange}
                >
                  <option value="Activa">
                    Activa
                  </option>

                  <option value="Inactiva">
                    Inactiva
                  </option>
                </select>
              </div>

              {/* DESCRIPCIÓN */}

              <div className="lotes-field lotes-field-full">
                <label htmlFor="descripcion">
                  Descripción
                </label>

                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={
                    form.descripcion
                  }
                  onChange={handleChange}
                  placeholder="Ej. Sector principal del proyecto"
                  rows="3"
                  maxLength={300}
                />
              </div>
            </div>

            {/* =====================================
                INFORMACIÓN
            ===================================== */}

            {!manzanaEditar && (
              <div className="manzana-info-box">
                <Building2 size={20} />

                <div>
                  <strong>
                    Código automático
                  </strong>

                  <span>
                    Al guardar, el sistema
                    asignará un código como
                    MZ-001, MZ-002,
                    MZ-003...
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* =========================================
              BOTONES
          ========================================= */}

          <div className="lotes-modal-footer">
            <button
              type="button"
              className="lotes-btn-secondary"
              onClick={onCerrar}
              disabled={guardando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="lotes-btn-primary"
              disabled={guardando}
            >
              <Save size={18} />

              {guardando
                ? "Guardando..."
                : manzanaEditar
                ? "Actualizar manzana"
                : "Guardar manzana"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}