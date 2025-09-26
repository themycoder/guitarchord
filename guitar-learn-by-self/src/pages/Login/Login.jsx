import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";

/**
 * Clean Auth Page (JSX)
 * - Redirect theo ROLE:
 *    + admin  -> ADMIN_URL (mặc định http://localhost:5174/admin/)
 *    + others -> "/"
 * - Xử lý cả login thường và Google OAuth callback (?token=&refresh=)
 *
 * ENV (tùy chọn):
 *   VITE_API_BASE_URL = http://localhost:3000/api/auth   (hoặc http://localhost:3000 nếu anh đang để vậy)
 *   VITE_API_ORIGIN   = http://localhost:3000/auth
 *   VITE_ADMIN_URL    = http://localhost:5174/admin/
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const API_ORIGIN =
  import.meta.env.VITE_API_ORIGIN || "http://localhost:3000/auth";

const ADMIN_URL =
  import.meta.env.VITE_ADMIN_URL || "http://localhost:5174/admin/";

const TOKENS_KEY = "auth_tokens_v1"; // { accessToken, refreshToken }

function saveTokens(tokens) {
  localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
}
function loadTokens() {
  try {
    return JSON.parse(localStorage.getItem(TOKENS_KEY) || "{}");
  } catch {
    return {};
  }
}
function clearTokens() {
  localStorage.removeItem(TOKENS_KEY);
}

// Decode JWT (fallback khi API chưa có /me)
function decodeJwtRole(jwt = "") {
  try {
    const [, payload] = jwt.split(".");
    if (!payload) return null;
    const json = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    );
    // các key role hay gặp: role | roles | user.role | claims["role"]
    if (json?.role) return json.role;
    if (Array.isArray(json?.roles) && json.roles.length) return json.roles[0];
    if (json?.user?.role) return json.user.role;
    return null;
  } catch {
    return null;
  }
}

export default function AuthPage() {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // login state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // register state
  const [rUsername, setRUsername] = useState("");
  const [email, setEmail] = useState("");
  const [rPassword, setRPassword] = useState("");
  const [age, setAge] = useState(18);
  const [role, setRole] = useState("user");

  const ax = useMemo(() => axios.create({ baseURL: API_BASE_URL }), []);

  // --- Helper: hỏi API lấy role, fallback decode JWT ---
  async function getRoleFromServerOrJwt(accessToken) {
    // Thử gọi /me (hoặc /auth/me tùy backend). Đổi path nếu server anh khác.
    try {
      const res = await axios.get(`${API_BASE_URL}/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      // chấp nhận nhiều format: {role}, {user:{role}}, {data:{role}}
      const r =
        res.data?.role || res.data?.user?.role || res.data?.data?.role || null;
      if (r) return String(r);
    } catch {
      // ignore
    }
    // Fallback: decode từ JWT
    return decodeJwtRole(accessToken);
  }

  // --- Helper: chuyển hướng theo role ---
  async function redirectByRole({ accessToken }) {
    const r = await getRoleFromServerOrJwt(accessToken);
    if (String(r).toLowerCase() === "admin") {
      window.location.href = ADMIN_URL;
    } else {
      window.location.href = "/";
    }
  }

  // ✅ Handle Google OAuth redirect: /?token=...&refresh=...
  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      const refresh = params.get("refresh");
      if (token && refresh) {
        saveTokens({ accessToken: token, refreshToken: refresh });
        // Xóa query để URL sạch
        window.history.replaceState({}, "", window.location.pathname);
        setMessage("Đăng nhập Google thành công, đang chuyển hướng…");
        await redirectByRole({ accessToken: token });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onLogin(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await ax.post("/login", { username, password });
      const { token, refreshToken } = res.data || {};
      if (!token || !refreshToken) throw new Error("Thiếu token");
      saveTokens({ accessToken: token, refreshToken });
      setMessage("Đăng nhập thành công, đang chuyển hướng...");
      await redirectByRole({ accessToken: token });
    } catch (err) {
      setMessage(err?.response?.data?.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  }

  async function onRegister(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await ax.post("/register", {
        username: rUsername,
        email,
        password: rPassword,
        role,
        age,
      });
      setMessage("Đăng ký thành công. Hãy đăng nhập.");
      setMode("login");
    } catch (err) {
      setMessage(err?.response?.data?.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  }

  function googleLogin() {
    window.location.href = `${API_ORIGIN}/google`;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="relative bg-white/80 backdrop-blur rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Tabs */}
          <div className="flex relative">
            <button
              className={`flex-1 py-3 text-sm font-medium ${
                mode === "login" ? "text-indigo-700" : "text-gray-500"
              }`}
              onClick={() => setMode("login")}
            >
              Đăng nhập
            </button>
            <button
              className={`flex-1 py-3 text-sm font-medium ${
                mode === "register" ? "text-indigo-700" : "text-gray-500"
              }`}
              onClick={() => setMode("register")}
            >
              Đăng ký
            </button>
            {/* Slider underline */}
            <span
              className={`absolute bottom-0 h-0.5 bg-indigo-600 transition-all duration-300 ease-out ${
                mode === "login" ? "left-0 w-1/2" : "left-1/2 w-1/2"
              }`}
            />
          </div>

          {/* Forms container (slide) */}
          <div
            className="relative w-[200%] flex transition-transform duration-500 ease-[cubic-bezier(.4,0,.2,1)]"
            style={{
              transform:
                mode === "login" ? "translateX(0%)" : "translateX(-50%)",
            }}
          >
            {/* Login */}
            <div className="w-1/2 p-6">
              <form onSubmit={onLogin} className="grid gap-4">
                <div>
                  <label className="text-sm text-gray-600">Username</label>
                  <input
                    className="mt-1 w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="yourname"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Password</label>
                  <input
                    type="password"
                    className="mt-1 w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                  />
                </div>
                <button
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white rounded-xl py-2.5 hover:bg-indigo-700 transition"
                >
                  {loading ? "Đang xử lý..." : "Đăng nhập"}
                </button>
                <button
                  type="button"
                  onClick={googleLogin}
                  className="w-full border rounded-xl py-2.5 hover:bg-gray-50 transition"
                >
                  Đăng nhập với Google
                </button>
              </form>
            </div>

            {/* Register */}
            <div className="w-1/2 p-6">
              <form onSubmit={onRegister} className="grid gap-4">
                <div>
                  <label className="text-sm text-gray-600">Username</label>
                  <input
                    className="mt-1 w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={rUsername}
                    onChange={(e) => setRUsername(e.target.value)}
                    placeholder="yourname"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Email</label>
                  <input
                    type="email"
                    className="mt-1 w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Password</label>
                  <input
                    type="password"
                    className="mt-1 w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={rPassword}
                    onChange={(e) => setRPassword(e.target.value)}
                    placeholder="••••••"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-600">Tuổi</label>
                    <input
                      type="number"
                      min={1}
                      className="mt-1 w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={age}
                      onChange={(e) =>
                        setAge(parseInt(e.target.value || "0", 10))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Role</label>
                    <select
                      className="mt-1 w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </div>
                </div>
                <button
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white rounded-xl py-2.5 hover:bg-indigo-700 transition"
                >
                  {loading ? "Đang xử lý..." : "Tạo tài khoản"}
                </button>
              </form>
            </div>
          </div>
        </div>

        {!!message && (
          <div className="mt-3 text-center text-sm text-gray-700 animate-fade-in">
            {message}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
          <code className="px-2 py-1 rounded bg-white/70 border">
            API_BASE_URL: {API_BASE_URL}
          </code>
          {loadTokens()?.accessToken && (
            <button
              onClick={() => {
                clearTokens();
                window.location.reload();
              }}
              className="underline hover:text-gray-700"
            >
              Clear token
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in .25s ease-out; }
      `}</style>
    </div>
  );
}
