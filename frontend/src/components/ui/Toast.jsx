import { useEffect } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  X,
} from "lucide-react";

import "./Toast.css";

export default function Toast({
  visible,
  mensaje,
  tipo = "success",
  onClose,
  duracion = 3000,
}) {
  useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(() => {
      onClose?.();
    }, duracion);

    return () => clearTimeout(timer);
  }, [visible, mensaje, tipo, duracion, onClose]);

  if (!visible) return null;

  const Icon =
    tipo === "error"
      ? AlertCircle
      : tipo === "info"
      ? Info
      : CheckCircle2;

  return (
    <div className={`toast toast-${tipo}`}>
      <div className="toast-icon">
        <Icon size={22} />
      </div>

      <div className="toast-content">
        <strong>
          {tipo === "error"
            ? "Error"
            : tipo === "info"
            ? "Información"
            : "Proceso exitoso"}
        </strong>

        <span>{mensaje}</span>
      </div>

      <button
        type="button"
        className="toast-close"
        onClick={onClose}
        aria-label="Cerrar notificación"
      >
        <X size={18} />
      </button>
    </div>
  );
}