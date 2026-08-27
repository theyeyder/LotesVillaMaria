import { useEffect, useState } from "react";
import { Save, X, Tractor } from "lucide-react";

const estadoInicial = {
  nombre: "",
  tipo: "",
  placa: "",
  marca: "",
  modelo: "",
  descripcion: "",
  estado: "Activa",
};

export default function MaquinariaModal({
  abierto,
  onCerrar,
  onGuardar,
  maquinariaEditar,
  guardando,
}) {
  const [form, setForm] = useState(estadoInicial);

  useEffect(() => {
    if (maquinariaEditar) {
      setForm({
        nombre: maquinariaEditar.nombre || "",
        tipo: maquinariaEditar.tipo || "",
        placa: maquinariaEditar.placa || "",
        marca: maquinariaEditar.marca || "",
        modelo: maquinariaEditar.modelo || "",
        descripcion: maquinariaEditar.descripcion || "",
        estado: maquinariaEditar.estado || "Activa",
      });
    } else {
      setForm(estadoInicial);
    }
  }, [maquinariaEditar, abierto]);

  if (!abierto) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    let nuevoValor = value;

    if (name === "placa") {
      nuevoValor = value.toUpperCase();
    }

    setForm((prev) => ({
      ...prev,
      [name]: nuevoValor,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.nombre.trim()) {
      alert("El nombre de la máquina es obligatorio");
      return;
    }

    await onGuardar(form);
  };

  return (
    <div className="maquinaria-modal-overlay">
      <div className="maquinaria-modal">
        <div className="maquinaria-modal-header">
          <div className="maquinaria-modal-title">
            <div className="maquinaria-modal-icon">
              <Tractor size={20} />
            </div>

            <div>
              <span className="maquinaria-modal-kicker">
                {maquinariaEditar
                  ? "Actualizar información"
                  : "Nuevo registro"}
              </span>

              <h2>
                {maquinariaEditar
                  ? "Editar máquina"
                  : "Registrar máquina"}
              </h2>
            </div>
          </div>

          <button
            type="button"
            className="maquinaria-modal-close"
            onClick={onCerrar}
            disabled={guardando}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="maquinaria-modal-body">
            <div className="maquinaria-form-grid">
              <div className="maquinaria-field">
                <label htmlFor="nombre">
                  Nombre de la máquina *
                </label>

                <input
                  id="nombre"
                  type="text"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Ej. Retroexcavadora CAT"
                  autoComplete="off"
                />
              </div>

              <div className="maquinaria-field">
                <label htmlFor="tipo">
                  Tipo de máquina
                </label>

                <select
                  id="tipo"
                  name="tipo"
                  value={form.tipo}
                  onChange={handleChange}
                >
                  <option value="">
                    Seleccione...
                  </option>

                  <option value="Retroexcavadora">
                    Retroexcavadora
                  </option>

                  <option value="Excavadora">
                    Excavadora
                  </option>

                  <option value="Bulldozer">
                    Bulldozer
                  </option>

                  <option value="Motoniveladora">
                    Motoniveladora
                  </option>

                  <option value="Volqueta">
                    Volqueta
                  </option>

                  <option value="Compactador">
                    Compactador
                  </option>

                  <option value="Cargador">
                    Cargador
                  </option>

                  <option value="Otro">
                    Otro
                  </option>
                </select>
              </div>

              <div className="maquinaria-field">
                <label htmlFor="placa">
                  Placa / Identificación
                </label>

                <input
                  id="placa"
                  type="text"
                  name="placa"
                  value={form.placa}
                  onChange={handleChange}
                  placeholder="Ej. ABC123"
                  autoComplete="off"
                />
              </div>

              <div className="maquinaria-field">
                <label htmlFor="marca">
                  Marca
                </label>

                <input
                  id="marca"
                  type="text"
                  name="marca"
                  value={form.marca}
                  onChange={handleChange}
                  placeholder="Ej. Caterpillar"
                  autoComplete="off"
                />
              </div>

              <div className="maquinaria-field">
                <label htmlFor="modelo">
                  Modelo
                </label>

                <input
                  id="modelo"
                  type="text"
                  name="modelo"
                  value={form.modelo}
                  onChange={handleChange}
                  placeholder="Ej. 420F"
                  autoComplete="off"
                />
              </div>

              <div className="maquinaria-field">
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

                  <option value="Mantenimiento">
                    Mantenimiento
                  </option>
                </select>
              </div>

              <div className="maquinaria-field maquinaria-field-full">
                <label htmlFor="descripcion">
                  Descripción
                </label>

                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  placeholder="Información adicional de la máquina"
                  rows="3"
                />
              </div>
            </div>
          </div>

          <div className="maquinaria-modal-footer">
            <button
              type="button"
              className="maquinaria-btn-secondary"
              onClick={onCerrar}
              disabled={guardando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="maquinaria-btn-primary"
              disabled={guardando}
            >
              <Save size={18} />

              {guardando
                ? "Guardando..."
                : maquinariaEditar
                ? "Actualizar máquina"
                : "Guardar máquina"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}