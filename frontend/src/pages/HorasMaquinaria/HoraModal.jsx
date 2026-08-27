import { useEffect, useMemo, useState } from "react";
import {
  Save,
  X,
  Clock3,
  Tractor,
} from "lucide-react";

const estadoInicial = {
  maquinaria: "",
  operario: "",
  fecha: "",
  horaInicio: "",
  horaFinal: "",
  observaciones: "",
};

const convertirHoraAMinutos = (hora) => {
  if (!hora || !hora.includes(":")) {
    return null;
  }

  const [horas, minutos] = hora
    .split(":")
    .map(Number);

  if (
    Number.isNaN(horas) ||
    Number.isNaN(minutos)
  ) {
    return null;
  }

  return horas * 60 + minutos;
};

const formatearMinutos = (minutos) => {
  if (
    minutos === null ||
    minutos === undefined ||
    minutos < 0
  ) {
    return "0 h 0 min";
  }

  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;

  if (resto === 0) {
    return `${horas} h`;
  }

  return `${horas} h ${resto} min`;
};

export default function HoraModal({
  abierto,
  onCerrar,
  onGuardar,
  registroEditar,
  guardando,
  maquinarias = [],
}) {
  const [form, setForm] = useState(
    estadoInicial
  );

  useEffect(() => {
    if (registroEditar) {
      setForm({
        maquinaria:
          registroEditar.maquinaria?._id ||
          registroEditar.maquinaria ||
          "",
        operario:
          registroEditar.operario || "",
        fecha: registroEditar.fecha
          ? new Date(registroEditar.fecha)
              .toISOString()
              .slice(0, 10)
          : "",
        horaInicio:
          registroEditar.horaInicio || "",
        horaFinal:
          registroEditar.horaFinal || "",
        observaciones:
          registroEditar.observaciones ||
          "",
      });
    } else {
      const hoy = new Date();

      const hoyLocal = new Date(
        hoy.getTime() -
          hoy.getTimezoneOffset() * 60000
      )
        .toISOString()
        .slice(0, 10);

      setForm({
        ...estadoInicial,
        fecha: hoyLocal,
      });
    }
  }, [registroEditar, abierto]);

  const totalMinutos = useMemo(() => {
    const inicio =
      convertirHoraAMinutos(
        form.horaInicio
      );

    const final =
      convertirHoraAMinutos(
        form.horaFinal
      );

    if (
      inicio === null ||
      final === null ||
      final <= inicio
    ) {
      return 0;
    }

    return final - inicio;
  }, [
    form.horaInicio,
    form.horaFinal,
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.maquinaria) {
      alert("Debe seleccionar una máquina");
      return;
    }

    if (!form.operario.trim()) {
      alert("El operario es obligatorio");
      return;
    }

    if (!form.fecha) {
      alert("La fecha es obligatoria");
      return;
    }

    if (!form.horaInicio) {
      alert(
        "La hora de inicio es obligatoria"
      );
      return;
    }

    if (!form.horaFinal) {
      alert(
        "La hora final es obligatoria"
      );
      return;
    }

    if (totalMinutos <= 0) {
      alert(
        "La hora final debe ser mayor que la hora de inicio"
      );
      return;
    }

    await onGuardar(form);
  };

  if (!abierto) {
    return null;
  }

  return (
    <div className="horas-modal-overlay">
      <div className="horas-modal">
        <div className="horas-modal-header">
          <div className="horas-modal-title">
            <div className="horas-modal-icon">
              <Clock3 size={20} />
            </div>

            <div>
              <span className="horas-modal-kicker">
                {registroEditar
                  ? "Actualizar jornada"
                  : "Nuevo registro"}
              </span>

              <h2>
                {registroEditar
                  ? "Editar horas trabajadas"
                  : "Registrar horas trabajadas"}
              </h2>
            </div>
          </div>

          <button
            type="button"
            className="horas-modal-close"
            onClick={onCerrar}
            disabled={guardando}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="horas-modal-body">
            <div className="horas-form-grid">
              <div className="horas-field horas-field-full">
                <label htmlFor="maquinaria">
                  Máquina *
                </label>

                <div className="horas-select-with-icon">
                  <Tractor size={18} />

                  <select
                    id="maquinaria"
                    name="maquinaria"
                    value={form.maquinaria}
                    onChange={handleChange}
                  >
                    <option value="">
                      Seleccione una máquina
                    </option>

                    {maquinarias
                      .filter(
                        (maquina) =>
                          maquina.estado ===
                            "Activa" ||
                          maquina._id ===
                            form.maquinaria
                      )
                      .map((maquina) => (
                        <option
                          key={maquina._id}
                          value={maquina._id}
                        >
                          {maquina.codigo} -{" "}
                          {maquina.nombre}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="horas-field">
                <label htmlFor="operario">
                  Operario *
                </label>

                <input
                  id="operario"
                  type="text"
                  name="operario"
                  value={form.operario}
                  onChange={handleChange}
                  placeholder="Ej. Juan Pérez"
                  autoComplete="off"
                />
              </div>

              <div className="horas-field">
                <label htmlFor="fecha">
                  Fecha *
                </label>

                <input
                  id="fecha"
                  type="date"
                  name="fecha"
                  value={form.fecha}
                  onChange={handleChange}
                />
              </div>

              <div className="horas-field">
                <label htmlFor="horaInicio">
                  Hora de inicio *
                </label>

                <input
                  id="horaInicio"
                  type="time"
                  name="horaInicio"
                  value={form.horaInicio}
                  onChange={handleChange}
                />
              </div>

              <div className="horas-field">
                <label htmlFor="horaFinal">
                  Hora final *
                </label>

                <input
                  id="horaFinal"
                  type="time"
                  name="horaFinal"
                  value={form.horaFinal}
                  onChange={handleChange}
                />
              </div>

              <div className="horas-field horas-field-full">
                <div className="horas-total-preview">
                  <div>
                    <span>
                      Total de horas del registro
                    </span>

                    <strong>
                      {formatearMinutos(
                        totalMinutos
                      )}
                    </strong>
                  </div>

                  <Clock3 size={24} />
                </div>
              </div>

              <div className="horas-field horas-field-full">
                <label htmlFor="observaciones">
                  Observaciones
                </label>

                <textarea
                  id="observaciones"
                  name="observaciones"
                  value={form.observaciones}
                  onChange={handleChange}
                  placeholder="Información adicional del trabajo realizado"
                  rows="3"
                />
              </div>
            </div>
          </div>

          <div className="horas-modal-footer">
            <button
              type="button"
              className="horas-btn-secondary"
              onClick={onCerrar}
              disabled={guardando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="horas-btn-primary"
              disabled={guardando}
            >
              <Save size={18} />

              {guardando
                ? "Guardando..."
                : registroEditar
                ? "Actualizar registro"
                : "Guardar registro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}