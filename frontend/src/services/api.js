import axios from "axios";

/* =========================================================
   URL DE LA API
========================================================= */

const API_BASE_URL =
  import.meta.env.PROD
    ? "/api"
    : `${window.location.protocol}//${window.location.hostname}:5000/api`;

/* =========================================================
   AXIOS
========================================================= */

const api = axios.create({
  baseURL:
    API_BASE_URL,
});

export default api;