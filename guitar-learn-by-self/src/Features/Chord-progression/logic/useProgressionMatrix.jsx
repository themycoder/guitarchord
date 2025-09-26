// src/features/progression-matrix/logic/useProgressionMatrix.jsx
import { useCallback, useEffect, useMemo, useState } from "react";

// 👉 ĐỔI thành URL BE của bạn (không có "/" ở cuối)
const API_BASE = "http://localhost:3000/api";

// --- Parser an toàn ---
async function safeJSON(res) {
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const text = await res.text();
    throw new Error(
      `Expected JSON, got: ${ct}. ${res.status} ${res.url} :: ${text.slice(
        0,
        140
      )}`
    );
  }
  return res.json();
}

/* =======================
   Helpers: preview chords
======================= */
const NOTE_CYCLE_SHARPS = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];
const NOTE_CYCLE_FLATS = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
];
const MAJOR_SCALE_STEPS = [0, 2, 4, 5, 7, 9, 11];
const preferFlats = (k) => ["F", "Bb", "Eb", "Ab", "Db"].includes(k);

const degreeToChord = (key, degree) => {
  const cyc = preferFlats(key) ? NOTE_CYCLE_FLATS : NOTE_CYCLE_SHARPS;
  const rootIndex = cyc.indexOf(key);
  if (rootIndex < 0) return degree;

  const base = degree.replace(/7|°/g, "");
  const idxMap = { I: 0, II: 1, III: 2, IV: 3, V: 4, VI: 5, VII: 6 };
  const degIdx = idxMap[base.toUpperCase()];
  if (degIdx === undefined) return degree;

  const semitone = (rootIndex + MAJOR_SCALE_STEPS[degIdx]) % 12;
  const rootName = cyc[semitone];

  const isLower = base === base.toLowerCase(); // ii/iii/vi -> minor
  const triad = isLower ? "m" : "";
  const has7 = /7/.test(degree);
  const hasDim = /°/.test(degree) || base.toUpperCase() === "VII";

  if (hasDim && has7) return `${rootName}m7b5`;
  if (hasDim) return `${rootName}dim`;
  if (has7) return `${rootName}${triad}7`;
  return `${rootName}${triad}`;
};
const degreesToChords = (key, degrees) =>
  degrees.map((d) => degreeToChord(key, d));

/* =======================
   Helpers: expand filters
   để BE khớp cả 'vi' khi FE chọn 'VIm' (Am)
======================= */
const ROMAN_RE = /^(VII|VI|IV|III|II|V|I)/i;
const toLowerRoman = (romanUpper) =>
  romanUpper.replace(/[IVX]+/g, (m) => m.toLowerCase());

function expandTokenForFilter(tok) {
  const t = String(tok || "");
  // giữ nguyên token có slash (DB thường lưu đúng chuỗi): "I/III", "V/ii"
  if (t.includes("/")) return [t];

  const acc = t[0] === "b" ? "b" : t[0] === "#" ? "#" : "";
  const rest = acc ? t.slice(1) : t;
  const m = rest.match(ROMAN_RE);
  if (!m) return [t];

  const baseRaw = m[0]; // "II", "ii", ...
  const baseUpper = baseRaw.toUpperCase(); // "II"
  const baseLower = toLowerRoman(baseUpper); // "ii"
  const suffix = rest.slice(m[0].length); // "m", "7", "maj7"...

  const out = new Set([t]);

  // Nếu token là minor triad (có 'm' đầu suffix), thêm biến thể DB hay dùng (vi, vim)
  if (/^m(?!aj)/i.test(suffix)) {
    out.add(acc + baseLower); // "vi"
    out.add(acc + baseLower + suffix); // "vim"
  }

  // Nếu bậc vốn là thứ (ii/iii/vi) mà token không ghi 'm', thêm dạng chữ thường
  const isMinorDegree = ["II", "III", "VI"].includes(baseUpper);
  if (isMinorDegree && !/^m(?!aj)/i.test(suffix)) {
    out.add(acc + baseLower + suffix); // "ii", "ii7"
  }

  // Thêm biến thể không accidental (tuỳ dữ liệu DB)
  out.add(baseLower + suffix); // "vi", "ii7" (không b/#)

  return Array.from(out);
}

function expandColumnForFilter(col) {
  const expanded = new Set();
  col.forEach((tok) =>
    expandTokenForFilter(tok).forEach((x) => expanded.add(x))
  );
  return Array.from(expanded);
}

function buildSelectedParamExpanded(columnsSelected) {
  // Trong một cột: OR bằng '|'; giữa các cột: AND bằng ';'
  return columnsSelected
    .map(expandColumnForFilter)
    .map((list) => list.filter(Boolean).join("|"))
    .filter(Boolean)
    .join(";");
}

/* =======================
   HOOK CHÍNH
======================= */
export function useProgressionMatrix() {
  const [meta, setMeta] = useState(null);
  const [displayMode, setDisplayMode] = useState("degree"); // "degree" | "absolute"
  const [currentKey, setCurrentKey] = useState("C");

  const [search, setSearch] = useState("");
  const [tags, setTags] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progressions, setProgressions] = useState([]);

  // luôn 7 nhóm I..VII (có thể adjust theo meta nếu BE trả columns)
  const [columnsSelected, setColumnsSelected] = useState(
    Array.from({ length: 7 }, () => [])
  );

  // tải meta (không bắt buộc để chạy UI cố định)
  const fetchMeta = useCallback(async () => {
    try {
      setError("");
      const res = await fetch(`${API_BASE}/matrix/meta`, { mode: "cors" });
      const json = await safeJSON(res);
      if (json?.success) {
        setMeta(json.data);
        if (Array.isArray(json.data?.columns) && json.data.columns.length) {
          setColumnsSelected(
            Array.from({ length: json.data.columns.length }, () => [])
          );
        }
      }
    } catch (e) {
      // meta fail không chặn luồng chính
      console.warn("Load meta failed:", e?.message);
    }
  }, []);

  const fetchProgressions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const selected = buildSelectedParamExpanded(columnsSelected);

      const params = new URLSearchParams();
      if (selected) params.set("selected", selected);
      if (search) params.set("search", search);
      if (tags.length) params.set("tags", tags.join(","));
      if (displayMode === "absolute") {
        params.set("mode", "chord");
        params.set("key", currentKey);
      }

      const res = await fetch(`${API_BASE}/progressions?${params.toString()}`, {
        mode: "cors",
      });
      const json = await safeJSON(res);
      if (!json.success) throw new Error("Load progressions failed");
      setProgressions(json.data || []);
    } catch (e) {
      setError(e?.message || "Cannot load progressions");
    } finally {
      setLoading(false);
    }
  }, [columnsSelected, search, tags, displayMode, currentKey]);

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);
  useEffect(() => {
    fetchProgressions();
  }, [fetchProgressions]);

  // === selection API ===
  const toggleToken = useCallback((colIndex, token) => {
    setColumnsSelected((prev) => {
      const next = prev.map((a) => [...a]);
      const i = next[colIndex]?.indexOf(token) ?? -1;
      if (i >= 0) next[colIndex].splice(i, 1);
      else next[colIndex].push(token);
      return next;
    });
  }, []);

  const isTokenSelected = useCallback(
    (t) => columnsSelected.some((col) => col.includes(t)),
    [columnsSelected]
  );

  const resetSelection = useCallback(() => {
    setColumnsSelected((prev) => Array.from({ length: prev.length }, () => []));
  }, []);

  // preview chords (dùng trong phần Results nếu cần)
  const previewChords = useCallback(
    (p) =>
      displayMode === "absolute"
        ? degreesToChords(currentKey, p.degrees)
        : p.degrees,
    [displayMode, currentKey]
  );

  // vài tiện ích nếu bạn vẫn dùng meta để render filter khác
  const triadRow = useMemo(
    () => meta?.columns ?? ["I", "II", "III", "IV", "V", "VI", "VII"],
    [meta]
  );
  const seventhRow = useMemo(
    () => triadRow.map((c) => (c.includes("°") ? c : `${c}7`)),
    [triadRow]
  );
  const specialRows = useMemo(
    () =>
      (meta?.groups ?? [])
        .filter((g) => g.name?.toLowerCase().includes("special"))
        .map((g) => g.items),
    [meta]
  );

  return {
    // state
    meta,
    displayMode,
    setDisplayMode,
    currentKey,
    setCurrentKey,
    search,
    setSearch,
    tags,
    setTags,

    loading,
    error,
    progressions,

    // selection
    columnsSelected,
    toggleToken,
    isTokenSelected,
    resetSelection,

    // helpers
    previewChords,
    triadRow,
    seventhRow,
    specialRows,

    // actions
    refetch: fetchProgressions,
  };
}
