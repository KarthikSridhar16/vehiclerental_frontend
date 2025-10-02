import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { adminReviews } from "../api/admin";

const tabs = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

function extractList(resp) {
  const d = resp?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.items)) return d.items;
  if (Array.isArray(d?.results)) return d.results;
  if (Array.isArray(d?.data?.items)) return d.data.items;
  return [];
}

export default function AdminReviews() {
  const [status, setStatus] = useState("pending");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      const params = status === "all" ? {} : { status };
      const res = await adminReviews.list(params);
      setRows(extractList(res));
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Failed to load reviews");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status]);

  const act = async (id, next) => {
    try {
      setBusyId(id);
      await adminReviews.update(id, { status: next });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const del = async (id) => {
    if (!confirm("Delete this review?")) return;
    try {
      setBusyId(id);
      await adminReviews.remove(id);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="admin-reviews space-y-4">
      <h1 className="admin-title">Reviews</h1>

      {/* Tabs */}
      <div className="rv-tabs" role="tablist" aria-label="Review filters">
        {tabs.map(t => (
          <button
            key={t.key}
            role="tab"
            aria-selected={status === t.key}
            className={`rv-tab ${status === t.key ? "is-active" : ""}`}
            onClick={() => setStatus(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div>Loading…</div>}
      {!loading && err && (
        <div className="form-alert">{String(err)}</div>
      )}
      {!loading && !err && rows.length === 0 && (
        <div className="text-gray-500">No reviews.</div>
      )}

      {!loading && !err && rows.length > 0 && (
        <div className="space-y-3">
          {rows.map(rv => {
            const st = String(rv.status || "approved").toLowerCase();
            const rating = Number(rv.rating || 0);
            const w = Math.max(0, Math.min(100, (rating / 5) * 100));

            return (
              <div key={rv._id} className="rv-card">
                <div className="rv-card-head">
                  <div className="rv-head-left">
                    <div className="rv-user">{rv.user?.name || "User"}</div>
                    <div className="rv-stars" aria-label={`Rating ${rating} out of 5`}>
                      <div className="rv-stars-fill" style={{ width: `${w}%` }} />
                    </div>
                    <div className="rv-rating-num">{rating}/5</div>
                  </div>
                  <span className={`rv-status ${
                    st === "approved" ? "is-ok" : st === "pending" ? "is-warn" : "is-bad"
                  }`}>{rv.status || "approved"}</span>
                </div>

                {rv.comment && <p className="rv-comment">{rv.comment}</p>}

                <div className="rv-meta">
                  {rv.createdAt ? dayjs(rv.createdAt).format("DD MMM YYYY") : "-"}
                  {rv.vehicle?.make ? <> · Vehicle: {rv.vehicle.make}</> : null}
                </div>

                <div className="rv-actions">
                  <button
                    onClick={() => act(rv._id, "approved")}
                    className="rv-btn rv-btn-approve"
                    disabled={busyId === rv._id || st === "approved"}
                  >
                    {busyId === rv._id ? "Working…" : "Approve"}
                  </button>
                  <button
                    onClick={() => act(rv._id, "rejected")}
                    className="rv-btn rv-btn-reject"
                    disabled={busyId === rv._id || st === "rejected"}
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => del(rv._id)}
                    className="rv-btn rv-btn-delete"
                    disabled={busyId === rv._id}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
