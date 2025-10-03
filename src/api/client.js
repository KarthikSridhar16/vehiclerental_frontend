import axios from "axios";
import { loadSession, isExpired, clearSession } from "../utils/session";

const BASE = (
  import.meta.env.VITE_API_BASE?.trim() ||
  import.meta.env.VITE_API?.trim() ||
  "http://localhost:8099"
).replace(/\/$/, "");

function logoutAndRedirect() {
  clearSession();
  const here = window.location.pathname + window.location.search;
  if (!here.startsWith("/login")) {
    window.location.replace(`/login?expired=1&redirect=${encodeURIComponent(here)}`);
  } else {
    window.location.replace("/login");
  }
}

function needsAuth(cfg) {
  const m = String(cfg.method || "get").toUpperCase();
  const u = String(cfg.url || "");
  if (u.startsWith("/bookings")) return true;
  if (u.startsWith("/payments")) return true;
  if (u.startsWith("/reviews/me")) return true;
  if (u.startsWith("/admin")) return true;
  if (u.startsWith("/auth")) return false;
  if (m !== "GET" && !u.startsWith("/vehicles")) return true;
  return false;
}

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((cfg) => {
  const sess = loadSession();
  if (needsAuth(cfg)) {
    if (sess?.token && !isExpired(sess)) {
      cfg.headers = cfg.headers || {};
      cfg.headers.Authorization = `Bearer ${sess.token}`;
    } else if (sess?.token) {
      logoutAndRedirect();
    }
  } else if (cfg?.headers?.Authorization) {
    delete cfg.headers.Authorization;
  }
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const status = err?.response?.status;
    const cfg = err?.config || {};
    if (status === 401 && needsAuth(cfg)) logoutAndRedirect();
    return Promise.reject(err);
  }
);

export default api;
