const KEY = "auth.session";
const LEGACY_KEYS = ["token", "user"];

function nukeLegacy() {
  try {
    for (const k of LEGACY_KEYS) {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    }
  } catch {}
}

function decodeJwt(token) {
  try {
    const [, payload] = token.split(".");
    if (!payload) return {};
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return {};
  }
}

function computeExpiresAt({ token, exp, ttlMs }) {
  const payloadExp = token ? Number(decodeJwt(token)?.exp || 0) : 0;
  const unixSec = Number(exp || payloadExp || 0);
  if (unixSec > 0) return unixSec * 1000;
  const ttl = Number(ttlMs || 0) || 15 * 60 * 1000;
  return Date.now() + ttl;
}

function broadcast(sessOrNull) {
  try {
    window.dispatchEvent(new CustomEvent("auth:changed", { detail: sessOrNull || null }));
  } catch {}
}

export function saveSession({ token, user, exp, ttlMs }) {
  if (!token) throw new Error("saveSession: token is required");
  const expiresAt = computeExpiresAt({ token, exp, ttlMs });
  const safeExpiresAt = Math.max(0, expiresAt - 30000);
  const blob = {
    token,
    user: user || null,
    exp: Math.floor(safeExpiresAt / 1000),
    expiresAt: safeExpiresAt,
  };
  localStorage.setItem(KEY, JSON.stringify(blob));
  nukeLegacy();
  broadcast(blob);
  return blob;
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession(shouldBroadcast = true) {
  try {
    localStorage.removeItem(KEY);
    nukeLegacy();
  } catch {}
  if (shouldBroadcast) broadcast(null);
}

export function isExpired(session = loadSession()) {
  const t = Number(session?.expiresAt || 0);
  return !t || Date.now() >= t;
}

export function remainingMs(session = loadSession()) {
  const t = Number(session?.expiresAt || 0);
  return Math.max(0, t - Date.now());
}

export function getToken() {
  const s = loadSession();
  return s?.token && !isExpired(s) ? s.token : null;
}
