const KEY = "auth.session";

export function saveSession({ token, user }) {
  const expiresAt = Date.now() + 15 * 60 * 1000;
  const blob = { token, user, expiresAt };
  localStorage.setItem(KEY, JSON.stringify(blob));
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

export function clearSession() {
  localStorage.removeItem(KEY);
}

export function isExpired(session = loadSession()) {
  if (!session?.expiresAt) return true;
  return Date.now() >= session.expiresAt;
}

export function remainingMs(session = loadSession()) {
  if (!session?.expiresAt) return 0;
  return Math.max(0, session.expiresAt - Date.now());
}
