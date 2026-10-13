import {
  CalendarDays,
  CircleDollarSign,
  LoaderCircle,
  Plus,
  Save,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  actualizarPagoManual,
  crearPagoManual,
} from "../../../services/pagoManual.service.js";

import {
  obtenerBeneficiarios,
} from "../../../services/beneficiario.service.js";

import BeneficiarioModal from "./BeneficiarioModal.jsx";

/* =========================================================
   HELPERS
========================================================= */

const obtenerFechaHoy = () => {
  const fecha =
    new Date();

  const anio =
    fecha.getFullYear();

  const mes =
    String(
      fecha.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const dia =
    String(
      fecha.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${anio}-${mes}-${dia}`;
};

const convertirFechaInput = (
  valor
) => {
  if (!valor) {
    return obtenerFechaHoy();
  }

  const texto =
    String(
      valor
    );

  /*
    Si viene como:

    2026-10-12T05:00:00.000Z

    conservamos:

    2026-10-12
  */

  if (
    /^\d{4}-\d{2}-\d{2}/.test(
      texto
    )
  ) {
    return texto.slice(
      0,
      10
    );
  }

  return obtenerFechaHoy();
};

const formatearDinero = (
  valor
) => {
  const numero =
    Number(
      valor
    );

  if (
    !Number.isFinite(
      numero
    )
  ) {
    return "$ 0";
  }

  return new Intl.NumberFormat(
    "es-CO",
    {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }
  ).format(
    numero
  );
};

/* =========================================================
   FORMULARIO INICIAL
========================================================= */

const crearFormularioInicial =
  () => ({
    beneficiario: "",

    motivo: "",

    valor: "",

    fechaPago:
      obtenerFechaHoy(),

    formaPago:
      "Efectivo",

    referenciaPago:
      "",

    observaciones:
      "",
  });

/* =========================================================
   PAGO MANUAL MODAL
========================================================= */

export default function PagoManualModal({
  abierto,
  onCerrar,
  pagoEditar = null,
  onGuardado,
}) {
  /* =======================================================
     ESTADOS
  ======================================================= */

  const [
    formulario,
    setFormulario,
  ] = useState(
    crearFormularioInicial
  );

  const [
    beneficiarios,
    setBeneficiarios,
  ] = useState([]);

  const [
    cargandoBeneficiarios,
    setCargandoBeneficiarios,
  ] = useState(false);

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    beneficiarioModalAbierto,
    setBeneficiarioModalAbierto,
  ] = useState(false);

  /* =======================================================
     MODO EDICIÓN
  ======================================================= */

  const esEdicion =
    Boolean(
      pagoEditar?._id
    );

  /* =======================================================
     BENEFICIARIO SELECCIONADO
  ======================================================= */

  const beneficiarioSeleccionado =
    useMemo(
      () => {
        return beneficiarios.find(
          (
            beneficiario
          ) =>
            String(
              beneficiario._id
            ) ===
            String(
              formulario.beneficiario
            )
        ) || null;
      },
      [
        beneficiarios,
        formulario.beneficiario,
      ]
    );

  /* =======================================================
     CARGAR BENEFICIARIOS
  ======================================================= */

  const cargarBeneficiarios =
    async () => {
      setCargandoBeneficiarios(
        true
      );

      try {
        /*
          Consultamos todos.

          Esto nos permite conservar visible
          un beneficiario histórico que posteriormente
          haya sido marcado como Inactivo.
        */

        const respuesta =
          await obtenerBeneficiarios();

        const lista =
          Array.isArray(
            respuesta
          )
            ? respuesta
            : respuesta
                ?.beneficiarios ||
              [];

        setBeneficiarios(
          lista
        );
      } catch (errorPeticion) {
        console.error(
          "Error cargando beneficiarios:",
          errorPeticion
        );

        setError(
          errorPeticion
            ?.response
            ?.data
            ?.message ||
            "No fue posible cargar los beneficiarios."
        );
      } finally {
        setCargandoBeneficiarios(
          false
        );
      }
    };

  /* =======================================================
     ABRIR MODAL
  ======================================================= */

  useEffect(
    () => {
      if (!abierto) {
        return;
      }

      setError("");

      cargarBeneficiarios();

      /* ===================================================
         EDICIÓN
      =================================================== */

      if (
        pagoEditar?._id
      ) {
        const beneficiarioId =
          pagoEditar
            ?.beneficiario
            ?._id ||
          pagoEditar
            ?.beneficiario ||
          "";

        setFormulario({
          beneficiario:
            beneficiarioId,

          motivo:
            pagoEditar
              ?.motivo ||
            "",

          valor:
            pagoEditar
              ?.valor ??
            "",

          fechaPago:
            convertirFechaInput(
              pagoEditar
                ?.fechaPago
            ),

          formaPago:
            pagoEditar
              ?.formaPago ||
            "Efectivo",

          referenciaPago:
            pagoEditar
              ?.referenciaPago ||
            "",

          observaciones:
            pagoEditar
              ?.observaciones ||
            "",
        });

        return;
      }

      /* ===================================================
         NUEVO
      =================================================== */

      setFormulario(
        crearFormularioInicial()
      );
    },
    [
      abierto,
      pagoEditar,
    ]
  );

  /* =======================================================
     CAMBIOS DEL FORMULARIO
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
     NUEVO BENEFICIARIO
  ======================================================= */

  const abrirNuevoBeneficiario =
    () => {
      setBeneficiarioModalAbierto(
        true
      );
    };

  const cerrarNuevoBeneficiario =
    () => {
      setBeneficiarioModalAbierto(
        false
      );
    };

  const beneficiarioGuardado =
    async (
      beneficiario
    ) => {
      /*
        Lo agregamos directamente a la lista
        para no obligar al usuario a volverlo
        a buscar.
      */

      setBeneficiarios(
        (
          anteriores
        ) => {
          const existe =
            anteriores.some(
              (
                registro
              ) =>
                String(
                  registro._id
                ) ===
                String(
                  beneficiario._id
                )
            );

          if (existe) {
            return anteriores.map(
              (
                registro
              ) =>
                String(
                  registro._id
                ) ===
                String(
                  beneficiario._id
                )
                  ? beneficiario
                  : registro
            );
          }

          return [
            ...anteriores,
            beneficiario,
          ].sort(
            (
              a,
              b
            ) =>
              String(
                a.nombre ||
                  ""
              ).localeCompare(
                String(
                  b.nombre ||
                    ""
                ),
                "es"
              )
          );
        }
      );

      /*
        Automáticamente seleccionamos
        el beneficiario recién creado.
      */

      setFormulario(
        (
          anterior
        ) => ({
          ...anterior,

          beneficiario:
            beneficiario._id,
        })
      );

      setBeneficiarioModalAbierto(
        false
      );
    };

  /* =======================================================
     VALIDAR
  ======================================================= */

  const validarFormulario =
    () => {
      if (
        !formulario.beneficiario
      ) {
        return "Seleccione el beneficiario que recibirá el pago.";
      }

      if (
        !formulario.motivo.trim()
      ) {
        return "Digite el motivo del pago.";
      }

      const valor =
        Number(
          formulario.valor
        );

      if (
        !Number.isFinite(
          valor
        ) ||
        valor <= 0
      ) {
        return "Digite un valor de pago válido.";
      }

      if (
        !formulario.fechaPago
      ) {
        return "Seleccione la fecha del pago.";
      }

      if (
        !formulario.formaPago
      ) {
        return "Seleccione la forma de pago.";
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

    if (
      mensajeValidacion
    ) {
      setError(
        mensajeValidacion
      );

      return;
    }

    setGuardando(true);

    setError("");

    try {
      const datos = {
        beneficiario:
          formulario.beneficiario,

        motivo:
          formulario.motivo.trim(),

        valor:
          Number(
            formulario.valor
          ),

        fechaPago:
          formulario.fechaPago,

        formaPago:
          formulario.formaPago,

        referenciaPago:
          formulario.referenciaPago.trim(),

        observaciones:
          formulario.observaciones.trim(),
      };

      let respuesta;

      /* ===================================================
         EDITAR

         El backend conserva el mismo EG-XXXX.
      =================================================== */

      if (
        esEdicion
      ) {
        respuesta =
          await actualizarPagoManual(
            pagoEditar._id,
            datos
          );
      }

      /* ===================================================
         CREAR

         El backend generará automáticamente
         el EG-XXXX.
      =================================================== */

      if (
        !esEdicion
      ) {
        respuesta =
          await crearPagoManual(
            datos
          );
      }

      const pagoGuardado =
        respuesta
          ?.pagoManual ||
        respuesta;

      if (
        onGuardado
      ) {
        onGuardado(
          pagoGuardado,
          respuesta
        );
      }

      setFormulario(
        crearFormularioInicial()
      );

      onCerrar?.();
    } catch (errorPeticion) {
      console.error(
        "Error guardando pago manual:",
        errorPeticion
      );

      setError(
        errorPeticion
          ?.response
          ?.data
          ?.message ||
          "No fue posible guardar el pago manual."
      );
    } finally {
      setGuardando(false);
    }
  };

  /* =======================================================
     CERRAR
  ======================================================= */

  const manejarCerrar =
    () => {
      if (
        guardando
      ) {
        return;
      }

      setError("");

      setBeneficiarioModalAbierto(
        false
      );

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
    <>
      <div
        className="pagos-manuales-modal-overlay"
        onMouseDown={
          (
            evento
          ) => {
            if (
              evento.target ===
                evento.currentTarget &&
              !beneficiarioModalAbierto
            ) {
              manejarCerrar();
            }
          }
        }
      >
        <div
          className="pagos-manuales-modal pago-manual-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pago-manual-modal-titulo"
        >
          {/* =============================================
              HEADER
          ============================================= */}

          <div className="pagos-manuales-modal-header">
            <div className="pagos-manuales-modal-header-info">
              <div className="pagos-manuales-modal-icon">
                <CircleDollarSign
                  size={22}
                />
              </div>

              <div>
                <h2
                  id="pago-manual-modal-titulo"
                >
                  {esEdicion
                    ? "Editar pago manual"
                    : "Nuevo pago manual"}
                </h2>

                <p>
                  {esEdicion
                    ? "Corrija los datos del gasto sin cambiar su código de egreso."
                    : "Registre un gasto y genere automáticamente su egreso."}
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

          {/* =============================================
              FORMULARIO
          ============================================= */}

          <form
            onSubmit={
              manejarGuardar
            }
          >
            <div className="pagos-manuales-modal-body">
              {/* =========================================
                  ERROR
              ========================================= */}

              {error && (
                <div className="pagos-manuales-form-error">
                  {error}
                </div>
              )}

              <div className="pagos-manuales-form-grid">
                {/* =======================================
                    BENEFICIARIO
                ======================================= */}

                <div className="pagos-manuales-field full">
                  <label
                    htmlFor="pago-manual-beneficiario"
                  >
                    Beneficiario
                    <span>*</span>
                  </label>

                  <div className="pagos-manuales-beneficiario-row">
                    <div className="pagos-manuales-select-icon">
                      <UserRound
                        size={17}
                      />

                      <select
                        id="pago-manual-beneficiario"
                        name="beneficiario"
                        value={
                          formulario.beneficiario
                        }
                        onChange={
                          manejarCambio
                        }
                        disabled={
                          guardando ||
                          cargandoBeneficiarios
                        }
                      >
                        <option value="">
                          {cargandoBeneficiarios
                            ? "Cargando beneficiarios..."
                            : "Seleccione una persona o empresa"}
                        </option>

                        {beneficiarios.map(
                          (
                            beneficiario
                          ) => {
                            const inactivo =
                              beneficiario.estado ===
                              "Inactivo";

                            /*
                              Si estamos creando un pago,
                              no permitimos seleccionar
                              beneficiarios inactivos.

                              En edición dejamos disponible
                              el beneficiario histórico actual.
                            */

                            const esActual =
                              String(
                                beneficiario._id
                              ) ===
                              String(
                                formulario.beneficiario
                              );

                            const deshabilitado =
                              inactivo &&
                              !esActual;

                            return (
                              <option
                                key={
                                  beneficiario._id
                                }
                                value={
                                  beneficiario._id
                                }
                                disabled={
                                  deshabilitado
                                }
                              >
                                {beneficiario.nombre}
                                {" - "}
                                {beneficiario.tipoDocumento}
                                {" "}
                                {beneficiario.documento}
                                {inactivo
                                  ? " (Inactivo)"
                                  : ""}
                              </option>
                            );
                          }
                        )}
                      </select>
                    </div>

                    <button
                      type="button"
                      className="pagos-manuales-btn-new-beneficiario"
                      onClick={
                        abrirNuevoBeneficiario
                      }
                      disabled={
                        guardando
                      }
                      title="Crear beneficiario"
                    >
                      <Plus
                        size={17}
                      />

                      Nuevo
                    </button>
                  </div>

                  {/* =====================================
                      INFORMACIÓN BENEFICIARIO
                  ===================================== */}

                  {beneficiarioSeleccionado && (
                    <div className="pagos-manuales-beneficiario-info">
                      <strong>
                        {beneficiarioSeleccionado.nombre}
                      </strong>

                      <span>
                        {
                          beneficiarioSeleccionado.tipoDocumento
                        }
                        {" "}
                        {
                          beneficiarioSeleccionado.documento
                        }

                        {beneficiarioSeleccionado.telefono
                          ? ` · ${beneficiarioSeleccionado.telefono}`
                          : ""}
                      </span>
                    </div>
                  )}
                </div>

                {/* =======================================
                    MOTIVO
                ======================================= */}

                <div className="pagos-manuales-field full">
                  <label
                    htmlFor="pago-manual-motivo"
                  >
                    Motivo del pago
                    <span>*</span>
                  </label>

                  <input
                    id="pago-manual-motivo"
                    name="motivo"
                    type="text"
                    value={
                      formulario.motivo
                    }
                    onChange={
                      manejarCambio
                    }
                    placeholder="Ej. Compra de café"
                    autoComplete="off"
                    maxLength={200}
                    disabled={
                      guardando
                    }
                  />
                </div>

                {/* =======================================
                    VALOR
                ======================================= */}

                <div className="pagos-manuales-field">
                  <label
                    htmlFor="pago-manual-valor"
                  >
                    Valor pagado
                    <span>*</span>
                  </label>

                  <div className="pagos-manuales-input-icon">
                    <CircleDollarSign
                      size={17}
                    />

                    <input
                      id="pago-manual-valor"
                      name="valor"
                      type="number"
                      value={
                        formulario.valor
                      }
                      onChange={
                        manejarCambio
                      }
                      min="1"
                      step="1"
                      placeholder="10000"
                      disabled={
                        guardando
                      }
                    />
                  </div>
                </div>

                {/* =======================================
                    FECHA
                ======================================= */}

                <div className="pagos-manuales-field">
                  <label
                    htmlFor="pago-manual-fecha"
                  >
                    Fecha
                    <span>*</span>
                  </label>

                  <div className="pagos-manuales-input-icon">
                    <CalendarDays
                      size={17}
                    />

                    <input
                      id="pago-manual-fecha"
                      name="fechaPago"
                      type="date"
                      value={
                        formulario.fechaPago
                      }
                      onChange={
                        manejarCambio
                      }
                      disabled={
                        guardando
                      }
                    />
                  </div>
                </div>

                {/* =======================================
                    FORMA DE PAGO
                ======================================= */}

                <div className="pagos-manuales-field">
                  <label
                    htmlFor="pago-manual-forma"
                  >
                    Forma de pago
                    <span>*</span>
                  </label>

                  <div className="pagos-manuales-select-icon">
                    <WalletCards
                      size={17}
                    />

                    <select
                      id="pago-manual-forma"
                      name="formaPago"
                      value={
                        formulario.formaPago
                      }
                      onChange={
                        manejarCambio
                      }
                      disabled={
                        guardando
                      }
                    >
                      <option value="Efectivo">
                        Efectivo
                      </option>

                      <option value="Transferencia">
                        Transferencia
                      </option>

                      <option value="Consignacion">
                        Consignación
                      </option>

                      <option value="Otro">
                        Otro
                      </option>
                    </select>
                  </div>
                </div>

                {/* =======================================
                    REFERENCIA
                ======================================= */}

                <div className="pagos-manuales-field">
                  <label
                    htmlFor="pago-manual-referencia"
                  >
                    Referencia
                  </label>

                  <input
                    id="pago-manual-referencia"
                    name="referenciaPago"
                    type="text"
                    value={
                      formulario.referenciaPago
                    }
                    onChange={
                      manejarCambio
                    }
                    placeholder="Opcional"
                    autoComplete="off"
                    maxLength={100}
                    disabled={
                      guardando
                    }
                  />
                </div>

                {/* =======================================
                    OBSERVACIONES
                ======================================= */}

                <div className="pagos-manuales-field full">
                  <label
                    htmlFor="pago-manual-observaciones"
                  >
                    Observaciones
                  </label>

                  <textarea
                    id="pago-manual-observaciones"
                    name="observaciones"
                    value={
                      formulario.observaciones
                    }
                    onChange={
                      manejarCambio
                    }
                    placeholder="Ej. Se compraron productos para la oficina."
                    rows={4}
                    maxLength={500}
                    disabled={
                      guardando
                    }
                  />
                </div>

                {/* =======================================
                    RESUMEN DEL VALOR
                ======================================= */}

                {Number(
                  formulario.valor
                ) > 0 && (
                  <div className="pagos-manuales-total-preview full">
                    <div>
                      <span>
                        Total del egreso
                      </span>

                      <strong>
                        {formatearDinero(
                          formulario.valor
                        )}
                      </strong>
                    </div>

                    {!esEdicion && (
                      <small>
                        Se generará un nuevo código EG-XXXX.
                      </small>
                    )}

                    {esEdicion && (
                      <small>
                        Se conservará el mismo código de egreso.
                      </small>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* =============================================
                FOOTER
            ============================================= */}

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
                  guardando ||
                  cargandoBeneficiarios
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
                    ? "Actualizar pago"
                    : "Registrar pago"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* =================================================
          MODAL NUEVO BENEFICIARIO
      ================================================= */}

      <BeneficiarioModal
        abierto={
          beneficiarioModalAbierto
        }
        onCerrar={
          cerrarNuevoBeneficiario
        }
        onGuardado={
          beneficiarioGuardado
        }
      />
    </>
  );
}