import { Bell, Menu, Plus, Search } from "lucide-react";
import Button from "../ui/Button";
import "./Navbar.css";

const titles = { dashboard:"Resumen", clientes:"Clientes", lotes:"Lotes", ventas:"Ventas", cuotas:"Cuotas", pagos:"Pagos", facturas:"Facturas", maquinaria:"Maquinaria", horas:"Horas trabajadas" };
export default function Navbar({ active, search, onSearch, onNewPayment }) {
  return <header className="navbar">
    <button className="navbar-mobile"><Menu /></button>
    <div className="navbar-title"><strong>{titles[active] || "Villa María"}</strong><small>Sistema administrativo Villa María</small></div>
    <div className="navbar-actions">
      <label className="navbar-search"><Search /><input value={search} onChange={e=>onSearch(e.target.value)} placeholder="Buscar..." /></label>
      <button className="navbar-icon"><Bell /></button>
      <Button onClick={onNewPayment}><Plus /> Registrar pago</Button>
    </div>
  </header>;
}
