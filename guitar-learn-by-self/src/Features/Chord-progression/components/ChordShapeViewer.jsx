import React, { useMemo, useState } from "react";
import Fretboard from "../../../components/Fretboard/SmallFretboard";

/**
 * Props:
 * - chord: string
 * - voicings: [...]
 * - size?: "sm" | "md" (default "md")
 * - className?: string
 */
export default function ChordShapeViewer({
  chord,
  voicings = [],
  size = "md",
  className = "",
}) {
  const [idx, setIdx] = useState(0);
  const total = voicings.length;
  const cur = voicings[idx] || {};

  const next = () => setIdx((i) => (total ? (i + 1) % total : 0));
  const prev = () => setIdx((i) => (total ? (i - 1 + total) % total : 0));

  const shape = useMemo(() => {
    if (!cur) return null;
    return {
      name: [chord, cur.type, cur.variation].filter(Boolean).join(" "),
      positions: Array.isArray(cur.positions) ? cur.positions : [],
      barre: cur.barre || null,
    };
  }, [cur, chord]);

  // kích thước cố định theo size → mọi thẻ đều nhau
  const fretboardWidth =
    size === "sm" ? "w-[180px] md:w-[200px]" : "w-[220px] md:w-[240px]";
  const fretboardHeight =
    size === "sm" ? "h-[200px] md:h-[220px]" : "h-[240px] md:h-[260px]";
  const btn = size === "sm" ? "h-7 w-7 text-[12px]" : "h-8 w-8";
  const metaText = size === "sm" ? "text-[11px]" : "text-xs";

  return (
    <div className={`flex h-full flex-col ${className}`}>
      {/* header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="font-semibold truncate">{chord}</div>
        <div className="flex items-center gap-1">
          <button
            onClick={prev}
            className={`${btn} grid place-items-center rounded-md border bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700`}
            aria-label="Previous voicing"
          >
            ◀
          </button>
          <span className={`min-w-[40px] text-center ${metaText} opacity-70`}>
            {total ? idx + 1 : 0}/{total || 0}
          </span>
          <button
            onClick={next}
            className={`${btn} grid place-items-center rounded-md border bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700`}
            aria-label="Next voicing"
          >
            ▶
          </button>
        </div>
      </div>

      {/* meta */}
      <div className={`mt-1 ${metaText} opacity-70`}>
        {cur.difficulty ? `Difficulty: ${cur.difficulty}` : ""}
        {cur.tags?.length ? ` • ${cur.tags.join(", ")}` : ""}
      </div>

      {/* vùng fretboard có HEIGHT cố định → mọi thẻ bằng nhau */}
      <div className={`mt-2 flex-1 grid place-items-center ${fretboardHeight}`}>
        <div className={`mx-auto ${fretboardWidth} max-w-full overflow-hidden`}>
          {shape ? (
            <Fretboard
              shape={shape}
              initialHorizontal={false}
              initialLeftHanded={false}
            />
          ) : (
            <div className={`${metaText} opacity-70`}>No voicing</div>
          )}
        </div>
      </div>
    </div>
  );
}
