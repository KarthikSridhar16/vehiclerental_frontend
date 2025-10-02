// src/admin/BookingsTrend.jsx
import dayjs from "dayjs";
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Area,
} from "recharts";

export default function BookingsTrend({ rows = [] }) {
  const days = [];
  const today = dayjs().startOf("day");
  for (let i = 13; i >= 0; i--) {
    const d = today.subtract(i, "day");
    days.push({
      key: d.format("YYYY-MM-DD"),
      label: d.format("D MMM"),
      total: 0,
      confirmed: 0,
    });
  }

  const toKey = (v) => {
    if (!v) return null;
    const d = dayjs.isDayjs(v) ? v : dayjs(v);
    return d.isValid() ? d.startOf("day").format("YYYY-MM-DD") : null;
  };

  const byKey = Object.fromEntries(days.map((d) => [d.key, d]));
  rows.forEach((r) => {
    const k = toKey(r.createdAt || r.created_at || r.created);
    if (!k || !byKey[k]) return;
    byKey[k].total += 1;
    const s = String(r.status || r.state || "").toLowerCase();
    if (s === "confirmed" || s === "paid" || s === "active") {
      byKey[k].confirmed += 1;
    }
  });

  const todayKey = today.format("YYYY-MM-DD");
  const yKey = today.subtract(1, "day").format("YYYY-MM-DD");
  const t = byKey[todayKey] || { total: 0, confirmed: 0 };
  const y = byKey[yKey] || { total: 0, confirmed: 0 };

  const pct = (cur, prev) =>
    prev === 0 ? (cur === 0 ? 0 : 100) : Math.round(((cur - prev) / prev) * 100);
  const deltaTotalStr = `${pct(t.total, y.total) >= 0 ? "+" : ""}${pct(t.total, y.total)}%`;
  const deltaConfirmedStr = `${pct(t.confirmed, y.confirmed) >= 0 ? "+" : ""}${pct(t.confirmed, y.confirmed)}%`;

  const data = days.map((d) => ({
    label: d.label,
    total: d.total,
    confirmed: d.confirmed,
  }));

  const order = { Total: 0, Confirmed: 1 };

  const tooltipFormatter = (value, name, props) => {

    if (name === "total" || props?.dataKey === "total") return [value, "Total"];
    if (name === "confirmed" || props?.dataKey === "confirmed") return [value, "Confirmed"];
    return [value, name || ""];
  };

  const tooltipSorter = (a, b) => {
    const an =
      a?.name ??
      (a?.dataKey === "total" ? "Total" : a?.dataKey === "confirmed" ? "Confirmed" : "");
    const bn =
      b?.name ??
      (b?.dataKey === "total" ? "Total" : b?.dataKey === "confirmed" ? "Confirmed" : "");
    return (order[an] ?? 99) - (order[bn] ?? 99);
  };

  return (
    <div className="chart-card">
      <div className="chart-head">
        <div className="chart-title">Bookings — last 14 days</div>
        <div className="chart-sub">
          Today: {t.total} total, {t.confirmed} confirmed • Δ vs yesterday: {deltaTotalStr} total,{" "}
          {deltaConfirmedStr} confirmed
        </div>
      </div>

      <div className="chart-body">
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={data} margin={{ top: 10, right: 16, bottom: 8, left: 8 }}>
            {/* Gradients */}
            <defs>
              {/* Gold bars (Total) */}
              <linearGradient id="goldBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e9cb7c" />
                <stop offset="100%" stopColor="#d6b55b" />
              </linearGradient>
              {/* Confirmed area/line */}
              <linearGradient id="areaBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(113,181,255,.18)" />
                <stop offset="100%" stopColor="rgba(113,181,255,.04)" />
              </linearGradient>
            </defs>

            {/* Grid & axes */}
            <CartesianGrid
              stroke="rgba(255,255,255,.16)"
              strokeDasharray="3 6"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fill: "#b8c7e6", fontSize: 12 }}
              axisLine={{ stroke: "rgba(255,255,255,.18)" }}
              tickLine={false}
              height={28}
            />
            <YAxis
              allowDecimals={false}
              width={28}
              tick={{ fill: "#b8c7e6", fontSize: 12 }}
              axisLine={{ stroke: "rgba(255,255,255,.18)" }}
              tickLine={false}
            />

            {/* Tooltip & legend */}
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,.04)" }}
              formatter={tooltipFormatter}
              itemSorter={tooltipSorter}
              contentStyle={{
                background:
                  "linear-gradient(180deg, rgba(16,23,42,.96), rgba(16,23,42,.92))",
                border: "1px solid rgba(255,255,255,.12)",
                borderRadius: 12,
                color: "#EAF1FF",
                boxShadow: "0 18px 60px rgba(0,0,0,.45)",
              }}
              labelStyle={{ color: "#cfe0ff", fontWeight: 700 }}
              itemStyle={{ color: "#EAF1FF" }}
            />
            <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: 8 }} iconType="circle" />

            {/* Series */}
            <Bar
              dataKey="total"
              name="Total"
              fill="url(#goldBar)"
              radius={[6, 6, 0, 0]}
              barSize={18}
            />
            {/* Single series for confirmed (no duplicate line) */}
            <Area
              dataKey="confirmed"
              name="Confirmed"
              type="monotone"
              fill="url(#areaBlue)"
              stroke="rgba(113,181,255,1)"
              strokeWidth={2.5}
              dot={{ r: 3, stroke: "rgba(113,181,255,1)", strokeWidth: 1, fill: "#0b1222" }}
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
