"use client";

import React, { useMemo, useState } from "react";
import axios from "axios";

// API_BASE: ưu tiên env, fallback "/api"
const API_BASE =
  (typeof window !== "undefined" && window.__API_BASE__) ||
  (typeof process !== "undefined" &&
    process.env &&
    process.env.NEXT_PUBLIC_API_BASE) ||
  "http://localhost:3000/api";


function toTagsArray(input) {
  if (!input) return [];
  return String(input)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function QuestionEditor() {
  const [form, setForm] = useState({
    id: "",
    type: "mc", // "mc" | "multi"
    difficulty: "easy", // "easy" | "medium" | "hard"
    tags: "", // comma separated
    prompt: "",
    options: ["", ""], // tối thiểu 2 option để tránh invalid
    answerSingle: 0, // for mc
    answerMulti: [], // for multi
    explanation: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  const canSubmit = useMemo(() => {
    const hasId = form.id.trim().length > 0;
    const hasPrompt = form.prompt.trim().length > 0;
    const validOptions =
      form.options.length >= 2 &&
      form.options.every((opt) => opt.trim().length > 0);

    if (!hasId || !hasPrompt || !validOptions) return false;

    if (form.type === "mc") {
      return (
        typeof form.answerSingle === "number" &&
        form.answerSingle >= 0 &&
        form.answerSingle < form.options.length
      );
    }
    // multi
    return (
      Array.isArray(form.answerMulti) &&
      form.answerMulti.length > 0 &&
      form.answerMulti.every(
        (i) => typeof i === "number" && i >= 0 && i < form.options.length
      )
    );
  }, [form]);

  const payload = useMemo(() => {
    return {
      id: form.id.trim(),
      type: form.type,
      difficulty: form.difficulty,
      tags: toTagsArray(form.tags),
      prompt: form.prompt.trim(),
      options: form.options.map((s) => s.trim()),
      answer: form.type === "mc" ? form.answerSingle : form.answerMulti,
      explanation: form.explanation.trim(),
    };
  }, [form]);

  const addOption = () => {
    setForm((p) => ({ ...p, options: [...p.options, ""] }));
  };

  const removeOption = (idx) => {
    setForm((p) => {
      const next = p.options.slice();
      next.splice(idx, 1);
      // cleanup answers if out of range
      let answerSingle = p.answerSingle;
      if (p.type === "mc") {
        if (typeof answerSingle === "number" && answerSingle >= next.length) {
          answerSingle = Math.max(0, next.length - 1);
        }
      }
      const answerMulti = (p.answerMulti || []).filter((i) => i < next.length);
      return { ...p, options: next, answerSingle, answerMulti };
    });
  };

  const updateOption = (idx, value) => {
    setForm((p) => {
      const next = p.options.slice();
      next[idx] = value;
      return { ...p, options: next };
    });
  };

  const onAnswerSingleChange = (idx) => {
    setForm((p) => ({ ...p, answerSingle: idx }));
  };

  const onAnswerMultiToggle = (idx) => {
    setForm((p) => {
      const set = new Set(p.answerMulti || []);
      if (set.has(idx)) set.delete(idx);
      else set.add(idx);
      return { ...p, answerMulti: Array.from(set).sort((a, b) => a - b) };
    });
  };

  const onSubmit = async () => {
    setSubmitting(true);
    setStatus(null);
    try {
      // GỌI ĐÚNG: /api/quiz/bank
      await axios.post(`${API_BASE}/quiz/bank`, payload, {
        headers: { "Content-Type": "application/json" },
      });
      setStatus({ ok: true, msg: "Đã lưu câu hỏi (upsert by id)!" });
    } catch (err) {
      // Nếu server chưa có route -> 404 -> err.response?.data có thể là HTML
      let msg = "Lỗi không xác định";
      if (err && err.response) {
        if (typeof err.response.data === "object") {
          msg =
            err.response.data?.detail ||
            err.response.data?.error ||
            `HTTP ${err.response.status}`;
        } else {
          msg = `HTTP ${err.response.status} — kiểm tra route /api/quiz/bank`;
        }
      } else if (err?.message) {
        msg = err.message;
      }
      setStatus({ ok: false, msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <h1 className="text-xl font-semibold mb-4">Thêm / Sửa câu hỏi Quiz</h1>

      <div className="space-y-4 rounded-2xl border p-4 bg-white dark:bg-zinc-900 dark:border-zinc-800">
        {/* ID + Type + Difficulty */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm font-medium">ID (duy nhất)</label>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={form.id}
              onChange={(e) => setForm((p) => ({ ...p, id: e.target.value }))}
              placeholder="VD: QZ-0001"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Loại</label>
            <select
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={form.type}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  type: e.target.value,
                  answerSingle: 0,
                  answerMulti: [],
                }))
              }
            >
              <option value="mc">MC (1 đáp án)</option>
              <option value="multi">Multi (nhiều đáp án)</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Độ khó</label>
            <select
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={form.difficulty}
              onChange={(e) =>
                setForm((p) => ({ ...p, difficulty: e.target.value }))
              }
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="text-sm font-medium">
            Tags (phân cách bởi dấu phẩy)
          </label>
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={form.tags}
            onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
            placeholder="theory, guitar"
          />
        </div>

        {/* Prompt */}
        <div>
          <label className="text-sm font-medium">Nội dung câu hỏi</label>
          <textarea
            className="mt-1 w-full rounded-lg border px-3 py-2"
            rows={3}
            value={form.prompt}
            onChange={(e) => setForm((p) => ({ ...p, prompt: e.target.value }))}
            placeholder="Ví dụ: Hợp âm nào là bậc V của key C?"
          />
        </div>

        {/* Options */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Options</label>
            <button
              type="button"
              onClick={addOption}
              className="px-2 py-1 text-sm rounded-md border"
            >
              + Thêm option
            </button>
          </div>
          <div className="mt-2 space-y-2">
            {form.options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {form.type === "mc" ? (
                  <input
                    type="radio"
                    name="answerSingle"
                    checked={form.answerSingle === idx}
                    onChange={() => onAnswerSingleChange(idx)}
                    className="mt-0.5"
                    title="Đáp án đúng"
                  />
                ) : (
                  <input
                    type="checkbox"
                    checked={(form.answerMulti || []).includes(idx)}
                    onChange={() => onAnswerMultiToggle(idx)}
                    className="mt-0.5"
                    title="Đáp án đúng"
                  />
                )}
                <input
                  className="flex-1 rounded-lg border px-3 py-2"
                  value={opt}
                  onChange={(e) => updateOption(idx, e.target.value)}
                  placeholder={`Option #${idx + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeOption(idx)}
                  className="px-2 py-1 text-sm rounded-md border"
                  disabled={form.options.length <= 2}
                  title="Xoá option"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Đánh dấu đáp án đúng bằng radio (mc) hoặc checkbox (multi).
          </p>
        </div>

        {/* Explanation */}
        <div>
          <label className="text-sm font-medium">Giải thích (tuỳ chọn)</label>
          <textarea
            className="mt-1 w-full rounded-lg border px-3 py-2"
            rows={2}
            value={form.explanation}
            onChange={(e) =>
              setForm((p) => ({ ...p, explanation: e.target.value }))
            }
            placeholder="Giải thích để hiện sau khi nộp bài"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit || submitting}
            className={`px-4 py-2 rounded-lg text-white ${
              !canSubmit || submitting
                ? "bg-gray-400"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {submitting ? "Đang lưu..." : "Lưu câu hỏi"}
          </button>
          {status && (
            <span className={status.ok ? "text-green-600" : "text-red-600"}>
              {status.msg}
            </span>
          )}
        </div>
      </div>

      {/* Payload Preview (debug) */}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-gray-600">
          Xem payload gửi API
        </summary>
        <pre className="mt-2 text-xs p-3 rounded-lg border bg-gray-50 overflow-auto">
          {JSON.stringify(payload, null, 2)}
        </pre>
      </details>
    </div>
  );
}
