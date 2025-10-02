import { Link } from "react-router-dom";

function rupees(n) {
  const v = Number(n || 0);
  return v.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
}

export default function VehicleCard({ v = {} }) {
  const title = [v.make, v.model].filter(Boolean).join(" ");
  const img = v.images?.[0] || "";
  const location = v.location || "-";
  const type = (v.type || "Vehicle").toString().charAt(0).toUpperCase() + (v.type || "vehicle").toString().slice(1);

  return (
    <Link to={`/vehicle/${v._id}`} className="v-card hover-lift" aria-label={`${title} details`}>
      <div className="v-card-media">
        {img ? (
          <img
            src={img}
            alt={title}
            loading="lazy"
            decoding="async"
            className="v-card-img"
          />
        ) : (
          <div className="v-card-placeholder" aria-hidden />
        )}

        {/* price pill */}
        <div className="v-price">{rupees(v.pricePerDay)}/day</div>
      </div>

      <div className="v-card-body">
        <h3 className="v-card-title">
          {title} {v.year ? <span className="v-year">({v.year})</span> : null}
        </h3>

        <div className="v-meta">
          {type} <span className="dot">•</span> {location}
        </div>

        <div className="v-card-actions">
          <span className="btn btn-ghost">View</span>
        </div>
      </div>
    </Link>
  );
}
