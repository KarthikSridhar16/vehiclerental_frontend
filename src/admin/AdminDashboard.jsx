import { useEffect, useMemo, useState } from "react";
import { adminBookings, adminVehicles } from "../api/admin";
import api from "../api/client";              
import dayjs from "dayjs";
import BookingsTrend from "./BookingsTrend";


const pick = (obj, keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; };
const fmt  = (dt) => (dt?.isValid?.() ? dt.format("D MMM, HH:mm") : "—");

function normalizeBooking(raw) {
  const startStr = pick(raw, ["start","from","startAt","startDate","pickupAt","pickup","fromDate"]);
  const endStr   = pick(raw, ["end","to","endAt","endDate","dropoffAt","dropoff","toDate"]);
  const created  = pick(raw, ["createdAt","created_on","created"]);
  const updated  = pick(raw, ["updatedAt","updated_on","updated"]);
  const status   = String(pick(raw, ["status","state"]) || "").toLowerCase();
  const v        = pick(raw, ["vehicle","vehicleId"]) ?? pick(raw, ["car","bike"]);
  const vehicleId = typeof v === "object" ? (v?._id || v?.id) : v;

  return {
    raw,
    start: startStr ? dayjs(startStr) : null,
    end:   endStr   ? dayjs(endStr)   : null,
    createdAt: created ? dayjs(created) : null,
    updatedAt: updated ? dayjs(updated) : null,
    status,
    vehicleId: vehicleId ? String(vehicleId) : null,
  };
}

function vehicleLabel(raw) {
  const v = raw?.vehicle ?? raw?.car ?? raw?.bike;
  if (typeof v === "string") return v;
  if (v && typeof v === "object") return v.name || v.model || v.title || v.make || v._id || v.id || "Vehicle";
  return "Vehicle";
}
function userLabel(raw) {
  const u = raw?.user || raw?.customer;
  if (!u) return raw?.email || raw?.name || "—";
  if (typeof u === "string") return u;
  return u.name || u.email || u._id || u.id || "—";
}

export default function AdminDashboard() {
  const [rows, setRows] = useState([]);
  const [fleetCount, setFleetCount] = useState(0);  
  const [loading, setLoading] = useState(true);
  const [panel, setPanel] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [br, vr] = await Promise.all([
          adminBookings.list({ limit: 500, sort: "-createdAt" }),
          adminVehicles.list({ limit: 500 }),
        ]);

        
        const bRaw = br?.data?.items ?? br?.data?.data ?? [];
        const bArr = Array.isArray(bRaw) ? bRaw : (Array.isArray(bRaw?.items) ? bRaw.items : []);
        if (alive) setRows(bArr.map(normalizeBooking));

        
        let vRaw = vr?.data?.items ?? vr?.data?.data ?? vr?.data?.vehicles ?? [];
        let vArr = Array.isArray(vRaw) ? vRaw : (Array.isArray(vRaw?.items) ? vRaw.items : []);
        let count = Array.isArray(vArr) ? vArr.length : 0;

       
        if (!count) {
          try {
            
            const pr = await api.get("/vehicles", { params: { limit: 1 } });
            const fromCount = pr?.data?.count;
            if (typeof fromCount === "number") {
              count = fromCount;
            } else {
              
              const pr2 = await api.get("/vehicles", { params: { limit: 1000 } });
              const arr = pr2?.data?.data ?? pr2?.data?.items ?? [];
              count = Array.isArray(arr) ? arr.length : 0;
            }
          } catch {
            
          }
        }
        if (alive) setFleetCount(count);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const now = dayjs();
  const todayStart = now.startOf("day");

  const metrics = useMemo(() => {
    const isCancelled     = (s) => ["cancelled","canceled"].includes(s);
    const isConfirmedLike = (s) => ["confirmed","paid","active"].includes(s) || s === "";

    const today = rows.filter(x => x.createdAt && x.createdAt.isAfter(todayStart));


    const inProgress = rows.filter(x =>
      x.start && x.end && isConfirmedLike(x.status) &&
      x.start.isBefore(now) && x.end.isAfter(now)
    );

    const upcoming = rows.filter(x =>
      x.start && isConfirmedLike(x.status) && !isCancelled(x.status) &&
      x.start.isAfter(now)
    );

    const completedToday = rows.filter(x => {
      const endedToday   = x.end && x.end.isBefore(now) && x.end.isAfter(todayStart);
      const updatedToday = x.updatedAt && x.updatedAt.isAfter(todayStart);
      return x.status === "completed" ? (updatedToday || endedToday) : endedToday;
    });

    const activeNowRows = rows.filter(x =>
      x.start && x.end && isConfirmedLike(x.status) &&
      x.start.isBefore(now) && x.end.isAfter(now)
    );
    const activeVehicles = Array.from(new Set(activeNowRows.map(x => x.vehicleId).filter(Boolean)));

    return {
      today, inProgress, upcoming, completedToday,
      activeNowRows, activeVehicles,
      fleetSize: fleetCount,
      availableNow: Math.max(0, fleetCount - activeVehicles.length),
    };
  }, [rows, fleetCount, now, todayStart]);

  if (loading) return <div className="admin-main">Loading…</div>;

  const tiles = [
    { key: "today",     label: "Bookings Today", value: metrics.today.length,           list: metrics.today },
    { key: "progress",  label: "In Progress Now", value: metrics.inProgress.length,     list: metrics.inProgress },
    { key: "upcoming",  label: "Upcoming",         value: metrics.upcoming.length,       list: metrics.upcoming },
    { key: "completed", label: "Completed Today",  value: metrics.completedToday.length, list: metrics.completedToday },
    { key: "active",    label: "Vehicles Active",  value: metrics.activeVehicles.length, list: metrics.activeNowRows },
    { key: "fleet",     label: "Fleet Size",       value: metrics.fleetSize,             list: [] },
  ];

  const current = tiles.find(t => t.key === panel);

  return (
    <div className="admin-main">
      <h1 className="admin-title">Dashboard</h1>

      <div className="admin-stats">
        {tiles.map(t => (
          <button
            key={t.key}
            type="button"
            className="admin-stat is-clickable"
            onClick={() => t.key !== "fleet" && setPanel(t.key)}
            title={t.key === "fleet" ? "Total vehicles in fleet" : "Click to view list"}
          >
            <div className="admin-stat-value">{t.value}</div>
            <div className="admin-stat-label">{t.label}</div>
          </button>
        ))}
      </div>

      {current && current.key !== "fleet" && (
        <div className="admin-panel" role="dialog" aria-labelledby="admin-panel-title">
          <div className="admin-panel-head">
            <div id="admin-panel-title" className="admin-panel-title">
              {current.label} <span className="admin-panel-count">({current.list.length})</span>
            </div>
            <div className="admin-panel-actions">
              <button className="btn btn-ghost" onClick={() => setPanel(null)}>Close</button>
              <a className="btn btn-gold" href="/admin/bookings">Open Bookings</a>
            </div>
          </div>

          <div className="admin-panel-body">
            {current.list.length === 0 ? (
              <div className="muted">No records.</div>
            ) : (
              <div className="table-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Vehicle</th>
                      <th>Start</th>
                      <th>End</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {current.list.slice(0, 50).map((x, i) => (
                      <tr key={x.raw?._id || x.raw?.id || i}>
                        <td>{userLabel(x.raw)}</td>
                        <td>{vehicleLabel(x.raw)}</td>
                        <td>{fmt(x.start)}</td>
                        <td>{fmt(x.end)}</td>
                        <td className="caps">{x.status || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      <BookingsTrend rows={rows} />
      <div className="hr-gold mt-6" />
    </div>
  );
}
