import {
  useState,
} from "react";

import {
  Users,
  BadgeDollarSign,
  MapPinned,
  UserRoundCheck,
  WalletCards,
  ReceiptText,
  Map,
  ArrowDownCircle,
  Tractor,
  BarChart3,
  ArrowRight,
  FileSpreadsheet,
  FileText,
  Globe2,
} from "lucide-react";

import ClientesLotesVendidos
  from "./ClientesLotesVendidos/ClientesLotesVendidos";

import "./Reportes.css";

/* =========================================================
   CATÁLOGO DE INFORMES
========================================================= */

const INFORMES = [
  {
    id:
      "clientes-lotes-vendidos",

    titulo:
      "Clientes por lotes vendidos",

    descripcion:
      "Compradores, lotes adquiridos, valores de venta, pagos, cartera y vendedor asociado.",

    Icon:
      Users,

    disponible:
      true,

    categoria:
      "Ventas y clientes",
  },

  {
    id:
      "comisiones",

    titulo:
      "Informe de comisiones",

    descripcion:
      "Comisiones generadas por vendedor, pagos realizados, abonos y saldos pendientes.",

    Icon:
      BadgeDollarSign,

    disponible:
      false,

    categoria:
      "Vendedores",
  },

  {
    id:
      "manzanas-lotes",

    titulo:
      "Manzanas y sus lotes",

    descripcion:
      "Manzanas creadas, cantidad de lotes, áreas, valores y disponibilidad de cada lote.",

    Icon:
      MapPinned,

    disponible:
      false,

    categoria:
      "Inventario",
  },

  {
    id:
      "ventas-vendedor",

    titulo:
      "Ventas por vendedor",

    descripcion:
      "Lotes vendidos por cada vendedor, clientes atendidos, valor vendido y comisiones generadas.",

    Icon:
      UserRoundCheck,

    disponible:
      false,

    categoria:
      "Ventas",
  },

  {
    id:
      "cartera-clientes",

    titulo:
      "Cartera por cliente",

    descripcion:
      "Valor comprado, pagos realizados, saldo pendiente, cuotas vencidas y valor vencido por cliente.",

    Icon:
      WalletCards,

    disponible:
      false,

    categoria:
      "Cartera",
  },

  {
    id:
      "recaudo-clientes",

    titulo:
      "Recaudo por cliente",

    descripcion:
      "Historial consolidado de pagos, ventas asociadas, lotes, último pago y total recaudado.",

    Icon:
      ReceiptText,

    disponible:
      false,

    categoria:
      "Pagos",
  },

  {
    id:
      "lotes-disponibles",

    titulo:
      "Lotes disponibles",

    descripcion:
      "Inventario actual de lotes disponibles agrupados por manzana, área y valor.",

    Icon:
      Map,

    disponible:
      false,

    categoria:
      "Inventario",
  },

  {
    id:
      "egresos",

    titulo:
      "Informe de egresos",

    descripcion:
      "Comisiones, maquinaria y otros egresos con beneficiarios, conceptos, fechas y valores.",

    Icon:
      ArrowDownCircle,

    disponible:
      false,

    categoria:
      "Tesorería",
  },

  {
    id:
      "maquinaria",

    titulo:
      "Informe de maquinaria",

    descripcion:
      "Máquinas, operarios, horas trabajadas, valores causados, pagos realizados y saldos.",

    Icon:
      Tractor,

    disponible:
      false,

    categoria:
      "Operación",
  },

  {
    id:
      "resumen-financiero",

    titulo:
      "Resumen financiero",

    descripcion:
      "Consolidado de ventas, recaudo, cartera, cartera vencida, egresos y balance general.",

    Icon:
      BarChart3,

    disponible:
      false,

    categoria:
      "Financiero",
  },
];

/* =========================================================
   COMPONENTES DISPONIBLES

   Cada informe tendrá su propio componente.
========================================================= */

const COMPONENTES_INFORMES = {
  "clientes-lotes-vendidos":
    ClientesLotesVendidos,
};

/* =========================================================
   REPORTES
========================================================= */

export default function Reportes() {
  const [
    informeActivo,
    setInformeActivo,
  ] = useState(null);

  /* =======================================================
     ABRIR INFORME
  ======================================================= */

  const abrirInforme = (
    informe
  ) => {
    if (
      !informe.disponible
    ) {
      return;
    }

    setInformeActivo(
      informe.id
    );
  };

  /* =======================================================
     INFORME ACTIVO
  ======================================================= */

  if (
    informeActivo
  ) {
    const ComponenteInforme =
      COMPONENTES_INFORMES[
        informeActivo
      ];

    if (
      ComponenteInforme
    ) {
      return (
        <ComponenteInforme
          onVolver={() =>
            setInformeActivo(
              null
            )
          }
        />
      );
    }
  }

  /* =======================================================
     MENÚ PRINCIPAL
  ======================================================= */

  return (
    <div className="reportes-home">

      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="reportes-home-header">

        <div>

          <span className="reportes-home-kicker">
            Centro de información
          </span>

          <h1>
            Reportes
          </h1>

          <p>
            Genera informes administrativos independientes con información consolidada de Lotes Villa María.
          </p>

        </div>

        <div className="reportes-home-formatos">

          <span>
            Formatos disponibles
          </span>

          <div>

            <b className="pdf">
              <FileText
                size={14}
              />
              PDF
            </b>

            <b className="excel">
              <FileSpreadsheet
                size={14}
              />
              XLSX
            </b>

            <b className="html">
              <Globe2
                size={14}
              />
              HTML
            </b>

          </div>

        </div>

      </header>

      {/* ===================================================
          INFORMACIÓN
      =================================================== */}

      <section className="reportes-home-info">

        <div>

          <strong>
            {INFORMES.length}
          </strong>

          <span>
            Informes administrativos
          </span>

        </div>

        <div>

          <strong>
            {
              INFORMES.filter(
                (informe) =>
                  informe.disponible
              ).length
            }
          </strong>

          <span>
            Informes disponibles
          </span>

        </div>

        <div>

          <strong>
            PDF · XLSX · HTML
          </strong>

          <span>
            Formatos de exportación
          </span>

        </div>

      </section>

      {/* ===================================================
          GRID DE INFORMES
      =================================================== */}

      <section className="reportes-home-grid">

        {INFORMES.map(
          (informe) => {
            const Icon =
              informe.Icon;

            return (
              <article
                key={
                  informe.id
                }
                className={`reportes-home-card ${
                  informe.disponible
                    ? "disponible"
                    : "pendiente"
                }`}
              >

                <div className="reportes-home-card-top">

                  <i>
                    <Icon
                      size={21}
                    />
                  </i>

                  <span
                    className={`reportes-home-status ${
                      informe.disponible
                        ? "activo"
                        : ""
                    }`}
                  >
                    {informe.disponible
                      ? "Disponible"
                      : "Próximamente"}
                  </span>

                </div>

                <div className="reportes-home-card-content">

                  <small>
                    {informe.categoria}
                  </small>

                  <h2>
                    {informe.titulo}
                  </h2>

                  <p>
                    {informe.descripcion}
                  </p>

                </div>

                <button
                  type="button"
                  disabled={
                    !informe.disponible
                  }
                  onClick={() =>
                    abrirInforme(
                      informe
                    )
                  }
                >
                  {informe.disponible
                    ? "Abrir informe"
                    : "En desarrollo"}

                  {informe.disponible && (
                    <ArrowRight
                      size={15}
                    />
                  )}
                </button>

              </article>
            );
          }
        )}

      </section>

    </div>
  );
}