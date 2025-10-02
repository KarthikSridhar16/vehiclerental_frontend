import { useMemo, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { auth } from "../api/auth";
import HeroShowcase from "../components/HeroShowcase";
import "../styles/auth.css";

export default function ResetPassword() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();

  const token = sp.get("token") || "";
  const email = sp.get("email") || "";
  const valid = useMemo(() => token && email, [token, email]);

  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [err, setErr] = useState(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);
    if (p1 !== p2) return setErr("Passwords do not match.");
    try {
      setLoading(true);
      await auth.reset({ email, token, password: p1 });
      setOk(true);
      setTimeout(() => navigate("/login"), 1200);
    } catch (e) {
      setErr(e?.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  if (!valid) {
    return (
      <div className="auth-bg">
        <HeroShowcase />
        <div className="auth-overlay">
          <div className="auth-card">
            <h1 className="auth-title">Set a new password</h1>
            <div className="auth-error">Invalid or expired reset link.</div>
            <div className="auth-actions">
              <Link className="btn btn-ghost" to="/forgot">Get a new link</Link>
              <Link className="btn btn-gold" to="/login">Go to login</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-bg">
      <HeroShowcase />
      <div className="auth-overlay">
        <form className="auth-card" onSubmit={onSubmit}>
          <h1 className="auth-title">Set a new password</h1>
          <div className="auth-sub">for <strong>{email}</strong></div>

          {ok ? (
            <div className="auth-footnote">Password updated. Redirecting to login…</div>
          ) : (
            <>
              {err && <div className="auth-error">{err}</div>}

              <div className="auth-row">
                <label className="auth-label">New password</label>
                <div className="auth-passwrap">
                  <input
                    className="auth-input"
                    type={show ? "text" : "password"}
                    value={p1}
                    onChange={(e) => setP1(e.target.value)}
                    required
                    minLength={6}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="auth-eyebtn"
                    onClick={() => setShow(s => !s)}
                    aria-label="Toggle password visibility"
                  >
                    👁
                  </button>
                </div>
              </div>

              <div className="auth-row">
                <label className="auth-label">Confirm password</label>
                <input
                  className="auth-input"
                  type={show ? "text" : "password"}
                  value={p2}
                  onChange={(e) => setP2(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                />
              </div>

              <div className="auth-actions">
                <button className="btn btn-gold" type="submit" disabled={loading}>
                  {loading ? "Saving…" : "Update password"}
                </button>
                <Link className="btn btn-ghost" to="/login">Cancel</Link>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
