import { useEffect, useMemo, useState } from "react";
import { adminBookings } from "../api/admin";
import dayjs from "dayjs";

function currency(n, c = "INR") {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: c }).format(Number(n || 0));
  } catch {
    return `₹${Number(n || 0).toFixed(2)}`;
  }
}

function extractItems(resp) {
  const d = resp?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.items)) return d.items;
  if (Array.isArray(d?.results)) return d.results;
  if (Array.isArray(d?.data)) return d.data;
  return [];
}

const STATUS_OPTIONS = ["pending", "confirmed", "cancelled", "failed", "completed"];

export default function AdminBookings() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState("createdAt,-start");

  const [total, setTotal] = useState(0);
  const [metrics, setMetrics] = useState(null);

  // status drafts + saving indicator
  const [draft, setDraft] = useState({});
  const [savingId, setSavingId] = useState(null);

  const params = useMemo(
    () => ({ page, limit, q, status, from, to, sort }),
    [page, limit, q, status, from, to, sort]
  );

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      const res = await adminBookings.list(params);
      const list = extractItems(res);
      setRows(list);
      setTotal(Number(res?.data?.total || list.length || 0));
      setMetrics(res?.data?.metrics || null);
      setDraft({});
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Failed to load bookings");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [params]);

  async function saveStatus(b) {
    const next = draft[b._id] ?? b.status;
    if (next === b.status) return;
    try {
      setSavingId(b._id);
      await adminBookings.update(b._id, { status: next });
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to update status");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="admin-bookings space-y-4">
      <h1 className="text-2xl font-semibold">Bookings</h1>

      {/* Summary */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card title="Total bookings" value={metrics?.all?.count ?? "—"} />
        <Card title="Confirmed" value={metrics?.confirmed?.count ?? 0} />
        <Card title="Pending" value={metrics?.pending?.count ?? 0} />
        <Card title="Revenue (confirmed)" value={currency(metrics?.revenue ?? 0)} />
      </div>

      {/* Filters (full-width on mobile so page never overflows) */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="min-w-[140px] w-full sm:w-auto">
          <label className="text-sm block mb-1">Search (user / vehicle / email)</label>
          <input
            className="border rounded px-3 py-2 w-full sm:w-64"
            value={q}
            onChange={e => { setQ(e.target.value); setPage(1); }}
          />
        </div>
        <div className="min-w-[140px] w-full sm:w-auto">
          <label className="text-sm block mb-1">Status</label>
          <select
            className="border rounded px-2 py-2 w-full sm:w-auto"
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1); }}
          >
            <option value="all">All</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="min-w-[140px] w-full sm:w-auto">
          <label className="text-sm block mb-1">From</label>
          <input
            type="date"
            className="border rounded px-2 py-2 w-full sm:w-auto"
            value={from}
            onChange={e => { setFrom(e.target.value); setPage(1); }}
          />
        </div>
        <div className="min-w-[140px] w-full sm:w-auto">
          <label className="text-sm block mb-1">To</label>
          <input
            type="date"
            className="border rounded px-2 py-2 w-full sm:w-auto"
            value={to}
            onChange={e => { setTo(e.target.value); setPage(1); }}
          />
        </div>
        <div className="min-w-[140px] w-full sm:w-auto">
          <label className="text-sm block mb-1">Sort</label>
          <select
            className="border rounded px-2 py-2 w-full sm:w-auto"
            value={sort}
            onChange={e => setSort(e.target.value)}
          >
            <option value="createdAt,-start">Newest</option>
            <option value="-createdAt">Oldest</option>
            <option value="start">Start ↑</option>
            <option value="-start">Start ↓</option>
            <option value="end">End ↑</option>
            <option value="-end">End ↓</option>
            <option value="amount">Amount ↑</option>
            <option value="-amount">Amount ↓</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading && <div>Loading…</div>}
      {!loading && err && <div className="p-3 border rounded bg-red-50 text-red-700 text-sm">{String(err)}</div>}
      {!loading && !err && rows.length === 0 && <div className="text-gray-500">No bookings found.</div>}

      {!loading && !err && rows.length > 0 && (
        <>
          {/* The ONLY horizontally scrollable element */}
          <div className="ab-scroll">
            <table className="w-full border text-sm">
              <thead className="bg-gray-50">
                <tr className="[&>th]:px-3 [&>th]:py-2 text-left">
                  <th>User</th>
                  <th>Email</th>
                  <th>Vehicle</th>
                  <th>Dates</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="[&>tr>:is(td)]:px-3 [&>tr>:is(td)]:py-2">
                {rows.map((b) => {
                  const val = draft[b._id] ?? b.status;
                  const dirty = val !== b.status;
                  return (
                    <tr key={b._id} className="border-t">
                      <td>{b.user?.name || "—"}</td>
                      <td className="text-gray-600">{b.user?.email || "—"}</td>
                      <td>{b.vehicle ? `${b.vehicle.make} ${b.vehicle.model}` : "—"}</td>
                      <td>
                        {b.start ? dayjs(b.start).format("DD/MM/YYYY") : "—"} →{" "}
                        {b.end ? dayjs(b.end).format("DD/MM/YYYY") : "—"}
                      </td>
                      <td>
                        <select
                          className="border rounded px-2 py-1"
                          value={val}
                          onChange={(e) => setDraft((d) => ({ ...d, [b._id]: e.target.value }))}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td>{currency(b.amount, b.currency)}</td>
                      <td>{b.createdAt ? dayjs(b.createdAt).format("DD MMM YYYY") : "—"}</td>
                      <td>
                        <button
                          disabled={!dirty || savingId === b._id}
                          onClick={() => saveStatus(b)}
                          className={`px-3 py-1.5 rounded border ${dirty ? "bg-emerald-600 text-white hover:bg-emerald-700" : "opacity-50 cursor-not-allowed"}`}
                        >
                          {savingId === b._id ? "Saving…" : "Update"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-3">
            <div className="text-sm text-gray-600">Total: {total}</div>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 rounded border disabled:opacity-50">Prev</button>
              <div className="px-2 py-1.5">Page {page}</div>
              <button disabled={rows.length < limit} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 rounded border disabled:opacity-50">Next</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="border rounded p-3">
      <div className="text-sm text-gray-600">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
