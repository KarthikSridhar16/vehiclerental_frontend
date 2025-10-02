import { useState } from "react";
import "../styles/footer.css";

export default function SiteFooter() {
  const [open, setOpen] = useState({
    company: false,
    support: false,
    contact: false,
  });

  const toggle = (key) =>
    setOpen((p) => ({ ...p, [key]: !p[key] }));

  return (
    <footer className="footer">
      <div className="v-container footer-inner">
        {/* Brand / blurb */}
        <div className="footer-brand">
          <div className="footer-logo">
            <img src="/logo.png" alt="VRUMACARS" />
          </div>
          <div className="footer-brand-text">
            <h3 className="v-h footer-title">VRUMACARS</h3>
            <p className="footer-tag">
              Elite rentals across India. Curated fleet, white-glove support.
            </p>
          </div>
        </div>

        {/* Cards */}
        <div className="footer-cards">
          {/* Company */}
          <div className={`footer-card ${open.company ? "is-open" : ""}`}>
            <button
              className="footer-card-head"
              onClick={() => toggle("company")}
              aria-expanded={open.company}
              aria-controls="footer-panel-company"
            >
              <span className="footer-head">Company</span>
              <span className="footer-arrow" aria-hidden="true" />
            </button>
            <div id="footer-panel-company" className="footer-panel">
              <a href="#" className="footer-link">About</a>
              <a href="#" className="footer-link">Terms</a>
              <a href="#" className="footer-link">Privacy</a>
            </div>
          </div>

          {/* Support */}
          <div className={`footer-card ${open.support ? "is-open" : ""}`}>
            <button
              className="footer-card-head"
              onClick={() => toggle("support")}
              aria-expanded={open.support}
              aria-controls="footer-panel-support"
            >
              <span className="footer-head">Support</span>
              <span className="footer-arrow" aria-hidden="true" />
            </button>
            <div id="footer-panel-support" className="footer-panel">
              <a href="#" className="footer-link">FAQ</a>
              <a href="#" className="footer-link">Contact</a>
              <a href="#" className="footer-link">Careers</a>
            </div>
          </div>

          {/* Contact */}
          <div className={`footer-card ${open.contact ? "is-open" : ""}`}>
            <button
              className="footer-card-head"
              onClick={() => toggle("contact")}
              aria-expanded={open.contact}
              aria-controls="footer-panel-contact"
            >
              <span className="footer-head">Contact</span>
              <span className="footer-arrow" aria-hidden="true" />
            </button>
            <div id="footer-panel-contact" className="footer-panel">
              <div className="footer-link">+91 98xx xxxxx</div>
              <div className="footer-link">hello@vrumacars.com</div>
              <div className="footer-link">Mumbai · Bengaluru · Chennai</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div className="footer-bottom">
        <div className="v-container footer-bottom-inner">
          <span>© {new Date().getFullYear()} VRUMACARS</span>
          <span className="footer-small">All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
