import React, { useEffect, useState } from "react";
import { apiGet, apiPost } from "../utils/api";
import { useNavigate } from "react-router-dom";

export default function OnboardingPage() {
  const nav = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({ basic: [] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGet("/api/ml/questions").then((d) => setQuestions(d.questions || []));
  }, []);

  const setSingle = (k, v) => setAnswers((a) => ({ ...a, [k]: v }));
  const toggleMulti = (k, v) =>
    setAnswers((a) => {
      const cur = new Set(a[k] || []);
      if (cur.has(v)) cur.delete(v);
      else cur.add(v);
      return { ...a, [k]: Array.from(cur) };
    });

  const submit = async () => {
    setSaving(true);
    await apiPost("/api/ml/save-answers", { answers });
    // (tuỳ chọn) có thể prefetch recommend ở đây nếu muốn
    nav("/theory", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl p-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Cá nhân hoá lộ trình học 🎸
          </h1>
          <p className="text-gray-600 mb-6">
            Trả lời vài câu hỏi ngắn để hệ thống gợi ý nội dung phù hợp nhất với
            bạn.
          </p>

          <div className="space-y-6">
            {questions.map((q) => (
              <div key={q.key} className="border rounded-xl p-4">
                <div className="font-medium mb-3">{q.title}</div>
                <div className="flex flex-wrap gap-2">
                  {q.options.map((op) => {
                    const active = q.multi
                      ? (answers[q.key] || []).includes(op.key)
                      : answers[q.key] === op.key;
                    const onClick = () =>
                      q.multi
                        ? toggleMulti(q.key, op.key)
                        : setSingle(q.key, op.key);
                    return (
                      <button
                        key={op.key}
                        onClick={onClick}
                        className={`px-3 py-1 rounded-full border transition ${
                          active
                            ? "bg-black text-white border-black"
                            : "bg-white hover:bg-gray-100"
                        }`}
                      >
                        {op.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button
              onClick={() => nav("/theory", { replace: true })}
              className="px-4 py-2 rounded-lg"
            >
              Để sau
            </button>
            <button
              onClick={submit}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-black text-white"
            >
              {saving ? "Đang lưu..." : "Lưu & vào học"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
