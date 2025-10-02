import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import dayjs from "dayjs";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import "../styles/vehicle-detail.css";

const API = (
  import.meta.env.VITE_API_BASE?.trim() ||
  import.meta.env.VITE_API?.trim() ||
  "https://myvehiclerental-backend.onrender.com"
).replace(/\/$/, "");

async function getJSON(url, opts) {
  const res = await fetch(url, opts);
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const text = await res.text();
    throw new Error(`Server returned non-JSON (${res.status} ${res.statusText}). First bytes: ${text.slice(0, 60)}`);
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Request failed");
  return data;
}

function rupees(n) {
  const v = Number(n || 0);
  return v.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
}

function fmtRangeLabel(range) {
  if (!range?.from || !range?.to) return "Select dates";
  const f = dayjs(range.from), t = dayjs(range.to);
  return f.format("DD MMM") + " → " + t.format("DD MMM YYYY");
}

function useClickAway(ref, onAway) {
  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) onAway?.(); }
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [onAway, ref]);
}

function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

function buildMaps({ lat, lng, address = "" }) {
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  const q = hasCoords ? `${lat},${lng}` : encodeURIComponent((address || "").trim());
  return {
    directions: `https://www.google.com/maps/dir/?api=1&destination=${q}`,
    embed: `https://www.google.com/maps?q=${q}&z=15&output=embed`,
  };
}

const TIME_OPTS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  const m = i % 2 ? "30" : "00";
  return `${h}:${m}`;
});

export default function VehicleDetail() {
  const { id } = useParams();

  const [v, setV] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [idx, setIdx] = useState(0);

  const [range, setRange] = useState({
    from: dayjs().toDate(),
    to: dayjs().add(1, "day").toDate(),
  });
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("09:00");

  const [blocked, setBlocked] = useState([]);
  const [blockedLoading, setBlockedLoading] = useState(true);

  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState(null);

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getJSON(`${API}/vehicles/${id}`);
        if (on) setV(data?.data || data);
      } catch (e) {
        if (on) setErr(e.message || "Failed to load");
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
  }, [id]);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        setBlockedLoading(true);
        const data = await getJSON(`${API}/vehicles/${id}/blocked`);
        const list = Array.isArray(data?.data) ? data.data : [];
        if (!on) return;
        setBlocked(list.map(r => ({ from: new Date(r.from), to: new Date(r.to) })));
      } catch {
        if (on) setBlocked([]);
      } finally {
        if (on) setBlockedLoading(false);
      }
    })();
    return () => { on = false; };
  }, [id]);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        setReviewsLoading(true);
        try {
          const d1 = await getJSON(`${API}/vehicles/${id}/reviews`);
          const list1 = Array.isArray(d1?.data) ? d1.data : Array.isArray(d1) ? d1 : [];
          if (on) { setReviews(list1); return; }
        } catch {
          try {
            const d2 = await getJSON(`${API}/reviews?vehicleId=${id}&status=approved`);
            const list2 = Array.isArray(d2?.data) ? d2.data : Array.isArray(d2) ? d2 : [];
            if (on) setReviews(list2);
          } catch {
            if (on) setReviews([]);
          }
        }
      } finally {
        if (on) setReviewsLoading(false);
      }
    })();
    return () => { on = false; };
  }, [id]);

  const startISO = useMemo(() => {
    if (!range?.from) return null;
    const [h, m] = (startTime || "10:00").split(":").map(Number);
    const d = new Date(range.from);
    d.setHours(h || 0, m || 0, 0, 0);
    return d.toISOString();
  }, [range?.from, startTime]);

  const endISO = useMemo(() => {
    if (!range?.to) return null;
    const [h, m] = (endTime || "09:00").split(":").map(Number);
    const d = new Date(range.to);
    d.setHours(h || 0, m || 0, 0, 0);
    return d.toISOString();
  }, [range?.to, endTime]);

  useEffect(() => {
    if (startISO && endISO) {
      const s = dayjs(startISO);
      const e = dayjs(endISO);
      if (e.valueOf() < s.valueOf()) {
        const newTo = dayjs(range.from).add(1, "day").toDate();
        setRange(r => ({ ...r, to: newTo }));
        setEndTime(startTime);
      }
    }
  }, [startISO, endISO]);

  const estimated = useMemo(() => {
    if (!v?.pricePerDay || !startISO || !endISO) return 0;
    const s = dayjs(startISO);
    const e = dayjs(endISO);
    let days = e.diff(s, "day", true);
    if (!isFinite(days) || days <= 0) days = 1;
    return Math.ceil(days) * Number(v.pricePerDay);
  }, [v, startISO, endISO]);

  const disabledDays = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return [{ before: today }, ...blocked];
  }, [blocked]);

  const [openCal, setOpenCal] = useState(false);
  const calRef = useRef(null);
  useClickAway(calRef, () => setOpenCal(false));

  const [openStart, setOpenStart] = useState(false);
  const startRef = useRef(null);
  useClickAway(startRef, () => setOpenStart(false));

  const [openEnd, setOpenEnd] = useState(false);
  const endRef = useRef(null);
  useClickAway(endRef, () => setOpenEnd(false));

  async function onCreateBooking(e) {
    e.preventDefault();
    setCreateErr(null);

    if (!startISO || !endISO) {
      setCreateErr("Please choose a start and end date.");
      return;
    }
    const s = dayjs(startISO);
    const eT = dayjs(endISO);
    if (eT.valueOf() <= s.valueOf()) {
      setCreateErr("End must be after start.");
      return;
    }

    const token = getToken();
    if (!token) {
      window.location = "/login?redirect=" + encodeURIComponent(window.location.pathname);
      return;
    }

    try {
      setCreating(true);
      const d = await getJSON(`${API}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ vehicleId: id, start: startISO, end: endISO }),
      });
      const bid = d?.data?._id || d?._id;
      window.location = `/checkout/${bid}`;
    } catch (e2) {
      setCreateErr(e2.message || "Failed to create booking");
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <div>Loading…</div>;
  if (err) return <div className="p-3 border rounded bg-red-50 text-red-700">{err}</div>;
  if (!v) return null;

  const images = Array.isArray(v.images) && v.images.length ? v.images : ["/no-image.png"];

  const depot = v.depot || null;
  const maps = buildMaps({
    lat: Number(depot?.lat),
    lng: Number(depot?.lng),
    address: depot?.address || v.location || "",
  });

  return (
    <div className="container-xl py-6 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-[Cinzel] tracking-wide">
          {v.make} {v.model} {v.year ? `(${v.year})` : ""}
        </h1>
        <div className="muted">
          {v.type || "vehicle"} • {v.city || v.location || "-"} • {rupees(v.pricePerDay)}/day
        </div>
      </header>

      <div className="vd-grid">
        <section className="vd-media">
          <div className="vd-hero">
            <img src={images[idx]} alt={`${v.make} ${v.model}`} className="vd-hero-img" />
          </div>

          {images.length > 1 && (
            <div className="vd-thumbs">
              {images.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  className={`thumb ${i === idx ? "active" : ""}`}
                  onClick={() => setIdx(i)}
                  aria-label={`Image ${i + 1}`}
                >
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          )}

          {v.description && (
            <section className="space-y-2 mt-6">
              <h2 className="text-xl font-semibold">Description</h2>
              <p className="text-gray-200/90">{v.description}</p>
            </section>
          )}
        </section>

        <aside className="vd-book">
          <h3 className="text-lg font-semibold mb-3">Book this vehicle</h3>

          <div className="space-y-3">
            <div className="relative" ref={calRef}>
              <button
                type="button"
                onClick={() => setOpenCal(v => !v)}
                className="glass-input flex items-center justify-between"
                aria-haspopup="dialog"
                aria-expanded={openCal}
              >
                <span className="truncate">{fmtRangeLabel(range)}</span>
                <span className="text-gold-500">Calendar</span>
              </button>

              {openCal && (
                <div className="popover">
                  <DayPicker
                    className="vd-daypicker"
                    mode="range"
                    selected={range}
                    onSelect={(r) => setRange(r || { from: undefined, to: undefined })}
                    disabled={disabledDays}
                    numberOfMonths={1}
                    fixedWeeks
                    showOutsideDays
                    captionLayout="dropdown"
                  />
                  <div className="flex justify-end gap-2 px-1 pb-1">
                    <button className="btn-outline" onClick={() => setOpenCal(false)}>Done</button>
                  </div>
                  {blockedLoading && (
                    <div className="px-2 pb-2 text-xs text-gray-400">Loading availability…</div>
                  )}
                </div>
              )}
            </div>

            <div className="relative" ref={startRef}>
              <button
                type="button"
                onClick={() => setOpenStart(v => !v)}
                className="glass-input flex items-center justify-between"
                aria-haspopup="listbox"
                aria-expanded={openStart}
              >
                <span>Start: {startTime}</span>
                <span className="text-gold-500">Select</span>
              </button>
              {openStart && (
                <div className="popover w-full max-h-64 overflow-auto">
                  {TIME_OPTS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`w-full text-left px-3 py-2 rounded hover:bg-white/5 ${t===startTime ? "bg-white/10" : ""}`}
                      onClick={() => { setStartTime(t); setOpenStart(false); }}
                      role="option"
                      aria-selected={t===startTime}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative" ref={endRef}>
              <button
                type="button"
                onClick={() => setOpenEnd(v => !v)}
                className="glass-input flex items-center justify-between"
                aria-haspopup="listbox"
                aria-expanded={openEnd}
              >
                <span>End: {endTime}</span>
                <span className="text-gold-500">Select</span>
              </button>
              {openEnd && (
                <div className="popover w-full max-h-64 overflow-auto">
                  {TIME_OPTS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`w-full text-left px-3 py-2 rounded hover:bg-white/5 ${t===endTime ? "bg-white/10" : ""}`}
                      onClick={() => { setEndTime(t); setOpenEnd(false); }}
                      role="option"
                      aria-selected={t===endTime}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 mt-4">
            <div className="text-gray-200">
              Estimated total (rounded to full days): <strong>{rupees(estimated)}</strong>
            </div>

            {createErr && (
              <div className="p-2 rounded bg-red-500/10 text-red-300 text-sm border border-red-500/30">
                {createErr}
              </div>
            )}

            <button
              type="button"
              onClick={onCreateBooking}
              className="btn btn-book w-full"
              disabled={creating}
            >
              {creating ? "Creating…" : "Create booking"}
            </button>

            <div className="text-xs text-gray-400">
              Pricing is per day; partial days are rounded up.
            </div>
          </div>

          <section className="space-y-3 mt-8">
            <h2 className="text-lg font-semibold">Pickup location</h2>
            <div className="map-card">
              <div className="map-meta">
                <div className="font-medium">{depot?.name || "Depot pickup"}</div>
                <div className="text-gray-300/90">
                  {[depot?.address, depot?.city || v.city].filter(Boolean).join(", ") || v.location || "—"}
                </div>
                {(depot?.hours || depot?.phone) && (
                  <div className="text-gray-400 text-sm mt-1">
                    {depot?.hours ? <>Hours: {depot.hours}</> : null}
                    {depot?.hours && depot?.phone ? " • " : null}
                    {depot?.phone ? <>Phone: {depot.phone}</> : null}
                  </div>
                )}
                <a className="btn btn-map mt-3 inline-block" href={maps.directions} target="_blank" rel="noreferrer">
                  Open in Google Maps
                </a>
              </div>
              <div className="map-embed-wrap">
                <iframe
                  title="Pickup location map"
                  className="map-embed"
                  src={maps.embed}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </section>
        </aside>
      </div>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold">Reviews</h3>
        {reviewsLoading && <div>Loading reviews…</div>}
        {!reviewsLoading && reviews.length === 0 && (
          <div className="text-gray-400">No reviews yet.</div>
        )}
        {!reviewsLoading && reviews.length > 0 && reviews.map((r) => (
          <article
            key={r._id}
            className="border border-white/10 rounded px-4 py-3 flex items-start justify-between bg-white/[.03]"
          >
            <div>
              <div className="font-medium">{r.userName || r.user?.name || "User"}</div>
              {r.comment && <div className="text-gray-200 mt-1">{r.comment}</div>}
              <div className="text-xs text-gray-400 mt-1">
                {r.createdAt ? dayjs(r.createdAt).format("DD MMM YYYY") : ""}
              </div>
            </div>
            <div className="text-sm text-gray-200">
              <span className="inline-block mr-1">⭐</span>{r.rating}/5
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
