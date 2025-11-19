// ===========================
// 🌐 API Helper (JS version)
// ===========================

// Tự động chọn base URL
let API_BASE = "http://localhost:3000";
try {
  if (typeof window !== "undefined" && window.__API_BASE__) {
    API_BASE = window.__API_BASE__;
  } else if (
    typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL
  ) {
    API_BASE = import.meta.env.VITE_API_BASE_URL;
  }
} catch (e) {
  console.warn("⚠️ Không thể đọc VITE_API_BASE_URL, fallback localhost:", e);
}

export { API_BASE };

// Token key
const TOKENS_KEY = "auth_tokens_v1";

// Đọc token
function loadTokens() {
  try {
    return JSON.parse(localStorage.getItem(TOKENS_KEY) || "{}");
  } catch {
    return {};
  }
}

// Headers mặc định
export function authHeaders(extra = {}) {
  const { accessToken } = loadTokens();
  return {
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...extra,
  };
}

// Gọi GET
export async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

// Gọi POST
export async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}
