import React from "react";
import ChordShapeViewer from "./ChordShapeViewer";

export default function ChordVoicingPanel({
  open,
  onClose,
  chord,
  loading,
  error,
  data,
}) {
  if (!open) return null;

  const voicings = Array.isArray(data?.voicings) ? data.voicings : [];

  return (
    <div className="fixed inset-0 z-50">
      {/* nền mờ */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* panel chính */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-zinc-900 shadow-2xl p-4 overflow-y-auto">
        {/* header */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 pb-2">
          <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
            {chord || "Chord"}
          </h3>
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition"
          >
            ✕
          </button>
        </div>

        {/* nội dung */}
        {loading && (
          <div className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            Đang tải thế bấm...
          </div>
        )}

        {error && (
          <div className="mt-4 text-sm text-rose-600 dark:text-rose-400">
            {String(error)}
          </div>
        )}

        {!loading && !error && (
          <div className="mt-4">
            <ChordShapeViewer
              chord={chord}
              voicings={voicings}
              className="border-0 p-0"
            />
          </div>
        )}

        {!loading && !error && voicings.length === 0 && (
          <div className="mt-4 text-sm opacity-70">Không có thế bấm nào.</div>
        )}
      </div>
    </div>
  );
}
