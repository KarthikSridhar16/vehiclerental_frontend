// src/pages/AuthLogin.jsx
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../api/client";
import HeroShowcase from "../components/HeroShowcase";
import { saveSession } from "../utils/session";
import "../styles/auth.css";

export default function AuthLogin({ onAuth }) {
  const nav = useNavigate();
  const { search } = useLocation();
  const qs = new URLSearchParams(search);
  const next = qs.get("redirect") || "/search";
  const justExpired = qs.get("expired") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const r = await api.post("/auth/login", { email, password });
      const sess = saveSession(r.data);  
      onAuth?.(sess);

      if (sess?.user?.role === "admin") {
        nav("/admin", { replace: true });
      } else {
        nav(next, { replace: true });
      }
    } catch (ex) {
      setErr(ex?.response?.data?.error || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-bg">
      <HeroShowcase />
      <div className="auth-overlay">
        <form onSubmit={submit} className="auth-card glass-strong">
          <h1 className="auth-title v-h">Welcome back</h1>
          <p className="auth-sub">Sign in to continue your reservation</p>

          {(err || justExpired) && (
            <div className="auth-error">{err || "Your session expired. Please sign in again."}</div>
          )}

          <div className="auth-row">
            <label className="auth-label" htmlFor="email">Email</label>
            <input
              id="email"
              className="input auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-row">
            <div className="auth-label-row">
              <label className="auth-label" htmlFor="password">Password</label>
              <Link to="/forgot" className="auth-link">Forgot password?</Link>
            </div>
            <div className="auth-passwrap">
              <input
                id="password"
                type={show ? "text" : "password"}
                className="input auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShow(v => !v)}
                className="auth-eyebtn"
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          <div className="auth-actions">
            <button className="btn btn-gold" disabled={busy} type="submit">
              {busy ? "Logging in…" : "Login"}
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => nav("/register")}>
              Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
