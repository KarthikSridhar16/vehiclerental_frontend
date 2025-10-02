import { useEffect, useRef, useState } from "react";

export default function Toaster() {
  const [msg, setMsg] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    function onShow(e) {
      const { message, ttl = 10000 } = e.detail || {};
      setMsg(message);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (ttl > 0) timerRef.current = setTimeout(() => setMsg(null), ttl);
    }
    window.addEventListener("toast:show", onShow);
    return () => {
      window.removeEventListener("toast:show", onShow);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!msg) return null;

  return (
    <div style={{ position: "fixed", left: "50%", bottom: 24, transform: "translateX(-50%)", zIndex: 9999, pointerEvents: "none" }}>
      <div
        role="status"
        aria-live="polite"
        style={{
          pointerEvents: "auto",
          background: "rgba(17,24,39,.95)",
          color: "#fde68a",
          border: "1px solid #fcd34d",
          padding: "12px 16px",
          borderRadius: 10,
          boxShadow: "0 10px 30px rgba(0,0,0,.4)",
          maxWidth: "90vw",
          textAlign: "center"
        }}
      >
        {msg}
      </div>
    </div>
  );
}
