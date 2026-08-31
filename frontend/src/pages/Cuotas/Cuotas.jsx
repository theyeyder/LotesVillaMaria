import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  LandPlot,
  RefreshCw,
  Search,
  UserRound,
  WalletCards,
} from "lucide-react";

import "./Cuotas.css";

import Toast from "../../components/ui/Toast";

import {
  obtenerCuotas,
  obtenerResumenCuotas,
} from "../../services/cuota.service";

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
   NOMBRE DEL CLIENTE
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
   ESTADO INICIAL DEL RESUMEN

   Estados válidos:
   - Pendiente
   - Parcial
   - Pagada
   - Vencida
========================================================= */

const resumenInicial = {
  totalCuotas: 0,

  pendientes: 0,
  parciales: 0,
  pagadas: 0,
  vencidas: 0,

  valorProgramado: 0,
  valorPagado: 0,
  saldoPendiente: 0,
};

/* =========================================================
   COMPONENTE
========================================================= */

export default function Cuotas() {
  /* =======================================================
     DATOS
  ======================================================= */

  const [
    cuotas,
    setCuotas,
  ] = useState([]);

  const [
    resumen,
    setResumen,
  ] = useState(
    resumenInicial
  );

  /* =======================================================
     CARGA
  ======================================================= */

  const [
    cargando,
    setCargando,
  ] = useState(true);

  /* =======================================================
     FILTROS
  ======================================================= */

  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  const [
    filtroEstado,
    setFiltroEstado,
  ] = useState("");

  const [
    filtroCliente,
    setFiltroCliente,
  ] = useState("");

  const [
    busquedaCliente,
    setBusquedaCliente,
  ] = useState("");

  const [
    mostrarResultadosClientes,
    setMostrarResultadosClientes,
  ] = useState(false);

  const [
    fechaInicio,
    setFechaInicio,
  ] = useState("");

  const [
    fechaFinal,
    setFechaFinal,
  ] = useState("");

  /* =======================================================
     PAGINACIÓN
  ======================================================= */

  const [
    paginaActual,
    setPaginaActual,
  ] = useState(1);

  const CUOTAS_POR_PAGINA =
    10;

  /* =======================================================
     TOAST
  ======================================================= */

  const [
    notificacion,
    setNotificacion,
  ] = useState({
    visible: false,
    mensaje: "",
    tipo: "success",
  });

  const mostrarNotificacion = (
    mensaje,
    tipo = "success"
  ) => {
    setNotificacion({
      visible: true,
      mensaje,
      tipo,
    });
  };

  const cerrarNotificacion =
    () => {
      setNotificacion(
        (prev) => ({
          ...prev,

          visible:
            false,
        })
      );
    };

  /* =======================================================
     CARGAR CUOTAS
  ======================================================= */

  const cargarCuotas =
    async () => {
      try {
        const datos =
          await obtenerCuotas();

        setCuotas(
          Array.isArray(
            datos
          )
            ? datos
            : []
        );
      } catch (error) {
        console.error(
          "Error cargando cuotas:",
          error
        );

        mostrarNotificacion(
          error?.response?.data
            ?.message ||
            "No fue posible cargar las cuotas.",
          "error"
        );
      }
    };

  /* =======================================================
     CARGAR RESUMEN
  ======================================================= */

  const cargarResumen =
    async () => {
      try {
        const datos =
          await obtenerResumenCuotas();

        setResumen({
          ...resumenInicial,

          ...(datos || {}),
        });
      } catch (error) {
        console.error(
          "Error cargando resumen:",
          error
        );

        mostrarNotificacion(
          error?.response?.data
            ?.message ||
            "No fue posible cargar el resumen de cuotas.",
          "error"
        );
      }
    };

  /* =======================================================
     CARGAR TODO
  ======================================================= */

  const cargarTodo =
    async () => {
      try {
        setCargando(
          true
        );

        await Promise.all([
          cargarCuotas(),
          cargarResumen(),
        ]);
      } finally {
        setCargando(
          false
        );
      }
    };

  useEffect(() => {
    cargarTodo();
  }, []);

  /* =======================================================
     CLIENTES DISPONIBLES EN LAS CUOTAS
  ======================================================= */

  const clientes =
    useMemo(() => {
      const mapa =
        new Map();

      cuotas.forEach(
        (cuota) => {
          const cliente =
            cuota.venta?.cliente;

          if (
            cliente?._id &&
            !mapa.has(
              cliente._id
            )
          ) {
            mapa.set(
              cliente._id,
              cliente
            );
          }
        }
      );

      return Array.from(
        mapa.values()
      ).sort(
        (
          a,
          b
        ) =>
          obtenerNombreCliente(
            a
          ).localeCompare(
            obtenerNombreCliente(
              b
            ),
            "es"
          )
      );
    }, [
      cuotas,
    ]);

  /* =======================================================
     CLIENTE SELECCIONADO EN EL FILTRO
  ======================================================= */

  const clienteSeleccionado =
    useMemo(() => {
      if (
        !filtroCliente
      ) {
        return null;
      }

      return (
        clientes.find(
          (cliente) =>
            cliente._id ===
            filtroCliente
        ) || null
      );
    }, [
      clientes,
      filtroCliente,
    ]);

  /* =======================================================
     BUSCAR CLIENTES

     Busca por:
     - Nombre
     - Apellido
     - Documento
     - Teléfono
     - Correo

     Máximo 10 resultados.
  ======================================================= */

  const clientesFiltradosBusqueda =
    useMemo(() => {
      const texto =
        busquedaCliente
          .trim()
          .toLowerCase();

      /*
        No mostramos todos los clientes
        cuando el buscador está vacío.
      */

      if (
        !texto
      ) {
        return [];
      }

      return clientes
        .filter(
          (cliente) => {
            const nombre =
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
              nombre.includes(
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
        .slice(
          0,
          10
        );
    }, [
      clientes,
      busquedaCliente,
    ]);

  /* =======================================================
     ESCRIBIR EN BUSCADOR DE CLIENTE
  ======================================================= */

  const handleBuscarCliente =
    (e) => {
      const value =
        e.target.value;

      setBusquedaCliente(
        value
      );

      setMostrarResultadosClientes(
        true
      );

      /*
        Si había un cliente seleccionado
        y comenzamos una búsqueda nueva,
        quitamos el filtro anterior.
      */

      if (
        filtroCliente
      ) {
        setFiltroCliente(
          ""
        );
      }
    };

  /* =======================================================
     SELECCIONAR CLIENTE
  ======================================================= */

  const seleccionarCliente =
    (cliente) => {
      setFiltroCliente(
        cliente._id
      );

      setBusquedaCliente(
        obtenerNombreCliente(
          cliente
        )
      );

      setMostrarResultadosClientes(
        false
      );

      setPaginaActual(
        1
      );
    };

  /* =======================================================
     LIMPIAR CLIENTE
  ======================================================= */

  const limpiarCliente =
    () => {
      setFiltroCliente(
        ""
      );

      setBusquedaCliente(
        ""
      );

      setMostrarResultadosClientes(
        false
      );

      setPaginaActual(
        1
      );
    };

  /* =======================================================
     FILTRAR CUOTAS
  ======================================================= */

  const cuotasFiltradas =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      return cuotas.filter(
        (cuota) => {
          const venta =
            cuota.venta;

          const cliente =
            venta?.cliente;

          const lote =
            venta?.lote;

          const manzana =
            lote?.manzana;

          /* =====================
             ESTADO
          ===================== */

          if (
            filtroEstado &&
            cuota.estado !==
              filtroEstado
          ) {
            return false;
          }

          /* =====================
             CLIENTE
          ===================== */

          if (
            filtroCliente &&
            cliente?._id !==
              filtroCliente
          ) {
            return false;
          }

          /* =====================
             FECHA INICIAL
          ===================== */

          if (
            fechaInicio
          ) {
            const vencimiento =
              new Date(
                cuota.fechaVencimiento
              );

            const inicio =
              new Date(
                `${fechaInicio}T00:00:00Z`
              );

            if (
              vencimiento <
              inicio
            ) {
              return false;
            }
          }

          /* =====================
             FECHA FINAL
          ===================== */

          if (
            fechaFinal
          ) {
            const vencimiento =
              new Date(
                cuota.fechaVencimiento
              );

            const final =
              new Date(
                `${fechaFinal}T23:59:59Z`
              );

            if (
              vencimiento >
              final
            ) {
              return false;
            }
          }

          /* =====================
             BÚSQUEDA
          ===================== */

          if (
            !texto
          ) {
            return true;
          }

          const contenido = [
            venta?.codigo,

            obtenerNombreCliente(
              cliente
            ),

            cliente?.documento,

            lote?.codigo,

            lote?.numeroLote,

            manzana?.codigo,

            manzana?.nombre,

            `cuota ${cuota.numeroCuota}`,

            cuota.numeroCuota,

            cuota.estado,
          ]
            .filter(
              (item) =>
                item !==
                  undefined &&
                item !==
                  null
            )
            .join(" ")
            .toLowerCase();

          return contenido.includes(
            texto
          );
        }
      );
    }, [
      cuotas,
      busqueda,
      filtroEstado,
      filtroCliente,
      fechaInicio,
      fechaFinal,
    ]);

  /* =======================================================
     PAGINACIÓN
  ======================================================= */

  const totalPaginas =
    Math.max(
      1,
      Math.ceil(
        cuotasFiltradas.length /
          CUOTAS_POR_PAGINA
      )
    );

  const indiceInicial =
    (
      paginaActual -
      1
    ) *
    CUOTAS_POR_PAGINA;

  const cuotasPaginadas =
    cuotasFiltradas.slice(
      indiceInicial,
      indiceInicial +
        CUOTAS_POR_PAGINA
    );

  useEffect(() => {
    setPaginaActual(
      1
    );
  }, [
    busqueda,
    filtroEstado,
    filtroCliente,
    fechaInicio,
    fechaFinal,
  ]);

  useEffect(() => {
    if (
      paginaActual >
      totalPaginas
    ) {
      setPaginaActual(
        totalPaginas
      );
    }
  }, [
    paginaActual,
    totalPaginas,
  ]);

  /* =======================================================
     LIMPIAR FILTROS
  ======================================================= */

  const limpiarFiltros =
    () => {
      setBusqueda(
        ""
      );

      setFiltroEstado(
        ""
      );

      setFiltroCliente(
        ""
      );

      setBusquedaCliente(
        ""
      );

      setMostrarResultadosClientes(
        false
      );

      setFechaInicio(
        ""
      );

      setFechaFinal(
        ""
      );

      setPaginaActual(
        1
      );
    };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <section className="cuotas-page">

      {/* =================================================
          CABECERA
      ================================================= */}

      <div className="cuotas-header">

        <div>
          <span className="cuotas-kicker">
            Cartera
          </span>

          <h1>
            Control de cuotas
          </h1>

          <p>
            Consulta las cuotas
            generadas por las ventas
            financiadas, sus
            vencimientos, pagos y
            saldos pendientes.
          </p>
        </div>

        <button
          type="button"
          className="cuotas-refresh-button"
          onClick={
            cargarTodo
          }
          disabled={
            cargando
          }
        >
          <RefreshCw
            size={18}
            className={
              cargando
                ? "cuotas-spin"
                : ""
            }
          />

          Actualizar
        </button>

      </div>

      {/* =================================================
          ESTADÍSTICAS
      ================================================= */}

      <div className="cuotas-stats">

        {/* TOTAL */}

        <article className="cuotas-stat">
          <div className="cuotas-stat-icon">
            <WalletCards
              size={20}
            />
          </div>

          <div>
            <span>
              Total cuotas
            </span>

            <strong>
              {
                resumen.totalCuotas
              }
            </strong>
          </div>
        </article>

        {/* PENDIENTES */}

        <article className="cuotas-stat pendiente">
          <div className="cuotas-stat-icon">
            <Clock3
              size={20}
            />
          </div>

          <div>
            <span>
              Pendientes
            </span>

            <strong>
              {
                resumen.pendientes
              }
            </strong>
          </div>
        </article>

        {/* VENCIDAS */}

        <article className="cuotas-stat vencida">
          <div className="cuotas-stat-icon">
            <AlertTriangle
              size={20}
            />
          </div>

          <div>
            <span>
              Vencidas
            </span>

            <strong>
              {
                resumen.vencidas
              }
            </strong>
          </div>
        </article>

        {/* PAGADAS */}

        <article className="cuotas-stat pagada">
          <div className="cuotas-stat-icon">
            <CheckCircle2
              size={20}
            />
          </div>

          <div>
            <span>
              Pagadas
            </span>

            <strong>
              {
                resumen.pagadas
              }
            </strong>
          </div>
        </article>

        {/* SALDO */}

        <article className="cuotas-stat saldo">
          <div className="cuotas-stat-icon">
            $
          </div>

          <div>
            <span>
              Saldo pendiente
            </span>

            <strong>
              {formatearDinero(
                resumen.saldoPendiente
              )}
            </strong>
          </div>
        </article>

      </div>

      {/* =================================================
          RESUMEN ECONÓMICO
      ================================================= */}

      <div className="cuotas-financial-summary">

        <div>
          <span>
            Valor programado
          </span>

          <strong>
            {formatearDinero(
              resumen.valorProgramado
            )}
          </strong>
        </div>

        <div>
          <span>
            Total pagado
          </span>

          <strong>
            {formatearDinero(
              resumen.valorPagado
            )}
          </strong>
        </div>

        <div>
          <span>
            Saldo por cobrar
          </span>

          <strong>
            {formatearDinero(
              resumen.saldoPendiente
            )}
          </strong>
        </div>

        <div>
          <span>
            Parciales
          </span>

          <strong>
            {
              resumen.parciales
            }
          </strong>
        </div>

      </div>

      {/* =================================================
          PANEL
      ================================================= */}

      <div className="cuotas-panel">

        {/* =============================================
            BÚSQUEDA
        ============================================= */}

        <div className="cuotas-toolbar">

          <div className="cuotas-search">

            <Search
              size={18}
            />

            <input
              type="text"
              value={
                busqueda
              }
              onChange={(e) =>
                setBusqueda(
                  e.target.value
                )
              }
              placeholder="Buscar cliente, venta, lote, manzana o cuota..."
            />

          </div>

          <button
            type="button"
            className="cuotas-clear-button"
            onClick={
              limpiarFiltros
            }
          >
            Limpiar filtros
          </button>

        </div>

        {/* =============================================
            FILTROS
        ============================================= */}

        <div className="cuotas-filters">

          {/* CLIENTE */}

          <div className="cuotas-filter-field cuotas-client-filter">

            <label>
              Cliente
            </label>

            {clienteSeleccionado ? (
              /* =================================
                 CLIENTE SELECCIONADO
              ================================= */

              <div className="cuotas-client-selected">

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
                >
                  Cambiar
                </button>

              </div>
            ) : (
              <>
                {/* ===============================
                    BUSCADOR
                =============================== */}

                <div className="cuotas-client-search">

                  <Search
                    size={16}
                  />

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
                    placeholder="Nombre, documento o teléfono..."
                    autoComplete="off"
                  />

                  {busquedaCliente && (
                    <button
                      type="button"
                      className="cuotas-client-clear"
                      onClick={
                        limpiarCliente
                      }
                      aria-label="Limpiar cliente"
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
                    <div className="cuotas-client-results">

                      {clientesFiltradosBusqueda.length >
                      0 ? (
                        clientesFiltradosBusqueda.map(
                          (cliente) => (
                            <button
                              key={
                                cliente._id
                              }
                              type="button"
                              className="cuotas-client-result"
                              onClick={() =>
                                seleccionarCliente(
                                  cliente
                                )
                              }
                            >

                              <div className="cuotas-client-avatar">

                                {obtenerNombreCliente(
                                  cliente
                                )
                                  .charAt(
                                    0
                                  )
                                  .toUpperCase()}

                              </div>

                              <div className="cuotas-client-result-info">

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

                              <span className="cuotas-client-select-text">
                                Seleccionar
                              </span>

                            </button>
                          )
                        )
                      ) : (
                        <div className="cuotas-client-empty">
                          No se encontraron clientes.
                        </div>
                      )}

                    </div>
                  )}

                {!busquedaCliente.trim() && (
                  <small className="cuotas-client-help">
                    Escriba nombre, apellido,
                    documento o teléfono.
                  </small>
                )}

              </>
            )}

          </div>

          {/* ESTADO */}

          <div className="cuotas-filter-field">

            <label>
              Estado
            </label>

            <select
              value={
                filtroEstado
              }
              onChange={(e) =>
                setFiltroEstado(
                  e.target.value
                )
              }
            >
              <option value="">
                Todos
              </option>

              <option value="Pendiente">
                Pendiente
              </option>

              <option value="Parcial">
                Parcial
              </option>

              <option value="Pagada">
                Pagada
              </option>

              <option value="Vencida">
                Vencida
              </option>

            </select>

          </div>

          {/* DESDE */}

          <div className="cuotas-filter-field">

            <label>
              Vence desde
            </label>

            <input
              type="date"
              value={
                fechaInicio
              }
              onChange={(e) =>
                setFechaInicio(
                  e.target.value
                )
              }
            />

          </div>

          {/* HASTA */}

          <div className="cuotas-filter-field">

            <label>
              Vence hasta
            </label>

            <input
              type="date"
              value={
                fechaFinal
              }
              onChange={(e) =>
                setFechaFinal(
                  e.target.value
                )
              }
            />

          </div>

        </div>

        {/* =================================================
            TABLA
        ================================================= */}

        <div className="cuotas-table-wrapper">

          <table className="cuotas-table">

            <thead>
              <tr>
                <th>
                  Cliente
                </th>

                <th>
                  Venta
                </th>

                <th>
                  Lote
                </th>

                <th>
                  Cuota
                </th>

                <th>
                  Vencimiento
                </th>

                <th>
                  Valor cuota
                </th>

                <th>
                  Pagado
                </th>

                <th>
                  Saldo
                </th>

                <th>
                  Estado
                </th>
              </tr>
            </thead>

            <tbody>

              {cargando ? (
                <tr>
                  <td
                    colSpan="9"
                    className="cuotas-empty"
                  >
                    <RefreshCw
                      size={27}
                      className="cuotas-spin"
                    />

                    <strong>
                      Cargando cuotas...
                    </strong>
                  </td>
                </tr>
              ) : cuotasPaginadas.length ===
                0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="cuotas-empty"
                  >
                    <WalletCards
                      size={38}
                    />

                    <strong>
                      No hay cuotas
                    </strong>

                    <span>
                      No existen cuotas
                      para los filtros
                      seleccionados.
                    </span>
                  </td>
                </tr>
              ) : (
                cuotasPaginadas.map(
                  (cuota) => {
                    const venta =
                      cuota.venta;

                    const cliente =
                      venta?.cliente;

                    const lote =
                      venta?.lote;

                    const manzana =
                      lote?.manzana;

                    return (
                      <tr
                        key={
                          cuota._id
                        }
                      >

                        {/* CLIENTE */}

                        <td>
                          <div className="cuota-client-cell">

                            <UserRound
                              size={16}
                            />

                            <div>
                              <strong>
                                {obtenerNombreCliente(
                                  cliente
                                )}
                              </strong>

                              <span>
                                {cliente?.documento ||
                                  "Sin documento"}
                              </span>
                            </div>

                          </div>
                        </td>

                        {/* VENTA */}

                        <td>
                          <strong className="cuota-venta-code">
                            {venta?.codigo ||
                              "—"}
                          </strong>
                        </td>

                        {/* LOTE */}

                        <td>
                          <div className="cuota-lote-cell">

                            <LandPlot
                              size={15}
                            />

                            <div>
                              <strong>
                                {lote?.codigo ||
                                  "—"}
                              </strong>

                              <span>
                                {manzana?.nombre ||
                                  "Sin manzana"}
                              </span>
                            </div>

                          </div>
                        </td>

                        {/* NÚMERO */}

                        <td>
                          <div className="cuota-number">

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

                              {venta?.numeroCuotas
                                ? ` / ${String(
                                    venta.numeroCuotas
                                  ).padStart(
                                    2,
                                    "0"
                                  )}`
                                : ""}
                            </strong>

                          </div>
                        </td>

                        {/* VENCIMIENTO */}

                        <td>
                          <div className="cuota-date">

                            <CalendarClock
                              size={15}
                            />

                            <span>
                              {formatearFecha(
                                cuota.fechaVencimiento
                              )}
                            </span>

                          </div>
                        </td>

                        {/* VALOR */}

                        <td>
                          <strong className="cuota-money">
                            {formatearDinero(
                              cuota.valorCuota
                            )}
                          </strong>
                        </td>

                        {/* PAGADO */}

                        <td>
                          <span className="cuota-paid">
                            {formatearDinero(
                              cuota.valorPagado
                            )}
                          </span>
                        </td>

                        {/* SALDO */}

                        <td>
                          <strong
                            className={`cuota-balance ${
                              Number(
                                cuota.saldoPendiente
                              ) ===
                              0
                                ? "cuota-balance-zero"
                                : ""
                            }`}
                          >
                            {formatearDinero(
                              cuota.saldoPendiente
                            )}
                          </strong>
                        </td>

                        {/* ESTADO */}

                        <td>
                          <span
                            className={`cuota-status cuota-status-${String(
                              cuota.estado
                            ).toLowerCase()}`}
                          >
                            {
                              cuota.estado
                            }
                          </span>
                        </td>

                      </tr>
                    );
                  }
                )
              )}

            </tbody>
          </table>

        </div>

        {/* =================================================
            PIE
        ================================================= */}

        <div className="cuotas-table-footer">

          <span>
            Mostrando{" "}
            <strong>
              {
                cuotasFiltradas.length
              }
            </strong>{" "}
            de{" "}
            <strong>
              {
                cuotas.length
              }
            </strong>{" "}
            cuotas
          </span>

          <div className="cuotas-pagination">

            <button
              type="button"
              disabled={
                paginaActual ===
                1
              }
              onClick={() =>
                setPaginaActual(
                  (pagina) =>
                    Math.max(
                      1,
                      pagina - 1
                    )
                )
              }
            >
              Anterior
            </button>

            <span>
              Página{" "}
              <strong>
                {
                  paginaActual
                }
              </strong>{" "}
              de{" "}
              <strong>
                {
                  totalPaginas
                }
              </strong>
            </span>

            <button
              type="button"
              disabled={
                paginaActual ===
                totalPaginas
              }
              onClick={() =>
                setPaginaActual(
                  (pagina) =>
                    Math.min(
                      totalPaginas,
                      pagina + 1
                    )
                )
              }
            >
              Siguiente
            </button>

          </div>

        </div>

      </div>

      {/* =================================================
          NOTIFICACIONES
      ================================================= */}

      <Toast
        visible={
          notificacion.visible
        }
        mensaje={
          notificacion.mensaje
        }
        tipo={
          notificacion.tipo
        }
        onClose={
          cerrarNotificacion
        }
      />

    </section>
  );
}