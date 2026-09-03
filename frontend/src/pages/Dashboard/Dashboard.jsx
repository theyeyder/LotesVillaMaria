import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Banknote,
  Map,
  Tractor,
  WalletCards,
  ArrowRight,
  Clock3,
  CircleDollarSign,
  ArrowUpCircle,
  RefreshCw,
  ReceiptText,
} from "lucide-react";

import "./Dashboard.css";

import {
  obtenerCartera,
} from "../../services/cartera.service";

import {
  obtenerComprobantes,
} from "../../services/comprobante.service";

import {
  obtenerVentas,
} from "../../services/venta.service";

import {
  obtenerLotes,
} from "../../services/lote.service";

import {
  obtenerMaquinarias,
} from "../../services/maquinaria.service";

/* =========================================================
   DINERO
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
   FECHA
========================================================= */

const formatearFecha = (
  fecha
) => {
  if (!fecha) {
    return "—";
  }

  const texto =
    String(fecha);

  const coincidencia =
    texto.match(
      /^(\d{4})-(\d{2})-(\d{2})/
    );

  if (coincidencia) {
    const [
      ,
      anio,
      mes,
      dia,
    ] = coincidencia;

    return `${dia}/${mes}/${anio}`;
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
    }
  );
};

/* =========================================================
   TIMESTAMP
========================================================= */

const obtenerTiempo = (
  fecha
) => {
  const date =
    new Date(fecha);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return 0;
  }

  return date.getTime();
};

/* =========================================================
   NOMBRE CLIENTE
========================================================= */

const obtenerNombreCliente = (
  cliente
) => {
  if (!cliente) {
    return "Cliente";
  }

  return [
    cliente.nombres,
    cliente.apellidos,
  ]
    .filter(Boolean)
    .join(" ")
    .trim() ||
    cliente.nombre ||
    "Cliente";
};

/* =========================================================
   DASHBOARD
========================================================= */

export default function Dashboard({
  onNavigate,
}) {
  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    cartera,
    setCartera,
  ] = useState([]);

  const [
    resumenCartera,
    setResumenCartera,
  ] = useState({
    totalRegistros: 0,
    clientesConDeuda: 0,
    ventasConSaldo: 0,
    ventasVencidas: 0,

    totalVentas: 0,
    totalPagado: 0,
    saldoPendiente: 0,
    valorVencido: 0,
  });

  const [
    comprobantes,
    setComprobantes,
  ] = useState([]);

  const [
    resumenComprobantes,
    setResumenComprobantes,
  ] = useState({
    totalIngresos: 0,
    totalEgresos: 0,
    balance: 0,
  });

  const [
    ventas,
    setVentas,
  ] = useState([]);

  const [
    lotes,
    setLotes,
  ] = useState([]);

  const [
    maquinarias,
    setMaquinarias,
  ] = useState([]);

  /* =========================================================
     CARGAR DASHBOARD
  ========================================================= */

  const cargarDashboard =
    async () => {
      try {
        setCargando(
          true
        );

        setError(
          ""
        );

        const [
          datosCartera,
          datosComprobantes,
          datosVentas,
          datosLotes,
          datosMaquinaria,
        ] =
          await Promise.all([
            obtenerCartera(),

            obtenerComprobantes(),

            obtenerVentas(),

            obtenerLotes(),

            obtenerMaquinarias(),
          ]);

        /* =========================
           CARTERA
        ========================= */

        setCartera(
          Array.isArray(
            datosCartera?.cartera
          )
            ? datosCartera.cartera
            : []
        );

        setResumenCartera({
          totalRegistros:
            Number(
              datosCartera
                ?.resumen
                ?.totalRegistros
            ) || 0,

          clientesConDeuda:
            Number(
              datosCartera
                ?.resumen
                ?.clientesConDeuda
            ) || 0,

          ventasConSaldo:
            Number(
              datosCartera
                ?.resumen
                ?.ventasConSaldo
            ) || 0,

          ventasVencidas:
            Number(
              datosCartera
                ?.resumen
                ?.ventasVencidas
            ) || 0,

          totalVentas:
            Number(
              datosCartera
                ?.resumen
                ?.totalVentas
            ) || 0,

          totalPagado:
            Number(
              datosCartera
                ?.resumen
                ?.totalPagado
            ) || 0,

          saldoPendiente:
            Number(
              datosCartera
                ?.resumen
                ?.saldoPendiente
            ) || 0,

          valorVencido:
            Number(
              datosCartera
                ?.resumen
                ?.valorVencido
            ) || 0,
        });

        /* =========================
           COMPROBANTES
        ========================= */

        setComprobantes(
          Array.isArray(
            datosComprobantes?.comprobantes
          )
            ? datosComprobantes.comprobantes
            : []
        );

        setResumenComprobantes({
          totalIngresos:
            Number(
              datosComprobantes
                ?.resumen
                ?.totalIngresos
            ) || 0,

          totalEgresos:
            Number(
              datosComprobantes
                ?.resumen
                ?.totalEgresos
            ) || 0,

          balance:
            Number(
              datosComprobantes
                ?.resumen
                ?.balance
            ) || 0,
        });

        /* =========================
           VENTAS
        ========================= */

        setVentas(
          Array.isArray(
            datosVentas
          )
            ? datosVentas
            : []
        );

        /* =========================
           LOTES
        ========================= */

        setLotes(
          Array.isArray(
            datosLotes
          )
            ? datosLotes
            : []
        );

        /* =========================
           MAQUINARIA
        ========================= */

        setMaquinarias(
          Array.isArray(
            datosMaquinaria
          )
            ? datosMaquinaria
            : []
        );
      } catch (error) {
        console.error(
          "Error cargando dashboard:",
          error
        );

        setError(
          error?.response
            ?.data
            ?.message ||
            "No fue posible cargar la información del dashboard."
        );
      } finally {
        setCargando(
          false
        );
      }
    };

  useEffect(() => {
    cargarDashboard();
  }, []);

  /* =========================================================
     LOTES DISPONIBLES
  ========================================================= */

  const lotesDisponibles =
    useMemo(
      () => {
        return lotes.filter(
          (
            lote
          ) =>
            String(
              lote.estado ||
                ""
            )
              .trim()
              .toLowerCase() ===
            "disponible"
        ).length;
      },
      [
        lotes,
      ]
    );

  /* =========================================================
     LOTES VENDIDOS
  ========================================================= */

  const lotesVendidos =
    useMemo(
      () => {
        return lotes.filter(
          (
            lote
          ) =>
            String(
              lote.estado ||
                ""
            )
              .trim()
              .toLowerCase() ===
            "vendido"
        ).length;
      },
      [
        lotes,
      ]
    );

  /* =========================================================
     MÉTRICAS
  ========================================================= */

  const metricas = [
    {
      titulo:
        "Valor vendido",

      valor:
        formatearDinero(
          resumenCartera.totalVentas
        ),

      detalle:
        `${lotesVendidos} lote(s) vendido(s)`,

      Icon:
        Banknote,

      tipo:
        "ventas",
    },

    {
      titulo:
        "Dinero recibido",

      valor:
        formatearDinero(
          resumenCartera.totalPagado
        ),

      detalle:
        "Pagos recibidos de clientes",

      Icon:
        CircleDollarSign,

      tipo:
        "pagado",
    },

    {
      titulo:
        "Cartera pendiente",

      valor:
        formatearDinero(
          resumenCartera.saldoPendiente
        ),

      detalle:
        `${resumenCartera.clientesConDeuda} cliente(s) con deuda`,

      Icon:
        WalletCards,

      tipo:
        "cartera",
    },

    {
      titulo:
        "Cartera vencida",

      valor:
        formatearDinero(
          resumenCartera.valorVencido
        ),

      detalle:
        `${resumenCartera.ventasVencidas} venta(s) vencida(s)`,

      Icon:
        Clock3,

      tipo:
        "vencido",
    },

    {
      titulo:
        "Egresos",

      valor:
        formatearDinero(
          resumenComprobantes.totalEgresos
        ),

      detalle:
        "Salidas de dinero registradas",

      Icon:
        ArrowUpCircle,

      tipo:
        "egresos",
    },

    {
      titulo:
        "Balance",

      valor:
        formatearDinero(
          resumenComprobantes.balance
        ),

      detalle:
        "Ingresos menos egresos",

      Icon:
        ReceiptText,

      tipo:
        "balance",
    },

    {
      titulo:
        "Lotes disponibles",

      valor:
        String(
          lotesDisponibles
        ),

      detalle:
        "Inventario disponible",

      Icon:
        Map,

      tipo:
        "lotes",
    },

    {
      titulo:
        "Maquinaria",

      valor:
        String(
          maquinarias.length
        ),

      detalle:
        "Máquinas registradas",

      Icon:
        Tractor,

      tipo:
        "maquinaria",
    },
  ];

  /* =========================================================
     VENCIMIENTOS PRIORITARIOS

     Orden:
     1. Vencidos
     2. Próximos vencimientos
  ========================================================= */

  const vencimientos =
    useMemo(
      () => {
        const vencidos =
          cartera
            .filter(
              (
                registro
              ) =>
                registro.estadoCartera ===
                  "Vencida" &&
                Number(
                  registro.saldoPendiente
                ) >
                  0
            )
            .map(
              (
                registro
              ) => ({
                ...registro,

                prioridad:
                  1,
              })
            );

        const pendientes =
          cartera
            .filter(
              (
                registro
              ) =>
                registro.estadoCartera ===
                  "Pendiente" &&
                registro.proximoVencimiento
            )
            .map(
              (
                registro
              ) => ({
                ...registro,

                prioridad:
                  2,
              })
            )
            .sort(
              (
                a,
                b
              ) =>
                obtenerTiempo(
                  a.proximoVencimiento
                    ?.fechaVencimiento
                ) -
                obtenerTiempo(
                  b.proximoVencimiento
                    ?.fechaVencimiento
                )
            );

        return [
          ...vencidos,
          ...pendientes,
        ].slice(
          0,
          4
        );
      },
      [
        cartera,
      ]
    );

  /* =========================================================
     ACTIVIDAD RECIENTE

     Mezclamos:
     - Ventas
     - Pagos / ingresos
     - Egresos
  ========================================================= */

  const actividad =
    useMemo(
      () => {
        const ventasActividad =
          ventas.map(
            (
              venta
            ) => ({
              id:
                `venta-${venta._id}`,

              tipo:
                "Venta",

              fecha:
                venta.fechaVenta ||
                venta.createdAt,

              titulo:
                "Nueva venta",

              descripcion:
                `${venta.codigo || "Venta"} · ${obtenerNombreCliente(
                  venta.cliente
                )}`,

              valor:
                Number(
                  venta.valorVenta
                ) || 0,
            })
          );

        const comprobantesActividad =
          comprobantes.map(
            (
              comprobante
            ) => ({
              id:
                `${comprobante.origen}-${comprobante._id}`,

              tipo:
                comprobante.origen,

              fecha:
                comprobante.fecha,

              titulo:
                comprobante.origen ===
                "Ingreso"
                  ? "Pago recibido"
                  : "Egreso registrado",

              descripcion:
                `${comprobante.codigo || "—"} · ${
                  comprobante.terceroNombre ||
                  comprobante.concepto ||
                  "Movimiento"
                }`,

              valor:
                Number(
                  comprobante.valor
                ) || 0,
            })
          );

        return [
          ...ventasActividad,
          ...comprobantesActividad,
        ]
          .sort(
            (
              a,
              b
            ) =>
              obtenerTiempo(
                b.fecha
              ) -
              obtenerTiempo(
                a.fecha
              )
          )
          .slice(
            0,
            5
          );
      },
      [
        ventas,
        comprobantes,
      ]
    );

  /* =========================================================
     CARGANDO
  ========================================================= */

  if (
    cargando
  ) {
    return (
      <div className="dashboard-page">

        <div className="dashboard-loading">

          <RefreshCw
            size={28}
            className="dashboard-spin"
          />

          <span>
            Cargando información general...
          </span>

        </div>

      </div>
    );
  }

  return (
    <div className="dashboard-page">

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (

        <div className="dashboard-error">

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={
              cargarDashboard
            }
          >
            Reintentar
          </button>

        </div>

      )}

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="dashboard-hero topography">

        <div>

          <p>
            Panel general
          </p>

          <h1 className="serif-title">
            El proyecto, claro y bajo control.
          </h1>

          <span>
            Consulta ventas, cartera, pagos, egresos, lotes y operación desde un solo lugar.
          </span>

        </div>

        <div className="dashboard-hero-actions">

          <button
            type="button"
            onClick={() =>
              onNavigate(
                "cartera"
              )
            }
          >
            Ver cartera

            <ArrowRight />
          </button>

          <button
            type="button"
            className="secondary"
            onClick={
              cargarDashboard
            }
          >
            <RefreshCw
              size={17}
            />

            Actualizar
          </button>

        </div>

      </section>

      {/* =====================================================
          MÉTRICAS
      ===================================================== */}

      <section className="dashboard-metrics">

        {metricas.map(
          ({
            titulo,
            valor,
            detalle,
            Icon,
            tipo,
          }) => (

            <article
              className={`dashboard-metric surface ${tipo}`}
              key={
                titulo
              }
            >

              <div>

                <small>
                  {titulo}
                </small>

                <strong>
                  {valor}
                </strong>

                <span>
                  {detalle}
                </span>

              </div>

              <i>
                <Icon />
              </i>

            </article>

          )
        )}

      </section>

      {/* =====================================================
          PANELES
      ===================================================== */}

      <div className="dashboard-grid">

        {/* ===================================================
            VENCIMIENTOS
        =================================================== */}

        <section className="surface dashboard-panel">

          <div className="dashboard-panel-title">

            <div>

              <p className="page-eyebrow">
                Cartera
              </p>

              <h3>
                Vencimientos prioritarios
              </h3>

            </div>

            <Clock3 />

          </div>

          {vencimientos.length ===
          0 ? (

            <div className="dashboard-panel-empty">

              <strong>
                No hay vencimientos pendientes
              </strong>

              <span>
                La cartera no presenta compromisos próximos o vencidos.
              </span>

            </div>

          ) : (

            vencimientos.map(
              (
                registro
              ) => {

                const vencida =
                  registro.estadoCartera ===
                  "Vencida";

                const manzana =
                  registro.lote
                    ?.manzana
                    ?.codigo ||
                  registro.lote
                    ?.manzana
                    ?.nombre ||
                  "—";

                const lote =
                  registro.lote
                    ?.codigo ||
                  "—";

                return (
                  <div
                    className="due-row"
                    key={
                      registro._id
                    }
                  >

                    <div>

                      <strong>
                        {manzana} · Lote {lote} ·{" "}
                        {
                          registro.cliente
                            ?.nombre
                        }
                      </strong>

                      <span>

                        {vencida
                          ? `${registro.cuotasVencidas} cuota(s) vencida(s) · ${formatearDinero(
                              registro.valorVencido
                            )}`
                          : `Próxima cuota: ${formatearFecha(
                              registro
                                .proximoVencimiento
                                ?.fechaVencimiento
                            )} · ${formatearDinero(
                              registro
                                .proximoVencimiento
                                ?.saldoPendiente
                            )}`}

                      </span>

                    </div>

                    <b
                      className={`badge ${
                        vencida
                          ? "badge-danger"
                          : "badge-warning"
                      }`}
                    >
                      {vencida
                        ? "Vencida"
                        : "Próxima"}
                    </b>

                  </div>
                );
              }
            )

          )}

          <button
            type="button"
            className="dashboard-panel-link"
            onClick={() =>
              onNavigate(
                "cartera"
              )
            }
          >
            Ver cartera completa

            <ArrowRight
              size={15}
            />
          </button>

        </section>

        {/* ===================================================
            ACTIVIDAD
        =================================================== */}

        <section className="surface dashboard-panel">

          <div className="dashboard-panel-title">

            <div>

              <p className="page-eyebrow">
                Actividad
              </p>

              <h3>
                Movimientos recientes
              </h3>

            </div>

            <ReceiptText />

          </div>

          {actividad.length ===
          0 ? (

            <div className="dashboard-panel-empty">

              <strong>
                Sin movimientos recientes
              </strong>

              <span>
                Los pagos, egresos y ventas aparecerán aquí.
              </span>

            </div>

          ) : (

            actividad.map(
              (
                movimiento
              ) => (

                <div
                  className="activity"
                  key={
                    movimiento.id
                  }
                >

                  <span
                    className={`activity-dot ${String(
                      movimiento.tipo
                    ).toLowerCase()}`}
                  />

                  <div>

                    <strong>
                      {
                        movimiento.titulo
                      }
                    </strong>

                    <p>
                      {
                        movimiento.descripcion
                      }
                    </p>

                    <small>
                      {formatearFecha(
                        movimiento.fecha
                      )}
                      {" · "}
                      {formatearDinero(
                        movimiento.valor
                      )}
                    </small>

                  </div>

                </div>

              )
            )

          )}

          <button
            type="button"
            className="dashboard-panel-link"
            onClick={() =>
              onNavigate(
                "comprobantes"
              )
            }
          >
            Ver comprobantes

            <ArrowRight
              size={15}
            />
          </button>

        </section>

      </div>

    </div>
  );
}