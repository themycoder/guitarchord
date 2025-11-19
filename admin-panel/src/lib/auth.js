// src/admin/lib/auth.js
export const TOKENS_KEY = "auth_tokens_v1"; // TRÙNG với FE thường

export function readTokens() {
  try {
    const raw = localStorage.getItem(TOKENS_KEY);
    if (!raw) return { accessToken: "", refreshToken: "" };
    const obj = JSON.parse(raw);
    return {
      accessToken: obj?.accessToken || obj?.token || "",
      refreshToken: obj?.refreshToken || "",
    };
  } catch {
    return { accessToken: "", refreshToken: "" };
  }
}

export function writeTokens(next) {
  try {
    const cur = readTokens();
    const merged = {
      accessToken: next?.accessToken ?? cur.accessToken,
      refreshToken: next?.refreshToken ?? cur.refreshToken,
    };
    localStorage.setItem(TOKENS_KEY, JSON.stringify(merged));
  } catch {}
}

export function clearTokens() {
  try {
    localStorage.removeItem(TOKENS_KEY);
  } catch {}
}

export function hydrateTokensFromUrl() {
  try {
    const u = new URL(window.location.href);
    const token = u.searchParams.get("token");
    const refresh = u.searchParams.get("refresh");
    if (token) {
      writeTokens({ accessToken: token, refreshToken: refresh || "" });
      u.searchParams.delete("token");
      u.searchParams.delete("refresh");
      window.history.replaceState({}, "", u.toString());
      console.log("[Admin] hydrated tokens from URL");
    }
  } catch {}
}

export function decodeJwtPayload(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export function getDisplayNameFromPayload(p) {
  if (!p) return "";
  if (p.displayName) return p.displayName;
  if (p.username) return p.username;
  const full = [p.firstName, p.lastName].filter(Boolean).join(" ").trim();
  if (full) return full;
  if (p.email) return String(p.email).split("@")[0];
  return "";
}
