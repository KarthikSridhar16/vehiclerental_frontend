import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/client";
import HeroShowcase from "../components/HeroShowcase";
import "../styles/auth.css";

export default function AuthRegister({ onAuth }) {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const r = await api.post("/auth/register", { name, email, password });
      onAuth?.(r.data);
      nav("/search", { replace: true });
    } catch (ex) {
      setErr(ex?.response?.data?.error || "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-bg">
      <HeroShowcase />

      <div className="auth-overlay">
        <form onSubmit={submit} className="auth-card glass-strong">
          <h1 className="auth-title v-h">Create account</h1>
          <p className="auth-sub">Join the VRUMACARS fleet</p>

          {err && <div className="auth-error">{err}</div>}

          <div className="auth-row">
            <label className="auth-label" htmlFor="name">Name</label>
            <input
              id="name"
              className="input auth-input"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="auth-row">
            <label className="auth-label" htmlFor="email">Email</label>
            <input
              id="email"
              className="input auth-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-row">
            <label className="auth-label" htmlFor="password">Password</label>
            <div className="password-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="input auth-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPassword(prev => !prev)}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          <div className="auth-actions">
            <button className="btn btn-gold" disabled={busy} type="submit">
              {busy ? "Creating…" : "Sign up"}
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => nav("/login")}>
              Login
            </button>
          </div>

          <div className="auth-footnote">
            Already have an account?{" "}
            <Link to="/login" className="auth-link">Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
