import { useEffect, useState } from "react";

export function useChordShape(name) {
  const [data, setData] = useState(null); // { name, positions, barre?, startFret? }
  const [loading, setLoading] = useState(!!name);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!name) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);

    fetch(`/api/chords?name=${encodeURIComponent(name)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((e) => {
        if (!cancelled) setError(e);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [name]);

  return { data, loading, error };
}
