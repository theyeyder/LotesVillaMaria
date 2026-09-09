import {
  useEffect,
  useState,
} from "react";

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

/* =========================================================
   PÁGINAS
========================================================= */

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
};

/* =========================================================
   CONSTANTES
========================================================= */

const MODULO_DEFAULT =
  "dashboard";

const STORAGE_LOGIN =
  "vm-admin-demo";

const STORAGE_MODULO =
  "vm-modulo-activo";

/* =========================================================
   VALIDAR MÓDULO
========================================================= */

const moduloValido = (
  modulo
) => {
  return Boolean(
    modulo &&
      Object.prototype.hasOwnProperty.call(
        pages,
        modulo
      )
  );
};

/* =========================================================
   OBTENER MÓDULO DESDE LA URL
========================================================= */

const obtenerModuloURL =
  () => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const modulo =
      params.get(
        "modulo"
      );

    return moduloValido(
      modulo
    )
      ? modulo
      : null;
  };

/* =========================================================
   CREAR URL DEL MÓDULO
========================================================= */

const crearURLModulo = (
  modulo
) => {
  const url =
    new URL(
      window.location.href
    );

  url.searchParams.set(
    "modulo",
    modulo
  );

  return (
    url.pathname +
    url.search +
    url.hash
  );
};

/* =========================================================
   URL DE LOGIN
========================================================= */

const crearURLLogin =
  () => {
    const url =
      new URL(
        window.location.href
      );

    url.searchParams.delete(
      "modulo"
    );

    return (
      url.pathname +
      url.search +
      url.hash
    );
  };

/* =========================================================
   MÓDULO INICIAL
========================================================= */

const obtenerModuloInicial =
  () => {
    /* =====================================================
       1. URL
    ===================================================== */

    const moduloURL =
      obtenerModuloURL();

    if (
      moduloURL
    ) {
      return moduloURL;
    }

    /* =====================================================
       2. HISTORIAL
    ===================================================== */

    const moduloHistorial =
      window.history.state
        ?.vmModulo;

    if (
      moduloValido(
        moduloHistorial
      )
    ) {
      return moduloHistorial;
    }

    /* =====================================================
       3. SESSION STORAGE
    ===================================================== */

    const moduloGuardado =
      sessionStorage.getItem(
        STORAGE_MODULO
      );

    if (
      moduloValido(
        moduloGuardado
      )
    ) {
      return moduloGuardado;
    }

    return MODULO_DEFAULT;
  };

/* =========================================================
   APP
========================================================= */

export default function App() {
  /* =======================================================
     SESIÓN
  ======================================================= */

  const [
    logged,
    setLogged,
  ] = useState(
    () => {
      return (
        sessionStorage.getItem(
          STORAGE_LOGIN
        ) === "1"
      );
    }
  );

  /* =======================================================
     MÓDULO ACTIVO
  ======================================================= */

  const [
    active,
    setActive,
  ] = useState(
    () =>
      obtenerModuloInicial()
  );

  /* =======================================================
     BÚSQUEDA
  ======================================================= */

  const [
    search,
    setSearch,
  ] = useState("");

  /* =======================================================
     SIDEBAR
  ======================================================= */

  const [
    sidebarAbierto,
    setSidebarAbierto,
  ] = useState(true);

  /* =======================================================
     SIDEBAR
  ======================================================= */

  const toggleSidebar =
    () => {
      setSidebarAbierto(
        (estado) =>
          !estado
      );
    };

  /* =======================================================
     LOGIN
  ======================================================= */

  const login =
    () => {
      sessionStorage.setItem(
        STORAGE_LOGIN,
        "1"
      );

      const modulo =
        MODULO_DEFAULT;

      sessionStorage.setItem(
        STORAGE_MODULO,
        modulo
      );

      setActive(
        modulo
      );

      setSearch(
        ""
      );

      /*
        Reemplazamos la entrada del Login
        para que Atrás no regrese al Login.
      */

      window.history.replaceState(
        {
          vmApp: true,
          vmGuard: true,
          vmModulo:
            modulo,
        },
        "",
        crearURLModulo(
          modulo
        )
      );

      /*
        Creamos una entrada normal delante
        de la entrada de protección.
      */

      window.history.pushState(
        {
          vmApp: true,
          vmGuard: false,
          vmModulo:
            modulo,
        },
        "",
        crearURLModulo(
          modulo
        )
      );

      setLogged(
        true
      );
    };

  /* =======================================================
     LOGOUT
  ======================================================= */

  const logout =
    () => {
      sessionStorage.removeItem(
        STORAGE_LOGIN
      );

      sessionStorage.removeItem(
        STORAGE_MODULO
      );

      setLogged(
        false
      );

      setActive(
        MODULO_DEFAULT
      );

      setSearch(
        ""
      );

      /*
        Al cerrar sesión sí dejamos una
        entrada limpia para Login.
      */

      window.history.replaceState(
        {
          vmApp: false,
        },
        "",
        crearURLLogin()
      );
    };

  /* =======================================================
     NAVEGAR
  ======================================================= */

  const navigate = (
    view
  ) => {
    if (
      !moduloValido(
        view
      )
    ) {
      return;
    }

    setSearch(
      ""
    );

    /*
      Si ya estamos en ese módulo,
      no creamos otra entrada duplicada.
    */

    if (
      view === active
    ) {
      sessionStorage.setItem(
        STORAGE_MODULO,
        view
      );

      return;
    }

    sessionStorage.setItem(
      STORAGE_MODULO,
      view
    );

    window.history.pushState(
      {
        vmApp: true,
        vmGuard: false,
        vmModulo:
          view,
      },
      "",
      crearURLModulo(
        view
      )
    );

    setActive(
      view
    );
  };

  /* =======================================================
     HISTORIAL DEL NAVEGADOR
  ======================================================= */

  useEffect(
    () => {
      if (
        !logged
      ) {
        return undefined;
      }

      /* ===================================================
         NORMALIZAR MÓDULO ACTUAL
      =================================================== */

      const moduloActual =
        obtenerModuloInicial();

      setActive(
        moduloActual
      );

      sessionStorage.setItem(
        STORAGE_MODULO,
        moduloActual
      );

      /*
        Si la página fue recargada o abierta directamente
        y ya existe estado de la aplicación, lo conservamos.
      */

      if (
        window.history.state
          ?.vmApp
      ) {
        window.history.replaceState(
          {
            ...window.history.state,

            vmApp: true,

            vmModulo:
              moduloActual,
          },
          "",
          crearURLModulo(
            moduloActual
          )
        );
      } else {
        /*
          Si entramos con una sesión ya iniciada pero
          no existe historial de la aplicación, creamos
          una entrada de protección y una entrada normal.
        */

        window.history.replaceState(
          {
            vmApp: true,

            vmGuard: true,

            vmModulo:
              moduloActual,
          },
          "",
          crearURLModulo(
            moduloActual
          )
        );

        window.history.pushState(
          {
            vmApp: true,

            vmGuard: false,

            vmModulo:
              moduloActual,
          },
          "",
          crearURLModulo(
            moduloActual
          )
        );
      }

      /* ===================================================
         ATRÁS / ADELANTE
      =================================================== */

      const manejarHistorial =
        (event) => {
          const estado =
            event.state;

          /*
            Entrada perteneciente a
            LotesVillaMaria.
          */

          if (
            estado?.vmApp
          ) {
            const modulo =
              moduloValido(
                estado.vmModulo
              )
                ? estado.vmModulo
                : MODULO_DEFAULT;

            /*
              Si llegamos a la entrada de protección,
              mantenemos al usuario dentro del sistema.
            */

            if (
              estado.vmGuard
            ) {
              sessionStorage.setItem(
                STORAGE_MODULO,
                modulo
              );

              setActive(
                modulo
              );

              setSearch(
                ""
              );

              window.history.pushState(
                {
                  vmApp: true,

                  vmGuard: false,

                  vmModulo:
                    modulo,
                },
                "",
                crearURLModulo(
                  modulo
                )
              );

              return;
            }

            sessionStorage.setItem(
              STORAGE_MODULO,
              modulo
            );

            setActive(
              modulo
            );

            setSearch(
              ""
            );

            return;
          }

          /*
            Si por alguna razón llegamos a una entrada
            que no pertenece a la aplicación mientras
            la sesión sigue activa, permanecemos dentro.
          */

          const moduloGuardado =
            sessionStorage.getItem(
              STORAGE_MODULO
            );

          const modulo =
            moduloValido(
              moduloGuardado
            )
              ? moduloGuardado
              : MODULO_DEFAULT;

          window.history.pushState(
            {
              vmApp: true,

              vmGuard: false,

              vmModulo:
                modulo,
            },
            "",
            crearURLModulo(
              modulo
            )
          );

          setActive(
            modulo
          );

          setSearch(
            ""
          );
        };

      window.addEventListener(
        "popstate",
        manejarHistorial
      );

      return () => {
        window.removeEventListener(
          "popstate",
          manejarHistorial
        );
      };
    },
    [
      logged,
    ]
  );

  /* =======================================================
     LOGIN
  ======================================================= */

  if (
    !logged
  ) {
    return (
      <Login
        onLogin={
          login
        }
      />
    );
  }

  /* =======================================================
     PÁGINA
  ======================================================= */

  const Page =
    pages[active] ||
    Dashboard;

  /* =======================================================
     APP
  ======================================================= */

  return (
    <div className="app-shell">

      <Sidebar
        active={
          active
        }
        onNavigate={
          navigate
        }
        onLogout={
          logout
        }
        abierto={
          sidebarAbierto
        }
        onToggleSidebar={
          toggleSidebar
        }
      />

      <main
        className={`app-main ${
          sidebarAbierto
            ? ""
            : "app-main-sidebar-closed"
        }`}
      >

        <Navbar
          active={
            active
          }
          search={
            search
          }
          onSearch={
            setSearch
          }
          onNewPayment={() =>
            navigate(
              "pagos"
            )
          }
        />

        <div
          className={`app-content ${
            sidebarAbierto
              ? ""
              : "app-content-sidebar-closed"
          }`}
        >

          <Page
            search={
              search
            }
            onNavigate={
              navigate
            }
          />

        </div>

      </main>

    </div>
  );
}