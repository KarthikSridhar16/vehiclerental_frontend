import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useLayoutEffect, useRef } from "react";
import "../styles/admin.css";

export default function AdminLayout() {
  const asideRef = useRef(null);
  const mainRef  = useRef(null);
  const { pathname } = useLocation();

  const measureRail = () => {
    const h = asideRef.current ? asideRef.current.offsetHeight : 0;
    document.documentElement.style.setProperty("--admin-rail-h", `${h}px`);
  };

  useLayoutEffect(() => {
    measureRail();
    const onResize = () => measureRail();
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, [pathname]);

  useEffect(() => {
    const root = document.getElementById("root");
    const scrollers = new Set([
      window,
      document,
      document.documentElement,
      document.body,
      mainRef.current,
      root
    ].filter(Boolean));

    let lastY = 0;
    let ticking = false;

    const getY = (target) => {
      
      if (target === window || target === document || target === document.documentElement || target === document.body) {
        return window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      }
      return (target && target.scrollTop) || 0;
    };

    const handle = (target) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const yNow = getY(target);
        const down = yNow > lastY + 8;
        const up   = yNow < lastY - 8;

        const shouldHide = yNow > 80 && down;          
        const shouldShow = yNow <= 80 || up;

        if (asideRef.current) {
          if (shouldHide) {
            asideRef.current.dataset.hidden = "1";
          }
          if (shouldShow) {
            delete asideRef.current.dataset.hidden;
          }
        }
        lastY = yNow;
        ticking = false;
      });
    };

    const listeners = [];
    scrollers.forEach(s => {
      const fn = () => handle(s);
      s.addEventListener("scroll", fn, { passive: true });
      listeners.push([s, fn]);
    });

    return () => listeners.forEach(([s, fn]) => s.removeEventListener("scroll", fn));
  }, [pathname]);

  return (
    <div className="admin-shell">
      <aside ref={asideRef} className="admin-aside">
        <div className="admin-aside-head">Admin</div>
        <nav className="admin-nav">
          <Item to="/admin" label="Dashboard" />
          <Item to="/admin/bookings" label="Bookings" />
          <Item to="/admin/vehicles" label="Vehicles" />
          <Item to="/admin/reviews" label="Reviews" />
        </nav>
      </aside>

      <main ref={mainRef} className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}

function Item({ to, label }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) => `admin-link ${isActive ? "is-active" : ""}`}
    >
      {label}
    </NavLink>
  );
}
