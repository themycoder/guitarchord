import { loadTokens } from "./tokens";

const API_BASE =
  (typeof window !== "undefined" && window.__API_BASE__) ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3000";

// Mặc định mọi request là auth = true (trừ khi em cố ý tắt)
async function core(
  path,
  { method = "GET", body, headers = {}, auth = true } = {}
) {
  const h = { "Content-Type": "application/json", ...headers };

  if (auth) {
    const { accessToken } = loadTokens();
    if (accessToken) h.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: h,
    body: body && typeof body !== "string" ? JSON.stringify(body) : body,
  });

  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null);

  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  get: (p, opts = {}) => core(p, { method: "GET", ...opts }),
  post: (p, b, opts = {}) => core(p, { method: "POST", body: b, ...opts }),
  put: (p, b, opts = {}) => core(p, { method: "PUT", body: b, ...opts }),
  patch: (p, b, opts = {}) => core(p, { method: "PATCH", body: b, ...opts }),
  del: (p, opts = {}) => core(p, { method: "DELETE", ...opts }),
};
