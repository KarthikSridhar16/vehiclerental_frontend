// src/components/AdminRoute.jsx
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

function parseJwt(token) {
  try {
    const base = token.split(".")[1];
    const json = JSON.parse(atob(base.replace(/-/g, "+").replace(/_/g, "/")));
    return json || null;
  } catch {
    return null;
  }
}

export default function AdminRoute({ children }) {
  const [ok, setOk] = useState(null);
  const loc = useLocation();

  useEffect(() => {
    const t = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!t) return setOk(false);
    const p = parseJwt(t);
    setOk(!!p && (p.role === "admin" || p.isAdmin === true));
  }, [loc.pathname]);

  if (ok === null) return <div className="p-6">Checking access…</div>;
  if (!ok) return <Navigate to={`/login?redirect=${encodeURIComponent(loc.pathname)}`} replace />;
  return children;
}
