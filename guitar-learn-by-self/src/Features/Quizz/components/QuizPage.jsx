import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

/* ================= API base ================= */
const API_BASE =
  (typeof window !== "undefined" && window.__API_BASE__) ||
  (typeof process !== "undefined" &&
    process.env &&
    process.env.NEXT_PUBLIC_API_BASE) ||
  "http://localhost:3000/api";

/* =============== Small helpers =============== */
function Badge({ children, className = "" }) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] bg-neutral-100 border-neutral-200 text-neutral-700 " +
        "dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200 " +
        className
      }
    >
      {children}
    </span>
  );
}

function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800 ${className}`}
    />
  );
}

/* =============== Question Item =============== */
function QuestionCard({ q, value, onChange }) {
  return (
    <div
      className="rounded-2xl border p-5 bg-white/80 backdrop-blur-md shadow-sm transition hover:shadow-md
                    dark:bg-neutral-900/70 dark:border-neutral-800"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge className="uppercase tracking-wide">
            {q.type === "mc" ? "1 đáp án" : "Nhiều đáp án"}
          </Badge>
          <Badge>Độ khó: {q.difficulty || "—"}</Badge>
        </div>
        <div className="hidden sm:flex flex-wrap gap-1">
          {(q.tags || []).map((t) => (
            <Badge key={t}>{t}</Badge>
          ))}
        </div>
      </div>

      <p className="mt-3 text-lg font-semibold leading-6">{q.prompt}</p>

      <div className="mt-4 space-y-2">
        {q.options.map((opt, idx) => {
          const id = `${q.id}-${idx}`;
          const checked =
            q.type === "mc"
              ? Number(value) === idx
              : Array.isArray(value) && value.includes(idx);
          return (
            <label
              key={id}
              htmlFor={id}
              className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition
                dark:border-neutral-800
                ${
                  checked
                    ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800"
                    : "hover:bg-neutral-50 dark:hover:bg-neutral-800"
                }`}
            >
              {q.type === "mc" ? (
                <input
                  id={id}
                  type="radio"
                  name={`q-${q.id}`}
                  checked={checked}
                  onChange={() => onChange(q.id, idx)}
                  className="accent-indigo-600"
                />
              ) : (
                <input
                  id={id}
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => onChange(q.id, idx, e.target.checked)}
                  className="accent-indigo-600"
                />
              )}
              <span className="text-sm">{opt}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

/* =============== Main Page =============== */
export default function QuizPage() {
  const [step, setStep] = useState("setup"); // setup | running | result

  // filter state
  const [difficulty, setDifficulty] = useState("all");
  const [count, setCount] = useState(10);

  // tags state
  const [tagsLoading, setTagsLoading] = useState(false);
  const [tagsError, setTagsError] = useState(null);
  const [allTags, setAllTags] = useState([]); // [{name, count}]
  const [selectedTags, setSelectedTags] = useState(new Set());

  // attempt state
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [items, setItems] = useState([]);
  const [answers, setAnswers] = useState({});
  const [cursor, setCursor] = useState(0);
  const [result, setResult] = useState(null);

  const total = items.length;

  /* ---------- fetch tags from bank ---------- */
  useEffect(() => {
    let cancelled = false;
    async function loadTags() {
      try {
        setTagsLoading(true);
        setTagsError(null);
        const { data } = await axios.get(`${API_BASE}/quizz/bank?hideAnswer=1`);
        const list = Array.isArray(data?.questions) ? data.questions : [];
        const counter = new Map();
        list.forEach((q) => {
          (q.tags || []).forEach((t) => {
            const key = String(t).trim();
            if (!key) return;
            counter.set(key, (counter.get(key) || 0) + 1);
          });
        });
        const arr = Array.from(counter.entries())
          .map(([name, c]) => ({ name, count: c }))
          .sort((a, b) => a.name.localeCompare(b.name));
        if (!cancelled) setAllTags(arr);
      } catch (e) {
        if (!cancelled)
          setTagsError(
            e?.response?.data?.error ||
              e?.message ||
              "Không lấy được danh sách tags"
          );
      } finally {
        if (!cancelled) setTagsLoading(false);
      }
    }
    loadTags();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------- derived ---------- */
  const progressPct = useMemo(() => {
    if (!total) return 0;
    const answered = Object.keys(answers).length;
    return Math.round((answered / total) * 100);
  }, [answers, total]);

  const canSubmit = useMemo(() => {
    return total > 0 && Object.keys(answers).length === total;
  }, [answers, total]);

  const selectedTagsArray = useMemo(
    () => Array.from(selectedTags),
    [selectedTags]
  );

  /* ---------- actions ---------- */
  const toggleTag = (tag) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const clearTags = () => setSelectedTags(new Set());
  const selectAllTags = () =>
    setSelectedTags(new Set(allTags.map((t) => t.name)));

  const startQuiz = async () => {
    setLoading(true);
    setErr(null);
    setAnswers({});
    setResult(null);
    setCursor(0);
    try {
      const payload = {
        tags: selectedTagsArray,
        difficulty,
        count: Number(count) || 10,
      };
      const { data } = await axios.post(`${API_BASE}/quizz/attempts`, payload);
      setAttemptId(data.attemptId);
      setItems(Array.isArray(data.items) ? data.items : []);
      setStep("running");
    } catch (e) {
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.detail ||
        e?.message ||
        "Không tạo được đề thi";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  const changeAnswer = (qid, idx, checked) => {
    setAnswers((prev) => {
      const q = items.find((x) => x.id === qid);
      if (!q) return prev;
      if (q.type === "mc") {
        return { ...prev, [qid]: idx };
      } else {
        const cur = Array.isArray(prev[qid]) ? prev[qid].slice() : [];
        const pos = cur.indexOf(idx);
        if (checked && pos === -1) cur.push(idx);
        if (!checked && pos !== -1) cur.splice(pos, 1);
        cur.sort((a, b) => a - b);
        return { ...prev, [qid]: cur };
      }
    });
  };

  const submitQuiz = async () => {
    if (!attemptId) return;
    setLoading(true);
    setErr(null);
    try {
      const payload = {
        answers: items.map((q) => ({
          id: q.id,
          value: answers[q.id] ?? null,
        })),
      };
      const { data } = await axios.post(
        `${API_BASE}/quizz/attempts/${attemptId}/submit`,
        payload
      );
      setResult(data);
      setStep("result");
    } catch (e) {
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.detail ||
        e?.message ||
        "Nộp bài thất bại";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- UI ---------- */
  return (
    <div className="relative w-[80%] min-h-screen mx-auto">
      {/* subtle background pattern */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50 via-white to-white
                   dark:from-indigo-950/30 dark:via-neutral-950 dark:to-neutral-950"
      />

      <div className="relative max-w-6xl mx-auto p-4 md:p-6 text-neutral-900 dark:text-neutral-100">
        {/* HERO */}
        <div
          className="mb-5 rounded-3xl border bg-white/70 backdrop-blur-md p-5 shadow-sm
                        dark:bg-neutral-900/50 dark:border-neutral-800"
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Quiz luyện lý thuyết Guitar
              </h1>
              <p className="mt-1 text-sm opacity-70">
                Chọn chủ đề & độ khó → hệ thống tạo đề ngẫu nhiên. Làm bài theo
                từng câu, nộp để xem kết quả.
              </p>
            </div>
            {step === "running" && (
              <div className="w-full sm:w-80">
                <div className="text-xs mb-1 text-right opacity-70">
                  Tiến độ: {progressPct}%
                </div>
                <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* setup */}
        {step === "setup" && (
          <section className="space-y-5">
            {/* TAGS */}
            <div
              className="rounded-3xl border p-5 bg-white/80 backdrop-blur-md shadow-sm
                            dark:bg-neutral-900/60 dark:border-neutral-800"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold">Chủ đề (Tags)</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={selectAllTags}
                    className="px-3 py-1.5 text-xs rounded-lg border hover:bg-neutral-50
                               dark:border-neutral-700 dark:hover:bg-neutral-800"
                    disabled={!allTags.length}
                  >
                    Chọn tất cả
                  </button>
                  <button
                    onClick={clearTags}
                    className="px-3 py-1.5 text-xs rounded-lg border hover:bg-neutral-50
                               dark:border-neutral-700 dark:hover:bg-neutral-800"
                    disabled={!selectedTags.size}
                  >
                    Xoá chọn
                  </button>
                </div>
              </div>

              {tagsLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-8" />
                  ))}
                </div>
              ) : tagsError ? (
                <div
                  className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-800
                                dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                >
                  {tagsError}
                </div>
              ) : allTags.length === 0 ? (
                <div className="text-sm opacity-70">
                  Chưa có tag nào trong ngân hàng câu hỏi.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {allTags.map((t) => {
                    const active = selectedTags.has(t.name);
                    return (
                      <button
                        key={t.name}
                        onClick={() => toggleTag(t.name)}
                        className={`px-3 py-1.5 rounded-full border text-sm transition
                          ${
                            active
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                              : "bg-white/70 text-neutral-800 border-neutral-300 hover:bg-neutral-50 dark:bg-neutral-900/70 dark:text-neutral-200 dark:border-neutral-700 dark:hover:bg-neutral-800"
                          }`}
                      >
                        {t.name}
                        <span
                          className={`ml-2 inline-block rounded-full px-2 py-0.5 text-[11px] border
                            ${
                              active
                                ? "border-white/40 bg-white/20"
                                : "border-neutral-300 dark:border-neutral-700"
                            }`}
                        >
                          {t.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Difficulty + Count + Start */}
            <div
              className="rounded-3xl border p-5 bg-white/80 backdrop-blur-md shadow-sm
                            dark:bg-neutral-900/60 dark:border-neutral-800"
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Độ khó</label>
                  <select
                    className="mt-1 w-full rounded-xl border px-3 py-2 bg-white/90
                               dark:bg-neutral-900 dark:border-neutral-700"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Số câu</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    className="mt-1 w-full rounded-xl border px-3 py-2 bg-white/90
                               dark:bg-neutral-900 dark:border-neutral-700"
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value || 10))}
                  />
                </div>
              </div>

              {err && (
                <div
                  className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-800
                                dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                >
                  {err}
                </div>
              )}

              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={startQuiz}
                  disabled={loading}
                  className={`px-5 py-2.5 rounded-xl text-white shadow-sm
                    ${
                      loading
                        ? "bg-gray-400"
                        : "bg-indigo-600 hover:bg-indigo-700"
                    }`}
                >
                  {loading ? "Đang tạo đề..." : "Bắt đầu làm bài"}
                </button>
                {selectedTags.size > 0 && (
                  <span className="text-sm opacity-70">
                    Đang chọn: {selectedTagsArray.join(", ")}
                  </span>
                )}
              </div>
            </div>
          </section>
        )}

        {/* running */}
        {step === "running" && (
          <section className="space-y-5">
            {err && (
              <div
                className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-800
                              dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
              >
                {err}
              </div>
            )}

            {/* Question */}
            {items[cursor] ? (
              <QuestionCard
                q={items[cursor]}
                value={answers[items[cursor].id]}
                onChange={(qid, idx, checked) =>
                  changeAnswer(qid, idx, checked)
                }
              />
            ) : (
              <Skeleton className="h-64" />
            )}

            {/* Navigation row */}
            <div className="flex items-center justify-between gap-3">
              <button
                className="px-3 py-2 rounded-xl border bg-white/80 hover:bg-neutral-50
                           dark:bg-neutral-900/70 dark:border-neutral-800 dark:hover:bg-neutral-800"
                onClick={() => setCursor((c) => Math.max(0, c - 1))}
                disabled={cursor <= 0}
              >
                ◀ Trước
              </button>

              <div
                className="flex items-center gap-2 overflow-x-auto px-2 py-1 rounded-xl border
                              bg-white/60 dark:bg-neutral-900/60 dark:border-neutral-800"
              >
                {items.map((_, i) => {
                  const answered = answers[items[i].id] !== undefined;
                  const isCurrent = i === cursor;
                  return (
                    <button
                      key={i}
                      onClick={() => setCursor(i)}
                      className={`w-8 h-8 shrink-0 rounded-full text-sm border transition
                        ${
                          isCurrent
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : answered
                            ? "bg-emerald-100 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300"
                            : "bg-white/70 border-neutral-200 dark:bg-neutral-900/70 dark:border-neutral-800"
                        }`}
                      title={`Câu ${i + 1}`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>

              {canSubmit ? (
                <button
                  className="px-4 py-2 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                  onClick={submitQuiz}
                  disabled={loading}
                >
                  {loading ? "Đang nộp..." : "Nộp bài"}
                </button>
              ) : (
                <button
                  className="px-3 py-2 rounded-xl border bg-white/80 hover:bg-neutral-50
                             dark:bg-neutral-900/70 dark:border-neutral-800 dark:hover:bg-neutral-800"
                  onClick={() => setCursor((c) => Math.min(total - 1, c + 1))}
                  disabled={cursor >= total - 1}
                >
                  Tiếp ▶
                </button>
              )}
            </div>
          </section>
        )}

        {/* result */}
        {step === "result" && result && (
          <section className="space-y-5">
            <div
              className="rounded-3xl border p-5 bg-white/80 backdrop-blur-md shadow-sm
                            dark:bg-neutral-900/60 dark:border-neutral-800"
            >
              <div className="text-lg font-semibold">
                Kết quả: {result.score}/{result.total}
              </div>
              <p className="mt-1 text-sm opacity-70">
                Luyện tiếp để nhớ lâu hơn nhé 🎸
              </p>
            </div>

            <div className="space-y-4">
              {Array.isArray(result.detail) &&
                result.detail.map((d, i) => {
                  const snap = items.find((q) => q.id === d.qid);
                  const correct = d.correct;
                  return (
                    <div
                      key={d.qid}
                      className={`rounded-2xl border p-4 transition
                        ${
                          correct
                            ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/15"
                            : "border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-900/15"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">
                          {i + 1}. {snap?.prompt || d.qid}
                        </div>
                        <Badge
                          className={
                            correct
                              ? "bg-emerald-100 dark:bg-emerald-900/40"
                              : "bg-rose-100 dark:bg-rose-900/40"
                          }
                        >
                          {correct ? "Đúng" : "Sai"}
                        </Badge>
                      </div>
                      {snap && (
                        <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                          {snap.options.map((opt, idx) => {
                            const picked =
                              snap.type === "mc"
                                ? d.picked === idx
                                : Array.isArray(d.picked) &&
                                  d.picked.includes(idx);
                            return (
                              <li
                                key={idx}
                                className={picked ? "font-medium" : ""}
                              >
                                • {opt} {picked ? "— bạn chọn" : ""}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                      {!!d.explanation && (
                        <div className="mt-2 text-sm opacity-85">
                          <span className="font-medium">Giải thích:</span>{" "}
                          {d.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            <div className="flex items-center gap-3">
              <button
                className="px-4 py-2 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700"
                onClick={() => setStep("setup")}
              >
                Làm bài mới
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
