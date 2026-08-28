import { Banknote, Map, Tractor, WalletCards, ArrowRight, Clock3 } from "lucide-react";
import "./Dashboard.css";
const money = n => new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(n);
const metrics = [
  ["Valor vendido", money(348500000), "8 lotes vendidos", Banknote],
  ["Cartera pendiente", money(15000000), "Saldo por recaudar", WalletCards],
  ["Lotes disponibles", "17", "Inventario disponible", Map],
  ["Maquinaria", "4", "1.284 h acumuladas", Tractor],
];
export default function Dashboard({ onNavigate }) {
  return <div className="dashboard-page page-stack">
    <section className="dashboard-hero topography"><div><p>Panel general</p><h1 className="serif-title">El proyecto, claro y bajo control.</h1><span>Consulta cartera, pagos, lotes y operación de maquinaria desde un solo lugar.</span></div><button onClick={()=>onNavigate("pagos")}>Ver pagos <ArrowRight /></button></section>
    <section className="dashboard-metrics">{metrics.map(([title,value,detail,Icon])=><article className="dashboard-metric surface" key={title}><div><small>{title}</small><strong>{value}</strong><span>{detail}</span></div><i><Icon /></i></article>)}</section>
    <div className="dashboard-grid">
      <section className="surface dashboard-panel"><div className="dashboard-panel-title"><div><p className="page-eyebrow">Cartera</p><h3>Próximos vencimientos</h3></div><Clock3 /></div>
        <div className="due-row"><div><strong>Lote VM-014 · Carlos Ramírez</strong><span>Cuota vence el 30 ago 2026</span></div><b className="badge badge-warning">Próxima</b></div>
        <div className="due-row"><div><strong>Lote VM-008 · Diana Torres</strong><span>Cuota venció el 22 ago 2026</span></div><b className="badge badge-danger">Vencida</b></div>
        <div className="due-row"><div><strong>Lote VM-021 · Andrés Gómez</strong><span>Cuota vence el 2 sep 2026</span></div><b className="badge badge-success">Al día</b></div>
      </section>
      <section className="surface dashboard-panel"><div className="dashboard-panel-title"><div><p className="page-eyebrow">Actividad</p><h3>Movimientos recientes</h3></div></div>
        <div className="activity"><span className="activity-dot"></span><div><strong>Pago registrado</strong><p>Recibo RC-0089 · $2.500.000</p></div></div>
        <div className="activity"><span className="activity-dot"></span><div><strong>Horas de maquinaria</strong><p>Retroexcavadora · 5,5 horas</p></div></div>
        <div className="activity"><span className="activity-dot"></span><div><strong>Nueva venta</strong><p>Lote VM-021 · Andrés Gómez</p></div></div>
      </section>
    </div>
  </div>;
}
