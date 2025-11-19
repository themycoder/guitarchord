import React, { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "../utils/api";

function OptionLines({ value = [], onChange }) {
  const [text, setText] = useState((value || []).join("\n"));
  useEffect(() => {
    setText((value || []).join("\n"));
  }, [value]);
  return (
    <textarea
      className="w-full border rounded px-3 py-2 font-mono text-sm"
      rows={5}
      placeholder={"Mỗi dòng 1 đáp án\nBridge\nTuner\nSound hole"}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onChange(e.target.value.split("\n"));
      }}
    />
  );
}

function TagsInput({ value = [], onChange }) {
  const [text, setText] = useState((value || []).join(", "));
  useEffect(() => {
    setText((value || []).join(", "));
  }, [value]);
  return (
    <input
      className="w-full border rounded px-3 py-2"
      placeholder="parts, orientation"
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        const arr = e.target.value
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        onChange(arr);
      }}
    />
  );
}

export default function QuizAdmin() {
  const [lessons, setLessons] = useState([]);
  const [lessonId, setLessonId] = useState("");
  const [quizzes, setQuizzes] = useState([]);
  const [preview, setPreview] = useState(null); // xem trước quiz
  const [editing, setEditing] = useState(null); // form sửa
  const [bulkText, setBulkText] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const hasNext = useMemo(() => page * limit < total, [page, limit, total]);

  async function loadLessons() {
    setLoading(true);
    setMsg("");
    try {
      const data = await apiGet(
        `/api/lesson?limit=200&fields=title,topic,level`
      );
      const arr = (data.items || []).map((x) => ({
        id: x._id || x.id,
        title: x.title,
        topic: x.topic,
        level: x.level,
      }));
      setLessons(arr);
    } catch (e) {
      setMsg(e.message || "Lỗi tải lessons");
    } finally {
      setLoading(false);
    }
  }

  async function loadQuizzes(p = 1) {
    if (!lessonId) return;
    setLoading(true);
    setMsg("");
    try {
      const params = new URLSearchParams();
      params.set("lessonId", lessonId);
      params.set("page", String(p));
      params.set("limit", String(limit));
      if (q.trim()) params.set("q", q.trim());
      const data = await apiGet(`/api/quiz?${params.toString()}`);
      setQuizzes(data.items || data || []);
      setTotal(data.total ?? (data.items ? data.items.length : 0));
      setPage(data.page || 1);
    } catch (e) {
      setMsg(e.message || "Lỗi tải quizzes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLessons();
  }, []);
  useEffect(() => {
    if (lessonId) loadQuizzes(1);
  }, [lessonId]);

  function newQuiz() {
    if (!lessonId) return;
    setEditing({
      lessonId,
      quizId: "",
      type: "single",
      question: "",
      options: [],
      correctIndex: 0,
      correctIndices: [],
      answerText: "",
      difficulty: 1,
      tags: [],
      explanation: "",
    });
    setPreview(null);
  }

  async function saveQuiz() {
    try {
      setLoading(true);
      setMsg("");
      const payload = { ...editing, lessonId };
      if (
        payload.type === "multi" &&
        typeof payload.correctIndices === "string"
      ) {
        payload.correctIndices = payload.correctIndices
          .split(",")
          .map((s) => Number(s.trim()))
          .filter((n) => Number.isFinite(n));
      }
      if (
        (payload.type === "single" || payload.type === "truefalse") &&
        typeof payload.correctIndex === "string"
      ) {
        payload.correctIndex = Number(payload.correctIndex);
      }

      if (editing._id) {
        await apiPut(`/api/quiz/${editing._id}`, payload);
      } else {
        const resp = await apiPost(`/api/quiz`, payload);
        setEditing(resp.quiz);
      }

      await loadQuizzes(page);
      setMsg("Đã lưu quiz.");
    } catch (e) {
      setMsg(e.message || "Lỗi lưu quiz");
    } finally {
      setLoading(false);
    }
  }

  async function deleteQuiz(id) {
    if (!confirm("Xoá quiz này?")) return;
    try {
      setLoading(true);
      setMsg("");
      await apiDelete(`/api/quiz/${id}`);
      await loadQuizzes(1);
      if (editing && editing._id === id) setEditing(null);
      if (preview && preview._id === id) setPreview(null);
    } catch (e) {
      setMsg(e.message || "Lỗi xoá quiz");
    } finally {
      setLoading(false);
    }
  }

  async function bulkInsert() {
    try {
      setLoading(true);
      setMsg("");
      let items = JSON.parse(bulkText || "[]");
      if (!Array.isArray(items) || items.length === 0) {
        setMsg("JSON rỗng hoặc không phải mảng.");
        setLoading(false);
        return;
      }
      await apiPost(`/api/quiz/bulk`, { lessonId, items });
      setBulkText("");
      await loadQuizzes(1);
      setMsg(`Đã thêm ${items.length} quiz.`);
    } catch (e) {
      setMsg(e.message || "Lỗi bulk insert");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Quiz Admin</h1>
        <div className="flex gap-2">
          <button
            className="px-3 py-2 rounded bg-black text-white disabled:opacity-50"
            onClick={newQuiz}
            disabled={!lessonId}
          >
            + New Quiz
          </button>
        </div>
      </div>

      {/* chọn lesson + filter */}
      <div className="grid md:grid-cols-4 gap-3 mb-4">
        <select
          className="border rounded px-3 py-2"
          value={lessonId}
          onChange={(e) => setLessonId(e.target.value)}
        >
          <option value="">-- Chọn bài học --</option>
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title} • {l.topic} • Lv {l.level}
            </option>
          ))}
        </select>
        <input
          className="border rounded px-3 py-2"
          placeholder="Tìm theo quizId / question / tag"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          className="px-3 py-2 rounded border"
          onClick={() => loadQuizzes(1)}
        >
          Lọc
        </button>
        <button
          className="px-3 py-2 rounded border"
          onClick={() => {
            setQ("");
            loadQuizzes(1);
          }}
        >
          Xoá lọc
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* List + preview */}
        <div className="rounded-2xl border p-3">
          <div className="font-semibold mb-2">Danh sách Quiz</div>
          {!lessonId ? (
            <div className="text-gray-500">Chọn bài học trước.</div>
          ) : quizzes.length === 0 ? (
            <div className="text-gray-500">Chưa có quiz.</div>
          ) : (
            <ul className="divide-y">
              {quizzes.map((q) => (
                <li
                  key={q._id}
                  className="py-3 flex items-start justify-between"
                >
                  <div>
                    <div className="text-xs text-gray-500">
                      {q.quizId} • {q.type} • diff {q.difficulty}
                    </div>
                    <div className="font-medium">{q.question}</div>
                    {Array.isArray(q.options) && q.options.length > 0 && (
                      <ul className="list-disc pl-5 text-sm text-gray-700 mt-1">
                        {q.options.map((op, i) => (
                          <li key={i}>
                            {i}. {op}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      className="text-blue-600"
                      onClick={() => {
                        setPreview(q);
                      }}
                    >
                      Xem
                    </button>
                    <button
                      className="text-amber-600"
                      onClick={() => {
                        setEditing(q);
                        setPreview(null);
                      }}
                    >
                      Sửa
                    </button>
                    <button
                      className="text-red-600"
                      onClick={() => deleteQuiz(q._id)}
                    >
                      Xoá
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* pagination */}
          <div className="flex items-center gap-2 mt-3">
            <button
              className="px-3 py-1 rounded border"
              disabled={page <= 1}
              onClick={() => loadQuizzes(page - 1)}
            >
              ← Trước
            </button>
            <div className="text-sm text-gray-600">
              Trang {page} • Tổng {total}
            </div>
            <button
              className="px-3 py-1 rounded border"
              disabled={!hasNext}
              onClick={() => loadQuizzes(page + 1)}
            >
              Sau →
            </button>
          </div>

          {/* Preview panel */}
          {preview && (
            <div className="mt-4 rounded-xl border p-3 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="font-semibold">Xem trước</div>
                <button
                  className="text-sm text-gray-600"
                  onClick={() => setPreview(null)}
                >
                  Đóng
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {preview.quizId} • {preview.type} • diff {preview.difficulty}
              </div>
              <div className="mt-2 font-medium">{preview.question}</div>
              {Array.isArray(preview.options) && preview.options.length > 0 && (
                <div className="mt-2 space-y-2">
                  {preview.options.map((op, i) => (
                    <label key={i} className="flex gap-2 items-center">
                      <input
                        type={preview.type === "multi" ? "checkbox" : "radio"}
                        disabled
                      />
                      <span>{op}</span>
                    </label>
                  ))}
                </div>
              )}
              {preview.explanation && (
                <div className="mt-2 text-sm text-gray-600">
                  Giải thích: {preview.explanation}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="rounded-2xl border p-3">
          <div className="font-semibold mb-2">Editor</div>
          {!editing ? (
            <div className="text-gray-500">
              Chọn “Sửa” một quiz hoặc bấm “+ New Quiz”.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <input
                  className="border rounded px-3 py-2"
                  placeholder="quizId (vd: Q-GUITAR-INTRO-1)"
                  value={editing.quizId || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, quizId: e.target.value })
                  }
                />
                <select
                  className="border rounded px-3 py-2"
                  value={editing.type}
                  onChange={(e) =>
                    setEditing({ ...editing, type: e.target.value })
                  }
                >
                  <option value="single">single</option>
                  <option value="truefalse">truefalse</option>
                  <option value="multi">multi</option>
                  <option value="text">text</option>
                </select>
              </div>

              <textarea
                className="w-full border rounded px-3 py-2"
                rows={3}
                placeholder="Câu hỏi"
                value={editing.question || ""}
                onChange={(e) =>
                  setEditing({ ...editing, question: e.target.value })
                }
              />

              {(editing.type === "single" ||
                editing.type === "multi" ||
                editing.type === "truefalse") && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">
                    Đáp án (mỗi dòng 1 đáp án)
                  </div>
                  <OptionLines
                    value={editing.options || []}
                    onChange={(opts) =>
                      setEditing({ ...editing, options: opts })
                    }
                  />
                </div>
              )}

              {(editing.type === "single" || editing.type === "truefalse") && (
                <input
                  className="w-full border rounded px-3 py-2"
                  type="number"
                  min={0}
                  placeholder="correctIndex (vd: 1)"
                  value={editing.correctIndex ?? 0}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      correctIndex: Number(e.target.value),
                    })
                  }
                />
              )}

              {editing.type === "multi" && (
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="correctIndices (vd: 0,2)"
                  onChange={(e) =>
                    setEditing({ ...editing, correctIndices: e.target.value })
                  }
                />
              )}

              {editing.type === "text" && (
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="answerText (đáp án dạng text)"
                  value={editing.answerText || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, answerText: e.target.value })
                  }
                />
              )}

              <div className="grid grid-cols-3 gap-3">
                <input
                  className="border rounded px-3 py-2"
                  type="number"
                  min={1}
                  max={5}
                  placeholder="difficulty 1..5"
                  value={editing.difficulty ?? 1}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      difficulty: Number(e.target.value),
                    })
                  }
                />
                <TagsInput
                  value={editing.tags || []}
                  onChange={(tags) => setEditing({ ...editing, tags })}
                />
                <input
                  className="border rounded px-3 py-2"
                  placeholder="lessonId (readonly)"
                  value={lessonId}
                  readOnly
                />
              </div>

              <textarea
                className="w-full border rounded px-3 py-2"
                rows={2}
                placeholder="Giải thích"
                value={editing.explanation || ""}
                onChange={(e) =>
                  setEditing({ ...editing, explanation: e.target.value })
                }
              />

              <div className="flex gap-2">
                <button
                  className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
                  onClick={saveQuiz}
                  disabled={loading || !lessonId}
                >
                  Lưu
                </button>
                {editing._id ? (
                  <button
                    className="px-4 py-2 rounded border"
                    onClick={() => setEditing(null)}
                    disabled={loading}
                  >
                    Huỷ
                  </button>
                ) : null}
              </div>
            </div>
          )}

          {/* Bulk JSON */}
          <div className="mt-6">
            <div className="font-semibold">Bulk JSON</div>
            <textarea
              className="w-full border rounded px-3 py-2 font-mono text-sm"
              rows={8}
              placeholder='[{"quizId":"Q-1","type":"single","question":"...","options":["A","B"],"correctIndex":1}]'
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
            />
            <button
              className="mt-2 px-4 py-2 rounded border"
              onClick={bulkInsert}
              disabled={!lessonId || loading}
            >
              Bulk insert
            </button>
          </div>
        </div>
      </div>

      {msg && <div className="mt-4 text-sm text-gray-600">{msg}</div>}
    </div>
  );
}
