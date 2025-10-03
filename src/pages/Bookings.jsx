import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import dayjs from "dayjs";
import client from "../api/client";
import { getToken } from "../utils/session";
import "../styles/bookings.css";

const formatMoney = (v, cur = "INR") => {
  const n = Number(v || 0);
  try { return new Intl.NumberFormat("en-IN", { style: "currency", currency: cur }).format(n); }
  catch { return `₹${n.toLocaleString("en-IN")}`; }
};

const makeVehicleLabel = (b, vehiclesById) => {
  const viaBooking = b?.vehicle || {};
  const viaCache = vehiclesById[b?.vehicleId];
  const v = Object.keys(viaBooking).length ? viaBooking : viaCache || {};
  const make  = (v.make  || "").toString().trim();
  const model = (v.model || "").toString().trim();
  const year  = v.year ? ` (${v.year})` : "";
  const name = [make, model].filter(Boolean).join(" ");
  if (name) return name + year;
  const alt = (b?.vehicleTitle || b?.vehicleName || v?.name || "").toString().trim();
  return alt || "-";
};

const holdInfo = (b) => {
  const until = b?.pendingHoldUntil || (b?.createdAt ? dayjs(b.createdAt).add(15, "minute").toISOString() : null);
  if (!until) return { label: "-", expired: false };
  const ms = Math.max(0, dayjs(until).diff(dayjs(), "millisecond"));
  const mm = String(Math.floor(ms / 60000)).padStart(2, "0");
  const ss = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
  return { label: `${mm}:${ss}`, expired: ms === 0 };
};

const pickBookingsArray = (raw) => {
  if (Array.isArray(raw)) return raw;
  for (const k of ["data", "bookings", "results", "docs", "items", "list"]) {
    if (Array.isArray(raw?.[k])) return raw[k];
  }
  if (raw && typeof raw === "object") {
    for (const v of Object.values(raw)) if (Array.isArray(v)) return v;
  }
  return [];
};

function toast(message, ttl = 10000) {
  window.dispatchEvent(new CustomEvent("toast:show", { detail: { message, ttl } }));
}

function mailNotice(kind) {
  const base = "Heads up: we’re in dev mode. Emails can land in Spam — please check your Spam folder.";
  if (kind === "pending") return `${base} Your booking was created; payment email sent.`;
  if (kind === "confirmed") return `${base} Payment confirmed; confirmation email sent.`;
  if (kind === "reset") return `${base} Password reset email sent.`;
  return base;
}

export default function Bookings() {
  const loc = useLocation();

  const [rowsSrc, setRowsSrc] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vehiclesById, setVehiclesById] = useState({});
  const [myReviewsByVehicle, setMyReviewsByVehicle] = useState({});

  const [reviewOpen, setReviewOpen] = useState(false);
  const [activeBooking, setActiveBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [ratingOpen, setRatingOpen] = useState(false);
  const ratingRef = useRef(null);
  useEffect(() => {
    function onAway(e){ if(ratingRef.current && !ratingRef.current.contains(e.target)) setRatingOpen(false); }
    function onEsc(e){ if(e.key === "Escape") setRatingOpen(false); }
    document.addEventListener("mousedown", onAway);
    document.addEventListener("keydown", onEsc);
    return () => { document.removeEventListener("mousedown", onAway); document.removeEventListener("keydown", onEsc); };
  }, []);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsBooking, setDetailsBooking] = useState(null);

  const token = getToken();

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        setLoading(true);
        const res = await client.get("/bookings/me", {
          headers: { "Cache-Control": "no-store", "Pragma": "no-cache" }
        });
        const list = pickBookingsArray(res?.data);
        if (on) setRowsSrc(list);
      } catch {
        if (on) setRowsSrc([]);
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
  }, []);

  const rows = useMemo(() => {
    if (Array.isArray(rowsSrc)) return rowsSrc;
    if (Array.isArray(rowsSrc?.results)) return rowsSrc.results;
    if (Array.isArray(rowsSrc?.bookings)) return rowsSrc.bookings;
    if (Array.isArray(rowsSrc?.docs)) return rowsSrc.docs;
    return [];
  }, [rowsSrc]);

  function bHasVehicleObj(list, id) {
    const b = list.find((x) => x?.vehicleId === id);
    return !!(b && b.vehicle && (b.vehicle.make || b.vehicle.model || b.vehicle.name));
  }

  useEffect(() => {
    let on = true;
    const idsNeeded = [...new Set(rows.map((b) => b?.vehicleId).filter(Boolean).filter((id) => !vehiclesById[id] && !bHasVehicleObj(rows, id)))];
    if (idsNeeded.length === 0) return;
    (async () => {
      const results = await Promise.allSettled(idsNeeded.map((id) => client.get(`/vehicles/${id}`, { headers: { "Cache-Control": "no-store" } })));
      if (!on) return;
      const next = { ...vehiclesById };
      results.forEach((r) => {
        if (r.status === "fulfilled") {
          const data = r.value?.data?.data || r.value?.data || null;
          if (data && data._id) next[data._id] = data;
        }
      });
      setVehiclesById(next);
    })();
    return () => { on = false; };
  }, [rows]); 

  useEffect(() => {
    let on = true;
    if (!token || rows.length === 0) return;
    const vids = [...new Set(rows.map((b) => b?.vehicleId || b?.vehicle?._id).filter((x) => typeof x === "string" && x))];
    if (vids.length === 0) return;
    (async () => {
      try {
        const pairs = await Promise.all(
          vids.map(async (vid) => {
            try {
              const r = await client.get("/reviews/me", { params: { vehicleId: vid }, headers: { "Cache-Control": "no-store" } });
              return [vid, r?.data || null];
            } catch {
              return [vid, null];
            }
          })
        );
        if (on) setMyReviewsByVehicle(Object.fromEntries(pairs));
      } catch {}
    })();
    return () => { on = false; };
  }, [rows, token]);

  const now = dayjs();
  const canWrite = (b) => {
    const vid = b?.vehicleId || b?.vehicle?._id;
    const reviewed = !!myReviewsByVehicle[vid];
    const ended = dayjs(b?.end).isBefore(now.add(1, "minute"));
    return b?.status === "confirmed" && ended && !reviewed;
  };
  const reasonFor = (b) => {
    const vid = b?.vehicleId || b?.vehicle?._id;
    if (myReviewsByVehicle[vid]) return "You’ve already reviewed this vehicle";
    if (b?.status !== "confirmed") return "Only confirmed bookings can be reviewed";
    if (!dayjs(b?.end).isBefore(now.add(1, "minute"))) return "You can review after your rental ends";
    return "";
  };

  const openReview = (b) => { setActiveBooking(b); setRating(5); setComment(""); setReviewOpen(true); };
  const closeReview = () => { setReviewOpen(false); setActiveBooking(null); setSubmitting(false); setComment(""); setRating(5); };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!token || !activeBooking || submitting) return;
    const vehicleId = activeBooking?.vehicleId || activeBooking?.vehicle?._id;
    const payload = { vehicleId, rating: Number(rating), comment: comment?.trim(), bookingId: activeBooking?._id };
    try {
      setSubmitting(true);
      await client.post("/reviews", payload);
      setMyReviewsByVehicle((prev) => ({ ...prev, [vehicleId]: { _id: "created" } }));
      closeReview();
    } catch (err) {
      const api = err?.response?.data;
      if (api?.error === "ALREADY_REVIEWED") {
        setMyReviewsByVehicle((prev) => ({ ...prev, [vehicleId]: { _id: "exists" } }));
        closeReview();
        return;
      }
      alert(api?.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const openDetails = (b) => { setDetailsBooking(b); setDetailsOpen(true); };
  const closeDetails = () => { setDetailsOpen(false); setDetailsBooking(null); };

  useEffect(() => {
    const params = new URLSearchParams(loc.search || "");
    const kind = params.get("mail") || params.get("notice");
    if (!kind) return;
    toast(mailNotice(kind), 10000);
    params.delete("mail"); params.delete("notice");
    const qs = params.toString();
    window.history.replaceState({}, "", loc.pathname + (qs ? `?${qs}` : ""));
  }, [loc.search, loc.pathname]);

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="bk-wrap max-w-5xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-semibold mb-4">Your Bookings</h1>
      <div className="overflow-x-auto rounded border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Vehicle</th>
              <th className="p-3 text-left">Dates</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Amount</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-gray-500">No bookings yet.</td>
              </tr>
            ) : (
              rows.map((b) => {
                const vid = b?.vehicleId || b?.vehicle?._id;
                const reviewed = !!myReviewsByVehicle[vid];
                const label = makeVehicleLabel(b, vehiclesById);
                return (
                  <tr key={b?._id} className="border-t">
                    <td className="p-3">
                      <span className="inline-block max-w-[240px] truncate" title={label}>{label}</span>
                    </td>
                    <td className="p-3">
                      {dayjs(b?.start).format("D/M/YYYY, h:mm:ss a")} → {dayjs(b?.end).format("D/M/YYYY, h:mm:ss a")}
                    </td>
                    <td className="p-3">
                      <span className={
                        b?.status === "confirmed" ? "text-emerald-600" :
                        b?.status === "pending"   ? "text-amber-600"   : "text-gray-600"
                      }>
                        {b?.status}
                      </span>
                    </td>
                    <td className="p-3">{formatMoney(b?.price?.total, b?.price?.currency || "INR")}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <button className="px-3 py-1 border rounded" onClick={() => openDetails(b)}>Details</button>
                        <button
                          className={`px-3 py-1 border rounded ${canWrite(b) ? "hover:bg-gray-50" : "opacity-50 cursor-not-allowed"}`}
                          onClick={() => canWrite(b) && openReview(b)}
                          disabled={!canWrite(b)}
                          title={canWrite(b) ? "Write a review" : reasonFor(b)}
                        >
                          {reviewed ? "Review submitted" : "Write review"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {detailsOpen && detailsBooking && (
        <div className="bk-modal fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-[560px] max-w-[95vw] shadow-lg border border-white/20">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h3 className="font-semibold">Booking details</h3>
              <button className="text-gray-400 hover:text-gray-600" onClick={closeDetails}>✕</button>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <Row label="Vehicle" value={makeVehicleLabel(detailsBooking, vehiclesById)} />
              <Row label="Status" value={
                <span className={
                  detailsBooking.status === "confirmed" ? "text-emerald-600" :
                  detailsBooking.status === "pending"   ? "text-amber-600"   : "text-gray-600"
                }>
                  {detailsBooking.status}
                </span>
              } />
              <Row label="Dates" value={<>
                {dayjs(detailsBooking.start).format("DD MMM YYYY, hh:mm a")} <span className="opacity-60">→</span> {dayjs(detailsBooking.end).format("DD MMM YYYY, hh:mm a")}
              </>} />
              <Row label="Amount" value={formatMoney(detailsBooking?.price?.total, detailsBooking?.price?.currency || "INR")} />
              {detailsBooking.status === "pending" && (
                <div className="mt-2 p-3 rounded-lg border border-white/10 bg-white/[.04]">
                  {(() => {
                    const { label, expired } = holdInfo(detailsBooking);
                    return <Row label="Hold time left" value={<span className={expired ? "text-red-600" : "text-amber-600"}>{expired ? "Expired" : label}</span>} />;
                  })()}
                </div>
              )}
              {detailsBooking?.payment?.orderId && <Row label="Order ID" value={<code className="text-xs">{detailsBooking.payment.orderId}</code>} />}
              {detailsBooking?.payment?.paymentId && <Row label="Payment ID" value={<code className="text-xs">{detailsBooking.payment.paymentId}</code>} />}
            </div>
            <div className="px-4 pb-4 pt-2 flex justify-end">
              <button className="px-4 py-2 border rounded" onClick={closeDetails}>Close</button>
            </div>
          </div>
        </div>
      )}

      {reviewOpen && activeBooking && (
        <div className="bk-modal fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="rv-card rounded-xl w-[520px] max-w-[95vw] shadow-2xl">
            <div className="rv-head flex items-center justify-between px-5 py-4">
              <h3 className="rv-title font-semibold">Write a review</h3>
              <button className="rv-close" onClick={closeReview} aria-label="Close">✕</button>
            </div>
            <form onSubmit={submitReview} className="rv-body space-y-5">
              <div className="rv-field" ref={ratingRef}>
                <label className="rv-label">Rating</label>
                <div className="rv-dd" data-open={ratingOpen || undefined}>
                  <button
                    type="button"
                    className="rv-input rv-dd-trigger"
                    onClick={() => !submitting && setRatingOpen((v) => !v)}
                    aria-haspopup="listbox"
                    aria-expanded={ratingOpen}
                    aria-label="Choose rating"
                    disabled={submitting}
                  >
                    <span>{rating} ★</span>
                    <span className="rv-caret">▾</span>
                  </button>
                  {ratingOpen && (
                    <div className="rv-menu" role="listbox">
                      {[5, 4, 3, 2, 1].map((r) => (
                        <button
                          key={r}
                          type="button"
                          role="option"
                          aria-selected={String(r) === String(rating)}
                          className={`rv-option ${String(r) === String(rating) ? "is-active" : ""}`}
                          onClick={() => { setRating(r); setRatingOpen(false); }}
                          disabled={submitting}
                        >
                          {r} ★
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="rv-field">
                <label className="rv-label">Your review</label>
                <textarea
                  className="rv-textarea"
                  placeholder="Share your experience…"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  disabled={submitting}
                  maxLength={2000}
                />
              </div>
              <div className="rv-actions">
                <button type="button" className="btn-ghost" onClick={closeReview} disabled={submitting}>Cancel</button>
                <button type="submit" className={`btn-primary ${submitting ? "is-loading" : ""}`} disabled={submitting}>
                  {submitting ? "Submitting…" : "Submit review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="text-gray-500">{label}</div>
      <div className="text-right">{value}</div>
    </div>
  );
}
