import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

/**
 * ScaleDiagram – Complete polished version
 * - String numbers (both sides)
 * - Left/Right‑handed toggle with proper text counter‑flip
 * - Pastel note colors, smaller markers, fret markers 3/5/7/9/12
 * - Dark‑mode friendly
 */

const NOTE_COLORS = {
  C: "#FF6B6B",
  "C#": "#F06292",
  Db: "#F06292",
  D: "#BA68C8",
  "D#": "#9575CD",
  Eb: "#9575CD",
  E: "#5C6BC0",
  F: "#42A5F5",
  "F#": "#26C6DA",
  Gb: "#26C6DA",
  G: "#26A69A",
  "G#": "#66BB6A",
  Ab: "#66BB6A",
  A: "#9CCC65",
  "A#": "#D4E157",
  Bb: "#D4E157",
  B: "#FFEE58",
};

const ALL_NOTES = [
  "A",
  "A#",
  "Bb",
  "B",
  "C",
  "C#",
  "Db",
  "D",
  "D#",
  "Eb",
  "E",
  "F",
  "F#",
  "Gb",
  "G",
  "G#",
  "Ab",
];

const LabelMode = {
  NOTE: "NOTE",
  DEGREE: "DEGREE",
  BOTH: "BOTH",
};

const frets = 15;
const strings = 6;
const fretWidth = 34;
const stringSpacing = 22;
const topMargin = 18;

export default function ScaleDiagram() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scales, setScales] = useState([]);

  const [selectedScaleType, setSelectedScaleType] = useState("");
  const [selectedRootNote, setSelectedRootNote] = useState("C");
  const [currentScale, setCurrentScale] = useState(null);
  const [selectedBox, setSelectedBox] = useState(1);
  const [labelMode, setLabelMode] = useState(LabelMode.NOTE);
  const [leftHanded, setLeftHanded] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const { data } = await axios.get("http://localhost:3000/api/scales");
        const arr = (data?.data || []).map((s) => ({
          id: s.id,
          scale: s.scale || "Unnamed Scale",
          notes: s.notes || [],
          degrees: s.degrees || [],
          positions_by_box: (s.positions_by_box || []).map((b) => ({
            box: b.box,
            positions: (b.positions || []).filter((p) => p.note),
          })),
        }));
        if (!mounted) return;
        setScales(arr);
        setError(null);
      } catch (e) {
        if (!mounted) return;
        setError(`Lỗi khi tải scales: ${e?.message || e}`);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const scaleTypes = useMemo(() => {
    const set = new Set();
    for (const s of scales) {
      if (!s.scale) continue;
      const parts = s.scale.trim().split(/\s+/);
      if (parts.length > 1) set.add(parts.slice(1).join(" "));
    }
    return Array.from(set).sort();
  }, [scales]);

  useEffect(() => {
    if (!selectedScaleType && scaleTypes.length) {
      setSelectedScaleType(scaleTypes[0]);
    }
  }, [scaleTypes, selectedScaleType]);

  useEffect(() => {
    if (!selectedScaleType || !selectedRootNote || !scales.length) return;
    const needle = `${selectedRootNote} ${selectedScaleType}`.toLowerCase();
    const found =
      scales.find((s) => s.scale?.toLowerCase() === needle) ||
      scales.find((s) => s.scale?.toLowerCase().includes(needle));
    if (found) {
      setCurrentScale(found);
      setSelectedBox(found.positions_by_box?.[0]?.box || 1);
      setError(null);
    } else {
      setCurrentScale(null);
      setError(
        `Không tìm thấy scale: ${selectedRootNote} ${selectedScaleType}`
      );
    }
  }, [selectedScaleType, selectedRootNote, scales]);

  const degreeMap = useMemo(() => {
    const map = {};
    if (currentScale?.notes && currentScale?.degrees) {
      currentScale.notes.forEach(
        (n, i) => (map[n] = currentScale.degrees[i] || "")
      );
    }
    return map;
  }, [currentScale]);

  const BoxTabs = () => {
    if (!currentScale?.positions_by_box?.length) return null;
    return (
      <div className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          {currentScale.positions_by_box.map((b) => (
            <button
              key={b.box}
              onClick={() => setSelectedBox(b.box)}
              className={[
                "px-3 py-1.5 rounded-full text-sm border",
                selectedBox === b.box
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-transparent shadow"
                  : "bg-white/60 dark:bg-gray-900/50 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800",
              ].join(" ")}
            >
              Box {b.box}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const Legend = () => {
    if (!currentScale?.notes?.length) return null;
    return (
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {currentScale.notes.map((n) => (
          <div key={n} className="flex items-center gap-2">
            <span
              className="inline-block w-4 h-4 rounded-full ring-1 ring-black/10 dark:ring-white/10"
              style={{ background: NOTE_COLORS[n] || "#4CAF50" }}
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">{n}</span>
              {degreeMap[n] ? (
                <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                  ({degreeMap[n]})
                </span>
              ) : null}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const ToggleGroup = () => (
    <div className="inline-flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {[LabelMode.NOTE, LabelMode.DEGREE, LabelMode.BOTH].map((m) => (
        <button
          key={m}
          onClick={() => setLabelMode(m)}
          className={[
            "px-3 py-1.5 text-sm",
            labelMode === m
              ? "bg-gray-900 text-white dark:bg.white dark:text-gray-900"
              : "bg-white/60 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800",
          ].join(" ")}
        >
          {m === LabelMode.NOTE
            ? "Note"
            : m === LabelMode.DEGREE
            ? "Degree"
            : "Both"}
        </button>
      ))}
    </div>
  );

  const Controls = () => (
    <div className="sticky top-4 space-y-5">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Scale Diagram
      </h2>

      <div className="grid grid-cols-1 gap-4">
        {/* Root */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Root Note
          </label>
          <div className="relative">
            <select
              className="w-full appearance-none px-3 py-2.5 rounded-xl border bg-white/80 dark:bg-gray-900/60 backdrop-blur border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedRootNote}
              onChange={(e) => setSelectedRootNote(e.target.value)}
            >
              {ALL_NOTES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-5 w-5 text-gray-500" />
          </div>
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Scale Type
          </label>
          <div className="relative">
            <select
              className="w-full appearance-none px-3 py-2.5 rounded-xl border bg-white/80 dark:bg-gray-900/60 backdrop-blur border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedScaleType}
              onChange={(e) => setSelectedScaleType(e.target.value)}
              disabled={!scaleTypes.length}
            >
              {!scaleTypes.length && <option>Loading…</option>}
              {scaleTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-5 w-5 text-gray-500" />
          </div>
        </div>

        {/* Label mode */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Labels
          </span>
          <ToggleGroup />
        </div>

        {/* Handedness */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Tay chơi
          </span>
          <button
            onClick={() => setLeftHanded((v) => !v)}
            className={[
              "px-3 py-1.5 rounded-xl text-sm border",
              leftHanded
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-transparent shadow"
                : "bg-white/60 dark:bg-gray-900/50 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800",
            ].join(" ")}
            title={
              leftHanded ? "Đang ở chế độ tay trái" : "Đang ở chế độ tay phải"
            }
          >
            {leftHanded ? "Left‑handed" : "Right‑handed"}
          </button>
        </div>

        {/* Box tabs */}
        {currentScale?.positions_by_box?.length > 1 && <BoxTabs />}

        {/* Meta card */}
        {currentScale && (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-blue-50/60 dark:bg-blue-950/30 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {currentScale.scale}
            </h3>
            <p className="text-sm mt-1 text-gray-700 dark:text-gray-300">
              <span className="font-medium">Notes:</span>{" "}
              {currentScale.notes?.join(", ")}
            </p>
            <p className="text-sm mt-1 text-gray-700 dark:text-gray-300">
              <span className="font-medium">Degrees:</span>{" "}
              {currentScale.degrees?.join(", ")}
            </p>
            <Legend />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border-l-4 border-red-500 bg-red-50 dark:bg-red-950/30 p-3 text-red-700 dark:text-red-200 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="lg:col-span-1">
            <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 backdrop-blur p-5 shadow-sm">
              {loading ? <SidebarSkeleton /> : <Controls />}
            </div>
          </div>

          {/* Fretboard */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-center rounded-3xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 backdrop-blur p-4 md:p-6 shadow-sm min-h-[420px]">
              {loading ? (
                <BoardSkeleton />
              ) : currentScale ? (
                <Fretboard
                  currentScale={currentScale}
                  selectedBox={selectedBox}
                  labelMode={labelMode}
                  leftHanded={leftHanded}
                />
              ) : (
                <EmptyState />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- Sub‑components ---------------------------- */

function Fretboard({ currentScale, selectedBox, labelMode, leftHanded }) {
  const currentBox = currentScale.positions_by_box.find(
    (b) => b.box === selectedBox
  );
  if (!currentBox?.positions?.length) return null;

  const rendered = new Set();
  const width = `${fretWidth * frets}px`;
  const height = `${stringSpacing * (strings - 1) + 40}px`;

  const degreeMap = useMemo(() => {
    const m = {};
    currentScale.notes?.forEach(
      (n, i) => (m[n] = currentScale.degrees?.[i] || "")
    );
    return m;
  }, [currentScale]);

  const renderLabel = (note) => {
    if (labelMode === LabelMode.NOTE) return note;
    if (labelMode === LabelMode.DEGREE) return degreeMap[note] || "";
    return `${note}\n${degreeMap[note] || ""}`;
  };

  const isTonic = (note) => note === currentScale.notes?.[0];
  const fretMarker = (i) => ([3, 5, 7, 9].includes(i) ? 1 : i === 12 ? 2 : 0);

  return (
    <div className="relative">
      {/* Fretboard container với hiệu ứng gương */}
      <div
        className={[
          "relative rounded-2xl border bg-gradient-to-b from-zinc-50 to-white dark:from-gray-950 dark:to-gray-900 border-gray-300 dark:border-gray-700 overflow-visible",
          leftHanded ? "[transform:scaleX(-1)]" : "",
        ].join(" ")}
        style={{ width, height }}
      >
        {/* Fret separators */}
        {Array.from({ length: frets + 1 }).map((_, i) => (
          <div
            key={`fret-${i}`}
            className="absolute top-0 bottom-0 bg-gray-300 dark:bg-gray-600"
            style={{
              left: `${i * fretWidth}px`,
              width: i === 0 ? "3px" : "1.5px",
            }}
          />
        ))}

        {/* Fret markers (dots) */}
        {Array.from({ length: frets + 1 }).map((_, i) => {
          const dots = fretMarker(i);
          if (!dots) return null;
          return (
            <div
              key={`marker-${i}`}
              className="absolute"
              style={{
                left: `${(i - 0.5) * fretWidth}px`,
                top: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className="flex flex-col items-center gap-8">
                {Array.from({ length: dots }).map((__, idx) => (
                  <span
                    key={idx}
                    className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 block"
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Strings */}
        {Array.from({ length: strings }).map((_, si) => {
          const y = topMargin + si * stringSpacing;
          const isThick = si < strings - 3;
          return (
            <div
              key={`string-${si}`}
              className={
                isThick
                  ? "absolute left-0 right-0 bg-gray-800 dark:bg-gray-200"
                  : "absolute left-0 right-0 border-t border-b border-dotted border-gray-400 dark:border-gray-500"
              }
              style={{ top: `${y}px`, height: isThick ? "2px" : "1px" }}
            />
          );
        })}

        {/* Notes - Counter-flip nốt nhạc để chữ hiển thị đúng */}
        {currentBox.positions
          .filter((p) => {
            const k = `${p.string}-${p.fret}`;
            if (rendered.has(k)) return false;
            rendered.add(k);
            return true;
          })
          .map((p) => {
            const y = topMargin + (p.string - 1) * stringSpacing;
            const x = p.fret === 0 ? -20 : p.fret * fretWidth - fretWidth / 2;
            const bg = NOTE_COLORS[p.note] || "#81C784";
            const label = renderLabel(p.note);
            const tonic = isTonic(p.note);

            return (
              <div
                key={`note-${p.string}-${p.fret}-${p.note}-${selectedBox}`}
                className={[
                  "absolute z-10 -translate-x-1/2 -translate-y-1/2",
                  "flex items-center justify-center text-[10px] leading-tight font-semibold",
                  "w-5 h-5 rounded-full shadow-sm ring-1 ring-black/10 dark:ring-white/10",
                  tonic ? "outline outline-2 outline-amber-400" : "",
                  // Counter-flip chỉ áp dụng cho nốt khi left-handed
                  leftHanded
                    ? "[transform:translateX(-50%)_translateY(-50%)_scaleX(-1)]"
                    : "",
                ].join(" ")}
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                  background: bg,
                  color: "#0b0b0b",
                }}
                title={`${p.note}${
                  degreeMap[p.note] ? ` (${degreeMap[p.note]})` : ""
                }`}
              >
                {label.split("\n").map((line, i) => (
                  <span
                    key={i}
                    className={
                      i === 0 ? "" : "block -mt-0.5 text-[8px] opacity-90"
                    }
                  >
                    {line}
                  </span>
                ))}
              </div>
            );
          })}

        {/* String numbers BÊN TRONG fretboard - sẽ bị lật nhưng được counter-flip */}
        {Array.from({ length: strings }).map((_, si) => {
          const y = topMargin + si * stringSpacing;
          const num = si + 1; // 1 ở trên, 6 ở dưới
          return (
            <React.Fragment key={`snum-${si}`}>
              {/* Số dây bên trái cần đàn */}
              <div
                className="absolute w-6 text-right text-[12px] font-semibold text-gray-700 dark:text-gray-300 select-none"
                style={{
                  left: "-44px", // lệch hẳn sang trái ngoài cần đàn
                  top: `${y}px`,
                  transform: "translateY(-50%)", // căn giữa theo dây
                }}
                aria-hidden
                title={`String ${num}`}
              >
                {num}
              </div>
            </React.Fragment>
          );
        })}

        {/* Fret numbers BÊN TRONG fretboard - sẽ bị lật nhưng được counter-flip */}
        {Array.from({ length: frets }).map((_, i) => (
          <div
            key={`fnum-${i}`}
            className={[
              "absolute text-[9px] font-medium text-gray-700 dark:text-gray-300 z-20",
              // Counter-flip số phím đàn để giữ nguyên hướng khi left-handed
              leftHanded
                ? "[transform:translateX(-50%)_scaleX(-1)]"
                : "[transform:translateX(-50%)]",
            ].join(" ")}
            style={{
              left: `${(i + 0.5) * fretWidth}px`,
              bottom: "-16px",
            }}
          >
            {i + 1}
          </div>
        ))}
      </div>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-7 w-40 bg-gray-200 dark:bg-gray-800 rounded" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="h-10 w-full bg-gray-200 dark:bg-gray-800 rounded-xl" />
        </div>
      ))}
      <div className="h-28 w-full bg-gray-200 dark:bg-gray-800 rounded-2xl" />
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <Spinner />
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Đang tải scale…
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center">
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Chọn Root + Type để hiển thị cần đàn
      </p>
    </div>
  );
}

function Spinner() {
  return (
    <div className="h-10 w-10 rounded-full border-2 border-gray-300 dark:border-gray-600 border-t-transparent animate-spin" />
  );
}

function ChevronDown(props) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
      className={"h-5 w-5 " + (props.className || "")}
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.38a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}
