// src/api/client.js
import axios from "axios";
import { loadSession, isExpired, clearSession } from "../utils/session";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:8099",
});

api.interceptors.request.use((cfg) => {
  const sess = loadSession();
  if (sess?.token && !isExpired(sess)) {
    cfg.headers.Authorization = `Bearer ${sess.token}`;
  } else if (sess) {
    clearSession();
    const here = window.location.pathname + window.location.search;
    if (!here.startsWith("/login")) {
      window.location.href = `/login?expired=1&redirect=${encodeURIComponent(here)}`;
    }
  }
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      clearSession();
      const here = window.location.pathname + window.location.search;
      if (!here.startsWith("/login")) {
        window.location.href = `/login?expired=1&redirect=${encodeURIComponent(here)}`;
      }
    }
    return Promise.reject(err);
  }
);

export default api;
