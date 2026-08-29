import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Calculator,
  LandPlot,
  Ruler,
  Save,
  Shapes,
  X,
} from "lucide-react";

/* =========================================================
   ESTADO INICIAL
========================================================= */

const estadoInicial = {
  manzana: "",
  numeroLote: "",

  tipoLote: "Regular",

  frenteMetros: "",
  frenteCentimetros: "",

  fondoMetros: "",
  fondoCentimetros: "",

  areaM2: "",

  valorLote: "",

  estado: "Disponible",

  observaciones: "",
};

/* =========================================================
   CONVERTIR METROS + CENTÍMETROS
========================================================= */

const convertirAMetros = (
  metros = 0,
  centimetros = 0
) => {
  const metrosNumero =
    Number(metros) || 0;

  const centimetrosNumero =
    Number(centimetros) || 0;

  return (
    metrosNumero +
    centimetrosNumero / 100
  );
};

/* =========================================================
   FORMATO ÁREA
========================================================= */

const formatearArea = (
  area = 0
) => {
  return Number(
    area || 0
  ).toLocaleString(
    "es-CO",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
};

/* =========================================================
   FORMATO MONEDA
========================================================= */

const formatearDinero = (
  valor
) => {
  const numero =
    Number(valor) || 0;

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
   COMPONENTE
========================================================= */

export default function LoteModal({
  abierto,
  onCerrar,
  onGuardar,

  loteEditar = null,

  guardando = false,

  manzanas = [],

  manzanaInicial = "",
}) {
  const [
    form,
    setForm,
  ] = useState(
    estadoInicial
  );

  /* =======================================================
     CARGAR DATOS
  ======================================================= */

  useEffect(() => {
    if (
      !abierto
    ) {
      return;
    }

    /* =====================================================
       EDITAR LOTE
    ===================================================== */

    if (
      loteEditar
    ) {
      /*
        Compatibilidad con lotes anteriores.

        Si todavía no existe tipoLote en MongoDB:
        - si tiene frente/fondo -> Regular
        - si no tiene frente/fondo pero sí área -> Irregular
      */

      const frenteExistente =
        convertirAMetros(
          loteEditar.frenteMetros,
          loteEditar.frenteCentimetros
        );

      const fondoExistente =
        convertirAMetros(
          loteEditar.fondoMetros,
          loteEditar.fondoCentimetros
        );

      const tipoDetectado =
        loteEditar.tipoLote ||
        (
          frenteExistente > 0 &&
          fondoExistente > 0
            ? "Regular"
            : "Irregular"
        );

      setForm({
        manzana:
          loteEditar.manzana?._id ||
          loteEditar.manzana ||
          "",

        numeroLote:
          loteEditar.numeroLote ||
          "",

        tipoLote:
          tipoDetectado,

        frenteMetros:
          loteEditar.frenteMetros ??
          "",

        frenteCentimetros:
          loteEditar.frenteCentimetros ??
          "",

        fondoMetros:
          loteEditar.fondoMetros ??
          "",

        fondoCentimetros:
          loteEditar.fondoCentimetros ??
          "",

        areaM2:
          loteEditar.areaM2 !==
            undefined &&
          loteEditar.areaM2 !==
            null
            ? String(
                loteEditar.areaM2
              )
            : "",

        valorLote:
          loteEditar.valorLote
            ? String(
                loteEditar.valorLote
              )
            : "",

        estado:
          loteEditar.estado ||
          "Disponible",

        observaciones:
          loteEditar.observaciones ||
          "",
      });

      return;
    }

    /* =====================================================
       NUEVO LOTE
    ===================================================== */

    setForm({
      ...estadoInicial,

      manzana:
        manzanaInicial ||
        "",
    });
  }, [
    abierto,
    loteEditar,
    manzanaInicial,
  ]);

  /* =======================================================
     TIPO DE LOTE
  ======================================================= */

  const esIrregular =
    form.tipoLote ===
    "Irregular";

  const seleccionarTipoLote =
    (
      tipo
    ) => {
      setForm(
        (prev) => ({
          ...prev,

          tipoLote:
            tipo,

          /*
            Si vuelve a Regular, el área manual
            ya no se utiliza.
          */

          areaM2:
            tipo ===
            "Regular"
              ? ""
              : prev.areaM2,
        })
      );
    };

  /* =======================================================
     FRENTE TOTAL
  ======================================================= */

  const frenteTotal =
    useMemo(() => {
      return convertirAMetros(
        form.frenteMetros,
        form.frenteCentimetros
      );
    }, [
      form.frenteMetros,
      form.frenteCentimetros,
    ]);

  /* =======================================================
     FONDO TOTAL
  ======================================================= */

  const fondoTotal =
    useMemo(() => {
      return convertirAMetros(
        form.fondoMetros,
        form.fondoCentimetros
      );
    }, [
      form.fondoMetros,
      form.fondoCentimetros,
    ]);

  /* =======================================================
     ÁREA AUTOMÁTICA PARA LOTE REGULAR
  ======================================================= */

  const areaCalculada =
    useMemo(() => {
      const area =
        frenteTotal *
        fondoTotal;

      return Number(
        area.toFixed(
          2
        )
      );
    }, [
      frenteTotal,
      fondoTotal,
    ]);

  /* =======================================================
     ÁREA REAL DEL LOTE

     REGULAR:
     frente × fondo

     IRREGULAR:
     área escrita manualmente
  ======================================================= */

  const areaFinal =
    useMemo(() => {
      if (
        esIrregular
      ) {
        return (
          Number(
            form.areaM2
          ) || 0
        );
      }

      return areaCalculada;
    }, [
      esIrregular,
      form.areaM2,
      areaCalculada,
    ]);

  /* =======================================================
     CAMBIOS GENERALES
  ======================================================= */

  const handleChange =
    (
      e
    ) => {
      const {
        name,
        value,
      } = e.target;

      setForm(
        (prev) => ({
          ...prev,
          [name]:
            value,
        })
      );
    };

  /* =======================================================
     CAMPOS NUMÉRICOS DE MEDIDAS
  ======================================================= */

  const handleNumeroChange =
    (
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

      /*
        Los centímetros solamente
        pueden estar entre 0 y 99.
      */

      if (
        name ===
          "frenteCentimetros" ||
        name ===
          "fondoCentimetros"
      ) {
        if (
          limpio !== "" &&
          Number(
            limpio
          ) > 99
        ) {
          return;
        }
      }

      setForm(
        (prev) => ({
          ...prev,
          [name]:
            limpio,
        })
      );
    };

  /* =======================================================
     ÁREA MANUAL DEL LOTE IRREGULAR

     Permite:
     250
     250.5
     250.75
  ======================================================= */

  const handleAreaChange =
    (
      e
    ) => {
      let valor =
        e.target.value
          .replace(
            ",",
            "."
          )
          .replace(
            /[^0-9.]/g,
            ""
          );

      /*
        Impedir más de un punto decimal.
      */

      const partes =
        valor.split(
          "."
        );

      if (
        partes.length > 2
      ) {
        valor =
          `${partes[0]}.${partes
            .slice(1)
            .join("")}`;
      }

      /*
        Máximo dos decimales.
      */

      if (
        partes.length === 2
      ) {
        valor =
          `${partes[0]}.${partes[1].slice(
            0,
            2
          )}`;
      }

      setForm(
        (prev) => ({
          ...prev,

          areaM2:
            valor,
        })
      );
    };

  /* =======================================================
     VALOR DEL LOTE
  ======================================================= */

  const handleValorChange =
    (
      e
    ) => {
      const limpio =
        e.target.value.replace(
          /\D/g,
          ""
        );

      setForm(
        (prev) => ({
          ...prev,

          valorLote:
            limpio,
        })
      );
    };

  /* =======================================================
     VALIDAR
  ======================================================= */

  const validarFormulario =
    () => {
      if (
        !form.manzana
      ) {
        alert(
          "Debe seleccionar una manzana"
        );

        return false;
      }

      if (
        !form.numeroLote.trim()
      ) {
        alert(
          "El número del lote es obligatorio"
        );

        return false;
      }

      /* =====================================================
         LOTE REGULAR

         Frente y fondo son obligatorios.
      ===================================================== */

      if (
        !esIrregular
      ) {
        if (
          frenteTotal <= 0
        ) {
          alert(
            "La medida del frente debe ser mayor que cero"
          );

          return false;
        }

        if (
          fondoTotal <= 0
        ) {
          alert(
            "La medida del fondo debe ser mayor que cero"
          );

          return false;
        }

        if (
          areaCalculada <= 0
        ) {
          alert(
            "No fue posible calcular el área del lote"
          );

          return false;
        }
      }

      /* =====================================================
         LOTE IRREGULAR

         El área es obligatoria.

         Frente y fondo pueden quedar en cero porque
         solamente son medidas de referencia.
      ===================================================== */

      if (
        esIrregular
      ) {
        const area =
          Number(
            form.areaM2
          );

        if (
          !Number.isFinite(
            area
          ) ||
          area <= 0
        ) {
          alert(
            "Debe indicar el área total del lote irregular"
          );

          return false;
        }
      }

      /* =====================================================
         VALOR
      ===================================================== */

      if (
        Number(
          form.valorLote
        ) <= 0
      ) {
        alert(
          "El valor general del lote debe ser mayor que cero"
        );

        return false;
      }

      return true;
    };

  /* =======================================================
     GUARDAR
  ======================================================= */

  const handleSubmit =
    async (
      e
    ) => {
      e.preventDefault();

      if (
        !validarFormulario()
      ) {
        return;
      }

      await onGuardar({
        manzana:
          form.manzana,

        numeroLote:
          form.numeroLote
            .trim()
            .toUpperCase(),

        /* =====================
           TIPO
        ===================== */

        tipoLote:
          form.tipoLote,

        /* =====================
           MEDIDAS
        ===================== */

        frenteMetros:
          Number(
            form.frenteMetros ||
              0
          ),

        frenteCentimetros:
          Number(
            form.frenteCentimetros ||
              0
          ),

        fondoMetros:
          Number(
            form.fondoMetros ||
              0
          ),

        fondoCentimetros:
          Number(
            form.fondoCentimetros ||
              0
          ),

        /* =====================
           ÁREA FINAL

           Regular:
           calculada

           Irregular:
           manual
        ===================== */

        areaM2:
          Number(
            areaFinal
          ),

        valorLote:
          Number(
            form.valorLote
          ),

        estado:
          form.estado,

        observaciones:
          form.observaciones.trim(),
      });
    };

  if (
    !abierto
  ) {
    return null;
  }

  return (
    <div className="lotes-modal-overlay">

      <div className="lotes-modal lote-modal">

        {/* =========================================
            CABECERA
        ========================================= */}

        <div className="lotes-modal-header">

          <div className="lotes-modal-title">

            <div className="lotes-modal-icon">
              <LandPlot
                size={21}
              />
            </div>

            <div>
              <span className="lotes-modal-kicker">
                {loteEditar
                  ? "Actualizar lote"
                  : "Nuevo lote"}
              </span>

              <h2>
                {loteEditar
                  ? "Editar lote"
                  : "Crear lote"}
              </h2>
            </div>

          </div>

          <button
            type="button"
            className="lotes-modal-close"
            onClick={
              onCerrar
            }
            disabled={
              guardando
            }
            aria-label="Cerrar"
          >
            <X
              size={20}
            />
          </button>

        </div>

        {/* =========================================
            FORMULARIO
        ========================================= */}

        <form
          onSubmit={
            handleSubmit
          }
        >

          <div className="lotes-modal-body">

            {/* =====================================
                CÓDIGO EN EDICIÓN
            ===================================== */}

            {loteEditar?.codigo && (
              <div className="lote-code-preview">

                <div>
                  <span>
                    Código del lote
                  </span>

                  <strong>
                    {
                      loteEditar.codigo
                    }
                  </strong>
                </div>

                <small>
                  Generado automáticamente.
                </small>

              </div>
            )}

            <div className="lotes-form-grid">

              {/* =====================
                  MANZANA
              ===================== */}

              <div className="lotes-field lotes-field-full">

                <label htmlFor="manzana">
                  Manzana *
                </label>

                <select
                  id="manzana"
                  name="manzana"
                  value={
                    form.manzana
                  }
                  onChange={
                    handleChange
                  }
                >
                  <option value="">
                    Seleccione una manzana
                  </option>

                  {manzanas
                    .filter(
                      (manzana) =>
                        manzana.estado ===
                          "Activa" ||
                        manzana._id ===
                          form.manzana
                    )
                    .map(
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

              {/* =====================
                  NÚMERO LOTE
              ===================== */}

              <div className="lotes-field lotes-field-full">

                <label htmlFor="numeroLote">
                  Número del lote *
                </label>

                <input
                  id="numeroLote"
                  name="numeroLote"
                  type="text"
                  value={
                    form.numeroLote
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Ej. 1"
                  autoComplete="off"
                  maxLength={20}
                />

                <small className="lotes-field-help">
                  El código se generará
                  automáticamente según la manzana.
                </small>

              </div>

            </div>

            {/* =====================================
                TIPO DE LOTE
            ===================================== */}

            <div className="lote-tipo-section">

              <div className="lote-section-title">

                <div>
                  <span>
                    Forma del terreno
                  </span>

                  <h3>
                    Tipo de lote
                  </h3>
                </div>

                <small>
                  Seleccione cómo se determina el área
                </small>

              </div>

              <div className="lote-tipo-options">

                {/* REGULAR */}

                <button
                  type="button"
                  className={`lote-tipo-option ${
                    !esIrregular
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    seleccionarTipoLote(
                      "Regular"
                    )
                  }
                  disabled={
                    guardando
                  }
                >
                  <div className="lote-tipo-option-icon">
                    <Ruler
                      size={21}
                    />
                  </div>

                  <div>
                    <strong>
                      Lote regular
                    </strong>

                    <span>
                      Se determina con las medidas
                      de frente y fondo.
                    </span>
                  </div>
                </button>

                {/* IRREGULAR */}

                <button
                  type="button"
                  className={`lote-tipo-option irregular ${
                    esIrregular
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    seleccionarTipoLote(
                      "Irregular"
                    )
                  }
                  disabled={
                    guardando
                  }
                >
                  <div className="lote-tipo-option-icon">
                    <Shapes
                      size={21}
                    />
                  </div>

                  <div>
                    <strong>
                      Lote irregular
                    </strong>

                    <span>
                      Se determina por el área total
                      en metros cuadrados.
                    </span>
                  </div>
                </button>

              </div>

            </div>

            {/* =====================================
                ÁREA MANUAL PARA IRREGULAR
            ===================================== */}

            {esIrregular && (
              <div className="lote-irregular-area">

                <div className="lote-irregular-area-header">

                  <div className="lote-irregular-area-icon">
                    <Shapes
                      size={22}
                    />
                  </div>

                  <div>
                    <span>
                      Área del lote irregular
                    </span>

                    <strong>
                      Área total a vender
                    </strong>

                    <small>
                      Esta será el área oficial del lote.
                      No se calculará con frente × fondo.
                    </small>
                  </div>

                </div>

                <div className="lote-irregular-area-control">

                  <input
                    type="text"
                    inputMode="decimal"
                    name="areaM2"
                    value={
                      form.areaM2
                    }
                    onChange={
                      handleAreaChange
                    }
                    placeholder="Ej. 347.50"
                  />

                  <span>
                    m²
                  </span>

                </div>

                {Number(
                  form.areaM2
                ) > 0 && (
                  <div className="lote-irregular-area-preview">
                    Área registrada:{" "}
                    <strong>
                      {formatearArea(
                        form.areaM2
                      )}{" "}
                      m²
                    </strong>
                  </div>
                )}

              </div>
            )}

            {/* =====================================
                MEDIDAS
            ===================================== */}

            <div className="lote-medidas-section">

              <div className="lote-section-title">

                <div>
                  <span>
                    Dimensiones
                  </span>

                  <h3>
                    Medidas del lote
                  </h3>
                </div>

                <small>
                  {esIrregular
                    ? "Opcionales como referencia"
                    : "Obligatorias para calcular el área"}
                </small>

              </div>

              {/* ===================================
                  AVISO IRREGULAR
              =================================== */}

              {esIrregular && (
                <div className="lote-irregular-reference">

                  <Shapes
                    size={18}
                  />

                  <div>
                    <strong>
                      Medidas de referencia
                    </strong>

                    <span>
                      Puede registrar frente y fondo si
                      los conoce, pero estas medidas no
                      cambiarán el área total del lote.
                    </span>
                  </div>

                </div>
              )}

              {/* ===================================
                  FRENTE
              =================================== */}

              <div className="lote-medida-card">

                <div className="lote-medida-name">

                  <span>
                    Frente
                  </span>

                  <strong>
                    {formatearArea(
                      frenteTotal
                    )}{" "}
                    m
                  </strong>

                </div>

                <div className="lote-medida-inputs">

                  <div className="lote-medida-field">

                    <label>
                      Metros
                    </label>

                    <div className="lote-medida-control">

                      <input
                        type="text"
                        inputMode="numeric"
                        name="frenteMetros"
                        value={
                          form.frenteMetros
                        }
                        onChange={
                          handleNumeroChange
                        }
                        placeholder="0"
                      />

                      <span>
                        m
                      </span>

                    </div>

                  </div>

                  <div className="lote-medida-field">

                    <label>
                      Centímetros
                    </label>

                    <div className="lote-medida-control">

                      <input
                        type="text"
                        inputMode="numeric"
                        name="frenteCentimetros"
                        value={
                          form.frenteCentimetros
                        }
                        onChange={
                          handleNumeroChange
                        }
                        placeholder="0"
                        maxLength={2}
                      />

                      <span>
                        cm
                      </span>

                    </div>

                  </div>

                </div>

              </div>

              {/* ===================================
                  FONDO
              =================================== */}

              <div className="lote-medida-card">

                <div className="lote-medida-name">

                  <span>
                    Fondo
                  </span>

                  <strong>
                    {formatearArea(
                      fondoTotal
                    )}{" "}
                    m
                  </strong>

                </div>

                <div className="lote-medida-inputs">

                  <div className="lote-medida-field">

                    <label>
                      Metros
                    </label>

                    <div className="lote-medida-control">

                      <input
                        type="text"
                        inputMode="numeric"
                        name="fondoMetros"
                        value={
                          form.fondoMetros
                        }
                        onChange={
                          handleNumeroChange
                        }
                        placeholder="0"
                      />

                      <span>
                        m
                      </span>

                    </div>

                  </div>

                  <div className="lote-medida-field">

                    <label>
                      Centímetros
                    </label>

                    <div className="lote-medida-control">

                      <input
                        type="text"
                        inputMode="numeric"
                        name="fondoCentimetros"
                        value={
                          form.fondoCentimetros
                        }
                        onChange={
                          handleNumeroChange
                        }
                        placeholder="0"
                        maxLength={2}
                      />

                      <span>
                        cm
                      </span>

                    </div>

                  </div>

                </div>

              </div>

            </div>

            {/* =====================================
                ÁREA DEL LOTE
            ===================================== */}

            <div
              className={`lote-area-preview ${
                esIrregular
                  ? "lote-area-preview-irregular"
                  : ""
              }`}
            >

              <div className="lote-area-icon">
                {esIrregular ? (
                  <Shapes
                    size={21}
                  />
                ) : (
                  <Calculator
                    size={21}
                  />
                )}
              </div>

              <div>

                <span>
                  {esIrregular
                    ? "Área registrada"
                    : "Área calculada"}
                </span>

                <strong>
                  {formatearArea(
                    areaFinal
                  )}{" "}
                  m²
                </strong>

                <small>
                  {esIrregular
                    ? "Área total oficial del lote"
                    : `${formatearArea(
                        frenteTotal
                      )} m × ${formatearArea(
                        fondoTotal
                      )} m`}
                </small>

              </div>

            </div>

            {/* =====================================
                VALOR
            ===================================== */}

            <div className="lotes-form-grid lote-economic-section">

              <div className="lotes-field">

                <label htmlFor="valorLote">
                  Valor general del lote *
                </label>

                <div className="lote-money-input">

                  <span>
                    $
                  </span>

                  <input
                    id="valorLote"
                    type="text"
                    inputMode="numeric"
                    name="valorLote"
                    value={
                      form.valorLote
                    }
                    onChange={
                      handleValorChange
                    }
                    placeholder="45000000"
                  />

                </div>

                {form.valorLote && (
                  <small className="lote-money-preview">
                    {formatearDinero(
                      form.valorLote
                    )}
                  </small>
                )}

              </div>

              {/* ===================================
                  ESTADO
              =================================== */}

              <div className="lotes-field">

                <label htmlFor="estadoLote">
                  Estado
                </label>

                <select
                  id="estadoLote"
                  name="estado"
                  value={
                    form.estado
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    loteEditar?.estado ===
                    "Vendido"
                  }
                >
                  <option value="Disponible">
                    Disponible
                  </option>

                  <option value="Reservado">
                    Reservado
                  </option>

                  {loteEditar?.estado ===
                    "Vendido" && (
                    <option value="Vendido">
                      Vendido
                    </option>
                  )}

                </select>

              </div>

              {/* ===================================
                  OBSERVACIONES
              =================================== */}

              <div className="lotes-field lotes-field-full">

                <label htmlFor="observaciones">
                  Observaciones
                </label>

                <textarea
                  id="observaciones"
                  name="observaciones"
                  value={
                    form.observaciones
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Información adicional del lote"
                  rows="3"
                  maxLength={500}
                />

              </div>

            </div>

            {/* =====================================
                RESUMEN
            ===================================== */}

            <div className="lote-form-summary">

              <div>
                <span>
                  Tipo de lote
                </span>

                <strong>
                  {
                    form.tipoLote
                  }
                </strong>
              </div>

              <div>
                <span>
                  Área
                </span>

                <strong>
                  {formatearArea(
                    areaFinal
                  )}{" "}
                  m²
                </strong>
              </div>

              <div>
                <span>
                  Valor general
                </span>

                <strong>
                  {form.valorLote
                    ? formatearDinero(
                        form.valorLote
                      )
                    : "$0"}
                </strong>
              </div>

            </div>

          </div>

          {/* =========================================
              PIE
          ========================================= */}

          <div className="lotes-modal-footer">

            <button
              type="button"
              className="lotes-btn-secondary"
              onClick={
                onCerrar
              }
              disabled={
                guardando
              }
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="lotes-btn-primary"
              disabled={
                guardando
              }
            >
              <Save
                size={18}
              />

              {guardando
                ? "Guardando..."
                : loteEditar
                ? "Actualizar lote"
                : "Guardar lote"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}