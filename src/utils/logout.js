import { clearSession } from "./session";

export function logoutAndReload() {
  clearSession();
  window.location.replace("/login");
}
