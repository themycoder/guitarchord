import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import ChordDiagram from "./ChordDiagram";

const ChordSuggestion = ({ selectedNotes = [] }) => {
  const [suggestedChords, setSuggestedChords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // chuẩn hoá danh sách nốt: ["C", "D#", "G"] -> sort + unique
  const normalizedNotes = useMemo(() => {
    if (!Array.isArray(selectedNotes)) return [];
    const arr = selectedNotes
      .map((n) => (n?.isSharp ? `${n.note}#` : n?.note))
      .filter(Boolean);
    return Array.from(new Set(arr)).sort();
  }, [selectedNotes]);

  useEffect(() => {
    if (normalizedNotes.length < 2) {
      setSuggestedChords([]);
      setError(null);
      return;
    }

    let cancelled = false;
    const cts = new AbortController();
    const delay = setTimeout(async () => {
      setLoading(true);
      try {
        const resp = await axios.get("/api/chords/suggest", {
          params: { notes: normalizedNotes.join(",") },
          signal: cts.signal,
        });
        if (cancelled) return;
        setSuggestedChords(Array.isArray(resp.data) ? resp.data : []);
        setError(null);
      } catch (err) {
        if (axios.isCancel?.(err) || err?.name === "CanceledError") return;
        setSuggestedChords([]);
        setError(
          err?.response?.data?.message || err?.message || "Unknown error"
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      cts.abort();
      clearTimeout(delay);
    };
  }, [normalizedNotes]);

  if (loading) {
    return (
      <div className="text-center py-4 text-sm">Loading suggestions...</div>
    );
  }
  if (error) {
    return <div className="text-red-500 py-4 text-sm">Error: {error}</div>;
  }

  return (
    <div className="chord-suggestions mt-6">
      <h3 className="font-semibold text-lg mb-3 text-black dark:text-white">
        Suggested Chords
      </h3>

      {suggestedChords.length > 0 ? (
        <div
          className="
            grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4
          "
        >
          {suggestedChords.map((chord, index) => {
            const {
              name,
              notes = [],
              difficulty = "",
              categories = [],
              shapes = [],
            } = chord || {};

            const badgeClass =
              difficulty === "easy"
                ? "bg-green-100 text-green-800"
                : difficulty === "medium"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800";

            return (
              <div
                key={`${name || "chord"}-${index}`}
                // Không tương tác: bỏ hover/cursor, chặn focus
                className="
                  bg-gray-100 dark:bg-gray-700 p-3 rounded-lg
                  select-none cursor-default
                "
                tabIndex={-1}
                role="presentation"
                aria-disabled="true"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <h4 className="font-bold text-black dark:text-white truncate">
                      {name || "Unknown"}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                      {notes.join(", ")}
                    </p>
                    {difficulty && (
                      <span
                        className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${badgeClass}`}
                      >
                        {difficulty}
                      </span>
                    )}
                  </div>

                  {/* Khu vực hiển thị voicings (shapes) */}
                  <div className="flex-0">
                    {shapes?.length > 0 ? (
                      // Hiển thị 1–3 voicing, to hơn, ẩn tên trên diagram
                      <div className="flex gap-2 overflow-x-auto max-w-[320px]">
                        {shapes.slice(0, 3).map((s, i) => (
                          <ChordDiagram
                            key={`shape-${index}-${i}`}
                            positions={s.positions}
                            barre={s.barre}
                            startFret={s.startFret}
                            hideName={true}
                            scale={1.6}
                          />
                        ))}
                      </div>
                    ) : (
                      <ChordDiagram
                        chordName={name}
                        hideName={true}
                        scale={1.6}
                      />
                    )}
                  </div>
                </div>

                {categories?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {categories.map((cat, i) => (
                      <span
                        key={`${name}-cat-${i}`}
                        className="text-xs bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded select-none"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {normalizedNotes.length > 1
            ? "No matching chords found"
            : "Select at least 2 notes to get chord suggestions"}
        </p>
      )}
    </div>
  );
};

export default ChordSuggestion;
