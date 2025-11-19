import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";

/**
 * Auth Page (đã khớp BE hiện tại)
 * - Base API: http://localhost:3000/
 * - Endpoints: /register, /login, /protected, /auth/google
 * - Google callback: FE nhận ?token=&refresh= và chuyển hướng theo role
 */

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

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

function decodeJwtRole(jwtStr = "") {
  try {
    const [, payload] = jwtStr.split(".");
    if (!payload) return null;
    const json = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    );
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

  const ax = useMemo(
    () =>
      axios.create({
        baseURL: API_BASE,
        withCredentials: false,
      }),
    []
  );

  // Lấy role từ /protected; fallback decode JWT
  async function getRole(accessToken) {
    try {
      const res = await ax.get("/protected", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const r =
        res.data?.user?.role || res.data?.role || res.data?.data?.role || null;
      if (r) return String(r);
    } catch {
      /* ignore, fallback decode */
    }
    return decodeJwtRole(accessToken);
  }

  async function redirectByRole(accessToken) {
    const r = await getRole(accessToken);
    if (String(r).toLowerCase() === "admin") {
      window.location.href = ADMIN_URL;
    } else {
      window.location.href = "/";
    }
  }

  // Xử lý Google OAuth callback (?token=&refresh=)
  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      const refresh = params.get("refresh");
      if (token && refresh) {
        saveTokens({ accessToken: token, refreshToken: refresh });
        window.history.replaceState({}, "", window.location.pathname);
        setMessage("Đăng nhập Google thành công, đang chuyển hướng…");
        await redirectByRole(token);
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
      // chấp nhận cả {accessToken} lẫn {token}
      const accessToken = res.data?.accessToken || res.data?.token;
      const refreshToken = res.data?.refreshToken;
      if (!accessToken || !refreshToken) throw new Error("Thiếu token");
      saveTokens({ accessToken, refreshToken });
      setMessage("Đăng nhập thành công, đang chuyển hướng...");
      await redirectByRole(accessToken);
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
        role, // nếu BE không cho set role từ client, có thể bỏ field này
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
    // Router BE: /api/auth + "/auth/google"
    window.location.href = `${API_BASE}/auth/google`;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="w-full max-w-md">
        <div className="relative bg-white/80 backdrop-blur rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
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
            <span
              className={`absolute bottom-0 h-0.5 bg-indigo-600 transition-all duration-300 ease-out ${
                mode === "login" ? "left-0 w-1/2" : "left-1/2 w-1/2"
              }`}
            />
          </div>

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
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in .25s ease-out; }
      `}</style>
    </div>
  );
}
