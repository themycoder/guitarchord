// dùng CHUNG đúng key như Navbar
export const TOKENS_KEY = "auth_tokens_v1";

export function loadTokens() {
  try {
    return JSON.parse(localStorage.getItem(TOKENS_KEY) || "{}");
  } catch {
    return {};
  }
}

export function decodeJwtPayload(token) {
  try {
    const payload = token?.split(".")[1];
    return payload ? JSON.parse(atob(payload)) : null;
  } catch {
    return null;
  }
}
