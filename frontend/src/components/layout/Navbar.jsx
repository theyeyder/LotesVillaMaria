import {
  Search,
  Bell,
  CircleDollarSign,
} from "lucide-react";

import "./Navbar.css";

const titles = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Resumen general de Villa María",
  },

  clientes: {
    title: "Clientes",
    subtitle: "Administración de compradores y clientes",
  },

  lotes: {
    title: "Lotes",
    subtitle: "Gestión y control de lotes",
  },

  ventas: {
    title: "Ventas",
    subtitle: "Control de ventas realizadas",
  },

  vendedores: {
    title: "Vendedores",
    subtitle: "Gestión de vendedores y comisiones",
  },

  comisiones: {
    title: "Comisiones",
    subtitle: "Control de comisiones y saldos por pagar",
  },

  cuotas: {
    title: "Cuotas",
    subtitle: "Seguimiento de cuotas y vencimientos",
  },

  pagos: {
    title: "Pagos",
    subtitle: "Registro de pagos y abonos de clientes",
  },

 egresos: {
  title: "Egresos",
  subtitle: "Control de pagos y salidas de dinero",
},

comprobantes: {
  title: "Comprobantes",
  subtitle: "Consulta de ingresos, egresos y documentos de movimiento",
},

facturas: {
  title: "Facturas",
  subtitle: "Gestión de facturas y comprobantes",
},

  maquinaria: {
    title: "Maquinaria",
    subtitle: "Control de maquinaria",
  },

  horas: {
    title: "Horas trabajadas",
    subtitle: "Registro de horas de maquinaria",
  },
};

export default function Navbar({
  active,
  search,
  onSearch,
  onNewPayment,
}) {
  const page =
    titles[active] ||
    titles.dashboard;

  return (
    <header className="navbar">

      {/* =============================================
          TÍTULO
      ============================================= */}

      <div className="navbar-title">
        <span className="navbar-kicker">
          Lotes Villa María
        </span>

        <h1>
          {page.title}
        </h1>

        <p>
          {page.subtitle}
        </p>
      </div>

      {/* =============================================
          ACCIONES
      ============================================= */}

      <div className="navbar-actions">
        <div className="navbar-search">
          <Search size={18} />

          <input
            type="text"
            value={
              search || ""
            }
            onChange={(e) =>
              onSearch?.(
                e.target.value
              )
            }
            placeholder="Buscar..."
          />
        </div>

        <button
          type="button"
          className="navbar-icon-button"
          title="Notificaciones"
        >
          <Bell size={19} />
        </button>

        <button
          type="button"
          className="navbar-payment-button"
          onClick={
            onNewPayment
          }
        >
          <CircleDollarSign
            size={19}
          />

          Registrar pago
        </button>
      </div>
    </header>
  );
}