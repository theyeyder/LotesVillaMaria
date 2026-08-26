import { Building2, ChevronRight, LayoutDashboard, Map, ShoppingCart, CalendarClock, WalletCards, ReceiptText, Tractor, Timer, LogOut, UsersRound } from "lucide-react";
import "./Sidebar.css";

const items = [
  ["dashboard", "Resumen", LayoutDashboard],
  ["clientes", "Clientes", UsersRound],
  ["lotes", "Lotes", Map],
  ["ventas", "Ventas", ShoppingCart],
  ["cuotas", "Cuotas", CalendarClock],
  ["pagos", "Pagos", WalletCards],
  ["facturas", "Facturas", ReceiptText],
  ["maquinaria", "Maquinaria", Tractor],
  ["horas", "Horas trabajadas", Timer],
];

export default function Sidebar({ active, onNavigate, onLogout }) {
  return <aside className="sidebar topography">
    <button className="sidebar-brand" onClick={() => onNavigate("dashboard")}>
      <span className="sidebar-logo"><Building2 /></span>
      <span><strong className="serif-title">Villa María</strong><small>Gestión de lotes</small></span>
    </button>
    <nav className="sidebar-nav">
      {items.map(([id,label,Icon]) => <button key={id} className={`sidebar-item ${active===id?"active":""}`} onClick={() => onNavigate(id)}>
        <Icon /> <span>{label}</span>{active===id && <ChevronRight className="sidebar-arrow" />}
      </button>)}
    </nav>
    <div className="sidebar-user">
      <span className="sidebar-avatar">AD</span>
      <div><strong>Administrador</strong><small>@admin</small></div>
      <button className="sidebar-logout" onClick={onLogout} title="Cerrar sesión"><LogOut /></button>
    </div>
  </aside>;
}
