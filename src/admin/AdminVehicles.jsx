import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { adminVehicles } from "../api/admin";

function extractList(resp) {
  const d = resp?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.items)) return d.items;
  if (Array.isArray(d?.results)) return d.results;
  if (Array.isArray(d?.data?.items)) return d.data.items;
  return [];
}

export default function AdminVehicles() {
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();

  const q = sp.get("q") || "";
  const page = Number(sp.get("page") || 1);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await adminVehicles.list({ page, q, limit: 20 });
        const list = extractList(res);
        if (on) setRows(Array.isArray(list) ? list : []);
      } catch (e) {
        const status = e?.response?.status;
        if (status === 401 || status === 403) {
          navigate(`/login?redirect=${encodeURIComponent("/admin/vehicles")}`, { replace: true });
          return;
        }
        setErr(e?.response?.data?.message || e?.message || "Failed to load vehicles");
        setRows([]);
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
  }, [q, page, navigate]);

  const onDelete = async (id) => {
    if (!confirm("Delete this vehicle?")) return;
    try {
      await adminVehicles.remove(id);
      const res = await adminVehicles.list({ page, q, limit: 20 });
      setRows(extractList(res));
    } catch (e) {
      alert(e?.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="admin-vehicles space-y-4">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Vehicles</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <input
            className="border rounded px-3 py-2 w-full sm:w-72"
            placeholder="Search by make/model/location"
            value={q}
            onChange={(e) => setSp({ q: e.target.value, page: 1 })}
          />
          <Link
            to="/admin/vehicles/new"
            className="px-3 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 text-center"
          >
            + Add Vehicle
          </Link>
        </div>
      </header>

      {loading && <div>Loading…</div>}
      {!loading && err && (
        <div className="p-3 border rounded bg-red-50 text-red-700 text-sm">{String(err)}</div>
      )}

      {!loading && !err && rows.length === 0 && (
        <div className="text-gray-500">No vehicles found.</div>
      )}

      {!loading && !err && rows.length > 0 && (
        <>
          <div className="ab-scroll">
            <table className="w-full border text-sm">
              <thead className="bg-gray-50">
                <tr className="[&>th]:px-3 [&>th]:py-2 text-left">
                  <th>Make / Model</th>
                  <th>Year</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>₹/day</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="[&>tr>:is(td)]:px-3 [&>tr>:is(td)]:py-2">
                {rows.map((v) => {
                  const st = String(v.status || "active").toLowerCase();
                  return (
                    <tr key={v._id} className="border-t">
                      <td className="font-medium">{v.make} {v.model}</td>
                      <td>{v.year || "-"}</td>
                      <td className="capitalize">{v.type || "-"}</td>
                      <td>{v.location || "-"}</td>
                      <td>{v.pricePerDay ?? "-"}</td>
                      <td>
                        <span className={`status-pill ${st === "approved" || st === "active" ? "is-ok" : st === "inactive" ? "is-muted" : "is-warn"}`}>
                          {v.status || "active"}
                        </span>
                      </td>
                      <td>{v.updatedAt ? dayjs(v.updatedAt).format("DD MMM YYYY") : "-"}</td>
                      <td className="space-x-2 whitespace-nowrap">
                        <Link className="link-btn" to={`/admin/vehicles/${v._id}/edit`}>Edit</Link>
                        <button className="link-btn is-danger" onClick={() => onDelete(v._id)}>Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>


        </>
      )}
    </div>
  );
}
