import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  CreditCard,
  DollarSign,
  LandPlot,
  Loader2,
  ReceiptText,
  Search,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";

import {
  obtenerVentas,
} from "../../services/venta.service";

import {
  obtenerCuotasPorVenta,
} from "../../services/cuota.service";

import {
  crearPago,
} from "../../services/pago.service";

/* =========================================================
   FORMATEAR DINERO
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
   FECHA DE HOY
========================================================= */

const obtenerFechaHoy = () => {
  const hoy =
    new Date();

  const year =
    hoy.getFullYear();

  const month =
    String(
      hoy.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      hoy.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
};

/* =========================================================
   FORMATEAR FECHA
========================================================= */

const formatearFecha = (
  fecha
) => {
  if (!fecha) {
    return "—";
  }

  const date =
    new Date(fecha);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleDateString(
    "es-CO",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    }
  );
};

/* =========================================================
   NOMBRE CLIENTE
========================================================= */

const obtenerNombreCliente = (
  cliente
) => {
  if (!cliente) {
    return "Sin cliente";
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

export default function PagoModal({
  abierto,
  onClose,
  onGuardado,
  ventaInicial = null,
}) {
  /* =======================================================
     DATOS
  ======================================================= */

  const [
    ventas,
    setVentas,
  ] = useState([]);

  const [
    cuotas,
    setCuotas,
  ] = useState([]);

  /* =======================================================
     BUSCAR CLIENTE / VENTA
  ======================================================= */

  const [
    busquedaCliente,
    setBusquedaCliente,
  ] = useState("");

  /* =======================================================
     FORMULARIO
  ======================================================= */

  const [
    formulario,
    setFormulario,
  ] = useState({
    venta: "",
    valorPago: "",
    fechaPago:
      obtenerFechaHoy(),
    metodoPago:
      "Efectivo",
    referencia: "",
    observaciones: "",
  });

  /* =======================================================
     TIPO DE PAGO

     cuota = pagar cuota actual
     todo  = cancelar todo el saldo
     otro  = ingresar otro valor
  ======================================================= */

  const [
    tipoPago,
    setTipoPago,
  ] = useState("cuota");

  /* =======================================================
     ESTADOS
  ======================================================= */

  const [
    cargandoVentas,
    setCargandoVentas,
  ] = useState(false);

  const [
    cargandoCuotas,
    setCargandoCuotas,
  ] = useState(false);

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /* =======================================================
     CARGAR VENTAS
  ======================================================= */

  useEffect(() => {
    if (!abierto) {
      return;
    }

    const cargarVentas =
      async () => {
        try {
          setCargandoVentas(
            true
          );

          setError("");

          const datos =
            await obtenerVentas();

          const lista =
            Array.isArray(datos)
              ? datos
              : Array.isArray(
                    datos?.ventas
                  )
                ? datos.ventas
                : [];

          /*
            Solo pueden recibir pagos:

            - ventas financiadas
            - no anuladas

            Una venta Pagada podría aparecer si existe
            inconsistencia, pero luego verificamos sus cuotas.
          */

          const financiadas =
            lista.filter(
              (venta) =>
                venta.formaPago ===
                  "Financiado" &&
                venta.estado !==
                  "Anulada"
            );

          setVentas(
            financiadas
          );
        } catch (error) {
          console.error(
            "Error cargando ventas:",
            error
          );

          setError(
            error?.response?.data
              ?.message ||
              "No fue posible cargar las ventas."
          );
        } finally {
          setCargandoVentas(
            false
          );
        }
      };

    cargarVentas();
  }, [abierto]);

  /* =======================================================
     REINICIAR AL ABRIR
  ======================================================= */

  useEffect(() => {
    if (!abierto) {
      return;
    }

    setFormulario({
      venta:
        ventaInicial?._id ||
        "",

      valorPago: "",

      fechaPago:
        obtenerFechaHoy(),

      metodoPago:
        "Efectivo",

      referencia: "",

      observaciones: "",
    });

    setBusquedaCliente("");

    setCuotas([]);

    setError("");

    setTipoPago("cuota");
  }, [
    abierto,
    ventaInicial,
  ]);

  /* =======================================================
     CARGAR CUOTAS DE LA VENTA
  ======================================================= */

  useEffect(() => {
    if (
      !abierto ||
      !formulario.venta
    ) {
      setCuotas([]);

      return;
    }

    const cargarCuotas =
      async () => {
        try {
          setCargandoCuotas(
            true
          );

          setError("");

          const datos =
            await obtenerCuotasPorVenta(
              formulario.venta
            );

          const lista =
            Array.isArray(datos)
              ? datos
              : [];

          /*
            Solamente cuotas que todavía representen
            una deuda real.
          */

          const pendientes =
            lista
              .filter(
                (cuota) =>
                  cuota.estado !==
                    "Anulada" &&
                  Number(
                    cuota.saldoPendiente
                  ) > 0
              )
              .sort(
                (a, b) => {
                  const fechaA =
                    new Date(
                      a.fechaVencimiento
                    ).getTime();

                  const fechaB =
                    new Date(
                      b.fechaVencimiento
                    ).getTime();

                  if (
                    fechaA !==
                    fechaB
                  ) {
                    return (
                      fechaA -
                      fechaB
                    );
                  }

                  return (
                    Number(
                      a.numeroCuota
                    ) -
                    Number(
                      b.numeroCuota
                    )
                  );
                }
              );

          setCuotas(
            pendientes
          );
        } catch (error) {
          console.error(
            "Error cargando cuotas:",
            error
          );

          setCuotas([]);

          setError(
            error?.response?.data
              ?.message ||
              "No fue posible consultar las cuotas de la venta."
          );
        } finally {
          setCargandoCuotas(
            false
          );
        }
      };

    cargarCuotas();
  }, [
    abierto,
    formulario.venta,
  ]);

  /* =======================================================
     FILTRAR VENTAS POR CLIENTE

     Permite buscar por:
     - nombres
     - apellidos
     - nombre completo
     - documento
     - código de venta
     - código del lote
  ======================================================= */

  const ventasFiltradas =
    useMemo(() => {
      const texto =
        busquedaCliente
          .trim()
          .toLowerCase();

      if (!texto) {
        return ventas;
      }

      return ventas.filter(
        (venta) => {
          const cliente =
            venta.cliente;

          const nombre =
            obtenerNombreCliente(
              cliente
            );

          const contenido = [
            nombre,
            cliente?.nombres,
            cliente?.apellidos,
            cliente?.documento,
            venta?.codigo,
            venta?.lote?.codigo,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return contenido.includes(
            texto
          );
        }
      );
    }, [
      ventas,
      busquedaCliente,
    ]);

  /* =======================================================
     VENTA SELECCIONADA
  ======================================================= */

  const ventaSeleccionada =
    useMemo(() => {
      return ventas.find(
        (venta) =>
          venta._id ===
          formulario.venta
      ) || (
        ventaInicial?._id ===
        formulario.venta
          ? ventaInicial
          : null
      );
    }, [
      ventas,
      formulario.venta,
      ventaInicial,
    ]);

  /* =======================================================
     SALDO REAL
  ======================================================= */

  const saldoPendiente =
    useMemo(() => {
      return Number(
        cuotas
          .reduce(
            (
              total,
              cuota
            ) =>
              total +
              Number(
                cuota.saldoPendiente ||
                  0
              ),
            0
          )
          .toFixed(2)
      );
    }, [cuotas]);

  /* =======================================================
     CUOTA ACTUAL

     Siempre será la primera cuota que todavía tenga saldo.
  ======================================================= */

  const cuotaActual =
    useMemo(() => {
      if (
        !Array.isArray(cuotas) ||
        cuotas.length === 0
      ) {
        return null;
      }

      return cuotas[0];
    }, [cuotas]);

  /* =======================================================
     VALOR REAL A PAGAR DE LA CUOTA ACTUAL

     Si la cuota fue abonada parcialmente:

     Valor original:   $1.000.000
     Pagado:             $300.000
     Valor a pagar:      $700.000
  ======================================================= */

  const valorCuotaActual =
    Number(
      cuotaActual?.saldoPendiente
    ) || 0;

  /* =======================================================
     SALDO INICIAL FINANCIADO

     Valor venta - cuota inicial
  ======================================================= */

  const saldoInicialFinanciado =
    Number(
      ventaSeleccionada?.saldoFinanciar
    ) || 0;

  /* =======================================================
     TOTAL PAGADO HASTA EL MOMENTO
  ======================================================= */

  const totalPagadoVenta =
    Math.max(
      0,
      saldoInicialFinanciado -
        saldoPendiente
    );

  /* =======================================================
     COLOCAR AUTOMÁTICAMENTE EL VALOR DEL PAGO
  ======================================================= */

  useEffect(() => {
    if (
      !abierto ||
      !formulario.venta ||
      cargandoCuotas
    ) {
      return;
    }

    if (cuotas.length === 0) {
      setFormulario(
        (prev) => ({
          ...prev,
          valorPago: "",
        })
      );

      return;
    }

    /* =========================
       PAGAR CUOTA ACTUAL
    ========================= */

    if (
      tipoPago ===
      "cuota"
    ) {
      setFormulario(
        (prev) => ({
          ...prev,

          valorPago:
            String(
              valorCuotaActual
            ),
        })
      );
    }

    /* =========================
       PAGAR TODO
    ========================= */

    if (
      tipoPago ===
      "todo"
    ) {
      setFormulario(
        (prev) => ({
          ...prev,

          valorPago:
            String(
              saldoPendiente
            ),
        })
      );
    }
  }, [
    abierto,
    formulario.venta,
    cuotas,
    cargandoCuotas,
    tipoPago,
    valorCuotaActual,
    saldoPendiente,
  ]);

  /* =======================================================
     VISTA PREVIA DE APLICACIÓN

     Ejemplo:

     Pago $2.500.000

     C1 -> 1.000.000
     C2 -> 1.000.000
     C3 ->   500.000
  ======================================================= */

  const aplicacionesPrevias =
    useMemo(() => {
      let disponible =
        Number(
          formulario.valorPago
        ) || 0;

      if (
        disponible <= 0
      ) {
        return [];
      }

      const aplicaciones = [];

      for (
        const cuota
        of cuotas
      ) {
        if (
          disponible <= 0
        ) {
          break;
        }

        const saldo =
          Number(
            cuota.saldoPendiente
          ) || 0;

        if (
          saldo <= 0
        ) {
          continue;
        }

        const valorAplicado =
          Math.min(
            disponible,
            saldo
          );

        aplicaciones.push({
          cuota,

          valorAplicado:
            Number(
              valorAplicado.toFixed(
                2
              )
            ),

          saldoDespues:
            Number(
              Math.max(
                0,
                saldo -
                  valorAplicado
              ).toFixed(
                2
              )
            ),
        });

        disponible =
          Number(
            (
              disponible -
              valorAplicado
            ).toFixed(
              2
            )
          );
      }

      return aplicaciones;
    }, [
      cuotas,
      formulario.valorPago,
    ]);

  /* =======================================================
     VALORES CALCULADOS
  ======================================================= */

  const valorPago =
    Number(
      formulario.valorPago
    ) || 0;

  const pagoExcedeSaldo =
    valorPago >
      saldoPendiente &&
    saldoPendiente > 0;

  const saldoDespuesPago =
    Math.max(
      0,
      saldoPendiente -
        valorPago
    );

  /* =======================================================
     CAMBIOS
  ======================================================= */

  const handleChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setFormulario(
        (prev) => ({
          ...prev,

          [name]:
            value,
        })
      );

      setError("");
    };

  /* =======================================================
     GUARDAR
  ======================================================= */

  const handleSubmit =
    async (
      event
    ) => {
      event.preventDefault();

      setError("");

      /* =========================
         VENTA
      ========================= */

      if (
        !formulario.venta
      ) {
        setError(
          "Debe seleccionar una venta."
        );

        return;
      }

      /* =========================
         CUOTAS
      ========================= */

      if (
        cuotas.length === 0
      ) {
        setError(
          "La venta seleccionada no tiene cuotas pendientes."
        );

        return;
      }

      /* =========================
         VALOR
      ========================= */

      if (
        !Number.isFinite(
          valorPago
        ) ||
        valorPago <= 0
      ) {
        setError(
          "El valor del pago debe ser mayor que cero."
        );

        return;
      }

      if (
        valorPago >
        saldoPendiente
      ) {
        setError(
          `El pago no puede superar el saldo pendiente de ${formatearDinero(
            saldoPendiente
          )}.`
        );

        return;
      }

      /* =========================
         FECHA
      ========================= */

      if (
        !formulario.fechaPago
      ) {
        setError(
          "Debe seleccionar la fecha del pago."
        );

        return;
      }

      /* =========================
         REFERENCIA
      ========================= */

      if (
        [
          "Transferencia",
          "Consignación",
          "PSE",
        ].includes(
          formulario.metodoPago
        ) &&
        !formulario.referencia.trim()
      ) {
        setError(
          "Debe indicar la referencia o número de la transacción."
        );

        return;
      }

      /* =========================
         ENVIAR
      ========================= */

      try {
        setGuardando(
          true
        );

        const respuesta =
          await crearPago({
            venta:
              formulario.venta,

            valorPago,

            fechaPago:
              formulario.fechaPago,

            metodoPago:
              formulario.metodoPago,

            referencia:
              formulario.referencia.trim(),

            observaciones:
              formulario.observaciones.trim(),
          });

        if (onGuardado) {
          await onGuardado(
            respuesta
          );
        }

        onClose();
      } catch (error) {
        console.error(
          "Error registrando pago:",
          error
        );

        setError(
          error?.response?.data
            ?.message ||
            "No fue posible registrar el pago."
        );
      } finally {
        setGuardando(
          false
        );
      }
    };

  /* =======================================================
     CERRAR
  ======================================================= */

  const cerrarModal =
    () => {
      if (guardando) {
        return;
      }

      onClose();
    };

  /* =======================================================
     NO MOSTRAR
  ======================================================= */

  if (!abierto) {
    return null;
  }

  /* =======================================================
     DATOS AUXILIARES
  ======================================================= */

  const cliente =
    ventaSeleccionada?.cliente;

  const lote =
    ventaSeleccionada?.lote;

  const manzana =
    lote?.manzana;

  return (
    <div className="pagos-modal-overlay">
      <div className="pagos-modal pago-modal">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="pagos-modal-header">
          <div className="pagos-modal-title">
            <div className="pagos-modal-icon">
              <WalletCards
                size={22}
              />
            </div>

            <div>
              <span className="pagos-modal-kicker">
                Cartera
              </span>

              <h2>
                Registrar pago
              </h2>
            </div>
          </div>

          <button
            type="button"
            className="pagos-modal-close"
            onClick={
              cerrarModal
            }
            disabled={
              guardando
            }
          >
            <X size={20} />
          </button>
        </div>

        {/* =================================================
            FORMULARIO
        ================================================= */}

        <form
          onSubmit={
            handleSubmit
          }
        >
          <div className="pagos-modal-body">

            {/* =============================================
                ERROR
            ============================================= */}

            {error && (
              <div className="pago-modal-error">
                {error}
              </div>
            )}

            {/* =============================================
                BUSCAR CLIENTE
            ============================================= */}

            <div className="pagos-field pago-field-full">
              <label>
                Buscar cliente
              </label>

              <div className="pago-client-search">
                <Search
                  size={17}
                />

                <input
                  type="text"
                  value={
                    busquedaCliente
                  }
                  onChange={(e) =>
                    setBusquedaCliente(
                      e.target.value
                    )
                  }
                  placeholder="Escriba nombre, apellido o número de documento..."
                  disabled={
                    guardando ||
                    cargandoVentas ||
                    Boolean(
                      ventaInicial
                    )
                  }
                />

                {busquedaCliente && (
                  <button
                    type="button"
                    className="pago-client-search-clear"
                    onClick={() =>
                      setBusquedaCliente(
                        ""
                      )
                    }
                    disabled={
                      guardando
                    }
                    title="Limpiar búsqueda"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {busquedaCliente && (
                <small className="pago-client-search-results">
                  {ventasFiltradas.length ===
                  1
                    ? "1 venta financiada encontrada"
                    : `${ventasFiltradas.length} ventas financiadas encontradas`}
                </small>
              )}
            </div>

            {/* =============================================
                VENTA
            ============================================= */}

            <div className="pagos-field pago-field-full">
              <label>
                Venta financiada *
              </label>

              <select
                name="venta"
                value={
                  formulario.venta
                }
                onChange={
                  handleChange
                }
                disabled={
                  guardando ||
                  cargandoVentas ||
                  Boolean(
                    ventaInicial
                  )
                }
              >
                <option value="">
                  {cargandoVentas
                    ? "Cargando ventas..."
                    : ventasFiltradas.length ===
                        0
                      ? "No se encontraron ventas"
                      : "Seleccione una venta"}
                </option>

                {ventasFiltradas.map(
                  (venta) => {
                    const cliente =
                      venta.cliente;

                    const nombre =
                      obtenerNombreCliente(
                        cliente
                      );

                    const documento =
                      cliente?.documento
                        ? `CC ${cliente.documento}`
                        : "Sin documento";

                    return (
                      <option
                        key={
                          venta._id
                        }
                        value={
                          venta._id
                        }
                      >
                        {nombre} -{" "}
                        {documento} -{" "}
                        {venta.codigo} -{" "}
                        {venta.lote?.codigo ||
                          "Sin lote"}
                      </option>
                    );
                  }
                )}
              </select>
            </div>

            {/* =============================================
                INFORMACIÓN DE LA VENTA
            ============================================= */}

            {ventaSeleccionada && (
              <div className="pago-sale-info">

                <div>
                  <UserRound
                    size={17}
                  />

                  <span>
                    Cliente
                  </span>

                  <strong>
                    {obtenerNombreCliente(
                      cliente
                    )}
                  </strong>

                  <small>
                    {cliente?.documento ||
                      "Sin documento"}
                  </small>
                </div>

                <div>
                  <LandPlot
                    size={17}
                  />

                  <span>
                    Lote
                  </span>

                  <strong>
                    {lote?.codigo ||
                      "—"}
                  </strong>

                  <small>
                    {manzana?.nombre ||
                      "Sin manzana"}
                  </small>
                </div>

                <div>
                  <ReceiptText
                    size={17}
                  />

                  <span>
                    Venta
                  </span>

                  <strong>
                    {ventaSeleccionada.codigo ||
                      "—"}
                  </strong>

                  <small>
                    {ventaSeleccionada.numeroCuotas
                      ? `${ventaSeleccionada.numeroCuotas} cuotas`
                      : "Financiada"}
                  </small>
                </div>

                <div>
                  <DollarSign
                    size={17}
                  />

                  <span>
                    Saldo pendiente
                  </span>

                  <strong>
                    {cargandoCuotas
                      ? "Consultando..."
                      : formatearDinero(
                          saldoPendiente
                        )}
                  </strong>

                  <small>
                    {cuotas.length} cuota
                    {cuotas.length === 1
                      ? ""
                      : "s"}{" "}
                    pendiente
                    {cuotas.length === 1
                      ? ""
                      : "s"}
                  </small>
                </div>
              </div>
            )}

            {/* =============================================
                ESTADO DE LA FINANCIACIÓN
            ============================================= */}

            {ventaSeleccionada &&
              !cargandoCuotas && (
                <div className="pago-financing-summary">

                  <div>
                    <span>
                      Saldo inicial
                    </span>

                    <strong>
                      {formatearDinero(
                        saldoInicialFinanciado
                      )}
                    </strong>

                    <small>
                      Después de cuota inicial
                    </small>
                  </div>

                  <div>
                    <span>
                      Pagado
                    </span>

                    <strong className="pago-financing-paid">
                      {formatearDinero(
                        totalPagadoVenta
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Saldo actual
                    </span>

                    <strong>
                      {formatearDinero(
                        saldoPendiente
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Después de este pago
                    </span>

                    <strong className="pago-financing-after">
                      {formatearDinero(
                        Math.max(
                          0,
                          saldoPendiente -
                            valorPago
                        )
                      )}
                    </strong>
                  </div>
                </div>
              )}

            {/* =============================================
                FORMA DE APLICAR EL PAGO
            ============================================= */}

            <div className="pagos-field pago-field-full">
              <label>
                ¿Qué desea pagar? *
              </label>

              <div className="pago-type-options">

                {/* =========================================
                    PAGAR CUOTA
                ========================================= */}

                <button
                  type="button"
                  className={`pago-type-option ${
                    tipoPago === "cuota"
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setTipoPago(
                      "cuota"
                    )
                  }
                  disabled={
                    guardando ||
                    cargandoCuotas ||
                    !cuotaActual
                  }
                >
                  <div className="pago-type-radio">
                    <span />
                  </div>

                  <div className="pago-type-content">
                    <span>
                      Pagar cuota actual
                    </span>

                    <strong>
                      {cuotaActual
                        ? `Cuota ${String(
                            cuotaActual.numeroCuota
                          ).padStart(
                            2,
                            "0"
                          )}`
                        : "Sin cuota pendiente"}
                    </strong>

                    <small>
                      {cuotaActual
                        ? `Valor pendiente: ${formatearDinero(
                            valorCuotaActual
                          )}`
                        : "No hay cuotas pendientes"}
                    </small>
                  </div>
                </button>

                {/* =========================================
                    PAGAR TODO
                ========================================= */}

                <button
                  type="button"
                  className={`pago-type-option ${
                    tipoPago === "todo"
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setTipoPago(
                      "todo"
                    )
                  }
                  disabled={
                    guardando ||
                    cargandoCuotas ||
                    saldoPendiente <= 0
                  }
                >
                  <div className="pago-type-radio">
                    <span />
                  </div>

                  <div className="pago-type-content">
                    <span>
                      Pagar todo
                    </span>

                    <strong>
                      Cancelar saldo
                    </strong>

                    <small>
                      {formatearDinero(
                        saldoPendiente
                      )}
                    </small>
                  </div>
                </button>

                {/* =========================================
                    OTRO VALOR
                ========================================= */}

                <button
                  type="button"
                  className={`pago-type-option ${
                    tipoPago === "otro"
                      ? "active"
                      : ""
                  }`}
                  onClick={() => {
                    setTipoPago(
                      "otro"
                    );

                    setFormulario(
                      (prev) => ({
                        ...prev,
                        valorPago: "",
                      })
                    );
                  }}
                  disabled={
                    guardando ||
                    cargandoCuotas ||
                    saldoPendiente <= 0
                  }
                >
                  <div className="pago-type-radio">
                    <span />
                  </div>

                  <div className="pago-type-content">
                    <span>
                      Otro valor
                    </span>

                    <strong>
                      Abono personalizado
                    </strong>

                    <small>
                      Puede pagar menos o más
                      de una cuota
                    </small>
                  </div>
                </button>
              </div>
            </div>

            {/* =============================================
                VALOR DEL PAGO
            ============================================= */}

            <div className="pagos-field">
              <label>
                Valor del pago *
              </label>

              <div className="pago-money-input">
                <span>
                  $
                </span>

                <input
                  type="number"
                  name="valorPago"
                  value={
                    formulario.valorPago
                  }
                  onChange={
                    handleChange
                  }
                  min="1"
                  step="1"
                  placeholder="0"
                  readOnly={
                    tipoPago !==
                    "otro"
                  }
                  disabled={
                    guardando ||
                    cargandoCuotas ||
                    !formulario.venta
                  }
                />
              </div>

              {tipoPago ===
                "cuota" &&
                cuotaActual && (
                  <small className="pago-value-help">
                    Valor correspondiente a
                    la cuota{" "}
                    {cuotaActual.numeroCuota}.
                  </small>
                )}

              {tipoPago ===
                "todo" && (
                  <small className="pago-value-help">
                    Se cancelará completamente
                    el saldo pendiente.
                  </small>
                )}

              {tipoPago ===
                "otro" && (
                  <small className="pago-value-help">
                    Ingrese el valor que recibió
                    del cliente.
                  </small>
                )}
            </div>

            {/* =============================================
                DATOS DEL PAGO (FECHA, MÉTODO, REFERENCIA)
            ============================================= */}

            <div className="pago-form-grid">

              {/* FECHA */}

              <div className="pagos-field">
                <label>
                  Fecha del pago *
                </label>

                <div className="pago-input-icon">
                  <CalendarDays
                    size={16}
                  />

                  <input
                    type="date"
                    name="fechaPago"
                    value={
                      formulario.fechaPago
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      guardando
                    }
                  />
                </div>
              </div>

              {/* MÉTODO */}

              <div className="pagos-field">
                <label>
                  Método de pago *
                </label>

                <div className="pago-input-icon">
                  <CreditCard
                    size={16}
                  />

                  <select
                    name="metodoPago"
                    value={
                      formulario.metodoPago
                    }
                    onChange={
                      handleChange
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

                    <option value="Consignación">
                      Consignación
                    </option>

                    <option value="PSE">
                      PSE
                    </option>

                    <option value="Otro">
                      Otro
                    </option>
                  </select>
                </div>
              </div>

              {/* REFERENCIA */}

              <div className="pagos-field pago-field-full">
                <label>
                  Referencia
                </label>

                <input
                  type="text"
                  name="referencia"
                  value={
                    formulario.referencia
                  }
                  onChange={
                    handleChange
                  }
                  maxLength={100}
                  placeholder={
                    formulario.metodoPago ===
                    "Efectivo"
                      ? "Opcional"
                      : "Número de transacción"
                  }
                  disabled={
                    guardando
                  }
                />
              </div>
            </div>

            {/* =============================================
                VALIDACIÓN DEL SALDO
            ============================================= */}

            {pagoExcedeSaldo && (
              <div className="pago-balance-warning">
                El valor ingresado supera el
                saldo pendiente de{" "}
                <strong>
                  {formatearDinero(
                    saldoPendiente
                  )}
                </strong>
                .
              </div>
            )}

            {/* =============================================
                VISTA PREVIA DE DISTRIBUCIÓN
            ============================================= */}

            {valorPago > 0 &&
              !pagoExcedeSaldo &&
              aplicacionesPrevias.length >
                0 && (
                <div className="pago-distribution">

                  <div className="pago-distribution-header">
                    <div>
                      <span>
                        Aplicación automática
                      </span>

                      <h3>
                        Así se distribuirá el pago
                      </h3>
                    </div>

                    <div className="pago-after-balance">
                      <span>
                        Saldo después
                      </span>

                      <strong>
                        {formatearDinero(
                          saldoDespuesPago
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className="pago-distribution-list">
                    {aplicacionesPrevias.map(
                      (
                        aplicacion
                      ) => {
                        const {
                          cuota,
                          valorAplicado,
                          saldoDespues,
                        } =
                          aplicacion;

                        return (
                          <div
                            className="pago-distribution-item"
                            key={
                              cuota._id
                            }
                          >
                            <div className="pago-distribution-number">
                              <span>
                                Cuota
                              </span>

                              <strong>
                                {String(
                                  cuota.numeroCuota
                                ).padStart(
                                  2,
                                  "0"
                                )}
                              </strong>
                            </div>

                            <div>
                              <span>
                                Vencimiento
                              </span>

                              <strong>
                                {formatearFecha(
                                  cuota.fechaVencimiento
                                )}
                              </strong>
                            </div>

                            <div>
                              <span>
                                Saldo actual
                              </span>

                              <strong>
                                {formatearDinero(
                                  cuota.saldoPendiente
                                )}
                              </strong>
                            </div>

                            <div>
                              <span>
                                Se aplicará
                              </span>

                              <strong className="pago-distribution-applied">
                                {formatearDinero(
                                  valorAplicado
                                )}
                              </strong>
                            </div>

                            <div>
                              <span>
                                Nuevo saldo
                              </span>

                              <strong>
                                {formatearDinero(
                                  saldoDespues
                                )}
                              </strong>
                            </div>

                            <div className="pago-distribution-result">
                              {saldoDespues ===
                              0 ? (
                                <>
                                  <CheckCircle2
                                    size={15}
                                  />

                                  Pagada
                                </>
                              ) : (
                                <>
                                  <WalletCards
                                    size={15}
                                  />

                                  Parcial
                                </>
                              )}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

            {/* =============================================
                OBSERVACIONES
            ============================================= */}

            <div className="pagos-field pago-field-full">
              <label>
                Observaciones
              </label>

              <textarea
                name="observaciones"
                value={
                  formulario.observaciones
                }
                onChange={
                  handleChange
                }
                rows="3"
                maxLength={500}
                placeholder="Información adicional sobre el pago..."
                disabled={
                  guardando
                }
              />
            </div>
          </div>

          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="pagos-modal-footer">
            <button
              type="button"
              className="pagos-btn-secondary"
              onClick={
                cerrarModal
              }
              disabled={
                guardando
              }
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="pagos-btn-primary"
              disabled={
                guardando ||
                cargandoCuotas ||
                !formulario.venta ||
                valorPago <= 0 ||
                pagoExcedeSaldo ||
                cuotas.length === 0
              }
            >
              {guardando ? (
                <>
                  <Loader2
                    size={17}
                    className="pagos-spin"
                  />

                  Registrando...
                </>
              ) : (
                <>
                  <WalletCards
                    size={17}
                  />

                  Registrar pago
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}