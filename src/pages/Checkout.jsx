import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import client from "../api/client";
import { payments } from "../api/payments";
import "../styles/checkout.css";

function useCountdown(deadlineIso) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const msLeft = useMemo(() => {
    if (!deadlineIso) return 0;
    return Math.max(0, new Date(deadlineIso).getTime() - now);
  }, [deadlineIso, now]);
  const mm = Math.floor(msLeft / 60000);
  const ss = Math.floor((msLeft % 60000) / 1000);
  return { msLeft, label: `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}` };
}

async function ensureRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = resolve;
    s.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(s);
  });
}

export default function Checkout() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        // Try direct lookup
        let b;
        try {
          const res = await client.get(`/bookings/${bookingId}`);
          b = res.data?.data || res.data;
        } catch (e) {
          // Fallback to my list
          const listRes = await client.get("/bookings/me");
          const arr = listRes.data?.data || listRes.data || [];
          b = arr.find((x) => String(x._id) === String(bookingId));
          if (!b) throw e;
        }
        setBooking(b);
      } catch (e) {
        setErr(e?.response?.data?.message || "Failed to load booking");
      } finally {
        setLoading(false);
      }
    })();
  }, [bookingId]);

  const deadline = useMemo(() => {
    if (booking?.pendingHoldUntil) return booking.pendingHoldUntil;
    if (booking?.createdAt) return dayjs(booking.createdAt).add(15, "minute").toISOString();
    return null;
  }, [booking]);

  const { msLeft, label } = useCountdown(deadline);
  const expired = booking?.status === "failed" || (msLeft <= 0 && booking?.status === "pending");

  const onPay = async () => {
    if (!booking || expired) return;
    try {
      setPaying(true);
      const orderRes = await payments.order(booking._id);
      const { keyId, order } = orderRes.data;

      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: "VehicleRent",
        description: "Booking payment",
        order_id: order.id,
        handler: async (resp) => {
          try {
            await payments.verify({
              bookingId: booking._id,
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            });
            navigate("/checkout-list");
          } catch (e) {
            const code = e?.response?.data?.error;
            if (code === "BOOKING_EXPIRED") {
              alert("Booking hold expired. Please try a new booking.");
            } else {
              alert(e?.response?.data?.message || "Payment verification failed");
            }
          }
        },
        modal: { ondismiss: () => setPaying(false) },
        theme: { color: "#10b981" },
      };

      await ensureRazorpay();
      const rz = new window.Razorpay(options);
      rz.open();
    } catch (e) {
      const code = e?.response?.data?.error;
      if (code === "BOOKING_EXPIRED") {
        alert("Booking hold expired. Please try a new booking.");
      } else {
        alert(e?.response?.data?.message || "Unable to start payment");
      }
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div className="co-wrap co-empty">Loading…</div>;
  if (err)     return <div className="co-wrap co-card co-muted">{err}</div>;
  if (!booking) return <div className="co-wrap co-empty">Booking not found</div>;

  return (
    <div className="co-wrap">
      <h1 className="co-title text-2xl">Checkout</h1>

      <div className="co-card co-stack">
        <div className="co-kv">
          <div className="co-muted">Booking</div>
          <div className="co-ink">{booking._id}</div>

          <div className="co-muted">Status</div>
          <div className="co-ink">{booking.status}</div>

          <div className="co-muted">Amount</div>
          <div className="co-ink">₹{booking?.price?.total ?? "-"}</div>

          {booking.status === "pending" && (
            <>
              <div className="co-muted">Hold time left</div>
              <div className="co-ink">
                <span className={`co-chip ${expired ? "co-chip--danger" : ""}`}>
                  {label}{expired ? " (expired)" : ""}
                </span>
              </div>
            </>
          )}
        </div>

        <div>
          <button
            className={`co-btn co-btn--pay`}
            disabled={expired || paying}
            onClick={onPay}
            title={expired ? "Booking hold expired" : "Pay now"}
          >
            {paying ? "Opening payment…" : "Pay now"}
          </button>
        </div>
      </div>
    </div>
  );
}
