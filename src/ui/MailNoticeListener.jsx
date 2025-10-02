import { useEffect } from "react";
import { useLocation } from "react-router-dom";

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

export default function MailNoticeListener() {
  const loc = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(loc.search || "");
    const kind = params.get("mail") || params.get("notice");
    if (!kind) return;
    toast(mailNotice(kind), 10000);
    params.delete("mail");
    params.delete("notice");
    const qs = params.toString();
    window.history.replaceState({}, "", loc.pathname + (qs ? `?${qs}` : ""));
  }, [loc.key, loc.pathname, loc.search]);

  return null;
}
