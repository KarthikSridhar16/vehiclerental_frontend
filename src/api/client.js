import axios from "axios";
import { loadSession, isExpired, clearSession } from "../utils/session";

const BASE = (
  import.meta.env.VITE_API_BASE?.trim() ||
  import.meta.env.VITE_API?.trim() ||
  "http://localhost:8099"
).replace(/\/$/, "");

function logoutAndRedirect() {
  clearSession(true);
  const here = window.location.pathname + window.location.search;
  if (!here.startsWith("/login")) {
    window.location.href = `/login?expired=1&redirect=${encodeURIComponent(here)}`;
  }
}

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((cfg) => {
  const sess = loadSession();
  if (sess?.token && !isExpired(sess)) {
    cfg.headers.Authorization = `Bearer ${sess.token}`;
  } else if (sess?.token) {
    logoutAndRedirect();
  }
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) logoutAndRedirect();
    return Promise.reject(err);
  }
);

export default api;
