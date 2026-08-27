import { useEffect, useState } from "react";
import { X, Save } from "lucide-react";

const estadoInicial = {
  nombres: "",
  apellidos: "",
  tipoDocumento: "CC",
  documento: "",
  telefono: "",
  correo: "",
  ciudad: "",
  direccion: "",
  observaciones: "",
  estado: "Activo",
};

export default function ClienteModal({
  abierto,
  onCerrar,
  onGuardar,
  clienteEditar,
  guardando,
}) {
  const [form, setForm] = useState(estadoInicial);

  useEffect(() => {
    if (clienteEditar) {
      setForm({
        nombres: clienteEditar.nombres || "",
        apellidos: clienteEditar.apellidos || "",
        tipoDocumento: clienteEditar.tipoDocumento || "CC",
        documento: clienteEditar.documento || "",
        telefono: clienteEditar.telefono || "",
        correo: clienteEditar.correo || "",
        ciudad: clienteEditar.ciudad || "",
        direccion: clienteEditar.direccion || "",
        observaciones: clienteEditar.observaciones || "",
        estado: clienteEditar.estado || "Activo",
      });
    } else {
      setForm(estadoInicial);
    }
  }, [clienteEditar, abierto]);

  if (!abierto) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    let nuevoValor = value;

    if (name === "documento" || name === "telefono") {
      nuevoValor = value.replace(/\D/g, "");
    }

    setForm((prev) => ({
      ...prev,
      [name]: nuevoValor,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.nombres.trim()) {
      alert("Los nombres son obligatorios");
      return;
    }

    if (!form.apellidos.trim()) {
      alert("Los apellidos son obligatorios");
      return;
    }

    if (!form.documento.trim()) {
      alert("El documento es obligatorio");
      return;
    }

    await onGuardar(form);
  };

  return (
    <div className="cliente-modal-overlay">
      <div className="cliente-modal">
        <div className="cliente-modal-header">
          <div>
            <span className="cliente-modal-kicker">
              {clienteEditar ? "Actualizar información" : "Nuevo registro"}
            </span>

            <h2>
              {clienteEditar ? "Editar cliente" : "Registrar cliente"}
            </h2>
          </div>

          <button
            type="button"
            className="cliente-modal-close"
            onClick={onCerrar}
            disabled={guardando}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="cliente-modal-body">
            <div className="cliente-form-grid">
              <div className="cliente-field">
                <label htmlFor="nombres">Nombres *</label>

                <input
                  id="nombres"
                  type="text"
                  name="nombres"
                  value={form.nombres}
                  onChange={handleChange}
                  placeholder="Ej. Carlos Andrés"
                  autoComplete="off"
                />
              </div>

              <div className="cliente-field">
                <label htmlFor="apellidos">Apellidos *</label>

                <input
                  id="apellidos"
                  type="text"
                  name="apellidos"
                  value={form.apellidos}
                  onChange={handleChange}
                  placeholder="Ej. Ramírez López"
                  autoComplete="off"
                />
              </div>

              <div className="cliente-field">
                <label htmlFor="tipoDocumento">
                  Tipo de documento *
                </label>

                <select
                  id="tipoDocumento"
                  name="tipoDocumento"
                  value={form.tipoDocumento}
                  onChange={handleChange}
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
                </select>
              </div>

              <div className="cliente-field">
                <label htmlFor="documento">
                  Número de documento *
                </label>

                <input
                  id="documento"
                  type="text"
                  inputMode="numeric"
                  name="documento"
                  value={form.documento}
                  onChange={handleChange}
                  placeholder="Ej. 1110465789"
                  autoComplete="off"
                />
              </div>

              <div className="cliente-field">
                <label htmlFor="telefono">
                  Teléfono
                </label>

                <input
                  id="telefono"
                  type="tel"
                  inputMode="numeric"
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  placeholder="Ej. 3001234567"
                  autoComplete="tel"
                  maxLength="10"
                />
              </div>

              <div className="cliente-field">
                <label htmlFor="correo">Correo</label>

                <input
                  id="correo"
                  type="email"
                  name="correo"
                  value={form.correo}
                  onChange={handleChange}
                  placeholder="cliente@correo.com"
                  autoComplete="off"
                />
              </div>

              <div className="cliente-field">
                <label htmlFor="ciudad">Ciudad</label>

                <input
                  id="ciudad"
                  type="text"
                  name="ciudad"
                  list="ciudades-colombia"
                  value={form.ciudad}
                  onChange={handleChange}
                  placeholder="Seleccione o escriba la ciudad"
                  autoComplete="off"
                />

                <datalist id="ciudades-colombia">
                  <option value="Ibagué" />
                  <option value="Bogotá" />
                  <option value="Medellín" />
                  <option value="Cali" />
                  <option value="Barranquilla" />
                  <option value="Armenia" />
                  <option value="Pereira" />
                  <option value="Manizales" />
                  <option value="Neiva" />
                  <option value="Espinal" />
                  <option value="Melgar" />
                  <option value="Girardot" />
                </datalist>
              </div>

              <div className="cliente-field cliente-field-full">
                <label htmlFor="direccion">Dirección</label>

                <input
                  id="direccion"
                  type="text"
                  name="direccion"
                  value={form.direccion}
                  onChange={handleChange}
                  placeholder="Dirección del cliente"
                  autoComplete="off"
                />
              </div>

              <div className="cliente-field">
                <label htmlFor="estado">Estado</label>

                <select
                  id="estado"
                  name="estado"
                  value={form.estado}
                  onChange={handleChange}
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>

              <div className="cliente-field cliente-field-full">
                <label htmlFor="observaciones">Observaciones</label>

                <textarea
                  id="observaciones"
                  name="observaciones"
                  value={form.observaciones}
                  onChange={handleChange}
                  placeholder="Información adicional del cliente"
                  rows="4"
                />
              </div>
            </div>
          </div>

          <div className="cliente-modal-footer">
            <button
              type="button"
              className="cliente-btn-secondary"
              onClick={onCerrar}
              disabled={guardando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="cliente-btn-primary"
              disabled={guardando}
            >
              <Save size={18} />

              {guardando
                ? "Guardando..."
                : clienteEditar
                ? "Actualizar cliente"
                : "Guardar cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}