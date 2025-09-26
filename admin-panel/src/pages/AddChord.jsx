

import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import Fretboard from "../components/SmallFretboard";

const API_BASE =
  (typeof window !== "undefined" && window.__API_BASE__) ||
  (typeof process !== "undefined" &&
    process.env &&
    process.env.NEXT_PUBLIC_API_BASE) ||
  "http://localhost:3000/api";

/* ---------------------------- Small UI helpers ---------------------------- */
const cx = (...a) => a.filter(Boolean).join(" ");

const Chip = ({ children, tone = "neutral", className = "" }) => {
  const toneMap = {
    neutral:
      "bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700",
    green:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800",
    amber:
      "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800",
    red: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800",
    blue: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/40 dark:text-sky-300 dark:border-sky-800",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        toneMap[tone],
        className
      )}
    >
      {children}
    </span>
  );
};

const Skeleton = ({ className = "" }) => (
  <div
    className={cx(
      "animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-700",
      className
    )}
  />
);

/* ------------------------------- Utils/API -------------------------------- */
const ensureArray = (v) => {
  if (Array.isArray(v)) return v;
  if (v && typeof v === "object") {
    if (Array.isArray(v.chords)) return v.chords; // theo ChordOptions mẫu
    if (Array.isArray(v.data)) return v.data;
    if (Array.isArray(v.items)) return v.items;
    if (Array.isArray(v.results)) return v.results;
  }
  return [];
};

function parsePositionsInput(input) {
  // Hỗ trợ: "6-3-3,5-2-2,4-0,3-x,2-o,1-3-4"  (x=mute=null, o=open=0)
  if (!input?.trim()) return [];
  return input
    .split(/[,|\n]/)
    .map((raw) => {
      const s = raw.trim().toLowerCase();
      if (!s) return null;
      const parts = s.split("-");
      if (parts.length < 2) throw new Error(`Sai định dạng: "${raw}"`);

      const string = Number(parts[0]);
      if (!Number.isInteger(string) || string < 1 || string > 6) {
        throw new Error(`Dây không hợp lệ ở "${raw}" (1-6).`);
      }

      const fretRaw = parts[1];
      let fret = null;
      let mute = false;
      if (fretRaw === "x") {
        fret = null; // mute
        mute = true;
      } else if (fretRaw === "o") {
        fret = 0; // open
      } else {
        const f = Number(fretRaw);
        if (!Number.isInteger(f) || f < 0 || f > 24) {
          throw new Error(`Fret không hợp lệ ở "${raw}" (0-24 hoặc x/o).`);
        }
        fret = f;
      }

      let finger = undefined;
      if (parts[2] !== undefined) {
        const fing = Number(parts[2]);
        if (!Number.isInteger(fing) || fing < 1 || fing > 4) {
          throw new Error(`Ngón tay không hợp lệ ở "${raw}" (1-4).`);
        }
        finger = fing;
      }
      return { string, fret, finger, mute };
    })
    .filter(Boolean);
}

function positionsToInput(positions = []) {
  // đảo chiều parsePositionsInput để fill vào textarea (edit)
  return positions
    .map((p) => {
      const s = p?.string;
      const fretStr =
        p?.fret === null ? "x" : p?.fret === 0 ? "o" : String(p?.fret ?? "");
      const finger = p?.finger ? `-${p.finger}` : "";
      return `${s}-${fretStr}${finger}`;
    })
    .join(",");
}

function computeStartFret(positions) {
  const active = positions.filter((p) => p.fret !== null);
  if (active.length === 0) return 0;
  return Math.min(...active.map((p) => p.fret));
}

// --- NEW: helpers cho BARRE ---
function normalizeBarre(barre) {
  if (!barre) return null;
  const a = Number(barre.from_string);
  const b = Number(barre.to_string);
  const fret = Number(barre.fret);
  const finger = barre.finger ? Number(barre.finger) : undefined;
  if (!a || !b || !fret) return null;
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return { from_string: lo, to_string: hi, fret, finger };
}
function barreLabel(barre) {
  const n = normalizeBarre(barre);
  if (!n) return "";
  return `Barre: strings ${n.from_string}–${n.to_string} @ fret ${n.fret}`;
}

const diffTone = (d) => {
  if (!d) return "neutral";
  const x = String(d).toLowerCase();
  if (/(easy|beginner|dễ)/.test(x)) return "green";
  if (/(intermediate|medium|vừa)/.test(x)) return "amber";
  if (/(hard|advanced|khó)/.test(x)) return "red";
  return "blue";
};

/* --------------------------------- Main ---------------------------------- */
const AddChord = () => {
  // tab: add-chord | add-shape
  const [tab, setTab] = useState("add-chord");

  // data
  const [chords, setChords] = useState([]);
  const [selectedChord, setSelectedChord] = useState(null);
  const [shapes, setShapes] = useState([]);
  const [selectedShape, setSelectedShape] = useState(null);

  // ui state
  const [loading, setLoading] = useState({
    chords: false,
    shapes: false,
    submitChord: false,
    submitShape: false,
    submitShapeUpdate: false,
    deleteShape: false,
  });
  const [error, setError] = useState({
    chords: null,
    shapes: null,
    submitChord: null,
    submitShape: null,
    submitShapeUpdate: null,
    deleteShape: null,
  });

  // filters
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [difficulty, setDifficulty] = useState("All");

  const listRef = useRef(null);

  /* ----------------------------- Load chords ----------------------------- */
  async function fetchChords() {
    setLoading((p) => ({ ...p, chords: true }));
    setError((p) => ({ ...p, chords: null }));
    try {
      const { data } = await axios.get(`${API_BASE}/chords/library`);
      const arr = ensureArray(data);
      setChords(arr);
      if (!selectedChord && arr[0]) setSelectedChord(arr[0]);
    } catch (err) {
      console.error("Error fetching chords:", err);
      setError((p) => ({ ...p, chords: "Failed to load chords list" }));
    } finally {
      setLoading((p) => ({ ...p, chords: false }));
    }
  }
  useEffect(() => {
    fetchChords();
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
      const arr = ensureArray(data);
      setShapes(arr);
      setSelectedShape(arr[0] || null);
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

  /* -------------------------- Add CHORD (tab 1) --------------------------- */
  const [form, setForm] = useState({
    name: "",
    description: "",
    difficulty: "easy",
    notes: "",
    categories: "",
    suitable_for: "",
    progressions: "",
    contributed_by: "admin",
    version_name: "",
    positions: "", // ví dụ: 6-3-3,5-2-2,4-0,3-0,2-0,1-3-4
  });

  const onChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError((p) => ({ ...p, submitChord: null }));
  };

  const handleCreateChord = async (e) => {
    e.preventDefault();
    try {
      const notes = form.notes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const categories = form.categories
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const suitable_for = form.suitable_for
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const progressions = form.progressions
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const positions = parsePositionsInput(form.positions);

      if (
        !form.name ||
        !form.description ||
        !form.version_name ||
        positions.length === 0
      ) {
        throw new Error(
          "Vui lòng nhập đầy đủ tên, mô tả, phiên bản và positions hợp lệ."
        );
      }

      const payload = {
        name: form.name,
        description: form.description,
        difficulty: form.difficulty,
        notes,
        categories,
        suitable_for,
        progressions,
        contributed_by: form.contributed_by,
        shapes: [{ version_name: form.version_name, positions }],
      };

      setLoading((p) => ({ ...p, submitChord: true }));
      await axios.post(`${API_BASE}/chords`, payload);
      setForm({
        name: "",
        description: "",
        difficulty: "easy",
        notes: "",
        categories: "",
        suitable_for: "",
        progressions: "",
        contributed_by: "admin",
        version_name: "",
        positions: "",
      });
      await fetchChords();
      setTab("add-shape");
    } catch (err) {
      setError((p) => ({
        ...p,
        submitChord:
          err?.response?.data?.error || err.message || "Lỗi không xác định",
      }));
    } finally {
      setLoading((p) => ({ ...p, submitChord: false }));
    }
  };
  // NEW: Delete CHORD by name
  const handleDeleteChord = async (chordName) => {
    if (!chordName) return;
    const ok = window.confirm(
      `Bạn có chắc muốn xóa hợp âm "${chordName}"? Tất cả shapes của hợp âm sẽ bị xóa theo.`
    );
    if (!ok) return;

    setError((p) => ({ ...p, deleteChord: null }));
    try {
      setLoading((p) => ({ ...p, deleteChord: true }));

      // API của bạn: DELETE /chords/:name
      await axios.delete(`${API_BASE}/chords/${encodeURIComponent(chordName)}`);

      // Nếu đang xoá đúng hợp âm đang chọn → reset
      setSelectedChord((prev) =>
        prev && prev.name === chordName ? null : prev
      );
      setSelectedShape(null);
      setShapes([]);

      // Reload danh sách
      await fetchChords();
    } catch (err) {
      setError((p) => ({
        ...p,
        deleteChord:
          err?.response?.data?.error || err.message || "Không thể xóa hợp âm",
      }));
    } finally {
      setLoading((p) => ({ ...p, deleteChord: false }));
    }
  };

  /* -------------------------- Add SHAPE for chord --------------------------- */
  const [positionsText, setPositionsText] = useState("");
  const [variation, setVariation] = useState(1);
  const [type, setType] = useState("standard");
  const [diffNum, setDiffNum] = useState(2);

  // --- NEW: Barre inputs (add)
  const [barreFrom, setBarreFrom] = useState("");
  const [barreTo, setBarreTo] = useState("");
  const [barreFret, setBarreFret] = useState("");
  const [barreFinger, setBarreFinger] = useState("");

  const canSubmitShape =
    !!selectedChord?._id && positionsText.trim().length > 0;

  const handleAddShape = async (e) => {
    e.preventDefault();
    setError((p) => ({ ...p, submitShape: null }));
    try {
      const positions = parsePositionsInput(positionsText);
      if (!positions.length) {
        throw new Error(
          "Vui lòng nhập positions (vd: 6-3-3,5-2-2,4-0,3-0,2-0,1-3-4)"
        );
      }
      const start_fret = computeStartFret(positions);

      // NEW: build barre object nếu nhập đủ fret + from/to
      let barre = null;
      if (barreFret && barreFrom && barreTo) {
        const raw = {
          from_string: Number(barreFrom),
          to_string: Number(barreTo),
          fret: Number(barreFret),
          finger: barreFinger ? Number(barreFinger) : undefined,
        };
        barre = normalizeBarre(raw);
      }

      const payload = {
        chord_id: selectedChord._id,
        variation: Number(variation) || 1,
        start_fret,
        positions,
        type,
        difficulty: Number(diffNum) || undefined,
        is_user_uploaded: true,
        ...(barre ? { barre } : {}),
      };

      setLoading((p) => ({ ...p, submitShape: true }));
      await axios.post(`${API_BASE}/chord-shapes`, payload);
      await handleChordSelect(selectedChord);
      setPositionsText("");
      setBarreFrom("");
      setBarreTo("");
      setBarreFret("");
      setBarreFinger("");
    } catch (err) {
      setError((p) => ({
        ...p,
        submitShape:
          err?.response?.data?.error || err.message || "Lỗi không xác định",
      }));
    } finally {
      setLoading((p) => ({ ...p, submitShape: false }));
    }
  };

  /* ----------------------- EDIT/DELETE SELECTED SHAPE ----------------------- */
  const [editPositionsText, setEditPositionsText] = useState("");
  const [editVariation, setEditVariation] = useState(1);
  const [editType, setEditType] = useState("standard");
  const [editDiffNum, setEditDiffNum] = useState(2);

  // --- NEW: Barre inputs (edit)
  const [editBarreFrom, setEditBarreFrom] = useState("");
  const [editBarreTo, setEditBarreTo] = useState("");
  const [editBarreFret, setEditBarreFret] = useState("");
  const [editBarreFinger, setEditBarreFinger] = useState("");

  useEffect(() => {
    // khi chọn shape khác → fill form edit
    if (selectedShape) {
      setEditPositionsText(positionsToInput(selectedShape.positions || []));
      setEditVariation(selectedShape.variation || 1);
      setEditType(selectedShape.type || "standard");
      setEditDiffNum(selectedShape.difficulty || 2);

      // NEW: fill barre edit
      const nb = normalizeBarre(selectedShape?.barre);
      setEditBarreFrom(nb?.from_string ?? "");
      setEditBarreTo(nb?.to_string ?? "");
      setEditBarreFret(nb?.fret ?? "");
      setEditBarreFinger(nb?.finger ?? "");
    } else {
      setEditPositionsText("");
      setEditVariation(1);
      setEditType("standard");
      setEditDiffNum(2);
      setEditBarreFrom("");
      setEditBarreTo("");
      setEditBarreFret("");
      setEditBarreFinger("");
    }
    setError((p) => ({ ...p, submitShapeUpdate: null, deleteShape: null }));
  }, [selectedShape]);

  const handleUpdateShape = async (e) => {
    e.preventDefault();
    if (!selectedShape?._id) return;
    setError((p) => ({ ...p, submitShapeUpdate: null }));
    try {
      const positions = parsePositionsInput(editPositionsText);
      if (!positions.length) {
        throw new Error("Vui lòng nhập positions hợp lệ để cập nhật.");
      }
      const start_fret = computeStartFret(positions);

      // NEW: build/clear barre
      let barre = null;
      if (editBarreFret && editBarreFrom && editBarreTo) {
        const raw = {
          from_string: Number(editBarreFrom),
          to_string: Number(editBarreTo),
          fret: Number(editBarreFret),
          finger: editBarreFinger ? Number(editBarreFinger) : undefined,
        };
        barre = normalizeBarre(raw);
      }

      const payload = {
        variation: Number(editVariation) || 1,
        type: editType,
        difficulty: Number(editDiffNum) || undefined,
        positions,
        start_fret,
        ...(editBarreFret && editBarreFrom && editBarreTo
          ? { barre }
          : { barre: null }),
      };

      setLoading((p) => ({ ...p, submitShapeUpdate: true }));
      await axios.patch(
        `${API_BASE}/chord-shapes/${selectedShape._id}`,
        payload
      );
      await handleChordSelect(selectedChord); // reload list + giữ chord
      // chọn lại shape theo id cũ nếu còn
      setSelectedShape((prev) => {
        const found = (shapes || []).find((s) => s._id === prev?._id);
        return found || null;
      });
    } catch (err) {
      setError((p) => ({
        ...p,
        submitShapeUpdate:
          err?.response?.data?.error || err.message || "Lỗi không xác định",
      }));
    } finally {
      setLoading((p) => ({ ...p, submitShapeUpdate: false }));
    }
  };

  const handleDeleteShape = async () => {
    if (!selectedShape?._id) return;
    const ok = window.confirm("Bạn có chắc muốn xóa shape này?");
    if (!ok) return;
    setError((p) => ({ ...p, deleteShape: null }));
    try {
      setLoading((p) => ({ ...p, deleteShape: true }));
      await axios.delete(`${API_BASE}/chord-shapes/${selectedShape._id}`);
      await handleChordSelect(selectedChord);
      setSelectedShape(null);
    } catch (err) {
      setError((p) => ({
        ...p,
        deleteShape:
          err?.response?.data?.error || err.message || "Không thể xóa shape",
      }));
    } finally {
      setLoading((p) => ({ ...p, deleteShape: false }));
    }
  };

  /* --------------------------------- Render --------------------------------- */
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100">
      <div className="grid h-screen grid-cols-[300px_1fr]">
        {/* Sidebar */}
        <aside className="border-r border-neutral-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-neutral-800 dark:bg-neutral-900/60">
          <div className="sticky top-0 z-10 space-y-3 border-b border-neutral-200 p-4 dark:border-neutral-800 bg-inherit">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setTab("add-chord")}
                className={cx(
                  "rounded-lg px-3 py-1.5 text-sm border",
                  tab === "add-chord"
                    ? "border-sky-500 text-sky-700 bg-sky-50 dark:border-sky-600 dark:bg-sky-900/20 dark:text-sky-200"
                    : "border-neutral-300 dark:border-neutral-700"
                )}
              >
                Thêm HỢP ÂM
              </button>
              <button
                onClick={() => setTab("add-shape")}
                className={cx(
                  "rounded-lg px-3 py-1.5 text-sm border",
                  tab === "add-shape"
                    ? "border-sky-500 text-sky-700 bg-sky-50 dark:border-sky-600 dark:bg-sky-900/20 dark:text-sky-200"
                    : "border-neutral-300 dark:border-neutral-700"
                )}
              >
                Thêm/Quản lý THẾ BẤM
              </button>
            </div>

            <h2 className="text-lg font-semibold tracking-tight">
              Danh sách hợp âm
            </h2>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm theo tên/alias..."
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none ring-0 placeholder:text-neutral-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-neutral-700 dark:bg-neutral-800 dark:placeholder:text-neutral-500 dark:focus:border-sky-400 dark:focus:ring-sky-900/40"
                />
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-xl border border-neutral-300 bg-white px-2.5 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
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
                className="rounded-xl border border-neutral-300 bg-white px-2.5 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
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
            className="h-[calc(100vh-140px)] overflow-y-auto p-3"
            ref={listRef}
          >
            {loading.chords ? (
              <div className="space-y-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : error.chords ? (
              <div className="m-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
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
                        className={cx(
                          "group block w-full rounded-xl border p-3 text-left transition-all hover:-translate-y-[1px] hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300 dark:focus:ring-sky-800",
                          isActive
                            ? "border-sky-500 bg-sky-50 dark:border-sky-600 dark:bg-sky-900/10"
                            : "border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900"
                        )}
                        aria-current={isActive ? "true" : undefined}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium leading-6 tracking-tight">
                              {chord.name}
                            </div>
                            <div className="mt-1 line-clamp-1 text-xs text-neutral-500">
                              {(chord.categories || []).join(", ") ||
                                "No categories"}
                            </div>
                          </div>
                          <Chip tone={diffTone(chord.difficulty)}>
                            {chord.difficulty || "Unknown"}
                          </Chip>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation(); // tránh trigger chọn chord
                              handleDeleteChord(chord.name); // <— dùng name
                            }}
                            disabled={loading.deleteChord}
                            className={cx(
                              "rounded border px-2 py-1 text-xs",
                              "border-rose-500 text-rose-600 hover:bg-rose-50",
                              "dark:hover:bg-rose-900/20",
                              loading.deleteChord &&
                                "opacity-60 cursor-not-allowed"
                            )}
                            title="Xóa hợp âm này"
                          >
                            {loading.deleteChord ? "Đang xoá..." : "Xóa"}
                          </button>
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
          <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/80 p-4 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-neutral-800 dark:bg-neutral-900/60">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold tracking-tight">
                  {tab === "add-chord"
                    ? "Thêm HỢP ÂM mới"
                    : selectedChord
                    ? `${selectedChord.name} – Thêm/Quản lý THẾ BẤM`
                    : "Chọn một hợp âm"}
                </h1>
                {tab === "add-shape" && selectedChord?.description && (
                  <p className="mt-1 max-w-3xl text-sm text-neutral-600 dark:text-neutral-300">
                    {selectedChord.description}
                  </p>
                )}
              </div>
            </div>
          </header>

          <section className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
            {/* TAB 1: ADD CHORD */}
            {tab === "add-chord" && (
              <form
                onSubmit={handleCreateChord}
                className="mx-auto max-w-3xl space-y-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
              >
                {error.submitChord && (
                  <div className="rounded border border-rose-300 bg-rose-50 px-3 py-2 text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-200">
                    {String(error.submitChord)}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    name="name"
                    value={form.name}
                    onChange={onChange}
                    placeholder="Tên hợp âm (A_major)"
                    className="w-full rounded border px-3 py-2"
                  />
                  <select
                    name="difficulty"
                    value={form.difficulty}
                    onChange={onChange}
                    className="w-full rounded border px-3 py-2"
                  >
                    <option value="easy">Dễ</option>
                    <option value="medium">Trung bình</option>
                    <option value="hard">Khó</option>
                  </select>
                </div>

                <input
                  name="description"
                  value={form.description}
                  onChange={onChange}
                  placeholder="Mô tả"
                  className="w-full rounded border px-3 py-2"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    name="notes"
                    value={form.notes}
                    onChange={onChange}
                    placeholder="Các nốt (C,E,G)"
                    className="w-full rounded border px-3 py-2"
                  />
                  <input
                    name="categories"
                    value={form.categories}
                    onChange={onChange}
                    placeholder="Danh mục (major,basic)"
                    className="w-full rounded border px-3 py-2"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    name="suitable_for"
                    value={form.suitable_for}
                    onChange={onChange}
                    placeholder="Phù hợp cho (beginners,...)"
                    className="w-full rounded border px-3 py-2"
                  />
                  <input
                    name="progressions"
                    value={form.progressions}
                    onChange={onChange}
                    placeholder="Tiến trình (I-IV-V,...)"
                    className="w-full rounded border px-3 py-2"
                  />
                </div>

                <div className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
                  <div className="mb-2 text-sm font-semibold">
                    Shape khởi tạo cho hợp âm
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      name="version_name"
                      value={form.version_name}
                      onChange={onChange}
                      placeholder="Phiên bản (vd: Shape 1)"
                      className="w-full rounded border px-3 py-2"
                    />
                    <input
                      name="positions"
                      value={form.positions}
                      onChange={onChange}
                      placeholder="Positions (vd: 6-3-3,5-2-2,4-0,3-0,2-0,1-3-4)"
                      className="w-full rounded border px-3 py-2 font-mono"
                    />
                  </div>
                  <div className="mt-2 text-xs text-neutral-500">
                    * Hỗ trợ x (mute) & o (open). Ví dụ: 3-x, 2-o
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading.submitChord}
                    className={cx(
                      "rounded bg-blue-600 px-4 py-2 text-white",
                      loading.submitChord && "opacity-70 cursor-not-allowed"
                    )}
                  >
                    {loading.submitChord ? "Đang tạo..." : "Tạo hợp âm"}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: ADD/EDIT/DELETE SHAPE */}
            {tab === "add-shape" && (
              <>
                {/* Shapes toolbar */}
                {loading.shapes && (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                )}
                {error.shapes && (
                  <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                    {error.shapes}
                  </div>
                )}

                {selectedChord ? (
                  <>
                    <div className="mb-5 flex flex-wrap gap-2">
                      {shapes.length > 0 ? (
                        shapes.map((shape) => {
                          const active = selectedShape?._id === shape._id;
                          return (
                            <button
                              key={shape._id}
                              onClick={() => setSelectedShape(shape)}
                              className={cx(
                                "rounded-full border px-3 py-1.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-sky-300 dark:focus:ring-sky-800",
                                active
                                  ? "border-sky-500 bg-sky-50 text-sky-900 dark:border-sky-600 dark:bg-sky-900/20 dark:text-sky-200"
                                  : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                              )}
                              title={`${shape.type} ${shape.variation || ""}${
                                normalizeBarre(shape.barre)
                                  ? ` • ${barreLabel(shape.barre)}`
                                  : ""
                              }`}
                            >
                              <span className="font-medium">{shape.type}</span>
                              {shape.variation && (
                                <span className="ml-1">{shape.variation}</span>
                              )}
                              {normalizeBarre(shape.barre) && (
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
                        {/* Preview */}
                        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                          <div className="mb-3 flex items-center justify-between">
                            <div className="text-sm text-neutral-500">
                              Sơ đồ thế bấm
                            </div>
                            <div className="text-xs text-neutral-400">
                              Fretboard preview
                            </div>
                          </div>
                          <Fretboard shape={selectedShape} />
                          <div className="mt-4 text-sm text-neutral-600 dark:text-neutral-300">
                            <span className="font-semibold">Type:</span>{" "}
                            {selectedShape.type}
                            {normalizeBarre(selectedShape.barre) && (
                              <>
                                <span className="mx-2">•</span>
                                <span>{barreLabel(selectedShape.barre)}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Info blocks */}
                        <div className="space-y-5">
                          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                            <h3 className="mb-2 text-base font-semibold">
                              Ghi chú
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {(selectedChord.notes || []).length > 0 ? (
                                selectedChord.notes.map((n) => (
                                  <Chip
                                    key={n}
                                    tone="neutral"
                                    className="text-sm"
                                  >
                                    {n}
                                  </Chip>
                                ))
                              ) : (
                                <span className="text-sm text-neutral-500">
                                  No notes info
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                            <h3 className="mb-2 text-base font-semibold">
                              Phù hợp với
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {(selectedChord.suitable_for || []).length > 0 ? (
                                selectedChord.suitable_for.map((x) => (
                                  <Chip
                                    key={x}
                                    tone="green"
                                    className="text-sm"
                                  >
                                    {x}
                                  </Chip>
                                ))
                              ) : (
                                <span className="text-sm text-neutral-500">
                                  No information
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid place-items-center rounded-2xl border border-dashed border-neutral-300 p-10 text-neutral-500 dark:border-neutral-700">
                        Hãy chọn một shape để xem sơ đồ.
                      </div>
                    )}

                    {/* FORM THÊM THẾ BẤM */}
                    <form
                      onSubmit={handleAddShape}
                      className="mt-6 space-y-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                    >
                      <div className="text-sm text-neutral-600 dark:text-neutral-300">
                        Thêm thế bấm cho: <b>{selectedChord.name}</b>
                      </div>
                      {error.submitShape && (
                        <div className="rounded border border-rose-300 bg-rose-50 px-3 py-2 text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-200">
                          {String(error.submitShape)}
                        </div>
                      )}

                      <label className="block text-sm font-medium">
                        Positions (mỗi mục theo "string-fret-finger", phân tách
                        bằng dấu phẩy hoặc xuống dòng)
                      </label>
                      <textarea
                        rows={3}
                        className="w-full border rounded px-3 py-2 font-mono text-sm"
                        placeholder={
                          "VD: 6-3-3,5-2-2,4-0,3-0,2-0,1-3-4\nHỗ trợ x (mute) & o (open)"
                        }
                        value={positionsText}
                        onChange={(e) => setPositionsText(e.target.value)}
                      />

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-sm font-medium">
                            Variation
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={variation}
                            onChange={(e) => setVariation(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium">
                            Type
                          </label>
                          <select
                            className="w-full border rounded px-3 py-2"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                          >
                            <option value="standard">standard</option>
                            <option value="barre">barre</option>
                            <option value="power">power</option>
                            <option value="open">open</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium">
                            Difficulty
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={5}
                            value={diffNum}
                            onChange={(e) => setDiffNum(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            type="submit"
                            disabled={!canSubmitShape || loading.submitShape}
                            className={cx(
                              "w-full px-4 py-2 rounded text-white",
                              canSubmitShape && !loading.submitShape
                                ? "bg-blue-600 hover:bg-blue-700"
                                : "bg-gray-400 cursor-not-allowed"
                            )}
                          >
                            {loading.submitShape
                              ? "Đang lưu..."
                              : "Thêm thế bấm"}
                          </button>
                        </div>
                      </div>

                      {/* NEW: Barre (tùy chọn) */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-sm font-medium">
                            Barre từ dây
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={6}
                            value={barreFrom}
                            onChange={(e) => setBarreFrom(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium">
                            đến dây
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={6}
                            value={barreTo}
                            onChange={(e) => setBarreTo(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium">
                            Tại phím (fret)
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={24}
                            value={barreFret}
                            onChange={(e) => setBarreFret(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium">
                            Ngón chặn (1–4)
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={4}
                            value={barreFinger}
                            onChange={(e) => setBarreFinger(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                          />
                        </div>
                      </div>
                      <div className="text-xs text-neutral-500">
                        * Để trống 4 ô này nếu shape không có barre.
                      </div>
                    </form>

                    {/* FORM CHỈNH SỬA / XÓA SHAPE */}
                    {selectedShape && (
                      <form
                        onSubmit={handleUpdateShape}
                        className="mt-6 space-y-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold">
                            Chỉnh sửa shape được chọn
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleDeleteShape}
                              disabled={loading.deleteShape}
                              className={cx(
                                "rounded px-3 py-1.5 text-sm border border-rose-500 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20",
                                loading.deleteShape &&
                                  "opacity-60 cursor-not-allowed"
                              )}
                              title="Xóa shape này"
                            >
                              {loading.deleteShape
                                ? "Đang xóa..."
                                : "Xóa shape"}
                            </button>
                          </div>
                        </div>

                        {error.submitShapeUpdate && (
                          <div className="rounded border border-rose-300 bg-rose-50 px-3 py-2 text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-200">
                            {String(error.submitShapeUpdate)}
                          </div>
                        )}
                        {error.deleteShape && (
                          <div className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                            {String(error.deleteShape)}
                          </div>
                        )}

                        <label className="block text-sm font-medium">
                          Positions (mỗi mục theo "string-fret-finger", phân
                          tách bằng dấu phẩy hoặc xuống dòng)
                        </label>
                        <textarea
                          rows={3}
                          className="w-full border rounded px-3 py-2 font-mono text-sm"
                          placeholder={
                            "VD: 6-3-3,5-2-2,4-0,3-0,2-0,1-3-4\nHỗ trợ x (mute) & o (open)"
                          }
                          value={editPositionsText}
                          onChange={(e) => setEditPositionsText(e.target.value)}
                        />

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-sm font-medium">
                              Variation
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={editVariation}
                              onChange={(e) => setEditVariation(e.target.value)}
                              className="w-full border rounded px-3 py-2"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium">
                              Type
                            </label>
                            <select
                              className="w-full border rounded px-3 py-2"
                              value={editType}
                              onChange={(e) => setEditType(e.target.value)}
                            >
                              <option value="standard">standard</option>
                              <option value="barre">barre</option>
                              <option value="power">power</option>
                              <option value="open">open</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium">
                              Difficulty
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={5}
                              value={editDiffNum}
                              onChange={(e) => setEditDiffNum(e.target.value)}
                              className="w-full border rounded px-3 py-2"
                            />
                          </div>
                          <div className="flex items-end">
                            <button
                              type="submit"
                              disabled={loading.submitShapeUpdate}
                              className={cx(
                                "w-full px-4 py-2 rounded text-white",
                                !loading.submitShapeUpdate
                                  ? "bg-emerald-600 hover:bg-emerald-700"
                                  : "bg-gray-400 cursor-not-allowed"
                              )}
                            >
                              {loading.submitShapeUpdate
                                ? "Đang cập nhật..."
                                : "Cập nhật shape"}
                            </button>
                          </div>
                        </div>

                        {/* NEW: Barre (tùy chọn) */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-sm font-medium">
                              Barre từ dây
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={6}
                              value={editBarreFrom}
                              onChange={(e) => setEditBarreFrom(e.target.value)}
                              className="w-full border rounded px-3 py-2"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium">
                              đến dây
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={6}
                              value={editBarreTo}
                              onChange={(e) => setEditBarreTo(e.target.value)}
                              className="w-full border rounded px-3 py-2"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium">
                              Tại phím (fret)
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={24}
                              value={editBarreFret}
                              onChange={(e) => setEditBarreFret(e.target.value)}
                              className="w-full border rounded px-3 py-2"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium">
                              Ngón chặn (1–4)
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={4}
                              value={editBarreFinger}
                              onChange={(e) =>
                                setEditBarreFinger(e.target.value)
                              }
                              className="w-full border rounded px-3 py-2"
                            />
                          </div>
                        </div>
                        <div className="text-xs text-neutral-500">
                          * Để trống fret/from/to nếu muốn xoá barre của shape.
                        </div>
                      </form>
                    )}
                  </>
                ) : (
                  <div className="grid h-[60vh] place-items-center">
                    <div className="text-center">
                      <div className="mx-auto mb-4 h-16 w-16 rounded-full border border-dashed border-neutral-300 dark:border-neutral-700" />
                      <h3 className="text-lg font-semibold">
                        Vui lòng chọn một hợp âm từ danh sách
                      </h3>
                      <p className="mt-1 text-sm text-neutral-500">
                        Tìm kiếm theo tên, lọc theo Category/Difficulty ở thanh
                        bên trái.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default AddChord;
