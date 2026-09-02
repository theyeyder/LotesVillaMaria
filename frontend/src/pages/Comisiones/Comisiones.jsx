import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BadgeDollarSign,
  CircleCheckBig,
  Clock3,
  RefreshCw,
  Search,
  UserRound,
  WalletCards,
} from "lucide-react";

import {
  obtenerComisiones,
  sincronizarComisiones,
} from "../../services/comision.service";

import Toast from "../../components/ui/Toast";

import "./Comisiones.css";

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

  const fechaConvertida =
    new Date(fecha);

  if (
    Number.isNaN(
      fechaConvertida.getTime()
    )
  ) {
    return "—";
  }

  return fechaConvertida
    .toLocaleDateString(
      "es-CO",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
};

/* =========================================================
   NOMBRE COMPLETO
========================================================= */

const obtenerNombreCompleto = (
  persona
) => {
  if (!persona) {
    return "—";
  }

  const nombre = [
    persona.nombres,
    persona.apellidos,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return nombre || "—";
};

/* =========================================================
   TEXTO DEL LOTE
========================================================= */

const obtenerNombreLote = (
  lote
) => {
  if (!lote) {
    return "—";
  }

  const codigoLote =
    lote.codigo ||
    lote.numero ||
    lote.nombre ||
    "Lote";

  const manzana =
    lote.manzana;

  if (!manzana) {
    return codigoLote;
  }

  const nombreManzana =
    manzana.codigo ||
    manzana.nombre ||
    "";

  if (!nombreManzana) {
    return codigoLote;
  }

  return `${nombreManzana} - ${codigoLote}`;
};

/* =========================================================
   COMPONENTE
========================================================= */

export default function Comisiones() {
  /* =======================================================
     DATOS
  ======================================================= */

  const [
    comisiones,
    setComisiones,
  ] = useState([]);

  const [
    resumen,
    setResumen,
  ] = useState({
    totalComisiones: 0,
    valorGenerado: 0,
    valorPagado: 0,
    saldoPendiente: 0,
    pendientes: 0,
    abonadas: 0,
    pagadas: 0,
  });

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    sincronizando,
    setSincronizando,
  ] = useState(false);

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

  /* =======================================================
     NOTIFICACIÓN
  ======================================================= */

  const [
    notificacion,
    setNotificacion,
  ] = useState({
    visible: false,
    mensaje: "",
    tipo: "success",
  });

  const mostrarNotificacion =
    (
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

  /* =======================================================
     CARGAR COMISIONES
  ======================================================= */

  const cargarComisiones =
    async () => {
      try {
        setCargando(
          true
        );

        const datos =
          await obtenerComisiones({
            estado:
              filtroEstado ||
              undefined,
          });

        setComisiones(
          Array.isArray(
            datos?.comisiones
          )
            ? datos.comisiones
            : []
        );

        setResumen({
          totalComisiones:
            Number(
              datos?.resumen
                ?.totalComisiones
            ) || 0,

          valorGenerado:
            Number(
              datos?.resumen
                ?.valorGenerado
            ) || 0,

          valorPagado:
            Number(
              datos?.resumen
                ?.valorPagado
            ) || 0,

          saldoPendiente:
            Number(
              datos?.resumen
                ?.saldoPendiente
            ) || 0,

          pendientes:
            Number(
              datos?.resumen
                ?.pendientes
            ) || 0,

          abonadas:
            Number(
              datos?.resumen
                ?.abonadas
            ) || 0,

          pagadas:
            Number(
              datos?.resumen
                ?.pagadas
            ) || 0,
        });
      } catch (error) {
        console.error(
          "Error cargando comisiones:",
          error
        );

        mostrarNotificacion(
          error?.response?.data
            ?.message ||
            "No fue posible cargar las comisiones.",
          "error"
        );

        setComisiones(
          []
        );
      } finally {
        setCargando(
          false
        );
      }
    };

  /* =======================================================
     CARGA INICIAL / CAMBIO ESTADO
  ======================================================= */

  useEffect(
    () => {
      cargarComisiones();
    },
    [
      filtroEstado,
    ]
  );

  /* =======================================================
     SINCRONIZAR
  ======================================================= */

  const sincronizar =
    async () => {
      try {
        setSincronizando(
          true
        );

        const respuesta =
          await sincronizarComisiones();

        mostrarNotificacion(
          respuesta?.message ||
            "Comisiones sincronizadas correctamente."
        );

        await cargarComisiones();
      } catch (error) {
        console.error(
          "Error sincronizando comisiones:",
          error
        );

        mostrarNotificacion(
          error?.response?.data
            ?.message ||
            "No fue posible sincronizar las comisiones.",
          "error"
        );
      } finally {
        setSincronizando(
          false
        );
      }
    };

  /* =======================================================
     FILTRAR BÚSQUEDA LOCAL
  ======================================================= */

  const comisionesFiltradas =
    useMemo(
      () => {
        const texto =
          busqueda
            .trim()
            .toLowerCase();

        if (!texto) {
          return comisiones;
        }

        return comisiones.filter(
          (
            comision
          ) => {
            const vendedor =
              obtenerNombreCompleto(
                comision.vendedor
              );

            const cliente =
              obtenerNombreCompleto(
                comision.cliente
              );

            const codigo =
              comision.codigo ||
              "";

            const venta =
              comision.venta
                ?.codigo ||
              "";

            const documentoVendedor =
              comision.vendedor
                ?.documento ||
              "";

            const documentoCliente =
              comision.cliente
                ?.documento ||
              "";

            const lote =
              obtenerNombreLote(
                comision.lote
              );

            const contenido = `
              ${codigo}
              ${venta}
              ${vendedor}
              ${cliente}
              ${documentoVendedor}
              ${documentoCliente}
              ${lote}
            `
              .toLowerCase();

            return contenido.includes(
              texto
            );
          }
        );
      },
      [
        comisiones,
        busqueda,
      ]
    );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <section className="comisiones-page">

      {/* =================================================
          CABECERA
      ================================================= */}

      <div className="comisiones-header">

        <div>

          <span className="comisiones-kicker">
            Comercial
          </span>

          <h1>
            Comisiones
          </h1>

          <p>
            Control de las comisiones
            generadas por las ventas de
            lotes y los saldos pendientes
            por pagar a cada vendedor.
          </p>

        </div>

        <div className="comisiones-header-actions">

          <button
            type="button"
            className="comisiones-refresh"
            onClick={
              cargarComisiones
            }
            disabled={
              cargando ||
              sincronizando
            }
          >
            <RefreshCw
              size={17}
              className={
                cargando
                  ? "comisiones-spin"
                  : ""
              }
            />

            Actualizar
          </button>

          <button
            type="button"
            className="comisiones-sync"
            onClick={
              sincronizar
            }
            disabled={
              sincronizando ||
              cargando
            }
          >
            <RefreshCw
              size={17}
              className={
                sincronizando
                  ? "comisiones-spin"
                  : ""
              }
            />

            {sincronizando
              ? "Sincronizando..."
              : "Sincronizar ventas"}
          </button>

        </div>

      </div>

      {/* =================================================
          ESTADÍSTICAS
      ================================================= */}

      <div className="comisiones-stats">

        {/* GENERADO */}

        <article className="comisiones-stat generado">

          <div className="comisiones-stat-icon">
            <BadgeDollarSign
              size={21}
            />
          </div>

          <div>
            <span>
              Comisiones generadas
            </span>

            <strong>
              {formatearDinero(
                resumen.valorGenerado
              )}
            </strong>

            <small>
              {resumen.totalComisiones} comisión(es)
            </small>
          </div>

        </article>

        {/* PAGADO */}

        <article className="comisiones-stat pagado">

          <div className="comisiones-stat-icon">
            <CircleCheckBig
              size={20}
            />
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

            <small>
              {resumen.pagadas} pagada(s)
            </small>
          </div>

        </article>

        {/* PENDIENTE */}

        <article className="comisiones-stat pendiente">

          <div className="comisiones-stat-icon">
            <WalletCards
              size={20}
            />
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

            <small>
              {resumen.pendientes} pendiente(s)
            </small>
          </div>

        </article>

        {/* ABONADAS */}

        <article className="comisiones-stat abonado">

          <div className="comisiones-stat-icon">
            <Clock3
              size={20}
            />
          </div>

          <div>
            <span>
              Con abonos
            </span>

            <strong>
              {resumen.abonadas}
            </strong>

            <small>
              Comisiones abonadas
            </small>
          </div>

        </article>

      </div>

      {/* =================================================
          PANEL
      ================================================= */}

      <div className="comisiones-panel">

        {/* =============================================
            FILTROS
        ============================================= */}

        <div className="comisiones-toolbar">

          <div className="comisiones-search">

            <Search
              size={17}
            />

            <input
              type="text"
              value={
                busqueda
              }
              onChange={
                (
                  e
                ) =>
                  setBusqueda(
                    e.target.value
                  )
              }
              placeholder="Buscar comisión, venta, vendedor, cliente o lote..."
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
          >
            <option value="">
              Todos los estados
            </option>

            <option value="Pendiente">
              Pendientes
            </option>

            <option value="Abonada">
              Abonadas
            </option>

            <option value="Pagada">
              Pagadas
            </option>

          </select>

        </div>

        {/* =============================================
            TABLA
        ============================================= */}

        <div className="comisiones-table-wrapper">

          <table className="comisiones-table">

            <thead>

              <tr>

                <th>
                  Comisión
                </th>

                <th>
                  Fecha
                </th>

                <th>
                  Vendedor
                </th>

                <th>
                  Venta
                </th>

                <th>
                  Cliente
                </th>

                <th>
                  Lote
                </th>

                <th>
                  Comisión
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
                    colSpan="10"
                    className="comisiones-empty"
                  >

                    <RefreshCw
                      size={27}
                      className="comisiones-spin"
                    />

                    <strong>
                      Cargando comisiones...
                    </strong>

                  </td>

                </tr>

              ) : comisionesFiltradas.length ===
                0 ? (

                <tr>

                  <td
                    colSpan="10"
                    className="comisiones-empty"
                  >

                    <BadgeDollarSign
                      size={38}
                    />

                    <strong>
                      No hay comisiones para mostrar
                    </strong>

                    <span>
                      Las comisiones se generan
                      a partir de las ventas que
                      tengan un vendedor asignado.
                    </span>

                  </td>

                </tr>

              ) : (

                comisionesFiltradas.map(
                  (
                    comision
                  ) => (

                    <tr
                      key={
                        comision._id
                      }
                    >

                      {/* CÓDIGO */}

                      <td>

                        <strong className="comision-code">
                          {comision.codigo ||
                            "—"}
                        </strong>

                      </td>

                      {/* FECHA */}

                      <td>

                        <span className="comision-fecha">
                          {formatearFecha(
                            comision.fechaGeneracion
                          )}
                        </span>

                      </td>

                      {/* VENDEDOR */}

                      <td>

                        <div className="comision-persona">

                          <div className="comision-avatar">
                            {String(
                              comision.vendedor
                                ?.nombres ||
                                "V"
                            )
                              .charAt(
                                0
                              )
                              .toUpperCase()}
                          </div>

                          <div>

                            <strong>
                              {obtenerNombreCompleto(
                                comision.vendedor
                              )}
                            </strong>

                            <span>
                              {comision.vendedor
                                ?.codigo ||
                                comision.vendedor
                                  ?.documento ||
                                "—"}
                            </span>

                          </div>

                        </div>

                      </td>

                      {/* VENTA */}

                      <td>

                        <strong className="comision-venta">
                          {comision.venta
                            ?.codigo ||
                            "—"}
                        </strong>

                      </td>

                      {/* CLIENTE */}

                      <td>

                        <div className="comision-cliente">

                          <UserRound
                            size={14}
                          />

                          <div>

                            <strong>
                              {obtenerNombreCompleto(
                                comision.cliente
                              )}
                            </strong>

                            <span>
                              {comision.cliente
                                ?.documento ||
                                ""}
                            </span>

                          </div>

                        </div>

                      </td>

                      {/* LOTE */}

                      <td>

                        <span className="comision-lote">
                          {obtenerNombreLote(
                            comision.lote
                          )}
                        </span>

                      </td>

                      {/* VALOR COMISIÓN */}

                      <td>

                        <strong className="comision-valor generado">
                          {formatearDinero(
                            comision.valorComision
                          )}
                        </strong>

                      </td>

                      {/* PAGADO */}

                      <td>

                        <strong className="comision-valor pagado">
                          {formatearDinero(
                            comision.totalPagado
                          )}
                        </strong>

                      </td>

                      {/* SALDO */}

                      <td>

                        <strong className="comision-valor saldo">
                          {formatearDinero(
                            comision.saldoPendiente
                          )}
                        </strong>

                      </td>

                      {/* ESTADO */}

                      <td>

                        <span
                          className={`comision-status comision-status-${String(
                            comision.estado ||
                              "Pendiente"
                          )
                            .toLowerCase()
                            .replace(
                              /\s+/g,
                              "-"
                            )}`}
                        >
                          {comision.estado ||
                            "Pendiente"}
                        </span>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

        {/* =============================================
            PIE
        ============================================= */}

        <div className="comisiones-footer">

          <span>
            Mostrando{" "}
            <strong>
              {
                comisionesFiltradas.length
              }
            </strong>{" "}
            de{" "}
            <strong>
              {
                comisiones.length
              }
            </strong>{" "}
            comisión(es)
          </span>

        </div>

      </div>

      {/* =================================================
          TOAST
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