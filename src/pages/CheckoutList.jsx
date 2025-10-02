import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "../styles/checkout.css";

const API = (import.meta.env.VITE_API || "http://localhost:8099").replace(/\/$/, "");

function rupees(n) {
  const v = Number(n || 0);
  return v.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
}

export default function CheckoutList() {
  const nav = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const token = localStorage.getItem("token") || "";
        const res = await fetch(`${API}/bookings/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) {
          const text = await res.text();
          throw new Error(`Non-JSON response (${res.status}). First bytes: ${text.slice(0, 60)}`);
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to load");
        if (on) setRows(Array.isArray(data?.data) ? data.data : []);
      } catch (e) {
        if (on) setErr(e.message || "Failed to load");
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => (on = false);
  }, []);

  const current = useMemo(() => {
    const now = Date.now();
    const pendings = rows
      .filter((b) => b?.status === "pending")
      .filter((b) => !b.pendingHoldUntil || new Date(b.pendingHoldUntil).getTime() > now)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return pendings[0] || null;
  }, [rows]);

  const handlePayNow = (id) => nav(`/checkout/${id}?pay=1`);

  return (
    <div className="co-wrap">
      <h1 className="co-title text-2xl">Pending checkout</h1>

      {loading && <div className="co-empty">Loading…</div>}
      {!loading && err && <div className="co-card co-muted">{err}</div>}

      {!loading && !err && !current && (
        <div className="co-empty">You have no pending checkout right now.</div>
      )}

      {!loading && !err && current && (
        <div className="co-card">
          <div className="co-row">
            <div>
              <div className="co-ink" style={{ fontWeight: 700 }}>
                Booking <span className="co-muted" style={{ fontWeight: 500 }}>{current._id}</span>
              </div>
              <div className="co-muted" style={{ marginTop: 4 }}>
                {dayjs(current.start).format("DD MMM")} → {dayjs(current.end).format("DD MMM YYYY")}
                {" • "}
                {rupees(current?.price?.total)}
                {current.pendingHoldUntil
                  ? ` • hold until ${dayjs(current.pendingHoldUntil).format("hh:mm a")}`
                  : ""}
              </div>
            </div>

            <div className="co-row" style={{ gap: 8 }}>
              <Link to={`/checkout/${current._id}`} className="co-btn co-btn--ghost">Open</Link>
              <button onClick={() => handlePayNow(current._id)} className="co-btn co-btn--pay">
                Pay now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
