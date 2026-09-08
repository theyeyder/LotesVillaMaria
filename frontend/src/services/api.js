import axios from "axios";

/* =========================================================
   URL DEL SERVIDOR

   DESARROLLO:
   - En este PC:
     http://localhost:5173

   - Desde otro dispositivo:
     http://IP-DEL-SERVIDOR:5173

   PRODUCCIÓN:
   - React y Express funcionarán desde el mismo servidor.
   - Las peticiones utilizarán /api automáticamente.
========================================================= */

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (
    import.meta.env.DEV
      ? `${window.location.protocol}//${window.location.hostname}:5000/api`
      : "/api"
  );

/* =========================================================
   AXIOS
========================================================= */

const api = axios.create({
  baseURL: API_BASE_URL,

  headers: {
    "Content-Type": "application/json",
  },

  timeout: 15000,
});

/* =========================================================
   TOKEN JWT
========================================================= */

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem(
        "token"
      );

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) =>
    Promise.reject(error)
);

/* =========================================================
   RESPUESTAS
========================================================= */

api.interceptors.response.use(
  (response) =>
    response,

  (error) => {
    if (
      error.response?.status ===
        401 &&
      !error.config?.url?.includes(
        "/auth/login"
      )
    ) {
      localStorage.removeItem(
        "token"
      );

      localStorage.removeItem(
        "user"
      );

      window.location.href =
        "/login";
    }

    return Promise.reject(
      error
    );
  }
);

export default api;