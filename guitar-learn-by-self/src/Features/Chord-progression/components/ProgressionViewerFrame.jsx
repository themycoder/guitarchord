import React, { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import ChordShapeViewer from "./ChordShapeViewer";

const API_BASE =
  (typeof window !== "undefined" && window.__API_BASE__) ||
  (typeof process !== "undefined" &&
    process.env &&
    process.env.NEXT_PUBLIC_API_BASE) ||
  "http://localhost:3000/api";

// ======= helpers (giữ đúng các route bạn có) =======
const ENH = {
  "A#": "Bb",
  Bb: "A#",
  "C#": "Db",
  Db: "C#",
  "D#": "Eb",
  Eb: "D#",
  "F#": "Gb",
  Gb: "F#",
  "G#": "Ab",
  Ab: "G#",
};
const norm = (s) =>
  String(s || "")
    .replace(/\s+/g, "")
    .toLowerCase();
const sanitize = (s) =>
  String(s || "")
    .replace(/:\d+\b/g, "")
    .replace(/\s+/g, "")
    .trim();

function splitSymbol(sym = "") {
  const m = String(sym)
    .trim()
    .match(/^([A-Ga-g][#b]?)(.*)$/);
  if (!m) return { root: "", quality: "", raw: sym };
  return { root: m[1].toUpperCase(), quality: m[2] || "", raw: sym };
}
function withEnharmonics(sym) {
  const { root, quality, raw } = splitSymbol(sym);
  const alt = ENH[root];
  return alt ? [raw, `${alt}${quality}`] : [raw];
}

async function getChordByNameStrict(name) {
  try {
    const { data } = await axios.get(
      `${API_BASE}/chords/${encodeURIComponent(name)}`,
      {
        headers: { Accept: "application/json" },
        validateStatus: () => true,
      }
    );
    if (data && data._id) return data;
    if (data?.chord?._id) return data.chord;
  } catch {}
  for (const key of ["name", "q"]) {
    try {
      const { data, status } = await axios.get(`${API_BASE}/chords/search`, {
        params: { [key]: name },
        headers: { Accept: "application/json" },
        validateStatus: () => true,
      });
      if (status >= 200 && status < 300 && Array.isArray(data)) {
        const exact = data.find((c) => norm(c?.name) === norm(name));
        if (exact) return exact;
        const viaAlias = data.find((c) =>
          (c?.aliases || []).some((a) => norm(a) === norm(name))
        );
        if (viaAlias) return viaAlias;
        if (data[0]?._id) return data[0];
      }
    } catch {}
  }
  try {
    const { data, status } = await axios.get(`${API_BASE}/chords/library`, {
      headers: { Accept: "application/json" },
      validateStatus: () => true,
    });
    if (status >= 200 && status < 300 && data && Array.isArray(data.chords)) {
      const byName = data.chords.find((c) => norm(c?.name) === norm(name));
      if (byName) return byName;
      const byAlias = data.chords.find((c) =>
        (c.aliases || []).some((a) => norm(a) === norm(name))
      );
      if (byAlias) return byAlias;
    }
  } catch {}
  return null;
}

async function getChordByAnyName(sym) {
  const first = sanitize(sym);
  let chord = await getChordByNameStrict(first);
  if (chord?._id) return chord;

  if (first.includes("/")) {
    const base = first.split("/")[0];
    chord = await getChordByNameStrict(base);
    if (chord?._id) return chord;
  }
  for (const candidate of withEnharmonics(first)) {
    chord = await getChordByNameStrict(candidate);
    if (chord?._id) return chord;
  }
  return null;
}

async function getChordVoicingsByChordId(chordId) {
  const { data, status } = await axios.get(
    `${API_BASE}/chord-shapes/${encodeURIComponent(chordId)}`,
    {
      headers: { Accept: "application/json" },
      validateStatus: () => true,
    }
  );
  if (status >= 200 && status < 300) return Array.isArray(data) ? data : [];
  throw new Error(`GET /chord-shapes/${chordId} → HTTP ${status}`);
}

// ======= component =======
export default function ProgressionViewerFrame({
  open,
  onClose,
  title = "Progression",
  keyName,
  symbols = [], // ["C","F","C","G","F","C"]
}) {
  const [items, setItems] = useState([]);
  const stripRef = useRef(null);

  // reset items
  useEffect(() => {
    if (!open) return;
    setItems(
      symbols.map((s) => ({
        symbol: s,
        data: null,
        loading: true,
        error: null,
      }))
    );
  }, [open, symbols]);

  // load voicings
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      for (let i = 0; i < symbols.length; i++) {
        const sym = symbols[i];
        try {
          const chord = await getChordByAnyName(sym);
          if (!chord?._id) {
            if (!cancelled) {
              setItems((prev) =>
                prev.map((it, idx) =>
                  idx === i
                    ? {
                        ...it,
                        loading: false,
                        error: `Chord not found: ${sym}`,
                      }
                    : it
                )
              );
            }
            continue;
          }
          const voicings = await getChordVoicingsByChordId(chord._id);
          if (!cancelled) {
            setItems((prev) =>
              prev.map((it, idx) =>
                idx === i
                  ? { ...it, data: { voicings }, loading: false, error: null }
                  : it
              )
            );
          }
        } catch (err) {
          if (!cancelled) {
            setItems((prev) =>
              prev.map((it, idx) =>
                idx === i
                  ? {
                      ...it,
                      loading: false,
                      error: err.message || "Failed to load shapes",
                    }
                  : it
              )
            );
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, symbols]);

  const scrollByCards = useCallback((n) => {
    const cardWidth = 260 + 16; // w + gap = ~260px + 16px
    stripRef.current?.scrollBy({ left: n * cardWidth, behavior: "smooth" });
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-white dark:bg-zinc-950">
      {/* Header */}
      <div className="sticky top-0 z-[71] border-b border-zinc-200/70 dark:border-zinc-800/70 bg-white/80 dark:bg-zinc-950/80 backdrop-blur px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:border-zinc-700"
          >
            ← Back
          </button>
          <div>
            <div className="text-lg font-semibold">{title}</div>
            {keyName && (
              <div className="text-xs opacity-70">Key: {keyName}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scrollByCards(-2)}
            className="h-9 w-9 grid place-items-center rounded-md border bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            aria-label="Scroll left"
          >
            ◀
          </button>
          <button
            onClick={() => scrollByCards(2)}
            className="h-9 w-9 grid place-items-center rounded-md border bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            aria-label="Scroll right"
          >
            ▶
          </button>
          <div className="text-sm opacity-70 ml-2">
            {symbols.length} chord{symbols.length > 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Content – strip ngang, thẻ đồng chiều cao */}
      <div className="px-3 md:px-4">
        {symbols.length === 0 ? (
          <div className="text-sm opacity-70 py-4">
            No chords in this progression.
          </div>
        ) : (
          <div
            ref={stripRef}
            className="flex gap-4 overflow-x-auto pb-5 snap-x snap-mandatory"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <style>{`.hide-scrollbar::-webkit-scrollbar{display:none;}`}</style>

            {items.map((it, i) => (
              <div
                key={`${it.symbol}-${i}`}
                className="hide-scrollbar w-[240px] md:w-[260px] h-[340px] md:h-[380px] shrink-0 snap-start rounded-xl border dark:border-zinc-800 bg-zinc-950/10 dark:bg-zinc-900/40 p-3 flex flex-col"
              >
                <div className="font-semibold truncate">
                  {i + 1}. {it.symbol}
                </div>
                {it.loading && (
                  <div className="mt-2 text-sm opacity-70">Loading…</div>
                )}
                {it.error && (
                  <div className="mt-2 text-sm text-rose-600">{it.error}</div>
                )}
                {it.data && (
                  <ChordShapeViewer
                    chord={it.symbol}
                    voicings={
                      Array.isArray(it.data.voicings) ? it.data.voicings : []
                    }
                    size="sm"
                    className="mt-2 flex-1"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
