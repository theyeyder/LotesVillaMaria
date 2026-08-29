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
  Ruler,
  Save,
  Shapes,
  ShoppingCart,
  UserRound,
  X,
} from "lucide-react";

/* =========================================================
   FECHA LOCAL
========================================================= */

const obtenerFechaActual = () => {
  const fecha =
    new Date();

  const year =
    fecha.getFullYear();

  const month =
    String(
      fecha.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      fecha.getDate()
    ).padStart(
      2,
      "0"
    );

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
      style:
        "currency",

      currency:
        "COP",

      maximumFractionDigits:
        0,
    }
  ).format(
    Number(
      valor
    ) || 0
  );
};

/* =========================================================
   ÁREA / MEDIDAS
========================================================= */

const formatearMedida = (
  valor = 0
) => {
  return Number(
    valor || 0
  ).toLocaleString(
    "es-CO",
    {
      minimumFractionDigits:
        2,

      maximumFractionDigits:
        2,
    }
  );
};

const convertirAMetros = (
  metros = 0,
  centimetros = 0
) => {
  return (
    Number(
      metros || 0
    ) +
    Number(
      centimetros || 0
    ) /
      100
  );
};

/* =========================================================
   NOMBRE DEL CLIENTE
========================================================= */

const obtenerNombreCliente = (
  cliente
) => {
  if (
    !cliente
  ) {
    return "";
  }

  const nombre = [
    cliente.nombres,
    cliente.apellidos,
  ]
    .filter(
      Boolean
    )
    .join(
      " "
    )
    .trim();

  return (
    nombre ||
    cliente.nombre ||
    cliente.razonSocial ||
    "Cliente"
  );
};

/* =========================================================
   DETECTAR TIPO DEL LOTE

   Para lotes anteriores que todavía no tengan tipoLote:

   Si tiene frente y fondo:
   Regular

   Si no:
   Irregular
========================================================= */

const obtenerTipoLote = (
  lote
) => {
  if (
    !lote
  ) {
    return "Regular";
  }

  if (
    lote.tipoLote ===
      "Regular" ||
    lote.tipoLote ===
      "Irregular"
  ) {
    return lote.tipoLote;
  }

  const frente =
    convertirAMetros(
      lote.frenteMetros,
      lote.frenteCentimetros
    );

  const fondo =
    convertirAMetros(
      lote.fondoMetros,
      lote.fondoCentimetros
    );

  return (
    frente > 0 &&
    fondo > 0
  )
    ? "Regular"
    : "Irregular";
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

  const [
    busquedaCliente,
    setBusquedaCliente,
  ] = useState("");

  const [
    mostrarResultadosClientes,
    setMostrarResultadosClientes,
  ] = useState(false);

  /* =======================================================
     CARGAR DATOS AL ABRIR
  ======================================================= */

  useEffect(() => {
    if (
      !abierto
    ) {
      return;
    }

    /* =========================
       EDITAR
    ========================= */

    if (
      ventaEditar
    ) {
      const loteVenta =
        ventaEditar.lote;

      const clienteVenta =
        typeof ventaEditar.cliente ===
        "object"
          ? ventaEditar.cliente
          : clientes.find(
              (cliente) =>
                cliente._id ===
                ventaEditar.cliente
            );

      setBusquedaCliente(
        clienteVenta
          ? obtenerNombreCliente(
              clienteVenta
            )
          : ""
      );

      setMostrarResultadosClientes(
        false
      );

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
                .slice(
                  0,
                  10
                )
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

    setBusquedaCliente("");
    setMostrarResultadosClientes(false);

    setForm(
      crearEstadoInicial()
    );
  }, [
    abierto,
    ventaEditar,
    clientes,
  ]);

  /* =======================================================
     LOTES DISPONIBLES
  ======================================================= */

  const lotesDisponibles =
    useMemo(() => {
      return lotes.filter(
        (
          lote
        ) => {
          /*
            En edición conservamos visible
            el lote de la venta.
          */

          if (
            ventaEditar &&
            lote._id ===
              (
                ventaEditar.lote
                  ?._id ||
                ventaEditar.lote
              )
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
      if (
        !form.manzana
      ) {
        return [];
      }

      return lotesDisponibles.filter(
        (
          lote
        ) => {
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

     En edición usamos también el lote poblado de la venta
     como respaldo.
  ======================================================= */

  const loteSeleccionado =
    useMemo(() => {
      const encontrado =
        lotes.find(
          (
            lote
          ) =>
            lote._id ===
            form.lote
        );

      if (
        encontrado
      ) {
        return encontrado;
      }

      if (
        ventaEditar?.lote &&
        typeof ventaEditar.lote ===
          "object"
      ) {
        return ventaEditar.lote;
      }

      return null;
    }, [
      lotes,
      form.lote,
      ventaEditar,
    ]);

  /* =======================================================
     INFORMACIÓN FÍSICA DEL LOTE
  ======================================================= */

  const tipoLote =
    useMemo(() => {
      return obtenerTipoLote(
        loteSeleccionado
      );
    }, [
      loteSeleccionado,
    ]);

  const esLoteIrregular =
    tipoLote ===
    "Irregular";

  const frenteLote =
    useMemo(() => {
      if (
        !loteSeleccionado
      ) {
        return 0;
      }

      return convertirAMetros(
        loteSeleccionado.frenteMetros,
        loteSeleccionado.frenteCentimetros
      );
    }, [
      loteSeleccionado,
    ]);

  const fondoLote =
    useMemo(() => {
      if (
        !loteSeleccionado
      ) {
        return 0;
      }

      return convertirAMetros(
        loteSeleccionado.fondoMetros,
        loteSeleccionado.fondoCentimetros
      );
    }, [
      loteSeleccionado,
    ]);

  const areaLote =
    Number(
      loteSeleccionado
        ?.areaM2 ||
      0
    );

  /* =======================================================
     CÁLCULOS ECONÓMICOS
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
    cantidadCuotas >
      0
      ? saldoFinanciar /
        cantidadCuotas
      : 0;

  /* =======================================================
     BUSCADOR DE CLIENTES
  ======================================================= */

  const clienteSeleccionado =
    useMemo(() => {
      if (
        !form.cliente
      ) {
        return null;
      }

      const encontrado =
        clientes.find(
          (cliente) =>
            cliente._id ===
            form.cliente
        );

      if (
        encontrado
      ) {
        return encontrado;
      }

      if (
        ventaEditar?.cliente &&
        typeof ventaEditar.cliente ===
          "object" &&
        ventaEditar.cliente._id ===
          form.cliente
      ) {
        return ventaEditar.cliente;
      }

      return null;
    }, [
      clientes,
      form.cliente,
      ventaEditar,
    ]);

  const clientesFiltrados =
    useMemo(() => {
      const texto =
        busquedaCliente
          .trim()
          .toLowerCase();

      /*
        No mostramos los 100 clientes
        cuando el campo está vacío.
      */

      if (
        !texto
      ) {
        return [];
      }

      return clientes
        .filter(
          (cliente) => {
            const nombreCompleto =
              obtenerNombreCliente(
                cliente
              ).toLowerCase();

            const documento =
              String(
                cliente.documento ||
                ""
              ).toLowerCase();

            const telefono =
              String(
                cliente.telefono ||
                ""
              ).toLowerCase();

            const correo =
              String(
                cliente.correo ||
                ""
              ).toLowerCase();

            return (
              nombreCompleto.includes(
                texto
              ) ||
              documento.includes(
                texto
              ) ||
              telefono.includes(
                texto
              ) ||
              correo.includes(
                texto
              )
            );
          }
        )
        /*
          Aunque existan cientos de coincidencias,
          mostramos máximo 10.
        */
        .slice(
          0,
          10
        );
    }, [
      clientes,
      busquedaCliente,
    ]);

  /* =======================================================
     ESCRIBIR EN BUSCADOR
  ======================================================= */

  const handleBuscarCliente =
    (
      e
    ) => {
      const value =
        e.target.value;

      setBusquedaCliente(
        value
      );

      setMostrarResultadosClientes(
        true
      );

      /*
        Si empieza una nueva búsqueda,
        quitamos el cliente anterior.
      */

      setForm(
        (prev) => ({
          ...prev,

          cliente:
            "",
        })
      );
    };

  /* =======================================================
     SELECCIONAR CLIENTE
  ======================================================= */

  const seleccionarCliente =
    (
      cliente
    ) => {
      setForm(
        (prev) => ({
          ...prev,

          cliente:
            cliente._id,
        })
      );

      setBusquedaCliente(
        obtenerNombreCliente(
          cliente
        )
      );

      setMostrarResultadosClientes(
        false
      );
    };

  /* =======================================================
     CAMBIAR / LIMPIAR CLIENTE
  ======================================================= */

  const limpiarCliente =
    () => {
      setForm(
        (prev) => ({
          ...prev,

          cliente:
            "",
        })
      );

      setBusquedaCliente(
        ""
      );

      setMostrarResultadosClientes(
        false
      );
    };

  /* =======================================================
     CAMBIOS
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
        (
          prev
        ) => ({
          ...prev,

          [name]:
            value,
        })
      );
    };

  /* =======================================================
     SELECCIONAR MANZANA
  ======================================================= */

  const handleManzanaChange =
    (
      e
    ) => {
      const value =
        e.target.value;

      setForm(
        (
          prev
        ) => ({
          ...prev,

          manzana:
            value,

          lote:
            "",

          valorVenta:
            "",
        })
      );
    };

  /* =======================================================
     SELECCIONAR LOTE

     El lote conserva:
     - tipo
     - medidas
     - área oficial
     - valor registrado
  ======================================================= */

  const handleLoteChange =
    (
      e
    ) => {
      const loteId =
        e.target.value;

      const lote =
        lotes.find(
          (
            item
          ) =>
            item._id ===
            loteId
        );

      setForm(
        (
          prev
        ) => ({
          ...prev,

          lote:
            loteId,

          valorVenta:
            lote?.valorLote !=
            null
              ? String(
                  lote.valorLote
                )
              : "",

          /*
            Si estaba en contado,
            mantenemos la inicial sincronizada.
          */

          cuotaInicial:
            prev.formaPago ===
            "Contado" &&
            lote?.valorLote !=
              null
              ? String(
                  lote.valorLote
                )
              : prev.cuotaInicial,
        })
      );
    };

  /* =======================================================
     CAMPOS DE DINERO
  ======================================================= */

  const handleDineroChange =
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

      setForm(
        (
          prev
        ) => {
          const nuevoForm = {
            ...prev,

            [name]:
              limpio,
          };

          /*
            Si cambia el valor mientras es Contado,
            la cuota inicial debe seguir siendo igual
            al valor total.
          */

          if (
            name ===
              "valorVenta" &&
            prev.formaPago ===
              "Contado"
          ) {
            nuevoForm.cuotaInicial =
              limpio;
          }

          return nuevoForm;
        }
      );
    };

  /* =======================================================
     NÚMERO DE CUOTAS
  ======================================================= */

  const handleCuotasChange =
    (
      e
    ) => {
      const limpio =
        e.target.value.replace(
          /\D/g,
          ""
        );

      setForm(
        (
          prev
        ) => ({
          ...prev,

          numeroCuotas:
            limpio,
        })
      );
    };

  /* =======================================================
     FORMA DE PAGO
  ======================================================= */

  const handleFormaPago =
    (
      e
    ) => {
      const value =
        e.target.value;

      setForm(
        (
          prev
        ) => ({
          ...prev,

          formaPago:
            value,

          cuotaInicial:
            value ===
            "Contado"
              ? prev.valorVenta
              : "",

          numeroCuotas:
            value ===
            "Contado"
              ? ""
              : prev.numeroCuotas,
        })
      );
    };

  /* =======================================================
     VALIDAR
  ======================================================= */

  const validar =
    () => {
      if (
        !form.cliente
      ) {
        alert(
          "Debe seleccionar un cliente"
        );

        return false;
      }

      if (
        !form.lote
      ) {
        alert(
          "Debe seleccionar un lote"
        );

        return false;
      }

      if (
        !form.fechaVenta
      ) {
        alert(
          "La fecha de venta es obligatoria"
        );

        return false;
      }

      /*
        Verificación adicional del área oficial.
      */

      if (
        !loteSeleccionado ||
        !Number.isFinite(
          areaLote
        ) ||
        areaLote <= 0
      ) {
        alert(
          "El lote seleccionado no tiene un área válida"
        );

        return false;
      }

      /*
        Si es Regular debe conservar
        frente y fondo válidos.
      */

      if (
        !esLoteIrregular &&
        (
          frenteLote <= 0 ||
          fondoLote <= 0
        )
      ) {
        alert(
          "El lote regular seleccionado no tiene medidas válidas de frente y fondo"
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

  const handleSubmit =
    async (
      e
    ) => {
      e.preventDefault();

      if (
        !validar()
      ) {
        return;
      }

      const datos = {
        cliente:
          form.cliente,

        fechaVenta:
          form.fechaVenta,

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
        Para crear enviamos lote.

        El backend obtiene del lote:
        - tipoLote
        - área
        - frente
        - fondo

        No necesitamos duplicarlos dentro
        del documento Venta.
      */

      if (
        !ventaEditar
      ) {
        datos.lote =
          form.lote;
      }

      await onGuardar(
        datos
      );
    };

  if (
    !abierto
  ) {
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
            onClick={
              onCerrar
            }
            disabled={
              guardando
            }
          >
            <X
              size={20}
            />
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
                  Código generado automáticamente.
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
                  Buscar cliente *
                </label>

                {/* =================================
                    CLIENTE YA SELECCIONADO
                ================================= */}

                {clienteSeleccionado ? (
                  <div className="venta-client-selected">

                    <div>

                      <span>
                        Cliente seleccionado
                      </span>

                      <strong>
                        {obtenerNombreCliente(
                          clienteSeleccionado
                        )}
                      </strong>

                      {clienteSeleccionado.documento && (
                        <small>
                          Documento:{" "}
                          {
                            clienteSeleccionado.documento
                          }
                        </small>
                      )}

                    </div>

                    <button
                      type="button"
                      onClick={
                        limpiarCliente
                      }
                      disabled={
                        guardando
                      }
                    >
                      Cambiar
                    </button>

                  </div>
                ) : (
                  <>

                    {/* ===============================
                        BUSCADOR
                    =============================== */}

                    <div className="venta-client-search">

                      <input
                        type="text"
                        value={
                          busquedaCliente
                        }
                        onChange={
                          handleBuscarCliente
                        }
                        onFocus={() =>
                          setMostrarResultadosClientes(
                            true
                          )
                        }
                        placeholder="Buscar por nombre, apellido, documento o teléfono..."
                        autoComplete="off"
                      />

                      {busquedaCliente && (
                        <button
                          type="button"
                          className="venta-client-clear"
                          onClick={
                            limpiarCliente
                          }
                          aria-label="Limpiar búsqueda"
                        >
                          ×
                        </button>
                      )}

                    </div>

                    {/* ===============================
                        RESULTADOS
                    =============================== */}

                    {mostrarResultadosClientes &&
                      busquedaCliente.trim() && (
                        <div className="venta-client-results">

                          {clientesFiltrados.length >
                          0 ? (
                            clientesFiltrados.map(
                              (
                                cliente
                              ) => (
                                <button
                                  key={
                                    cliente._id
                                  }
                                  type="button"
                                  className="venta-client-result"
                                  onClick={() =>
                                    seleccionarCliente(
                                      cliente
                                    )
                                  }
                                >

                                  <div className="venta-client-avatar">

                                    {obtenerNombreCliente(
                                      cliente
                                    )
                                      .charAt(
                                        0
                                      )
                                      .toUpperCase()}

                                  </div>

                                  <div className="venta-client-result-info">

                                    <strong>
                                      {obtenerNombreCliente(
                                        cliente
                                      )}
                                    </strong>

                                    <span>
                                      {cliente.documento
                                        ? `Documento: ${cliente.documento}`
                                        : "Sin documento"}

                                      {cliente.telefono
                                        ? ` · Tel: ${cliente.telefono}`
                                        : ""}
                                    </span>

                                  </div>

                                  <span className="venta-client-select-text">
                                    Seleccionar
                                  </span>

                                </button>
                              )
                            )
                          ) : (
                            <div className="venta-client-empty">

                              No se encontraron clientes con
                              esa búsqueda.

                            </div>
                          )}

                        </div>
                      )}

                    {!busquedaCliente.trim() && (
                      <small>
                        Escriba al menos una parte del nombre,
                        apellido, documento o teléfono.
                      </small>
                    )}

                  </>
                )}

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
                      (
                        manzana
                      ) => (
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
                      (
                        lote
                      ) => (
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
                          {obtenerTipoLote(
                            lote
                          )}{" "}
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

              {/* ===================================
                  INFORMACIÓN DEL LOTE
              =================================== */}

              {loteSeleccionado && (
                <div className="venta-lote-detail">

                  {/* ===============================
                      TIPO / FORMA DE VENTA
                  =============================== */}

                  <div
                    className={`venta-lote-type ${
                      esLoteIrregular
                        ? "irregular"
                        : "regular"
                    }`}
                  >

                    <div className="venta-lote-type-icon">

                      {esLoteIrregular
                        ? (
                          <Shapes
                            size={21}
                          />
                        )
                        : (
                          <Ruler
                            size={21}
                          />
                        )}

                    </div>

                    <div>

                      <span>
                        {
                          tipoLote
                        }
                      </span>

                      <strong>
                        {esLoteIrregular
                          ? "Venta por área total"
                          : "Venta por frente y fondo"}
                      </strong>

                      <small>
                        {esLoteIrregular
                          ? "La medida oficial de esta venta es el área total registrada del lote."
                          : "La medida del lote está determinada por su frente y su fondo."}
                      </small>

                    </div>

                  </div>

                  {/* ===============================
                      LOTE REGULAR
                  =============================== */}

                  {!esLoteIrregular && (
                    <div className="venta-lote-measures">

                      <div>
                        <span>
                          Frente
                        </span>

                        <strong>
                          {formatearMedida(
                            frenteLote
                          )}{" "}
                          m
                        </strong>
                      </div>

                      <div>
                        <span>
                          Fondo
                        </span>

                        <strong>
                          {formatearMedida(
                            fondoLote
                          )}{" "}
                          m
                        </strong>
                      </div>

                      <div>
                        <span>
                          Área
                        </span>

                        <strong>
                          {formatearMedida(
                            areaLote
                          )}{" "}
                          m²
                        </strong>
                      </div>

                    </div>
                  )}

                  {/* ===============================
                      LOTE IRREGULAR
                  =============================== */}

                  {esLoteIrregular && (
                    <>
                      <div className="venta-lote-irregular-area">

                        <div>
                          <span>
                            Área total a vender
                          </span>

                          <strong>
                            {formatearMedida(
                              areaLote
                            )}{" "}
                            m²
                          </strong>

                          <small>
                            Esta es la medida oficial del lote.
                          </small>
                        </div>

                      </div>

                      {/* ===========================
                          REFERENCIAS OPCIONALES
                      =========================== */}

                      {(
                        frenteLote >
                          0 ||
                        fondoLote >
                          0
                      ) && (
                        <div className="venta-lote-reference">

                          <span className="venta-lote-reference-title">
                            Medidas de referencia
                          </span>

                          <div>

                            {frenteLote >
                              0 && (
                              <span>
                                Frente{" "}
                                <strong>
                                  {formatearMedida(
                                    frenteLote
                                  )}{" "}
                                  m
                                </strong>
                              </span>
                            )}

                            {fondoLote >
                              0 && (
                              <span>
                                Fondo{" "}
                                <strong>
                                  {formatearMedida(
                                    fondoLote
                                  )}{" "}
                                  m
                                </strong>
                              </span>
                            )}

                          </div>

                          <small>
                            Estas medidas son informativas y no determinan el área vendida.
                          </small>

                        </div>
                      )}

                    </>
                  )}

                  {/* ===============================
                      DATOS GENERALES
                  =============================== */}

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
                        Tipo
                      </span>

                      <strong>
                        {
                          tipoLote
                        }
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
                RESUMEN FINANCIACIÓN
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
              className="ventas-btn-primary"
              disabled={
                guardando
              }
            >
              <Save
                size={18}
              />

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