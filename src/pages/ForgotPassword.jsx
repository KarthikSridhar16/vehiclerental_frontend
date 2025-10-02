import { useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../api/auth";
import HeroShowcase from "../components/HeroShowcase";
import "../styles/auth.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);
    try {
      setLoading(true);
      await auth.forgot(email.trim());
      setOk(true);
    } catch (e) {
      setErr(e?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-bg">
      <HeroShowcase />
      <div className="auth-overlay">
        <form className="auth-card" onSubmit={onSubmit}>
          <h1 className="auth-title">Forgot password</h1>
          <div className="auth-sub">We’ll email you a link to reset your password.</div>

          {ok ? (
            <div className="auth-footnote" style={{textAlign:"left"}}>
              If an account exists for <strong>{email}</strong>, a reset link has been sent.
              Please check your inbox and spam folder.
              <div style={{ marginTop: 10 }}>
                <Link className="auth-link" to="/login">Back to login</Link>
              </div>
            </div>
          ) : (
            <>
              {err && <div className="auth-error">{err}</div>}

              <div className="auth-row">
                <label className="auth-label">Email</label>
                <input
                  className="auth-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  required
                />
              </div>

              <div className="auth-actions">
                <button className="btn btn-gold" type="submit" disabled={loading}>
                  {loading ? "Sending…" : "Send reset link"}
                </button>
                <Link to="/login" className="btn btn-ghost">Back to login</Link>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
