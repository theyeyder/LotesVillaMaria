import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  Calculator,
  DollarSign,
  LandPlot,
  Save,
  ShoppingCart,
  UserRound,
  X,
} from "lucide-react";

/* =========================================================
   FECHA LOCAL
========================================================= */

const obtenerFechaActual = () => {
  const fecha = new Date();

  const year =
    fecha.getFullYear();

  const month = String(
    fecha.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    fecha.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/* =========================================================
   ESTADO INICIAL
========================================================= */

const crearEstadoInicial = () => ({
  cliente: "",

  manzana: "",

  lote: "",

  fechaVenta:
    obtenerFechaActual(),

  valorVenta: "",

  cuotaInicial: "",

  formaPago:
    "Financiado",

  numeroCuotas: "",

  observaciones: "",
});

/* =========================================================
   MONEDA
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
   NOMBRE DEL CLIENTE
========================================================= */

const obtenerNombreCliente = (
  cliente
) => {
  if (!cliente) {
    return "";
  }

  const nombre = [
    cliente.nombres,
    cliente.apellidos,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    nombre ||
    cliente.nombre ||
    cliente.razonSocial ||
    "Cliente"
  );
};

/* =========================================================
   COMPONENTE
========================================================= */

export default function VentaModal({
  abierto,
  onCerrar,
  onGuardar,

  ventaEditar = null,

  guardando = false,

  clientes = [],

  manzanas = [],

  lotes = [],
}) {
  const [
    form,
    setForm,
  ] = useState(
    crearEstadoInicial()
  );

  /* =======================================================
     CARGAR DATOS AL ABRIR
  ======================================================= */

  useEffect(() => {
    if (!abierto) {
      return;
    }

    /* =========================
       EDITAR
    ========================= */

    if (ventaEditar) {
      const loteVenta =
        ventaEditar.lote;

      setForm({
        cliente:
          ventaEditar.cliente
            ?._id ||
          ventaEditar.cliente ||
          "",

        manzana:
          loteVenta?.manzana
            ?._id ||
          loteVenta?.manzana ||
          "",

        lote:
          loteVenta?._id ||
          loteVenta ||
          "",

        fechaVenta:
          ventaEditar.fechaVenta
            ? new Date(
                ventaEditar.fechaVenta
              )
                .toISOString()
                .slice(0, 10)
            : obtenerFechaActual(),

        valorVenta:
          ventaEditar.valorVenta ??
          "",

        cuotaInicial:
          ventaEditar.cuotaInicial ??
          "",

        formaPago:
          ventaEditar.formaPago ||
          "Financiado",

        numeroCuotas:
          ventaEditar.numeroCuotas ||
          "",

        observaciones:
          ventaEditar.observaciones ||
          "",
      });

      return;
    }

    /* =========================
       NUEVA VENTA
    ========================= */

    setForm(
      crearEstadoInicial()
    );
  }, [
    abierto,
    ventaEditar,
  ]);

  /* =======================================================
     LOTES DISPONIBLES
  ======================================================= */

  const lotesDisponibles =
    useMemo(() => {
      return lotes.filter(
        (lote) => {
          /*
            En edición dejamos visible
            el lote que ya pertenece
            a la venta.
          */

          if (
            ventaEditar &&
            lote._id ===
              (ventaEditar.lote?._id ||
                ventaEditar.lote)
          ) {
            return true;
          }

          return (
            lote.estado ===
            "Disponible"
          );
        }
      );
    }, [
      lotes,
      ventaEditar,
    ]);

  /* =======================================================
     LOTES SEGÚN MANZANA
  ======================================================= */

  const lotesDeManzana =
    useMemo(() => {
      if (!form.manzana) {
        return [];
      }

      return lotesDisponibles.filter(
        (lote) => {
          const manzanaId =
            lote.manzana?._id ||
            lote.manzana;

          return (
            manzanaId ===
            form.manzana
          );
        }
      );
    }, [
      lotesDisponibles,
      form.manzana,
    ]);

  /* =======================================================
     LOTE SELECCIONADO
  ======================================================= */

  const loteSeleccionado =
    useMemo(() => {
      return lotes.find(
        (lote) =>
          lote._id ===
          form.lote
      );
    }, [
      lotes,
      form.lote,
    ]);

  /* =======================================================
     CÁLCULOS
  ======================================================= */

  const valorVenta =
    Number(
      form.valorVenta
    ) || 0;

  const cuotaInicial =
    form.formaPago ===
    "Contado"
      ? valorVenta
      : Number(
          form.cuotaInicial
        ) || 0;

  const saldoFinanciar =
    form.formaPago ===
    "Contado"
      ? 0
      : Math.max(
          0,
          valorVenta -
            cuotaInicial
        );

  const cantidadCuotas =
    Number(
      form.numeroCuotas
    ) || 0;

  const valorCuota =
    form.formaPago ===
      "Financiado" &&
    cantidadCuotas > 0
      ? saldoFinanciar /
        cantidadCuotas
      : 0;

  /* =======================================================
     CAMBIOS
  ======================================================= */

  const handleChange = (
    e
  ) => {
    const {
      name,
      value,
    } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* =======================================================
     SELECCIONAR MANZANA
  ======================================================= */

  const handleManzanaChange = (
    e
  ) => {
    const value =
      e.target.value;

    setForm((prev) => ({
      ...prev,

      manzana:
        value,

      lote: "",

      valorVenta: "",
    }));
  };

  /* =======================================================
     SELECCIONAR LOTE

     Al escoger un lote tomamos
     automáticamente su valor general.
  ======================================================= */

  const handleLoteChange = (
    e
  ) => {
    const loteId =
      e.target.value;

    const lote =
      lotes.find(
        (item) =>
          item._id === loteId
      );

    setForm((prev) => ({
      ...prev,

      lote:
        loteId,

      valorVenta:
        lote?.valorLote != null
          ? String(
              lote.valorLote
            )
          : "",
    }));
  };

  /* =======================================================
     CAMPOS DE DINERO
  ======================================================= */

  const handleDineroChange = (
    e
  ) => {
    const {
      name,
      value,
    } = e.target;

    const limpio =
      value.replace(
        /\D/g,
        ""
      );

    setForm((prev) => ({
      ...prev,

      [name]:
        limpio,
    }));
  };

  /* =======================================================
     NÚMERO DE CUOTAS
  ======================================================= */

  const handleCuotasChange = (
    e
  ) => {
    const limpio =
      e.target.value.replace(
        /\D/g,
        ""
      );

    setForm((prev) => ({
      ...prev,

      numeroCuotas:
        limpio,
    }));
  };

  /* =======================================================
     FORMA DE PAGO
  ======================================================= */

  const handleFormaPago = (
    e
  ) => {
    const value =
      e.target.value;

    setForm((prev) => ({
      ...prev,

      formaPago:
        value,

      cuotaInicial:
        value === "Contado"
          ? prev.valorVenta
          : "",

      numeroCuotas:
        value === "Contado"
          ? ""
          : prev.numeroCuotas,
    }));
  };

  /* =======================================================
     VALIDAR
  ======================================================= */

  const validar = () => {
    if (!form.cliente) {
      alert(
        "Debe seleccionar un cliente"
      );

      return false;
    }

    if (!form.lote) {
      alert(
        "Debe seleccionar un lote"
      );

      return false;
    }

    if (!form.fechaVenta) {
      alert(
        "La fecha de venta es obligatoria"
      );

      return false;
    }

    if (
      valorVenta <= 0
    ) {
      alert(
        "El valor de la venta debe ser mayor que cero"
      );

      return false;
    }

    if (
      form.formaPago ===
      "Financiado"
    ) {
      if (
        cuotaInicial < 0
      ) {
        alert(
          "La cuota inicial no puede ser negativa"
        );

        return false;
      }

      if (
        cuotaInicial >=
        valorVenta
      ) {
        alert(
          "En una venta financiada la cuota inicial debe ser menor que el valor de la venta"
        );

        return false;
      }

      if (
        cantidadCuotas <= 0
      ) {
        alert(
          "Debe indicar el número de cuotas"
        );

        return false;
      }
    }

    return true;
  };

  /* =======================================================
     GUARDAR
  ======================================================= */

  const handleSubmit = async (
    e
  ) => {
    e.preventDefault();

    if (!validar()) {
      return;
    }

    const datos = {
      cliente:
        form.cliente,

      fechaVenta:
        form.fechaVenta,

      valorVenta:
        valorVenta,

      cuotaInicial:
        form.formaPago ===
        "Contado"
          ? valorVenta
          : cuotaInicial,

      formaPago:
        form.formaPago,

      numeroCuotas:
        form.formaPago ===
        "Contado"
          ? 0
          : cantidadCuotas,

      observaciones:
        form.observaciones.trim(),
    };

    /*
      Para crear sí enviamos lote.

      En edición el backend conserva
      el lote original.
    */

    if (!ventaEditar) {
      datos.lote =
        form.lote;
    }

    await onGuardar(
      datos
    );
  };

  if (!abierto) {
    return null;
  }

  return (
    <div className="ventas-modal-overlay">
      <div className="ventas-modal">
        {/* =========================================
            CABECERA
        ========================================= */}

        <div className="ventas-modal-header">
          <div className="ventas-modal-title">
            <div className="ventas-modal-icon">
              <ShoppingCart
                size={21}
              />
            </div>

            <div>
              <span>
                {ventaEditar
                  ? "Actualizar venta"
                  : "Nueva venta"}
              </span>

              <h2>
                {ventaEditar
                  ? "Editar venta"
                  : "Registrar venta"}
              </h2>
            </div>
          </div>

          <button
            type="button"
            className="ventas-modal-close"
            onClick={onCerrar}
            disabled={guardando}
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={
            handleSubmit
          }
        >
          <div className="ventas-modal-body">

            {/* =====================================
                CÓDIGO
            ===================================== */}

            {ventaEditar?.codigo && (
              <div className="venta-code-box">
                <span>
                  Venta
                </span>

                <strong>
                  {
                    ventaEditar.codigo
                  }
                </strong>

                <small>
                  Código generado
                  automáticamente.
                </small>
              </div>
            )}

            {/* =====================================
                CLIENTE
            ===================================== */}

            <div className="ventas-section">
              <div className="ventas-section-title">
                <UserRound
                  size={18}
                />

                <div>
                  <span>
                    Comprador
                  </span>

                  <h3>
                    Cliente
                  </h3>
                </div>
              </div>

              <div className="ventas-field">
                <label>
                  Seleccionar cliente *
                </label>

                <select
                  name="cliente"
                  value={
                    form.cliente
                  }
                  onChange={
                    handleChange
                  }
                >
                  <option value="">
                    Seleccione un cliente
                  </option>

                  {clientes.map(
                    (cliente) => (
                      <option
                        key={
                          cliente._id
                        }
                        value={
                          cliente._id
                        }
                      >
                        {obtenerNombreCliente(
                          cliente
                        )}

                        {cliente.documento
                          ? ` - ${cliente.documento}`
                          : ""}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            {/* =====================================
                LOTE
            ===================================== */}

            <div className="ventas-section">
              <div className="ventas-section-title">
                <LandPlot
                  size={18}
                />

                <div>
                  <span>
                    Inmueble
                  </span>

                  <h3>
                    Lote a vender
                  </h3>
                </div>
              </div>

              <div className="ventas-form-grid">

                {/* MANZANA */}

                <div className="ventas-field">
                  <label>
                    Manzana *
                  </label>

                  <select
                    name="manzana"
                    value={
                      form.manzana
                    }
                    onChange={
                      handleManzanaChange
                    }
                    disabled={
                      Boolean(
                        ventaEditar
                      )
                    }
                  >
                    <option value="">
                      Seleccione
                    </option>

                    {manzanas.map(
                      (manzana) => (
                        <option
                          key={
                            manzana._id
                          }
                          value={
                            manzana._id
                          }
                        >
                          {
                            manzana.codigo
                          }{" "}
                          -{" "}
                          {
                            manzana.nombre
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* LOTE */}

                <div className="ventas-field">
                  <label>
                    Lote disponible *
                  </label>

                  <select
                    name="lote"
                    value={
                      form.lote
                    }
                    onChange={
                      handleLoteChange
                    }
                    disabled={
                      !form.manzana ||
                      Boolean(
                        ventaEditar
                      )
                    }
                  >
                    <option value="">
                      Seleccione
                    </option>

                    {lotesDeManzana.map(
                      (lote) => (
                        <option
                          key={
                            lote._id
                          }
                          value={
                            lote._id
                          }
                        >
                          {
                            lote.codigo
                          }{" "}
                          - Lote{" "}
                          {
                            lote.numeroLote
                          }{" "}
                          -{" "}
                          {formatearDinero(
                            lote.valorLote
                          )}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              {/* INFO LOTE */}

              {loteSeleccionado && (
                <div className="venta-lote-preview">
                  <div>
                    <span>
                      Código
                    </span>

                    <strong>
                      {
                        loteSeleccionado.codigo
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Área
                    </span>

                    <strong>
                      {Number(
                        loteSeleccionado.areaM2 ||
                          0
                      ).toLocaleString(
                        "es-CO",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}{" "}
                      m²
                    </strong>
                  </div>

                  <div>
                    <span>
                      Valor registrado
                    </span>

                    <strong>
                      {formatearDinero(
                        loteSeleccionado.valorLote
                      )}
                    </strong>
                  </div>
                </div>
              )}
            </div>

            {/* =====================================
                FECHA
            ===================================== */}

            <div className="ventas-section">
              <div className="ventas-section-title">
                <CalendarDays
                  size={18}
                />

                <div>
                  <span>
                    Registro
                  </span>

                  <h3>
                    Fecha de venta
                  </h3>
                </div>
              </div>

              <div className="ventas-field">
                <label>
                  Fecha *
                </label>

                <input
                  type="date"
                  name="fechaVenta"
                  value={
                    form.fechaVenta
                  }
                  onChange={
                    handleChange
                  }
                />
              </div>
            </div>

            {/* =====================================
                INFORMACIÓN ECONÓMICA
            ===================================== */}

            <div className="ventas-section">
              <div className="ventas-section-title">
                <DollarSign
                  size={18}
                />

                <div>
                  <span>
                    Financiación
                  </span>

                  <h3>
                    Información económica
                  </h3>
                </div>
              </div>

              <div className="ventas-form-grid">

                {/* VALOR */}

                <div className="ventas-field">
                  <label>
                    Valor de venta *
                  </label>

                  <div className="venta-money-input">
                    <span>
                      $
                    </span>

                    <input
                      type="text"
                      inputMode="numeric"
                      name="valorVenta"
                      value={
                        form.valorVenta
                      }
                      onChange={
                        handleDineroChange
                      }
                      placeholder="45000000"
                    />
                  </div>

                  <small>
                    {form.valorVenta
                      ? formatearDinero(
                          form.valorVenta
                        )
                      : ""}
                  </small>
                </div>

                {/* FORMA DE PAGO */}

                <div className="ventas-field">
                  <label>
                    Forma de pago *
                  </label>

                  <select
                    name="formaPago"
                    value={
                      form.formaPago
                    }
                    onChange={
                      handleFormaPago
                    }
                  >
                    <option value="Financiado">
                      Financiado
                    </option>

                    <option value="Contado">
                      Contado
                    </option>
                  </select>
                </div>

                {/* INICIAL */}

                <div className="ventas-field">
                  <label>
                    Cuota inicial
                  </label>

                  <div className="venta-money-input">
                    <span>
                      $
                    </span>

                    <input
                      type="text"
                      inputMode="numeric"
                      name="cuotaInicial"
                      value={
                        form.formaPago ===
                        "Contado"
                          ? form.valorVenta
                          : form.cuotaInicial
                      }
                      onChange={
                        handleDineroChange
                      }
                      disabled={
                        form.formaPago ===
                        "Contado"
                      }
                      placeholder="0"
                    />
                  </div>

                  <small>
                    {form.formaPago ===
                    "Contado"
                      ? "En contado se paga el valor completo."
                      : form.cuotaInicial
                      ? formatearDinero(
                          form.cuotaInicial
                        )
                      : "Puede ser $0"}
                  </small>
                </div>

                {/* CUOTAS */}

                <div className="ventas-field">
                  <label>
                    Número de cuotas
                  </label>

                  <input
                    type="text"
                    inputMode="numeric"
                    name="numeroCuotas"
                    value={
                      form.numeroCuotas
                    }
                    onChange={
                      handleCuotasChange
                    }
                    placeholder="Ej. 35"
                    disabled={
                      form.formaPago ===
                      "Contado"
                    }
                  />
                </div>
              </div>
            </div>

            {/* =====================================
                CÁLCULO
            ===================================== */}

            <div className="venta-calculo-box">
              <div className="venta-calculo-title">
                <Calculator
                  size={19}
                />

                <strong>
                  Resumen de la venta
                </strong>
              </div>

              <div className="venta-calculo-grid">
                <div>
                  <span>
                    Valor venta
                  </span>

                  <strong>
                    {formatearDinero(
                      valorVenta
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Inicial
                  </span>

                  <strong>
                    {formatearDinero(
                      cuotaInicial
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Saldo
                  </span>

                  <strong>
                    {formatearDinero(
                      saldoFinanciar
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Cuotas
                  </span>

                  <strong>
                    {form.formaPago ===
                    "Contado"
                      ? "0"
                      : cantidadCuotas}
                  </strong>
                </div>

                <div className="venta-calculo-cuota">
                  <span>
                    Valor aproximado por cuota
                  </span>

                  <strong>
                    {formatearDinero(
                      valorCuota
                    )}
                  </strong>
                </div>
              </div>
            </div>

            {/* =====================================
                OBSERVACIONES
            ===================================== */}

            <div className="ventas-field venta-observaciones">
              <label>
                Observaciones
              </label>

              <textarea
                name="observaciones"
                value={
                  form.observaciones
                }
                onChange={
                  handleChange
                }
                rows="3"
                maxLength={500}
                placeholder="Información adicional de la venta..."
              />
            </div>
          </div>

          {/* =========================================
              BOTONES
          ========================================= */}

          <div className="ventas-modal-footer">
            <button
              type="button"
              className="ventas-btn-secondary"
              onClick={onCerrar}
              disabled={guardando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="ventas-btn-primary"
              disabled={guardando}
            >
              <Save size={18} />

              {guardando
                ? "Guardando..."
                : ventaEditar
                ? "Actualizar venta"
                : "Registrar venta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}