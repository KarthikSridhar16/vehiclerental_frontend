// src/components/Navbar.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
import "../styles/navbar.css";

export default function Navbar({ user, onLogout }) {
  const nav = useNavigate();
  const loc = useLocation();

  const [q, setQ] = useState("");
  const [openMobileSearch, setOpenMobileSearch] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);

  const isAdmin = user?.role === "admin";

  function onSubmit(e) {
    e.preventDefault();
    const query = q.trim();
    setOpenMobileSearch(false);
    nav(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
    setQ(""); 
  }

  function goBrowse() {
    setOpenMobileSearch(false);
    setQ("");
    nav("/search");
  }

  useEffect(() => {
    setOpenMobileSearch(false);
    setOpenMenu(false);
  }, [loc.pathname]);

  useEffect(() => {
    const mq = window.matchMedia?.("(min-width: 769px)");
    if (!mq) return;
    const onChange = () => mq.matches && setOpenMenu(false);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") {
        setOpenMobileSearch(false);
        setOpenMenu(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!openMenu) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = prev);
  }, [openMenu]);

  const initials = (user?.name?.trim()?.[0] || "U").toUpperCase();

  const Brand = (
    <Link to="/" className="vc-brand" aria-label="VRUMACARS Home">
      <img src="/logo.png" alt="VRUMACARS" className="vc-logo-img" width={32} height={32} decoding="async" />
      <span className="vc-wordmark">VRUMACARS</span>
    </Link>
  );

  return (
    <>
      <header className="vc-nav" data-mobile-open={openMobileSearch ? "1" : "0"}>
        <div className="vc-container vc-nav-inner">
          {Brand}

          {/* Desktop search */}
          <form className="vc-search vc-search--desktop" onSubmit={onSubmit}>
            {/* Magnifier acts as quick “browse all” */}
            <button type="button" className="vc-icon-btn" aria-label="Browse all vehicles" onClick={goBrowse}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-3.5-3.5" />
              </svg>
            </button>

            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search make / model / location"
              aria-label="Search"
            />
            <button type="submit" className="btn btn-gold">Search</button>
          </form>

          {/* Right actions */}
          <div className="vc-actions">
            {/* REPLACED: Browse -> Admin for admins */}
            {isAdmin ? (
              <Link to="/admin" className="btn btn-ghost">Admin</Link>
            ) : (
              <Link to="/search" className="btn btn-ghost">Browse</Link>
            )}

            <button
              type="button"
              className="btn-icon vc-search-toggle"
              aria-label="Open search"
              aria-expanded={openMobileSearch}
              onClick={() => setOpenMobileSearch((v) => !v)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-3.5-3.5" />
              </svg>
            </button>

            <button
              type="button"
              className="btn-icon vc-menu-toggle"
              aria-label="Open menu"
              aria-expanded={openMenu}
              onClick={() => setOpenMenu((v) => !v)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>

            <div className="vc-actions-desktop">
              {user ? (
                <>
                  <Link to="/checkout-list" className="btn btn-ghost">Checkout</Link>
                  <Link to="/bookings" className="btn btn-ghost">Bookings</Link>
                  <button className="btn btn-ghost" onClick={onLogout}>Logout</button>
                  <span className="vc-avatar" title={user.name || "Account"}>{initials}</span>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-ghost">Login</Link>
                  <Link to="/register" className="btn btn-gold">Sign up</Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile search drawer */}
        <div className={`vc-search-drawer ${openMobileSearch ? "open" : ""}`}>
          <form className="vc-search vc-search--mobile" onSubmit={onSubmit}>
            <button type="button" className="vc-icon-btn" aria-label="Browse all vehicles" onClick={goBrowse}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-3.5-3.5" />
              </svg>
            </button>
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search make / model / location"
              aria-label="Search"
            />
            <button type="submit" className="btn btn-gold">Search</button>
          </form>
        </div>
      </header>

      {/* Off-canvas mobile menu */}
      {createPortal(
        <div className={`vc-menu ${openMenu ? "open" : ""}`}>
          <button className="vc-menu-overlay" aria-label="Close menu" onClick={() => setOpenMenu(false)} />
          <nav className="vc-menu-panel" aria-label="Mobile">
            <div className="vc-menu-head">
              {Brand}
              <button className="btn-icon" aria-label="Close menu" onClick={() => setOpenMenu(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M6 6l12 12M6 18L18 6" />
                </svg>
              </button>
            </div>

            <ul className="vc-menu-list">
              {user ? (
                <>
                  <li><Link to="/checkout-list" onClick={() => setOpenMenu(false)}>Checkout</Link></li>
                  <li><Link to="/bookings" onClick={() => setOpenMenu(false)}>Bookings</Link></li>
                  {isAdmin && <li><Link to="/admin" onClick={() => setOpenMenu(false)}>Admin</Link></li>}
                  <li>
                    <button className="linkish" onClick={() => { setOpenMenu(false); onLogout?.(); }}>
                      Logout
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li><Link to="/login" onClick={() => setOpenMenu(false)}>Login</Link></li>
                  <li><Link to="/register" onClick={() => setOpenMenu(false)}>Sign up</Link></li>
                </>
              )}
            </ul>
          </nav>
        </div>,
        document.getElementById("nav-menu-root") || document.body
      )}
    </>
  );
}
