// ChordOptions.jsx (themed to match navbar palette)
// - 2-pane layout, sticky sidebar header
// - Search + filters
// - Cards, pills, chips dùng tone xanh navy/pastel giống Navbar

import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import Fretboard from "../../../components/Fretboard/SmallFretboard";

const API_BASE =
  (typeof window !== "undefined" && window.__API_BASE__) ||
  (typeof process !== "undefined" &&
    process.env &&
    process.env.NEXT_PUBLIC_API_BASE) ||
  "http://localhost:3000/api";

/* ---------------------------- Small UI helpers ---------------------------- */
const Chip = ({ children, tone = "neutral", className = "" }) => {
  const toneMap = {
    neutral:
      "bg-[#E7F1FF] text-[#061F5C] border-[#D0E3FF] dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-700",
    green:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800",
    amber:
      "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800",
    red: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800",
    blue: "bg-[#D0E3FF] text-[#061F5C] border-[#7096D1] dark:bg-sky-900/40 dark:text-sky-200 dark:border-sky-800",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${toneMap[tone]} ${className}`}
    >
      {children}
    </span>
  );
};

const Skeleton = ({ className = "" }) => (
  <div
    className={`animate-pulse rounded-xl bg-[#E7F1FF] dark:bg-neutral-700 ${className}`}
  />
);

/* --------------------------------- Main ---------------------------------- */
const ChordOptions = () => {
  const [chords, setChords] = useState([]);
  const [selectedChord, setSelectedChord] = useState(null);
  const [selectedShape, setSelectedShape] = useState(null);
  const [shapes, setShapes] = useState([]);
  const [loading, setLoading] = useState({ chords: false, shapes: false });
  const [error, setError] = useState({ chords: null, shapes: null });

  // UI/filters
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [difficulty, setDifficulty] = useState("All");

  const listRef = useRef(null);

  /* ----------------------------- Load all chords ---------------------------- */
  useEffect(() => {
    const controller = new AbortController();
    const fetchChords = async () => {
      setLoading((p) => ({ ...p, chords: true }));
      setError((p) => ({ ...p, chords: null }));
      try {
        const { data } = await axios.get(`${API_BASE}/chords/library`, {
          signal: controller.signal,
        });
        if (data && Array.isArray(data.chords)) {
          setChords(data.chords);
        } else {
          throw new Error("Invalid data format from API");
        }
      } catch (err) {
        if (axios.isCancel(err)) return;
        console.error("Error fetching chords:", err);
        setError((p) => ({ ...p, chords: "Failed to load chords list" }));
      } finally {
        setLoading((p) => ({ ...p, chords: false }));
      }
    };
    fetchChords();
    return () => controller.abort();
  }, []);

  /* --------------------------- Fetch shapes by chord --------------------------- */
  const handleChordSelect = async (chord) => {
    if (!chord?._id) return;
    setSelectedChord(chord);
    setSelectedShape(null);
    setLoading((p) => ({ ...p, shapes: true }));
    setError((p) => ({ ...p, shapes: null }));

    try {
      const { data } = await axios.get(`${API_BASE}/chord-shapes/${chord._id}`);
      if (!Array.isArray(data)) throw new Error("Invalid shapes data format");
      setShapes(data);
      setSelectedShape(data[0] || null);
    } catch (err) {
      console.error("Error fetching chord shapes:", err);
      setError((p) => ({ ...p, shapes: "Failed to load chord shapes" }));
      setShapes([]);
      setSelectedShape(null);
    } finally {
      setLoading((p) => ({ ...p, shapes: false }));
    }
  };

  /* --------------------------------- Filters -------------------------------- */
  const categoryOptions = useMemo(() => {
    const s = new Set();
    chords.forEach((c) => (c.categories || []).forEach((x) => s.add(x)));
    return ["All", ...Array.from(s)];
  }, [chords]);

  const difficultyOptions = useMemo(() => {
    const s = new Set();
    chords.forEach((c) => c.difficulty && s.add(c.difficulty));
    return ["All", ...Array.from(s)];
  }, [chords]);

  const filteredChords = useMemo(() => {
    const q = query.trim().toLowerCase();
    return chords.filter((c) => {
      const matchQ =
        !q ||
        `${c.name} ${(c.aliases || []).join(" ")}`.toLowerCase().includes(q);
      const matchCat =
        category === "All" || (c.categories || []).includes(category);
      const matchDiff = difficulty === "All" || c.difficulty === difficulty;
      return matchQ && matchCat && matchDiff;
    });
  }, [chords, query, category, difficulty]);

  /* ------------------------------- Utilities -------------------------------- */
  const diffTone = (d) => {
    if (!d) return "neutral";
    const x = String(d).toLowerCase();
    if (/(easy|beginner|dễ)/.test(x)) return "green";
    if (/(intermediate|medium|vừa)/.test(x)) return "amber";
    if (/(hard|advanced|khó)/.test(x)) return "red";
    return "blue";
  };

  /* --------------------------------- Render --------------------------------- */
  return (
    <div className="min-h-screen bg-[#F9FCFF] text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100">
      <div className="grid h-screen md:grid-cols-[340px_1fr] grid-cols-1">
        {/* Sidebar */}
        <aside className="border-r border-[#D0E3FF] bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-white/10 dark:bg-[#061F5C]/80">
          <div className="sticky top-0 z-10 space-y-3 border-b border-[#D0E3FF] p-4 bg-gradient-to-r from-[#D0E3FF]/90 via-[#E7F1FF]/90 to-[#F9FCFF]/90 dark:border-white/10 dark:from-[#061F5C] dark:via-[#334EAC] dark:to-[#7096D1]">
            <h2 className="text-lg font-semibold tracking-tight text-[#061F5C] dark:text-[#F9FCFF]">
              Danh sách hợp âm
            </h2>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm theo tên/alias..."
                  className="w-full rounded-xl border border-[#D0E3FF] bg-white px-3 py-2 text-sm outline-none ring-0 placeholder:text-neutral-400 focus:border-[#334EAC] focus:ring-2 focus:ring-[#D0E3FF] dark:border-white/20 dark:bg-[#061F5C] dark:text-white dark:placeholder:text-neutral-300 dark:focus:border-[#D0E3FF] dark:focus:ring-[#334EAC]/50"
                />
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-xl border border-[#D0E3FF] bg-white px-2 py-2 text-sm text-neutral-800 dark:border-white/20 dark:bg-[#061F5C] dark:text-neutral-50"
              >
                {categoryOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="rounded-xl border border-[#D0E3FF] bg-white px-2 py-2 text-sm text-neutral-800 dark:border-white/20 dark:bg-[#061F5C] dark:text-neutral-50"
              >
                {difficultyOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            ref={listRef}
            className="h-[calc(100vh-96px)] overflow-y-auto p-3 space-y-2"
          >
            {loading.chords ? (
              <div className="space-y-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : error.chords ? (
              <div className="m-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                {error.chords}
              </div>
            ) : filteredChords.length === 0 ? (
              <div className="p-6 text-center text-sm text-neutral-500">
                Không có hợp âm phù hợp.
              </div>
            ) : (
              <ul className="space-y-2">
                {filteredChords.map((chord) => {
                  const isActive = selectedChord?._id === chord._id;
                  return (
                    <li key={chord._id}>
                      <button
                        onClick={() => handleChordSelect(chord)}
                        className={`group block w-full rounded-xl border p-3 text-left transition-all hover:-translate-y-[1px] hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[#D0E3FF] dark:focus:ring-[#334EAC] ${
                          isActive
                            ? "border-[#334EAC] bg-[#E7F1FF] dark:border-[#D0E3FF] dark:bg-[#061F5C]"
                            : "border-[#D0E3FF] bg-white hover:border-[#7096D1] dark:border-white/10 dark:bg-[#061F5C]/60"
                        }`}
                        aria-current={isActive ? "true" : undefined}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium leading-6 tracking-tight text-[#061F5C] dark:text-[#F9FCFF]">
                              {chord.name}
                            </div>
                            <div className="mt-1 line-clamp-1 text-xs text-neutral-500 dark:text-neutral-300">
                              {(chord.categories || []).join(", ") ||
                                "No categories"}
                            </div>
                          </div>
                          <Chip tone={diffTone(chord.difficulty)}>
                            {chord.difficulty || "Unknown"}
                          </Chip>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex min-h-0 flex-col overflow-hidden">
          <header className="sticky top-0 z-10 border-b border-[#D0E3FF] bg-gradient-to-r from-[#D0E3FF]/90 via-[#E7F1FF]/90 to-[#F9FCFF]/90 p-4 backdrop-blur dark:border-white/10 dark:from-[#061F5C] dark:via-[#334EAC] dark:to-[#7096D1]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-[#061F5C] dark:text-[#F9FCFF]">
                  {selectedChord
                    ? `${selectedChord.name} Chord`
                    : "Chọn một hợp âm"}
                </h1>
                {selectedChord?.description && (
                  <p className="mt-1 max-w-3xl text-sm text-neutral-700 dark:text-neutral-200">
                    {selectedChord.description}
                  </p>
                )}
              </div>
            </div>
          </header>

          <section className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
            {/* Shapes toolbar */}
            {loading.shapes && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            )}

            {error.shapes && (
              <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                {error.shapes}
              </div>
            )}

            {selectedChord ? (
              <>
                <div className="mb-2 flex flex-wrap gap-2">
                  {shapes.length > 0 ? (
                    shapes.map((shape) => {
                      const active = selectedShape?._id === shape._id;
                      const barre = shape.barre;
                      return (
                        <button
                          key={shape._id}
                          onClick={() => setSelectedShape(shape)}
                          className={`rounded-full border px-3 py-1.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#D0E3FF] dark:focus:ring-[#334EAC] ${
                            active
                              ? "border-[#334EAC] bg-[#D0E3FF] text-[#061F5C] dark:border-[#D0E3FF] dark:bg-[#061F5C] dark:text-[#F9FCFF]"
                              : "border-[#D0E3FF] bg-white text-neutral-700 hover:border-[#7096D1] hover:bg-[#E7F1FF] dark:border-white/20 dark:bg-[#061F5C] dark:text-neutral-100 dark:hover:bg-[#334EAC]/60"
                          }`}
                          title={`${shape.type} ${shape.variation || ""}${
                            barre
                              ? ` • Barre ${barre.from_string}-${barre.to_string}@${barre.fret}`
                              : ""
                          }`}
                        >
                          <span className="font-medium">{shape.type}</span>
                          {shape.variation && (
                            <span className="ml-1">{shape.variation}</span>
                          )}
                          {barre && (
                            <Chip className="ml-2" tone="blue">
                              Barre
                            </Chip>
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-sm text-neutral-500">
                      No shapes available
                    </div>
                  )}
                </div>

                {selectedShape ? (
                  <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
                    <div className="rounded-2xl border border-[#D0E3FF] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#061F5C]">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="text-sm text-neutral-600 dark:text-neutral-200">
                          Sơ đồ thế bấm
                        </div>
                        <div className="text-xs text-neutral-400">
                          Fretboard preview
                        </div>
                      </div>
                      <Fretboard shape={selectedShape} />
                      <div className="mt-4 text-sm text-neutral-700 dark:text-neutral-100">
                        <span className="font-semibold">Type:</span>{" "}
                        {selectedShape.type}
                        {selectedShape.barre && (
                          <>
                            <span className="mx-2">•</span>
                            <span>
                              Barre: strings {selectedShape.barre.from_string}–
                              {selectedShape.barre.to_string} @ fret{" "}
                              {selectedShape.barre.fret}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="rounded-2xl border border-[#D0E3FF] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#061F5C]">
                        <h3 className="mb-2 text-base font-semibold text-[#061F5C] dark:text-[#F9FCFF]">
                          Ghi chú
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {(selectedChord.notes || []).length > 0 ? (
                            selectedChord.notes.map((n) => (
                              <Chip key={n} tone="neutral" className="text-sm">
                                {n}
                              </Chip>
                            ))
                          ) : (
                            <span className="text-sm text-neutral-500 dark:text-neutral-200">
                              No notes info
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[#D0E3FF] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#061F5C]">
                        <h3 className="mb-2 text-base font-semibold text-[#061F5C] dark:text-[#F9FCFF]">
                          Phù hợp với
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {(selectedChord.suitable_for || []).length > 0 ? (
                            selectedChord.suitable_for.map((x) => (
                              <Chip key={x} tone="green" className="text-sm">
                                {x}
                              </Chip>
                            ))
                          ) : (
                            <span className="text-sm text-neutral-500 dark:text-neutral-200">
                              No information
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid place-items-center rounded-2xl border border-dashed border-[#D0E3FF] bg-white/60 p-10 text-neutral-500 dark:border-white/20 dark:bg-[#061F5C]/40">
                    Hãy chọn một shape để xem sơ đồ.
                  </div>
                )}
              </>
            ) : (
              <div className="grid h-[60vh] place-items-center">
                <div className="text-center">
                  <div className="mx-auto mb-4 h-16 w-16 rounded-full border border-dashed border-[#D0E3FF] bg-white/70 dark:border-white/30 dark:bg-[#061F5C]/40" />
                  <h3 className="text-lg font-semibold text-[#061F5C] dark:text-[#F9FCFF]">
                    Vui lòng chọn một hợp âm từ danh sách
                  </h3>
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-200">
                    Tìm kiếm theo tên, lọc theo Category/Difficulty ở thanh bên
                    trái.
                  </p>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default ChordOptions;
