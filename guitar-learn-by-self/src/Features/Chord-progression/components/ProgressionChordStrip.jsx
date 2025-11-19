import React, { useEffect, useState } from "react";
import ChordShapeViewer from "./ChordShapeViewer";

export default function ProgressionChordStrip({ symbols = [] }) {
  // items: { symbol, data: { chord, voicings }, loading, error }
  const [items, setItems] = useState(() =>
    symbols.map((s) => ({ symbol: s, data: null, loading: false, error: null }))
  );

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      // reset when symbols change
      setItems(
        symbols.map((s) => ({
          symbol: s,
          data: null,
          loading: true,
          error: null,
        }))
      );

      // fetch tuần tự để tránh burst
      for (let i = 0; i < symbols.length; i++) {
        const sym = symbols[i];
        try {
          const res = await fetch(
            `/api/chords/lookup?symbol=${encodeURIComponent(sym)}`
          );
          if (!res.ok) throw new Error(`API ${res.status}`);
          const json = await res.json();
          if (!cancelled) {
            setItems((prev) =>
              prev.map((it, idx) =>
                idx === i
                  ? { ...it, data: json, loading: false, error: null }
                  : it
              )
            );
          }
        } catch (e) {
          if (!cancelled) {
            setItems((prev) =>
              prev.map((it, idx) =>
                idx === i
                  ? { ...it, loading: false, error: e.message || String(e) }
                  : it
              )
            );
          }
        }
      }
    }

    if (symbols.length) loadAll();
    else setItems([]);

    return () => {
      cancelled = true;
    };
  }, [symbols]);

  return (
    <div className="space-y-4">
      {items.map((it, i) => (
        <div
          key={`${it.symbol}-${i}`}
          className="rounded-xl border dark:border-zinc-700 p-3"
        >
          <div className="font-semibold mb-1">
            {i + 1}. {it.symbol}
          </div>

          {it.loading && <div className="text-sm opacity-70">Loading…</div>}
          {it.error && <div className="text-sm text-rose-600">{it.error}</div>}

          {it.data && (
            <ChordShapeViewer
              chord={it.symbol}
              voicings={Array.isArray(it.data.voicings) ? it.data.voicings : []}
              className="mt-2"
            />
          )}

          {!it.loading && !it.error && !it.data && (
            <div className="text-sm opacity-70">No data.</div>
          )}
        </div>
      ))}
    </div>
  );
}
