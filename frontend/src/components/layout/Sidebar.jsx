import {
  LayoutDashboard,
  Users,
  MapPinned,
  HandCoins,
  BadgeDollarSign,
  WalletCards,
  CreditCard,
  ReceiptText,
  Tractor,
  Clock3,
  LogOut,
} from "lucide-react";

import "./Sidebar.css";

const menuItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "clientes",
    label: "Clientes",
    icon: Users,
  },
  {
    id: "lotes",
    label: "Lotes",
    icon: MapPinned,
  },
  {
    id: "ventas",
    label: "Ventas",
    icon: HandCoins,
  },
  {
    id: "vendedores",
    label: "Vendedores",
    icon: BadgeDollarSign,
  },
  {
    id: "cuotas",
    label: "Cuotas",
    icon: WalletCards,
  },
  {
    id: "pagos",
    label: "Pagos",
    icon: CreditCard,
  },
  {
    id: "facturas",
    label: "Facturas",
    icon: ReceiptText,
  },
  {
    id: "maquinaria",
    label: "Maquinaria",
    icon: Tractor,
  },
  {
    id: "horas",
    label: "Horas trabajadas",
    icon: Clock3,
  },
];

export default function Sidebar({
  active,
  onNavigate,
  onLogout,
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">
          VM
        </div>

        <div>
          <h2>Villa María</h2>
          <span>Gestión de lotes</span>
        </div>
      </div>

      <div className="sidebar-section-title">
        Menú principal
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;

          const isActive =
            active === item.id;

          return (
            <button
              key={item.id}
              type="button"
              className={`sidebar-item ${
                isActive
                  ? "sidebar-item-active"
                  : ""
              }`}
              onClick={() =>
                onNavigate(item.id)
              }
            >
              <Icon size={19} />

              <span>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            A
          </div>

          <div className="sidebar-user-info">
            <strong>
              Administrador
            </strong>

            <span>
              @admin
            </span>
          </div>
        </div>

        <button
          type="button"
          className="sidebar-logout"
          onClick={onLogout}
        >
          <LogOut size={18} />

          <span>
            Cerrar sesión
          </span>
        </button>
      </div>
    </aside>
  );
}