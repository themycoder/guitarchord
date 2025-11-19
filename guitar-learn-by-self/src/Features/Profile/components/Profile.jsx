// src/pages/Profile.jsx
import React, { useEffect, useState } from "react";

/** ========= CONFIG ========= */
const API_BASE =
  (typeof window !== "undefined" && window.__API_BASE__) ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3000";

const TOKENS_KEY = "auth_tokens_v1"; // { accessToken, refreshToken }

/** ========= HELPERS ========= */
function loadTokens() {
  try {
    return JSON.parse(localStorage.getItem(TOKENS_KEY) || "{}");
  } catch {
    return {};
  }
}
function authHeaders(extra = {}) {
  const { accessToken } = loadTokens();
  return {
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...extra,
  };
}
async function authFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: authHeaders(options.headers || {}),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return res.json();
}
const cx = (...a) => a.filter(Boolean).join(" ");

/** ========= SMALL UI ========= */
function Card({ title, actions, children }) {
  return (
    <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{title}</h3>
        {actions}
      </div>
      {children}
    </div>
  );
}
function Field({ label, hint, children }) {
  return (
    <label className="block">
      <div className="text-sm font-medium">{label}</div>
      {children}
      {hint && <div className="text-xs text-gray-500 mt-1">{hint}</div>}
    </label>
  );
}
function Pill({ children }) {
  return (
    <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
      {children}
    </span>
  );
}
function ChipsInput({
  value = [],
  onChange,
  placeholder = "nhập, cách nhau bởi dấu phẩy",
}) {
  return (
    <input
      className="mt-1 w-full px-3 py-2 border rounded-xl"
      value={(value || []).join(", ")}
      onChange={(e) =>
        onChange(
          e.target.value
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        )
      }
      placeholder={placeholder}
    />
  );
}

/** ========= PAGE ========= */
export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // top-level
  const [top, setTop] = useState({
    firstName: "",
    lastName: "",
    displayName: "",
    avatarUrl: "",
    age: "",
    email: "",
    username: "",
    role: "",
  });

  // learning profile
  const [profile, setProfile] = useState({
    level: "beginner",
    skills: [],
    goals: [],
    preferredStyles: [],
    practicePreference: { sessionMinutes: 20, daysPerWeek: 4 },
    progress: {
      completedLessons: 0,
      totalLessons: 0,
      lastActive: new Date().toISOString(),
    },
    stats: { quizzesDone: 0, totalPracticeTime: 0, avgAccuracy: 0 },
  });

  // NEW: Onboarding hiển thị trong Profile (đồng bộ với ML)
  const [onboarding, setOnboarding] = useState({
    completed: false,
    levelHint: null,
    answers: null,
    updatedAt: null,
  });
  // NEW: ML status (để biết phía ML đã có dữ liệu chưa)
  const [mlStatus, setMlStatus] = useState({ hasData: false, levelHint: null });

  /** ---- load data ---- */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // 1) /api/profile/me
        const data = await authFetch("/api/profile/me", { method: "GET" });
        const u = data?.user || {};
        setTop({
          firstName: u.firstName || "",
          lastName: u.lastName || "",
          displayName: u.displayName || "",
          avatarUrl: u.avatarUrl || "",
          age: u.age ?? "",
          email: u.email || "",
          username: u.username || "",
          role: u.role || "",
        });
        setProfile({
          level: u.profile?.level || "beginner",
          skills: u.profile?.skills || [],
          goals: u.profile?.goals || [],
          preferredStyles: u.profile?.preferredStyles || [],
          practicePreference: {
            sessionMinutes: u.profile?.practicePreference?.sessionMinutes ?? 20,
            daysPerWeek: u.profile?.practicePreference?.daysPerWeek ?? 4,
          },
          progress: {
            completedLessons: u.profile?.progress?.completedLessons ?? 0,
            totalLessons: u.profile?.progress?.totalLessons ?? 0,
            lastActive:
              u.profile?.progress?.lastActive || new Date().toISOString(),
          },
          stats: {
            quizzesDone: u.profile?.stats?.quizzesDone ?? 0,
            totalPracticeTime: u.profile?.stats?.totalPracticeTime ?? 0,
            avgAccuracy: u.profile?.stats?.avgAccuracy ?? 0,
          },
        });

        // 2) /api/profile/onboarding  (có thể chưa tồn tại => try/catch riêng)
        try {
          const ob = await authFetch("/api/profile/onboarding", {
            method: "GET",
          });
          const o = ob?.onboarding || {};
          setOnboarding({
            completed: !!o.completed,
            levelHint: typeof o.levelHint === "number" ? o.levelHint : null,
            answers: o.answers || null,
            updatedAt: o.updatedAt || null,
          });
        } catch {
          // bỏ qua nếu BE chưa có hoặc user chưa lưu
          setOnboarding((s) => ({ ...s }));
        }

        // 3) /api/ml/onboarding-status  (để biết ML đã có answers/levelHint chưa)
        try {
          const ml = await authFetch("/api/ml/onboarding-status", {
            method: "GET",
          });
          setMlStatus({
            hasData: !!ml?.completed,
            levelHint: typeof ml?.levelHint === "number" ? ml.levelHint : null,
          });
        } catch {
          setMlStatus({ hasData: false, levelHint: null });
        }

        setErr("");
      } catch (e) {
        setErr("Không tải được hồ sơ. Hãy đăng nhập lại.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /** ---- submit PUT /api/profile/me ---- */
  async function onSaveAll() {
    try {
      setSaving(true);
      setMsg("");
      setErr("");

      const body = {
        firstName: top.firstName,
        lastName: top.lastName,
        displayName: top.displayName,
        avatarUrl: top.avatarUrl,
        age: Number(top.age) || undefined,
        profile: {
          level: profile.level,
          skills: profile.skills,
          goals: profile.goals,
          preferredStyles: profile.preferredStyles,
          practicePreference: {
            sessionMinutes:
              Number(profile.practicePreference.sessionMinutes) || 0,
            daysPerWeek: Number(profile.practicePreference.daysPerWeek) || 0,
          },
          // cho phép PUT full
          progress: profile.progress,
          stats: profile.stats,
        },
      };

      await authFetch("/api/profile/me", {
        method: "PUT",
        body: JSON.stringify(body),
      });

      setMsg("Đã cập nhật hồ sơ.");
    } catch (e) {
      setErr("Cập nhật thất bại. " + (e.message || ""));
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(""), 2500);
    }
  }

  /** ---- quick patchers ---- */
  async function patchPreferences() {
    try {
      const body = {
        sessionMinutes: Number(profile.practicePreference.sessionMinutes) || 0,
        daysPerWeek: Number(profile.practicePreference.daysPerWeek) || 0,
      };
      await authFetch("/api/profile/preferences", {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setMsg("Đã lưu Practice Preference.");
      setErr("");
    } catch (e) {
      setErr("Lưu Practice Preference thất bại.");
    } finally {
      setTimeout(() => setMsg(""), 2000);
    }
  }
  async function patchProgress(increments = { completed: 1, total: 1 }) {
    try {
      const body = {
        completedLessons: Number(increments.completed) || 0,
        totalLessons: Number(increments.total) || 0,
        lastActive: new Date().toISOString(),
      };
      await authFetch("/api/profile/progress", {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setMsg("Đã tăng tiến độ.");
      setErr("");
      // update local UI ngay (optimistic)
      setProfile((p) => ({
        ...p,
        progress: {
          ...p.progress,
          completedLessons:
            (p.progress.completedLessons || 0) + body.completedLessons,
          totalLessons: (p.progress.totalLessons || 0) + body.totalLessons,
          lastActive: body.lastActive,
        },
      }));
    } catch (e) {
      setErr("Tăng tiến độ thất bại.");
    } finally {
      setTimeout(() => setMsg(""), 2000);
    }
  }
  async function patchStats(
    increments = { quizzes: 1, minutes: 5, accuracy: undefined }
  ) {
    try {
      const body = {
        quizzesDone: Number(increments.quizzes) || 0,
        totalPracticeTime: Number(increments.minutes) || 0,
      };
      if (typeof increments.accuracy === "number") {
        body.avgAccuracy = increments.accuracy;
      }
      await authFetch("/api/profile/stats", {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setMsg("Đã cập nhật Stats.");
      setErr("");
      setProfile((p) => ({
        ...p,
        stats: {
          ...p.stats,
          quizzesDone: (p.stats.quizzesDone || 0) + (body.quizzesDone || 0),
          totalPracticeTime:
            (p.stats.totalPracticeTime || 0) + (body.totalPracticeTime || 0),
          avgAccuracy:
            typeof body.avgAccuracy === "number"
              ? body.avgAccuracy
              : p.stats.avgAccuracy,
        },
      }));
    } catch (e) {
      setErr("Cập nhật Stats thất bại.");
    } finally {
      setTimeout(() => setMsg(""), 2000);
    }
  }

  /** ==== NEW: Onboarding helpers ==== */
  async function syncOnboardingFromML() {
    try {
      setMsg("");
      setErr("");
      // 1) lấy từ ML
      const ml = await authFetch("/api/ml/onboarding-status", {
        method: "GET",
      });
      // 2) lưu vào profile
      const payload = {
        completed: !!ml?.completed,
        levelHint: typeof ml?.levelHint === "number" ? ml.levelHint : undefined,
        answers: ml?.answers || undefined,
      };
      await authFetch("/api/profile/onboarding", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      // 3) cập nhật UI
      setOnboarding({
        completed: !!payload.completed,
        levelHint: payload.levelHint ?? null,
        answers: payload.answers ?? null,
        updatedAt: new Date().toISOString(),
      });
      setMsg("Đã đồng bộ Onboarding từ ML vào hồ sơ.");
    } catch (e) {
      setErr("Đồng bộ Onboarding thất bại. " + (e.message || ""));
    } finally {
      setTimeout(() => setMsg(""), 2500);
    }
  }

  async function toggleOnboardingCompleted() {
    try {
      const next = !onboarding.completed;
      await authFetch("/api/profile/onboarding", {
        method: "PATCH",
        body: JSON.stringify({ completed: next }),
      });
      setOnboarding((o) => ({
        ...o,
        completed: next,
        updatedAt: new Date().toISOString(),
      }));
      setMsg(
        next
          ? "Đã đánh dấu đã hoàn tất onboarding."
          : "Đã bỏ đánh dấu onboarding."
      );
    } catch (e) {
      setErr("Cập nhật trạng thái onboarding thất bại.");
    } finally {
      setTimeout(() => setMsg(""), 2000);
    }
  }

  function renderAnswersPretty(ans) {
    if (!ans)
      return <div className="text-gray-500 text-sm">Chưa có dữ liệu.</div>;
    // hiển thị gọn gàng: key: value(s)
    const entries = Object.entries(ans);
    if (!entries.length)
      return <div className="text-gray-500 text-sm">Chưa có dữ liệu.</div>;
    return (
      <div className="text-sm space-y-1">
        {entries.map(([k, v]) => {
          const vv = Array.isArray(v) ? v.join(", ") : String(v);
          return (
            <div key={k} className="flex gap-2">
              <div className="min-w-32 font-medium">{k}</div>
              <div className="opacity-80">{vv || "-"}</div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="mx-auto w-full max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Hồ sơ cá nhân</h1>
            <p className="text-gray-600 text-sm">
              Chỉnh sửa thông tin và tuỳ chỉnh hồ sơ học để ML gợi ý lộ trình
              tốt hơn.
            </p>
          </div>
          <button
            onClick={onSaveAll}
            disabled={saving}
            className={cx(
              "px-4 py-2 rounded-2xl text-white shadow",
              saving ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"
            )}
            title="Cập nhật toàn bộ hồ sơ (PUT)"
          >
            {saving ? "Đang lưu..." : "💾 Cập nhật"}
          </button>
        </div>

        {/* Alerts */}
        {(msg || err) && (
          <div className="mb-4">
            {msg && (
              <div className="px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800">
                {msg}
              </div>
            )}
            {err && (
              <div className="px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-red-800">
                {err}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Basic + Learning */}
          <section className="lg:col-span-2 space-y-6">
            <Card title="Thông tin cơ bản">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="First name">
                  <input
                    className="mt-1 w-full px-3 py-2 border rounded-xl"
                    value={top.firstName}
                    onChange={(e) =>
                      setTop((t) => ({ ...t, firstName: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Last name">
                  <input
                    className="mt-1 w-full px-3 py-2 border rounded-xl"
                    value={top.lastName}
                    onChange={(e) =>
                      setTop((t) => ({ ...t, lastName: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Display name">
                  <input
                    className="mt-1 w-full px-3 py-2 border rounded-xl"
                    value={top.displayName}
                    onChange={(e) =>
                      setTop((t) => ({ ...t, displayName: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Avatar URL">
                  <input
                    className="mt-1 w-full px-3 py-2 border rounded-xl"
                    value={top.avatarUrl}
                    onChange={(e) =>
                      setTop((t) => ({ ...t, avatarUrl: e.target.value }))
                    }
                    placeholder="https://..."
                  />
                </Field>
                <Field label="Age">
                  <input
                    type="number"
                    className="mt-1 w-full px-3 py-2 border rounded-xl"
                    value={top.age}
                    onChange={(e) =>
                      setTop((t) => ({ ...t, age: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Email" hint="(không sửa tại đây)">
                  <input
                    disabled
                    className="mt-1 w-full px-3 py-2 border rounded-xl bg-gray-50"
                    value={top.email}
                    readOnly
                  />
                </Field>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Pill>username: {top.username || "-"}</Pill>
                <Pill>role: {top.role || "-"}</Pill>
              </div>
            </Card>

            <Card title="Hồ sơ học (Learning Profile)">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Level">
                  <select
                    className="mt-1 w-full px-3 py-2 border rounded-xl"
                    value={profile.level}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, level: e.target.value }))
                    }
                  >
                    <option value="beginner">beginner</option>
                    <option value="intermediate">intermediate</option>
                    <option value="advanced">advanced</option>
                  </select>
                </Field>

                <Field label="Skills">
                  <ChipsInput
                    value={profile.skills}
                    onChange={(v) => setProfile((p) => ({ ...p, skills: v }))}
                  />
                </Field>

                <Field label="Goals">
                  <ChipsInput
                    value={profile.goals}
                    onChange={(v) => setProfile((p) => ({ ...p, goals: v }))}
                  />
                </Field>

                <Field label="Preferred styles">
                  <ChipsInput
                    value={profile.preferredStyles}
                    onChange={(v) =>
                      setProfile((p) => ({ ...p, preferredStyles: v }))
                    }
                  />
                </Field>
              </div>
            </Card>

            {/* NEW: Onboarding & ML */}
            <Card
              title="Onboarding & ML"
              actions={
                <div className="flex gap-2">
                  <button
                    onClick={syncOnboardingFromML}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
                    title="Kéo trạng thái từ ML và lưu vào hồ sơ"
                  >
                    Sync từ ML
                  </button>
                  <button
                    onClick={toggleOnboardingCompleted}
                    className={cx(
                      "px-3 py-1.5 rounded-xl border",
                      onboarding.completed
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "hover:bg-gray-50"
                    )}
                    title="Đánh dấu đã hoàn tất onboarding"
                  >
                    {onboarding.completed ? "Đã hoàn tất" : "Chưa hoàn tất"}
                  </button>
                </div>
              }
            >
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm mb-2">
                    <span className="font-medium">levelHint (ML): </span>
                    <span className="opacity-80">
                      {onboarding.levelHint ?? "—"}
                      {mlStatus.levelHint != null
                        ? `  (ML=${mlStatus.levelHint})`
                        : ""}
                    </span>
                  </div>
                  <div className="text-sm mb-2">
                    <span className="font-medium">ML has answers? </span>
                    <span
                      className={
                        mlStatus.hasData ? "text-emerald-700" : "text-gray-500"
                      }
                    >
                      {mlStatus.hasData ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Updated at: </span>
                    <span className="opacity-80">
                      {onboarding.updatedAt
                        ? new Date(onboarding.updatedAt).toLocaleString()
                        : "—"}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">
                    Answers đã lưu:
                  </div>
                  <div className="rounded-xl border bg-gray-50 p-3 max-h-40 overflow-auto">
                    {renderAnswersPretty(onboarding.answers)}
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500">
                • Nút <b>Sync từ ML</b> sẽ gọi{" "}
                <code>/api/ml/onboarding-status</code> rồi lưu vào{" "}
                <code>/api/profile/onboarding</code>. <br />• Trường{" "}
                <code>profile.goals</code> vẫn chỉnh ở phần Learning Profile (ở
                trên).
              </div>
            </Card>
          </section>

          {/* Right: Widgets */}
          <aside className="space-y-6">
            <Card title="Ảnh đại diện">
              <div className="flex items-center gap-4">
                <img
                  src={
                    top.avatarUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      top.displayName || top.username || "User"
                    )}`
                  }
                  alt="avatar"
                  className="w-20 h-20 rounded-2xl object-cover border"
                />
                <div className="text-sm text-gray-600">
                  Dán link ảnh vào ô <b>Avatar URL</b> để thay đổi.
                </div>
              </div>
            </Card>

            <Card
              title="Practice Preference"
              actions={
                <button
                  onClick={patchPreferences}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Lưu
                </button>
              }
            >
              <div className="grid grid-cols-2 gap-3">
                <Field label="Session minutes">
                  <input
                    type="number"
                    className="mt-1 w-full px-3 py-2 border rounded-xl"
                    value={profile.practicePreference.sessionMinutes}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        practicePreference: {
                          ...p.practicePreference,
                          sessionMinutes: e.target.value,
                        },
                      }))
                    }
                  />
                </Field>
                <Field label="Days / week">
                  <input
                    type="number"
                    className="mt-1 w-full px-3 py-2 border rounded-xl"
                    value={profile.practicePreference.daysPerWeek}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        practicePreference: {
                          ...p.practicePreference,
                          daysPerWeek: e.target.value,
                        },
                      }))
                    }
                  />
                </Field>
              </div>
            </Card>

            <Card
              title="Progress"
              actions={
                <div className="flex gap-2">
                  <button
                    onClick={() => patchProgress({ completed: 1, total: 1 })}
                    className="px-3 py-1.5 rounded-xl border hover:bg-gray-50"
                  >
                    +1 bài
                  </button>
                </div>
              }
            >
              <div className="text-sm">
                <div>Completed: {profile.progress.completedLessons}</div>
                <div>Total: {profile.progress.totalLessons}</div>
                <div className="opacity-70">
                  Last active:{" "}
                  {new Date(profile.progress.lastActive).toLocaleString()}
                </div>
              </div>
            </Card>

            <Card
              title="Stats"
              actions={
                <div className="flex gap-2">
                  <button
                    onClick={() => patchStats({ quizzes: 1, minutes: 10 })}
                    className="px-3 py-1.5 rounded-xl border hover:bg-gray-50"
                  >
                    + Quiz / +10’
                  </button>
                  <button
                    onClick={() => patchStats({ accuracy: 0.9 })}
                    className="px-3 py-1.5 rounded-xl border hover:bg-gray-50"
                  >
                    Set Acc 0.9
                  </button>
                </div>
              }
            >
              <div className="text-sm">
                <div>Quizzes: {profile.stats.quizzesDone}</div>
                <div>Practice: {profile.stats.totalPracticeTime} phút</div>
                <div>
                  Accuracy: {(profile.stats.avgAccuracy * 100).toFixed(0)}%
                </div>
              </div>
            </Card>
          </aside>
        </div>

        {loading && (
          <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow p-4">Đang tải...</div>
          </div>
        )}
      </div>
    </div>
  );
}
