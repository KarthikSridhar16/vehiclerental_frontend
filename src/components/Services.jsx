// src/components/Services.jsx
import "../styles/services.css";

export default function Services() {
  return (
    <section className="services v-section v-container">
      <h2 className="v-h services-title">Our Services</h2>

      <div className="services-grid">
        {/* Available */}
        <article className="svc-card glass hover-lift">
          <div className="svc-badge svc-badge--live">Available</div>
          <h3 className="svc-title">Self-Drive</h3>
          <p className="svc-copy">
            Premium sedans, SUVs &amp; EVs. Spotless delivery, full insurance, 24×7 assistance.
          </p>
        </article>

        <article className="svc-card glass hover-lift">
          <div className="svc-badge svc-badge--live">Available</div>
          <h3 className="svc-title">Long-term Lease</h3>
          <p className="svc-copy">
            Corporate &amp; monthly leasing with maintenance included and priority support.
          </p>
        </article>

        {/* Upcoming */}
        <article className="svc-card glass svc-card--upcoming">
          <div className="svc-badge svc-badge--upcoming">Upcoming</div>
          <h3 className="svc-title">Airport Transfers</h3>
          <p className="svc-copy">
            On-time pick-ups, meet &amp; greet, flight tracking. Launching soon.
          </p>
        </article>
      </div>
    </section>
  );
}
