import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loadSession, isExpired, clearSession } from "../utils/session";

const Ctx = createContext({ user: null, token: null, ready: false, login:()=>{}, logout:()=>{} });

export function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, token: null, ready: false });

  useEffect(() => {
    const seed = loadSession();
    if (seed?.token && !isExpired(seed)) setState({ user: seed.user || null, token: seed.token, ready: true });
    else { clearSession(false); setState({ user: null, token: null, ready: true }); }

    function refresh() {
      const s = loadSession();
      if (s?.token && !isExpired(s)) setState({ user: s.user || null, token: s.token, ready: true });
      else setState({ user: null, token: null, ready: true });
    }
    window.addEventListener("storage", refresh);
    window.addEventListener("auth:changed", refresh);
    return () => { window.removeEventListener("storage", refresh); window.removeEventListener("auth:changed", refresh); };
  }, []);

  const api = useMemo(() => ({
    ...state,
    login(sess) { localStorage.setItem("auth.session", JSON.stringify(sess)); window.dispatchEvent(new CustomEvent("auth:changed", { detail: sess })); },
    logout() { clearSession(true); }
  }), [state]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
