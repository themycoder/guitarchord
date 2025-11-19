import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/* ===== API config ===== */
const API_BASE =
  (typeof window !== "undefined" && window.__API_BASE__) ||
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL) ||
  "http://localhost:3000";
const TOKENS_KEY = "auth_tokens_v1";

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
async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}
async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

/* ===== Quiz item ===== */
function QuizBlock({ quiz, value, onChange }) {
  return (
    <div className="rounded-2xl border p-4 mb-4">
      <div className="flex gap-2 items-center mb-2">
        <span className="text-xs px-2 py-0.5 rounded bg-gray-100">
          {quiz.type}
        </span>
        {quiz.difficulty ? (
          <span className="text-xs text-gray-500">
            Độ khó: {quiz.difficulty}
          </span>
        ) : null}
      </div>

      <p className="font-medium mb-2">{quiz.question}</p>
      {quiz.media?.image && (
        <img
          src={quiz.media.image}
          alt="quiz"
          className="max-h-40 rounded mb-3"
        />
      )}

      {(quiz.type === "single" || quiz.type === "truefalse") && (
        <div className="space-y-2">
          {(quiz.options || []).map((opt, idx) => (
            <label key={idx} className="flex gap-2 items-center cursor-pointer">
              <input
                type="radio"
                name={quiz.quizId}
                checked={value?.choiceIndex === idx}
                onChange={() => onChange(quiz.quizId, { choiceIndex: idx })}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      )}

      {quiz.type === "multi" && (
        <div className="space-y-2">
          {(quiz.options || []).map((opt, idx) => {
            const set = new Set(value?.choiceIndices || []);
            const checked = set.has(idx);
            return (
              <label
                key={idx}
                className="flex gap-2 items-center cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    if (e.target.checked) set.add(idx);
                    else set.delete(idx);
                    onChange(quiz.quizId, { choiceIndices: Array.from(set) });
                  }}
                />
                <span>{opt}</span>
              </label>
            );
          })}
        </div>
      )}

      {quiz.type === "text" && (
        <textarea
          className="w-full border rounded p-2"
          rows={3}
          placeholder="Nhập câu trả lời..."
          value={value?.text || ""}
          onChange={(e) => onChange(quiz.quizId, { text: e.target.value })}
        />
      )}
    </div>
  );
}

/* ===== Render lesson blocks ===== */
function LessonBlocks({ blocks }) {
  if (!blocks || blocks.length === 0) return null;
  return (
    <div className="prose max-w-none">
      {blocks.map((b, i) => {
        if (b.type === "heading") {
          const L = Math.min(Math.max(b.level || 2, 1), 3);
          const Tag = `h${L}`;
          return (
            <Tag key={i} className="mt-6">
              {b.text}
            </Tag>
          );
        }
        if (b.type === "paragraph") return <p key={i}>{b.text}</p>;
        if (b.type === "list") {
          return b.ordered ? (
            <ol key={i} className="list-decimal pl-6 space-y-1">
              {(b.items || []).map((li, idx) => (
                <li key={idx}>{li}</li>
              ))}
            </ol>
          ) : (
            <ul key={i} className="list-disc pl-6 space-y-1">
              {(b.items || []).map((li, idx) => (
                <li key={idx}>{li}</li>
              ))}
            </ul>
          );
        }
        if (b.type === "image") {
          return (
            <figure key={i} className="my-4">
              <img src={b.src} alt={b.alt || "image"} className="rounded-xl" />
              {b.caption ? (
                <figcaption className="text-sm text-gray-500 mt-2">
                  {b.caption}
                </figcaption>
              ) : null}
            </figure>
          );
        }
        if (b.type === "code") {
          return (
            <pre
              key={i}
              className="bg-gray-900 text-gray-100 rounded-xl p-4 overflow-auto"
            >
              <code>{b.text}</code>
            </pre>
          );
        }
        if (b.type === "callout") {
          return (
            <div
              key={i}
              className="border-l-4 border-indigo-500 bg-indigo-50 p-3 rounded-r-xl my-3"
            >
              <p className="m-0">{b.text}</p>
            </div>
          );
        }
        if (b.type === "divider") return <hr key={i} className="my-6" />;
        if (b.type === "table") {
          return (
            <div key={i} className="overflow-auto my-3">
              <table className="min-w-[400px] border border-gray-200 rounded-xl overflow-hidden">
                <tbody>
                  {(b.rows || []).map((row, r) => (
                    <tr key={r} className="odd:bg-gray-50">
                      {row.map((cell, c) => (
                        <td
                          key={c}
                          className="px-3 py-2 border border-gray-200"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        if (b.type === "video") {
          return (
            <div key={i} className="my-3">
              <video className="w-full rounded-xl" src={b.src} controls />
              {b.caption ? (
                <div className="text-sm text-gray-500 mt-1">{b.caption}</div>
              ) : null}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

/* ===== Main: dùng ML API mới /api/ml/* ===== */
export default function LessonRunner() {
  const [loading, setLoading] = useState(false);
  const [lesson, setLesson] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [answers, setAnswers] = useState({});
  const [checkResult, setCheckResult] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [queue, setQueue] = useState([]); // danh sách bài gợi ý (full lesson)
  const [currentIndex, setCurrentIndex] = useState(0);

  const startedAtRef = useRef(0);

  const quizArr = Array.isArray(quizzes) ? quizzes : [];
  const canSubmit = useMemo(() => !!checkResult, [checkResult]);

  const onChangeAnswer = useCallback((qid, val) => {
    setAnswers((prev) => ({
      ...prev,
      [qid]: { ...(prev[qid] || {}), ...val },
    }));
  }, []);

  const loadQuizzesAndLogView = useCallback(async (doc) => {
    if (!doc) return;
    setLoading(true);
    setStatusMsg("");
    setCheckResult(null);
    setAnswers({});
    try {
      setLesson(doc);

      // load quiz của bài
      const qs = await apiGet(`/api/quiz?lessonId=${doc._id}`);
      setQuizzes(Array.isArray(qs) ? qs : qs?.items ?? []);

      // log event xem bài
      await apiPost(`/api/events`, {
        lessonId: doc._id,
        type: "view",
        progress: 0.1,
        score: 1,
      });

      startedAtRef.current = Date.now();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      console.error(e);
      setStatusMsg(e.message || "Lỗi tải bài học");
    } finally {
      setLoading(false);
    }
  }, []);

  const dedupeById = (arr) => {
    const seen = new Set();
    const out = [];
    for (const it of arr) {
      const key = (it.id || it._id || "") + "";
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(it);
    }
    return out;
  };

  const fetchInitialQueue = useCallback(async () => {
    setLoading(true);
    setStatusMsg("");
    try {
      const data = await apiPost(`/api/ml/recommend`, { k: 10 });
      const items = Array.isArray(data?.items) ? data.items : [];
      const uniq = dedupeById(items);
      setQueue(uniq);
      if (uniq.length > 0) {
        setCurrentIndex(0);
        await loadQuizzesAndLogView(uniq[0]);
      } else {
        setStatusMsg(
          "Chưa có gợi ý phù hợp. Hãy cập nhật mục tiêu học hoặc thêm nội dung."
        );
      }
    } catch (e) {
      console.error(e);
      setStatusMsg(e.message || "Lỗi lấy gợi ý bài học");
    } finally {
      setLoading(false);
    }
  }, [loadQuizzesAndLogView]);


  // Lần đầu: lấy danh sách gợi ý
  useEffect(() => {
    fetchInitialQueue();
  }, [fetchInitialQueue]);

  // Chấm quiz (không bắt buộc để sang bài)
  const handleCheck = useCallback(async () => {
    if (!lesson) return;
    const payload = {
      lessonId: lesson._id,
      answers: Object.entries(answers).map(([qid, v]) => ({ qid, ...v })),
    };
    setLoading(true);
    setStatusMsg("");
    try {
      const result = await apiPost(`/api/quiz/check`, payload);
      setCheckResult(result);
    } catch (e) {
      console.error(e);
      setStatusMsg(e.message || "Lỗi chấm quiz");
    } finally {
      setLoading(false);
    }
  }, [lesson, answers]);

  // Gửi normalized (tuỳ chọn)
  const handleSubmitNormalized = useCallback(async () => {
    if (!lesson || !checkResult) return;
    const durationSec = Math.max(
      1,
      Math.floor((Date.now() - (startedAtRef.current || Date.now())) / 1000)
    );
    const payload = {
      lessonId: lesson._id,
      answers: checkResult?.normalized || [],
      durationSec,
    };
    setLoading(true);
    setStatusMsg("");
    try {
      const resp = await apiPost(`/api/quiz/submit`, payload);
      setStatusMsg(
        `Kết quả: ${Math.round((resp?.passRate ?? 0) * 100)}% – ${
          resp?.pass ? "Đạt" : "Chưa đạt"
        }`
      );
    } catch (e) {
      console.error(e);
      setStatusMsg(e.message || "Lỗi submit quiz");
    } finally {
      setLoading(false);
    }
  }, [lesson, checkResult]);

  // Điều hướng bài trước / tiếp theo
  const goToIndex = useCallback(
    async (idx) => {
      if (idx < 0) return;
      if (idx >= queue.length) {
        try {
          setLoading(true);
          const data = await apiPost(`/api/ml/recommend`, { k: 10 });
          const items = Array.isArray(data?.items) ? data.items : [];
          const uniq = dedupeById(items);
          if (uniq.length === 0) {
            setStatusMsg("Hết danh sách gợi ý. Hãy quay lại sau nhé!");
            return;
          }
          setQueue(uniq);
          setCurrentIndex(0);
          await loadQuizzesAndLogView(uniq[0]);
        } catch (e) {
          setStatusMsg(e.message || "Lỗi lấy thêm gợi ý");
        } finally {
          setLoading(false);
        }
        return;
      }
      setCurrentIndex(idx);
      await loadQuizzesAndLogView(queue[idx]);
    },
    [queue, loadQuizzesAndLogView]
  );


  const handlePrev = useCallback(() => {
    goToIndex(currentIndex - 1);
  }, [currentIndex, goToIndex]);

  const handleNext = useCallback(() => {
    goToIndex(currentIndex + 1);
  }, [currentIndex, goToIndex]);

  return (
    <div className="mx-auto p-4 md:p-6 max-w-7xl">
      {/* Layout: Sidebar + Main */}
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
        {/* Sidebar gợi ý */}
        <aside className="md:sticky md:top-4 h-max">
          <div className="border rounded-2xl bg-white">
            <div className="px-4 py-3 border-b font-semibold">
              Lộ trình gợi ý
            </div>
            <div className="max-h-[70vh] overflow-auto p-2">
              {queue.length === 0 ? (
                <div className="text-sm text-gray-500 px-2 py-3">
                  Chưa có gợi ý.
                </div>
              ) : (
                queue.map((it, idx) => {
                  const active = idx === currentIndex;
                  return (
                    <button
                      key={it._id || idx}
                      onClick={() => goToIndex(idx)}
                      className={`w-full text-left px-3 py-2 rounded-xl mb-1 border ${
                        active
                          ? "bg-indigo-50 border-indigo-200"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="text-xs text-gray-500">
                        {it.topic} • Lv {it.level}
                      </div>
                      <div className="text-sm font-medium line-clamp-2">
                        {it.title}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        score {Number(it.score ?? 0).toFixed(2)}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main>
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <div className="text-xs text-gray-500">Lesson</div>
              <h1 className="text-2xl md:text-3xl font-bold">
                {lesson?.title || "Đang tải..."}
              </h1>
              {lesson?.summary ? (
                <p className="text-gray-600 mt-2">{lesson.summary}</p>
              ) : null}
              {lesson?.tags && lesson.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {lesson.tags.map((t, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 rounded-full bg-gray-100"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="text-right">
              <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                Topic: {lesson?.topic || "-"}
              </span>
              <div className="mt-2 text-sm text-gray-500">
                Level: {lesson?.level ?? "-"}
              </div>
            </div>
          </div>

          {/* Blocks */}
          <section className="bg-white rounded-2xl shadow-sm border p-4 md:p-6 mb-6">
            {lesson ? (
              <LessonBlocks blocks={lesson.blocks} />
            ) : (
              <div className="text-gray-500">Đang tải nội dung...</div>
            )}
          </section>

          {/* Quiz (tùy chọn làm – không bắt buộc) */}
          <section className="bg-white rounded-2xl shadow-sm border p-4 md:p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold">Quiz kiểm tra</h2>
              <div className="text-sm text-gray-500">{quizArr.length} câu</div>
            </div>

            {quizArr.length === 0 ? (
              <div className="text-gray-500">
                Bài này chưa có quiz. Bạn có thể chuyển sang bài khác.
              </div>
            ) : (
              <div>
                {quizArr.map((q) => (
                  <QuizBlock
                    key={q._id}
                    quiz={q}
                    value={answers[q.quizId]}
                    onChange={onChangeAnswer}
                  />
                ))}
                <div className="flex gap-3">
                  <button
                    onClick={handleCheck}
                    className="px-4 py-2 rounded-xl bg-gray-900 text-white hover:opacity-90 disabled:opacity-50"
                    disabled={loading}
                  >
                    Chấm điểm
                  </button>
                  <button
                    onClick={handleSubmitNormalized}
                    className="px-4 py-2 rounded-xl border hover:bg-gray-50 disabled:opacity-50"
                    disabled={loading || !canSubmit}
                  >
                    Gửi kết quả
                  </button>
                </div>
                {checkResult?.results && (
                  <div className="mt-4 p-3 rounded-xl bg-gray-50 border">
                    <div className="font-medium">
                      Kết quả: {Math.round((checkResult.passRate ?? 0) * 100)}%
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {checkResult.results.filter((r) => r.correct).length}/
                      {checkResult.results.length} câu đúng
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Navigation Prev / Next */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handlePrev}
              className="px-4 py-2 rounded-xl border hover:bg-gray-50 disabled:opacity-50"
              disabled={loading || currentIndex <= 0}
              title="Bài học trước"
            >
              ← Bài học trước
            </button>

            {statusMsg && (
              <span className="text-sm text-gray-600">{statusMsg}</span>
            )}

            <button
              onClick={handleNext}
              className="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              disabled={loading}
              title="Bài học tiếp theo"
            >
              Bài học tiếp theo →
            </button>
          </div>

          {loading && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl shadow p-4">
                Đang xử lý...
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
