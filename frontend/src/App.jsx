import { useState } from "react";

import "./App.css";

import Sidebar from "./components/layout/Sidebar";
import Navbar from "./components/layout/Navbar";

import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import Clientes from "./pages/Clientes/Clientes";
import Lotes from "./pages/Lotes/Lotes";
import Ventas from "./pages/Ventas/Ventas";
import Cuotas from "./pages/Cuotas/Cuotas";
import Pagos from "./pages/Pagos/Pagos";
import Facturas from "./pages/Facturas/Facturas";
import Maquinaria from "./pages/Maquinaria/Maquinaria";
import HorasMaquinaria from "./pages/HorasMaquinaria/HorasMaquinaria";
import Vendedores from "./pages/Vendedores/Vendedores";
import Comisiones from "./pages/Comisiones/Comisiones";
import Egresos from "./pages/Egresos/Egresos";
import Comprobantes from "./pages/Comprobantes/Comprobantes";
import Cartera from "./pages/Cartera/Cartera";
import Reportes from "./pages/Reportes/Reportes";

const pages = {
  dashboard: Dashboard,
  clientes: Clientes,
  lotes: Lotes,
  ventas: Ventas,
  vendedores: Vendedores,
  comisiones: Comisiones,
  cuotas: Cuotas,
  pagos: Pagos,
  cartera: Cartera,
  egresos: Egresos,
  comprobantes: Comprobantes,
  facturas: Facturas,
  reportes: Reportes,
  maquinaria: Maquinaria,
  horas: HorasMaquinaria,
};;

export default function App() {
  const [logged, setLogged] = useState(() => {
    return sessionStorage.getItem("vm-admin-demo") === "1";
  });

  const [active, setActive] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [sidebarAbierto, setSidebarAbierto] = useState(true);

  const toggleSidebar = () => {
    setSidebarAbierto(
      (estado) => !estado
    );
  };

  const login = () => {
    sessionStorage.setItem("vm-admin-demo", "1");
    setLogged(true);
  };

  const logout = () => {
    sessionStorage.removeItem("vm-admin-demo");
    setLogged(false);
    setActive("dashboard");
    setSearch("");
  };

  const navigate = (view) => {
    setActive(view);
    setSearch("");
  };

  if (!logged) {
    return <Login onLogin={login} />;
  }

  const Page = pages[active] || Dashboard;

  return (
    <div className="app-shell">
      <Sidebar
        active={active}
        onNavigate={navigate}
        onLogout={logout}
        abierto={sidebarAbierto}
        onToggleSidebar={toggleSidebar}
      />

      <main
        className={`app-main ${
          sidebarAbierto
            ? ""
            : "app-main-sidebar-closed"
        }`}
      >
        <Navbar
          active={active}
          search={search}
          onSearch={setSearch}
          onNewPayment={() => navigate("pagos")}
        />

        <div
          className={`app-content ${
            sidebarAbierto
              ? ""
              : "app-content-sidebar-closed"
          }`}
        >
          <Page
            search={search}
            onNavigate={navigate}
          />
        </div>
      </main>
    </div>
  );
}