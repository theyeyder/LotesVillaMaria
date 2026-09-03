import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FileText,
  Printer,
  RefreshCw,
  Search,
  WalletCards,
  CircleDollarSign,
  CheckCircle2,
} from "lucide-react";

import "./Facturas.css";

import Toast from "../../components/ui/Toast";

import {
  obtenerVentas,
} from "../../services/venta.service";

import {
  obtenerCuotas,
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
      timeZone: "UTC",
    }
  );
};

/* =========================================================
   OBTENER NOMBRE CLIENTE
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
   OBTENER ID DE LA VENTA DE UNA CUOTA
========================================================= */

const obtenerVentaIdCuota = (
  cuota
) => {
  if (!cuota?.venta) {
    return "";
  }

  if (
    typeof cuota.venta ===
    "object"
  ) {
    return String(
      cuota.venta._id ||
        ""
    );
  }

  return String(
    cuota.venta
  );
};

/* =========================================================
   ESCAPAR HTML
========================================================= */

const escaparHTML = (
  valor = ""
) => {
  return String(
    valor ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
};

/* =========================================================
   COMPONENTE
========================================================= */

export default function Facturas({
  search = "",
}) {
  const [
    ventas,
    setVentas,
  ] = useState([]);

  const [
    cuotas,
    setCuotas,
  ] = useState([]);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    busquedaLocal,
    setBusquedaLocal,
  ] = useState("");

  const [
    filtroEstado,
    setFiltroEstado,
  ] = useState("");

  const [
    notificacion,
    setNotificacion,
  ] = useState({
    visible: false,
    mensaje: "",
    tipo: "success",
  });

  /* =========================================================
     TOAST
  ========================================================= */

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
        (
          anterior
        ) => ({
          ...anterior,
          visible: false,
        })
      );
    };

  /* =========================================================
     CARGAR DATOS REALES
  ========================================================= */

  const cargarDatos =
    async () => {
      try {
        setCargando(
          true
        );

        const [
          datosVentas,
          datosCuotas,
        ] =
          await Promise.all([
            obtenerVentas(),
            obtenerCuotas(),
          ]);

        setVentas(
          Array.isArray(
            datosVentas
          )
            ? datosVentas
            : []
        );

        setCuotas(
          Array.isArray(
            datosCuotas
          )
            ? datosCuotas
            : []
        );
      } catch (error) {
        console.error(
          "Error cargando facturas:",
          error
        );

        mostrarNotificacion(
          error?.response
            ?.data
            ?.message ||
            "No fue posible cargar las facturas.",
          "error"
        );
      } finally {
        setCargando(
          false
        );
      }
    };

  useEffect(() => {
    cargarDatos();
  }, []);

  /* =========================================================
     CONSTRUIR FACTURAS DESDE LAS VENTAS REALES

     CONTADO:
     - Pagado = valor completo
     - Saldo = 0

     FINANCIADO:
     - Pagado = cuota inicial + pagos de cuotas
     - Saldo = suma de saldos de cuotas
  ========================================================= */

  const facturas =
    useMemo(
      () => {
        return ventas.map(
          (
            venta
          ) => {
            const ventaId =
              String(
                venta._id
              );

            const cuotasVenta =
              cuotas.filter(
                (
                  cuota
                ) =>
                  obtenerVentaIdCuota(
                    cuota
                  ) ===
                  ventaId
              );

            const valorVenta =
              Math.max(
                0,
                Number(
                  venta.valorVenta
                ) || 0
              );

            const cuotaInicial =
              Math.max(
                0,
                Number(
                  venta.cuotaInicial
                ) || 0
              );

            let totalPagado =
              0;

            let saldoPendiente =
              0;

            /* =========================
               CONTADO
            ========================= */

            if (
              venta.formaPago ===
              "Contado"
            ) {
              totalPagado =
                valorVenta;

              saldoPendiente =
                0;
            } else {
              /* =====================
                 FINANCIADO
              ===================== */

              const pagadoCuotas =
                cuotasVenta.reduce(
                  (
                    total,
                    cuota
                  ) =>
                    total +
                    (
                      Number(
                        cuota.valorPagado
                      ) || 0
                    ),
                  0
                );

              const saldoCuotas =
                cuotasVenta.reduce(
                  (
                    total,
                    cuota
                  ) =>
                    total +
                    (
                      Number(
                        cuota.saldoPendiente
                      ) || 0
                    ),
                  0
                );

              totalPagado =
                Math.min(
                  valorVenta,
                  cuotaInicial +
                    pagadoCuotas
                );

              if (
                cuotasVenta.length >
                0
              ) {
                saldoPendiente =
                  Math.max(
                    0,
                    saldoCuotas
                  );
              } else {
                saldoPendiente =
                  Math.max(
                    0,
                    Number(
                      venta.saldoFinanciar
                    ) ||
                      (
                        valorVenta -
                        cuotaInicial
                      )
                  );
              }
            }

            const porcentaje =
              valorVenta > 0
                ? Math.min(
                    100,
                    Math.max(
                      0,
                      (
                        totalPagado /
                        valorVenta
                      ) *
                        100
                    )
                  )
                : 0;

            const lote =
              venta.lote;

            const manzana =
              lote?.manzana;

            return {
              ...venta,

              valorVenta,

              cuotaInicial,

              totalPagado,

              saldoPendiente,

              porcentaje,

              cuotasVenta,

              clienteNombre:
                obtenerNombreCliente(
                  venta.cliente
                ),

              clienteDocumento:
                venta.cliente
                  ?.documento ||
                "",

              loteCodigo:
                lote?.codigo ||
                lote?.numeroLote ||
                "—",

              manzanaNombre:
                manzana?.codigo ||
                manzana?.nombre ||
                "—",
            };
          }
        );
      },
      [
        ventas,
        cuotas,
      ]
    );

  /* =========================================================
     BÚSQUEDA Y FILTROS
  ========================================================= */

  const facturasFiltradas =
    useMemo(
      () => {
        const texto =
          [
            search,
            busquedaLocal,
          ]
            .filter(Boolean)
            .join(" ")
            .trim()
            .toLowerCase();

        return facturas.filter(
          (
            factura
          ) => {
            if (
              filtroEstado &&
              factura.estado !==
                filtroEstado
            ) {
              return false;
            }

            if (!texto) {
              return true;
            }

            const contenido = [
              factura.codigo,
              factura.clienteNombre,
              factura.clienteDocumento,
              factura.loteCodigo,
              factura.manzanaNombre,
              factura.formaPago,
              factura.estado,
              factura.observaciones,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            return contenido.includes(
              texto
            );
          }
        );
      },
      [
        facturas,
        search,
        busquedaLocal,
        filtroEstado,
      ]
    );

  /* =========================================================
     RESUMEN GENERAL
  ========================================================= */

  const resumen =
    useMemo(
      () => {
        return facturasFiltradas.reduce(
          (
            acumulado,
            factura
          ) => {
            acumulado.totalFacturas +=
              1;

            acumulado.totalVentas +=
              factura.valorVenta;

            acumulado.totalPagado +=
              factura.totalPagado;

            acumulado.totalPendiente +=
              factura.saldoPendiente;

            if (
              factura.estado ===
              "Pagada"
            ) {
              acumulado.pagadas +=
                1;
            }

            return acumulado;
          },
          {
            totalFacturas: 0,
            totalVentas: 0,
            totalPagado: 0,
            totalPendiente: 0,
            pagadas: 0,
          }
        );
      },
      [
        facturasFiltradas,
      ]
    );

  /* =========================================================
     IMPRIMIR FACTURA / RESUMEN DE VENTA
  ========================================================= */

  const imprimirFactura = (
    factura
  ) => {
    const ventana =
      window.open(
        "",
        "_blank",
        "width=900,height=850"
      );

    if (!ventana) {
      mostrarNotificacion(
        "El navegador bloqueó la ventana de impresión.",
        "error"
      );

      return;
    }

    const filasCuotas =
      factura.cuotasVenta
        .map(
          (
            cuota
          ) => `
            <tr>
              <td>
                ${escaparHTML(
                  cuota.codigo ||
                    `Cuota ${cuota.numeroCuota}`
                )}
              </td>

              <td>
                ${cuota.numeroCuota || "—"}
              </td>

              <td>
                ${formatearFecha(
                  cuota.fechaVencimiento
                )}
              </td>

              <td>
                ${formatearDinero(
                  cuota.valorCuota
                )}
              </td>

              <td>
                ${formatearDinero(
                  cuota.valorPagado
                )}
              </td>

              <td>
                ${formatearDinero(
                  cuota.saldoPendiente
                )}
              </td>

              <td>
                ${escaparHTML(
                  cuota.estado ||
                    "—"
                )}
              </td>
            </tr>
          `
        )
        .join("");

    ventana.document.write(`
      <!DOCTYPE html>

      <html lang="es">

        <head>

          <meta charset="UTF-8" />

          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />

          <title>
            Venta ${escaparHTML(
              factura.codigo
            )}
          </title>

          <style>

            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 24px;

              background: #f0ede5;

              color: #25352b;

              font-family:
                Arial,
                Helvetica,
                sans-serif;
            }

            .acciones {
              display: flex;
              justify-content: flex-end;
              gap: 10px;

              max-width: 850px;

              margin:
                0
                auto
                15px;
            }

            .acciones button {
              min-height: 38px;

              padding:
                0
                15px;

              border: none;
              border-radius: 8px;

              cursor: pointer;

              font-weight: 700;
            }

            .acciones button:last-child {
              background: #173f2e;
              color: white;
            }

            .documento {
              max-width: 850px;

              margin: auto;

              padding: 30px;

              background: white;

              border: 1px solid #ded8ca;
              border-radius: 14px;
            }

            .encabezado {
              display: flex;
              justify-content: space-between;
              gap: 20px;

              padding-bottom: 18px;

              border-bottom: 2px solid #173f2e;
            }

            .encabezado h1 {
              margin: 0;

              color: #173f2e;

              font-size: 24px;
            }

            .encabezado p {
              margin:
                5px
                0
                0;

              color: #98732d;

              font-size: 12px;
              font-weight: bold;
            }

            .codigo {
              padding:
                10px
                14px;

              border: 1px solid #d8caab;
              border-radius: 9px;

              background: #f7f1e3;

              text-align: center;
            }

            .codigo span {
              display: block;

              color: #7d745f;

              font-size: 9px;

              text-transform: uppercase;
            }

            .codigo strong {
              display: block;

              margin-top: 4px;

              color: #173f2e;

              font-size: 17px;
            }

            .datos {
              display: grid;

              grid-template-columns:
                repeat(
                  2,
                  1fr
                );

              gap: 10px;

              margin-top: 18px;
            }

            .dato {
              padding: 11px;

              border: 1px solid #e1ddd2;
              border-radius: 8px;

              background: #faf9f5;
            }

            .dato span,
            .resumen span {
              display: block;

              margin-bottom: 4px;

              color: #7b847e;

              font-size: 9px;
              font-weight: bold;

              text-transform: uppercase;
            }

            .dato strong {
              font-size: 12px;
            }

            .resumen {
              display: grid;

              grid-template-columns:
                repeat(
                  4,
                  1fr
                );

              gap: 9px;

              margin-top: 16px;
            }

            .resumen div {
              padding: 12px;

              border: 1px solid #d9d2c3;
              border-radius: 9px;

              background: #f8f5ed;
            }

            .resumen strong {
              color: #173f2e;

              font-size: 14px;
            }

            h2 {
              margin:
                22px
                0
                9px;

              color: #173f2e;

              font-size: 14px;
            }

            table {
              width: 100%;

              border-collapse: collapse;
            }

            th {
              padding: 7px;

              border: 1px solid #d8dad6;

              background: #173f2e;

              color: white;

              font-size: 8px;

              text-transform: uppercase;
            }

            td {
              padding: 7px;

              border: 1px solid #dedfdb;

              font-size: 8px;

              text-align: center;
            }

            .sin-cuotas {
              padding: 20px;

              border: 1px solid #dedad0;
              border-radius: 8px;

              background: #faf9f5;

              color: #737c76;

              font-size: 11px;

              text-align: center;
            }

            .observaciones {
              margin-top: 17px;

              padding: 12px;

              border: 1px solid #e0dbcf;
              border-radius: 8px;

              background: #faf9f5;

              font-size: 11px;
            }

            .firmas {
              display: grid;

              grid-template-columns:
                repeat(
                  2,
                  1fr
                );

              gap: 60px;

              margin-top: 55px;
            }

            .firma {
              padding-top: 35px;

              border-top: 1px solid #666;

              color: #666;

              font-size: 9px;

              text-align: center;
            }

            @media print {

              @page {
                size: A4;
                margin: 10mm;
              }

              body {
                padding: 0;

                background: white;
              }

              .acciones {
                display: none;
              }

              .documento {
                max-width: none;

                padding: 0;

                border: none;
                border-radius: 0;
              }

              tr {
                break-inside: avoid;
              }

              thead {
                display: table-header-group;
              }
            }

          </style>

        </head>

        <body>

          <div class="acciones">

            <button
              onclick="window.close()"
            >
              Cerrar
            </button>

            <button
              onclick="window.print()"
            >
              Imprimir
            </button>

          </div>

          <main class="documento">

            <header class="encabezado">

              <div>
                <h1>
                  LOTES VILLA MARÍA
                </h1>

                <p>
                  FACTURA / RESUMEN DE VENTA
                </p>
              </div>

              <div class="codigo">
                <span>
                  Venta
                </span>

                <strong>
                  ${escaparHTML(
                    factura.codigo ||
                      "—"
                  )}
                </strong>
              </div>

            </header>

            <section class="datos">

              <div class="dato">
                <span>
                  Cliente
                </span>

                <strong>
                  ${escaparHTML(
                    factura.clienteNombre
                  )}
                </strong>
              </div>

              <div class="dato">
                <span>
                  Documento
                </span>

                <strong>
                  ${escaparHTML(
                    factura.clienteDocumento ||
                      "—"
                  )}
                </strong>
              </div>

              <div class="dato">
                <span>
                  Fecha de venta
                </span>

                <strong>
                  ${formatearFecha(
                    factura.fechaVenta
                  )}
                </strong>
              </div>

              <div class="dato">
                <span>
                  Forma de pago
                </span>

                <strong>
                  ${escaparHTML(
                    factura.formaPago ||
                      "—"
                  )}
                </strong>
              </div>

              <div class="dato">
                <span>
                  Manzana
                </span>

                <strong>
                  ${escaparHTML(
                    factura.manzanaNombre
                  )}
                </strong>
              </div>

              <div class="dato">
                <span>
                  Lote
                </span>

                <strong>
                  ${escaparHTML(
                    factura.loteCodigo
                  )}
                </strong>
              </div>

              <div class="dato">
                <span>
                  Estado
                </span>

                <strong>
                  ${escaparHTML(
                    factura.estado ||
                      "—"
                  )}
                </strong>
              </div>

              <div class="dato">
                <span>
                  Número de cuotas
                </span>

                <strong>
                  ${
                    factura.formaPago ===
                    "Contado"
                      ? "0"
                      : Number(
                          factura.numeroCuotas
                        ) || 0
                  }
                </strong>
              </div>

            </section>

            <section class="resumen">

              <div>
                <span>
                  Valor venta
                </span>

                <strong>
                  ${formatearDinero(
                    factura.valorVenta
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Cuota inicial
                </span>

                <strong>
                  ${formatearDinero(
                    factura.cuotaInicial
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Total pagado
                </span>

                <strong>
                  ${formatearDinero(
                    factura.totalPagado
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Saldo pendiente
                </span>

                <strong>
                  ${formatearDinero(
                    factura.saldoPendiente
                  )}
                </strong>
              </div>

            </section>

            ${
              factura.formaPago ===
                "Financiado"
                ? `
                  <h2>
                    Detalle de cuotas
                  </h2>

                  ${
                    factura
                      .cuotasVenta
                      .length >
                    0
                      ? `
                        <table>

                          <thead>
                            <tr>
                              <th>Código</th>
                              <th>#</th>
                              <th>Vencimiento</th>
                              <th>Valor</th>
                              <th>Pagado</th>
                              <th>Saldo</th>
                              <th>Estado</th>
                            </tr>
                          </thead>

                          <tbody>
                            ${filasCuotas}
                          </tbody>

                        </table>
                      `
                      : `
                        <div class="sin-cuotas">
                          Esta venta todavía no tiene cuotas disponibles.
                        </div>
                      `
                  }
                `
                : ""
            }

            ${
              factura.observaciones
                ? `
                  <div class="observaciones">

                    <strong>
                      Observaciones:
                    </strong>

                    ${escaparHTML(
                      factura.observaciones
                    )}

                  </div>
                `
                : ""
            }

            <div class="firmas">

              <div class="firma">
                Cliente
              </div>

              <div class="firma">
                Lotes Villa María
              </div>

            </div>

          </main>

        </body>

      </html>
    `);

    ventana.document.close();

    ventana.focus();
  };

  return (
    <section className="facturas-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="facturas-header">

        <div>

          <span className="facturas-kicker">
            Documentos financieros
          </span>

          <h1>
            Facturas
          </h1>

          <p>
            Consulta el estado financiero y el documento de cada venta realizada.
          </p>

        </div>

        <button
          type="button"
          className="facturas-refresh-button"
          onClick={
            cargarDatos
          }
          disabled={
            cargando
          }
        >
          <RefreshCw
            size={18}
            className={
              cargando
                ? "facturas-spin"
                : ""
            }
          />

          Actualizar
        </button>

      </div>

      {/* =====================================================
          RESUMEN
      ===================================================== */}

      <div className="facturas-stats">

        <article className="facturas-stat">

          <div className="facturas-stat-icon">
            <FileText
              size={20}
            />
          </div>

          <div>
            <span>
              Ventas
            </span>

            <strong>
              {
                resumen.totalFacturas
              }
            </strong>
          </div>

        </article>

        <article className="facturas-stat">

          <div className="facturas-stat-icon">
            <WalletCards
              size={20}
            />
          </div>

          <div>
            <span>
              Valor vendido
            </span>

            <strong>
              {formatearDinero(
                resumen.totalVentas
              )}
            </strong>
          </div>

        </article>

        <article className="facturas-stat pagado">

          <div className="facturas-stat-icon">
            <CheckCircle2
              size={20}
            />
          </div>

          <div>
            <span>
              Total pagado
            </span>

            <strong>
              {formatearDinero(
                resumen.totalPagado
              )}
            </strong>
          </div>

        </article>

        <article className="facturas-stat pendiente">

          <div className="facturas-stat-icon">
            <CircleDollarSign
              size={20}
            />
          </div>

          <div>
            <span>
              Saldo pendiente
            </span>

            <strong>
              {formatearDinero(
                resumen.totalPendiente
              )}
            </strong>
          </div>

        </article>

      </div>

      {/* =====================================================
          FILTROS
      ===================================================== */}

      <div className="facturas-toolbar">

        <div className="facturas-search">

          <Search
            size={18}
          />

          <input
            type="text"
            value={
              busquedaLocal
            }
            onChange={
              (
                e
              ) =>
                setBusquedaLocal(
                  e.target.value
                )
            }
            placeholder="Buscar venta, cliente, documento, lote..."
          />

        </div>

        <select
          value={
            filtroEstado
          }
          onChange={
            (
              e
            ) =>
              setFiltroEstado(
                e.target.value
              )
          }
          className="facturas-status-filter"
        >
          <option value="">
            Todos los estados
          </option>

          <option value="Activa">
            Activas
          </option>

          <option value="Pagada">
            Pagadas
          </option>
        </select>

      </div>

      {/* =====================================================
          FACTURAS
      ===================================================== */}

      {cargando ? (

        <div className="facturas-loading">

          <RefreshCw
            size={27}
            className="facturas-spin"
          />

          <span>
            Cargando facturas...
          </span>

        </div>

      ) : facturasFiltradas.length ===
        0 ? (

        <div className="facturas-empty">

          <FileText
            size={35}
          />

          <strong>
            No hay facturas
          </strong>

          <span>
            No encontramos ventas con los filtros seleccionados.
          </span>

        </div>

      ) : (

        <section className="facturas-grid">

          {facturasFiltradas.map(
            (
              factura
            ) => (

              <article
                className="factura-card"
                key={
                  factura._id
                }
              >

                {/* HEADER */}

                <div className="factura-head">

                  <div className="factura-icon">
                    <FileText
                      size={21}
                    />
                  </div>

                  <div className="factura-title">

                    <small>
                      {
                        factura.codigo
                      }
                    </small>

                    <strong>
                      {
                        factura.clienteNombre
                      }
                    </strong>

                    <p>
                      Manzana{" "}
                      {
                        factura.manzanaNombre
                      }{" "}
                      · Lote{" "}
                      {
                        factura.loteCodigo
                      }
                    </p>

                  </div>

                  <button
                    type="button"
                    className="factura-print-button"
                    title="Imprimir factura"
                    onClick={() =>
                      imprimirFactura(
                        factura
                      )
                    }
                  >
                    <Printer
                      size={17}
                    />
                  </button>

                </div>

                {/* DATOS */}

                <div className="factura-meta">

                  <span>
                    {formatearFecha(
                      factura.fechaVenta
                    )}
                  </span>

                  <span>
                    {
                      factura.formaPago
                    }
                  </span>

                  <span
                    className={`factura-status ${String(
                      factura.estado ||
                        ""
                    ).toLowerCase()}`}
                  >
                    {
                      factura.estado
                    }
                  </span>

                </div>

                {/* VALORES */}

                <div className="factura-values">

                  <div>
                    <small>
                      Total
                    </small>

                    <b>
                      {formatearDinero(
                        factura.valorVenta
                      )}
                    </b>
                  </div>

                  <div>
                    <small>
                      Pagado
                    </small>

                    <b className="factura-paid">
                      {formatearDinero(
                        factura.totalPagado
                      )}
                    </b>
                  </div>

                  <div>
                    <small>
                      Saldo
                    </small>

                    <b className="factura-balance">
                      {formatearDinero(
                        factura.saldoPendiente
                      )}
                    </b>
                  </div>

                </div>

                {/* PROGRESO */}

                <div className="factura-progress-info">

                  <span>
                    Progreso de pago
                  </span>

                  <strong>
                    {Math.round(
                      factura.porcentaje
                    )}
                    %
                  </strong>

                </div>

                <div className="factura-progress">

                  <i
                    style={{
                      width:
                        `${factura.porcentaje}%`,
                    }}
                  />

                </div>

              </article>

            )
          )}

        </section>

      )}

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