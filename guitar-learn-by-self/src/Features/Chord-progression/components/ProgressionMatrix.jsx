// src/features/progression-matrix/components/ProgressionMatrix.jsx
import React, { useMemo, useState, useCallback } from "react";
import { MATRIX_LAYOUT } from "../logic/layout";
import { useProgressionMatrix } from "../logic/useProgressionMatrix";

/* ===================== Note helpers ===================== */
const SHARPS = [
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
const FLATS = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const STEPS = [0, 2, 4, 5, 7, 9, 11]; // I..VII
const DEGIDX = { I: 0, II: 1, III: 2, IV: 3, V: 4, VI: 5, VII: 6 };
const preferFlats = (k) => ["F", "Bb", "Eb", "Ab", "Db", "Gb"].includes(k);

// Regex để tách phần số La Mã và phần hậu tố
const ROMAN_SPLIT_RE = /^(b|#)?\s*(VII|VI|IV|III|II|V|I)(.*)$/i;

const headersForKey = (key) => {
  const cyc = preferFlats(key) ? FLATS : SHARPS;
  const root = cyc.indexOf(key);
  if (root < 0) return ["I", "II", "III", "IV", "V", "VI", "VII"];
  return STEPS.map((st) => cyc[(root + st) % 12]);
};

const degreeToNote = (key, romanUpper, accidental = "") => {
  const cyc = preferFlats(key) ? FLATS : SHARPS;
  const root = cyc.indexOf(key);
  if (root < 0) return "";

  const i = DEGIDX[romanUpper] ?? 0;
  let s = (root + STEPS[i]) % 12;

  // Xử lý accidental
  if (accidental === "b") s = (s - 1 + 12) % 12;
  if (accidental === "#") s = (s + 1) % 12;

  return cyc[s] || "";
};

/* ===================== ROMAN -> LETTER ===================== */
const romanToLetter = (romanPart, key) => {
  const match = romanPart.match(ROMAN_SPLIT_RE);
  if (!match) return romanPart;

  const accidental = match[1] || "";
  const romanNumeral = match[2].toUpperCase();
  const suffix = match[3] || "";

  const note = degreeToNote(key, romanNumeral, accidental);
  if (!note) return romanPart;

  return `${note}${suffix}`;
};

const renderToken_RomanToLetter = (token, key) => {
  const s = String(token ?? "").trim();
  if (!s.includes("/")) return romanToLetter(s, key);

  const [L, R] = s.split("/").map((x) => x.trim());
  return `${romanToLetter(L, key)}/${romanToLetter(R, key)}`;
};

/* ===================== LETTER -> ROMAN ===================== */
const NOTE_INDEX = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
  "E#": 5,
  Fb: 4,
  "B#": 0,
  Cb: 11,
};
const DEG_ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];

const noteToRomanBase = (key, noteIdx) => {
  const cyc = preferFlats(key) ? FLATS : SHARPS;
  const root = cyc.indexOf(key);
  if (root < 0) return null;

  for (let di = 0; di < 7; di++) {
    const sem = (root + STEPS[di]) % 12;
    if (sem === noteIdx) return { acc: "", deg: di };
    if ((sem + 1) % 12 === noteIdx) return { acc: "#", deg: di };
    if ((sem + 11) % 12 === noteIdx) return { acc: "b", deg: di };
  }
  return null;
};

const letterToRoman = (letterPart, key) => {
  const match = letterPart.match(/^([A-G][#b]?)(.*)$/i);
  if (!match) return letterPart;

  const noteName = match[1];
  const suffix = match[2];

  const noteIdx = NOTE_INDEX[noteName.toUpperCase()];
  if (noteIdx === undefined) return letterPart;

  const base = noteToRomanBase(key, noteIdx);
  if (!base) return letterPart;

  let roman = base.acc + DEG_ROMAN[base.deg];

  // Giữ nguyên tất cả các hậu tố (m, dim, maj, m7, m(b5), etc.)
  return roman + suffix;
};

const renderToken_LetterToRoman = (token, key) => {
  const s = String(token ?? "").trim();

  // Nếu đã là số La Mã thì giữ nguyên
  if (/^(b|#)?\s*(VII|VI|IV|III|II|V|I)/i.test(s)) return s;

  if (!s.includes("/")) return letterToRoman(s, key);

  const [L, R] = s.split("/").map((x) => x.trim());
  const left = letterToRoman(L, key);
  const right = letterToRoman(R, key);
  return `${left}/${right}`;
};

/* ===================== RESULTS ===================== */
const renderTokenForResults = (token, key) => {
  const s = String(token ?? "").trim();
  if (!s.includes("/")) {
    // Xử lý cho từng phần hợp âm
    const match = s.match(ROMAN_SPLIT_RE);
    if (!match) return s;

    const accidental = match[1] || "";
    const romanNumeral = match[2];
    const suffix = match[3] || "";

    const note = degreeToNote(key, romanNumeral.toUpperCase(), accidental);
    if (!note) return s;

    // Nếu số La Mã viết thường (ví dụ: vi, iv, ii) thì thêm 'm' cho hợp âm thứ
    const isMinor = romanNumeral === romanNumeral.toLowerCase();
    const qualitySuffix = isMinor ? "m" + suffix : suffix;

    return `${note}${qualitySuffix}`;
  }

  // Xử lý cho hợp âm có bass note (ví dụ: IV/vi)
  const [L, R] = s.split("/").map((x) => x.trim());

  const leftMatch = L.match(ROMAN_SPLIT_RE);
  const rightMatch = R.match(ROMAN_SPLIT_RE);

  let leftResult = L;
  let rightResult = R;

  if (leftMatch) {
    const acc = leftMatch[1] || "";
    const roman = leftMatch[2];
    const suffix = leftMatch[3] || "";
    const note = degreeToNote(key, roman.toUpperCase(), acc);
    if (note) {
      const isMinor = roman === roman.toLowerCase();
      leftResult = `${note}${isMinor ? "m" + suffix : suffix}`;
    }
  }

  if (rightMatch) {
    const acc = rightMatch[1] || "";
    const roman = rightMatch[2];
    const suffix = rightMatch[3] || "";
    const note = degreeToNote(key, roman.toUpperCase(), acc);
    if (note) {
      const isMinor = roman === roman.toLowerCase();
      rightResult = `${note}${isMinor ? "m" + suffix : suffix}`;
    }
  }

  return `${leftResult}/${rightResult}`;
};

/* ===================== UI helpers ===================== */
const pillBase =
  "px-3 py-1 rounded-lg border text-sm transition select-none w-full text-center shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-400 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900";

const colorFor = (state) => {
  if (state === "selected")
    return (
      `${pillBase} bg-orange-500 text-white border-orange-600 hover:bg-orange-600 active:bg-orange-700 ` +
      `dark:bg-orange-500 dark:text-white dark:border-orange-600 dark:hover:bg-orange-600`
    );
  if (state === "related")
    return (
      `${pillBase} bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200 ` +
      `dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-800 dark:hover:bg-amber-900/60`
    );
  return (
    `${pillBase} bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200 ` +
    `dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700`
  );
};

const groupIndexForRoman = (romans, r) => Math.max(0, romans.indexOf(r));
const groupRomanOfColumn = (col) =>
  col.kind === "deg" ? col.roman || "I" : col.between?.split("-")[1] || "I";

export default function ProgressionMatrix() {
  const {
    currentKey,
    setCurrentKey,
    columnsSelected,
    toggleToken,
    isTokenSelected,
    progressions,
    loading,
    error,
    refetch,
  } = useProgressionMatrix();

  const [headerMode, setHeaderMode] = useState("letter");
  const columns12 = MATRIX_LAYOUT.columns12;
  const romans = MATRIX_LAYOUT.header.roman;
  const headers = useMemo(() => headersForKey(currentKey), [currentKey]);

  const selectedSet = useMemo(() => {
    const s = new Set();
    columnsSelected.forEach((col) => col.forEach((t) => s.add(t)));
    return s;
  }, [columnsSelected]);

  // Hàm chuẩn hóa số La Mã để so sánh (bỏ qua case và các hậu tố phức tạp)
  const normalizeRoman = useCallback((degree) => {
    if (!degree) return "";
    const match = String(degree).match(/^(b|#)?\s*(VII|VI|IV|III|II|V|I)/i);
    if (!match) return degree;
    return (match[1] || "") + match[2].toUpperCase();
  }, []);

  const relatedSet = useMemo(() => {
    const r = new Set();

    // Tạo set các số La Mã đã được chuẩn hóa từ selectedSet
    const normalizedSelected = new Set();
    selectedSet.forEach((token) => {
      normalizedSelected.add(normalizeRoman(token));
    });

    // Duyệt qua tất cả các progression
    progressions.forEach((p) => {
      const degrees = p.degrees || [];

      // Kiểm tra xem progression này có chứa BẤT KỲ hợp âm nào đang được chọn không
      const containsSelected = degrees.some((degree) => {
        const normalizedDegree = normalizeRoman(degree);
        return normalizedSelected.has(normalizedDegree);
      });

      // Nếu có, thêm TẤT CẢ các hợp âm trong progression này vào relatedSet
      if (containsSelected) {
        degrees.forEach((degree) => {
          // Kiểm tra xem hợp âm này có trong selectedSet không (so sánh chuẩn hóa)
          const normalizedDegree = normalizeRoman(degree);
          const isSelected = Array.from(selectedSet).some(
            (selectedToken) =>
              normalizeRoman(selectedToken) === normalizedDegree
          );

          if (!isSelected) {
            r.add(degree);
          }
        });
      }
    });

    return r;
  }, [progressions, selectedSet, normalizeRoman]);

  const onToggle = useCallback(
    (groupRoman, tok) => {
      const gIdx = groupIndexForRoman(romans, groupRoman);
      toggleToken(gIdx, tok);
      refetch();
    },
    [romans, toggleToken, refetch]
  );

  const onHeaderClick = useCallback(
    (col) => {
      const tokens = Array.from(
        new Set((col.rows || []).flat().filter(Boolean))
      );
      if (tokens.length === 0) return;

      const groupRoman = groupRomanOfColumn(col);
      const gIdx = groupIndexForRoman(romans, groupRoman);
      const allSelected = tokens.every((t) => isTokenSelected(t));

      tokens.forEach((t) => {
        if (allSelected && isTokenSelected(t)) toggleToken(gIdx, t);
        if (!allSelected && !isTokenSelected(t)) toggleToken(gIdx, t);
      });
      refetch();
    },
    [romans, isTokenSelected, toggleToken, refetch]
  );

  const renderDegreesForResults = useCallback(
    (degrees) =>
      headerMode === "roman"
        ? degrees.map((d) => renderTokenForResults(d, currentKey))
        : degrees,
    [headerMode, currentKey]
  );

  const ROWS = [0, 1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 transition-colors">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap rounded-2xl border bg-gray-50/60 dark:bg-gray-900/60 dark:border-gray-800 px-3 py-2 md:px-4 md:py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Key
            </span>
            <select
              value={currentKey}
              onChange={(e) => setCurrentKey(e.target.value)}
              className="border rounded-lg px-3 py-2 bg-white/90 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              aria-label="Chọn Key"
            >
              {MATRIX_LAYOUT.keysMajor.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          <div className="inline-flex rounded-xl overflow-hidden border bg-white dark:bg-gray-900 dark:border-gray-700 shadow-sm">
            <button
              onClick={() => setHeaderMode("roman")}
              className={`px-3 py-2 text-sm transition focus:outline-none ${
                headerMode === "roman"
                  ? "bg-indigo-600 text-white dark:bg-indigo-600"
                  : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
              aria-pressed={headerMode === "roman"}
            >
              I II III
            </button>
            <button
              onClick={() => setHeaderMode("letter")}
              className={`px-3 py-2 text-sm transition focus:outline-none ${
                headerMode === "letter"
                  ? "bg-indigo-600 text-white dark:bg-indigo-600"
                  : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
              aria-pressed={headerMode === "letter"}
            >
              C D E
            </button>
          </div>
        </div>

        {/* Legend nhỏ */}
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md border bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700">
            • Normal
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md border bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-800">
            • Related
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md border bg-orange-500 text-white border-orange-600">
            • Selected
          </span>
        </div>
      </div>

      {/* Matrix */}
      <div className="rounded-2xl border bg-white dark:bg-gray-900 dark:border-gray-800 overflow-hidden shadow-md">
        {/* Header */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${columns12.length},minmax(0,1fr))`,
          }}
        >
          {columns12.map((c, idx) => {
            if (c.kind === "deg") {
              const i = romans.indexOf(c.roman);
              const note = headers[i];
              const roman = c.roman;
              const big = headerMode === "roman" ? roman : note;
              const small = headerMode === "roman" ? note : roman;

              return (
                <button
                  key={`h-${idx}`}
                  onClick={() => onHeaderClick(c)}
                  className="px-2 py-2 text-center hover:opacity-95 focus:outline-none group transition bg-gradient-to-b from-sky-700 to-sky-800 text-white dark:from-sky-800 dark:to-sky-900 border-r border-sky-900/30 dark:border-sky-900/50"
                  title="Chọn/Bỏ chọn toàn cột"
                >
                  <div className="font-semibold text-base tracking-wide">
                    {big}
                  </div>
                  <div className="text-[11px] opacity-90">{small}</div>
                  <div className="h-[3px] w-8 bg-white/70 mx-auto mt-1 rounded group-hover:w-10 transition-all"></div>
                </button>
              );
            }
            return (
              <button
                key={`h-${idx}`}
                onClick={() => onHeaderClick(c)}
                className="px-1 py-2 text-center scale-x-75 origin-center hover:opacity-95 focus:outline-none bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200 border-r border-sky-200 dark:border-sky-900/60"
                title="Chọn/Bỏ chọn cột bắc cầu"
              >
                <div className="text-xs font-medium">{c.between}</div>
                <div className="h-[2px] w-6 bg-sky-300 dark:bg-sky-600 mx-auto mt-1 rounded"></div>
              </button>
            );
          })}
        </div>

        {/* Body */}
        {ROWS.map((rowIdx) => (
          <div
            key={`row-${rowIdx}`}
            className="grid gap-x-1 gap-y-2 p-2 border-t border-gray-200/60 dark:border-gray-800/80"
            style={{
              gridTemplateColumns: `repeat(${columns12.length},minmax(0,1fr))`,
            }}
          >
            {columns12.map((c, ci) => {
              const tokens = c.rows?.[rowIdx] || [];
              const groupRoman = groupRomanOfColumn(c);

              return (
                <div
                  key={`cell-${rowIdx}-${ci}`}
                  className={c.kind === "gap" ? "scale-x-75 origin-center" : ""}
                >
                  <div className="flex flex-col gap-2">
                    {tokens.map((tok) => {
                      const state = isTokenSelected(tok)
                        ? "selected"
                        : relatedSet.has(tok)
                        ? "related"
                        : "normal";

                      const label =
                        headerMode === "roman"
                          ? renderToken_RomanToLetter(tok, currentKey)
                          : renderToken_LetterToRoman(tok, currentKey);

                      return (
                        <button
                          key={`${rowIdx}-${ci}-${tok}`}
                          onClick={() => onToggle(groupRoman, tok)}
                          className={colorFor(state)}
                          title={tok}
                        >
                          {label}
                        </button>
                      );
                    })}
                    {tokens.length === 0 && <div className="h-6" />}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Results */}
      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Progressions</h2>
          {loading && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Loading...
            </span>
          )}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>

        {!loading && !error && progressions.length === 0 && (
          <div className="text-gray-600 dark:text-gray-400 text-sm rounded-xl border bg-gray-50/60 dark:bg-gray-900/60 dark:border-gray-800 px-4 py-3">
            No matching progressions found.
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-3">
          {progressions.map((p) => (
            <div
              key={p._id || p.id || p.title}
              className="rounded-xl border p-3 bg-white dark:bg-gray-900 dark:border-gray-800 shadow-sm hover:shadow-md transition"
            >
              <div className="font-semibold">{p.title || "Untitled"}</div>
              <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                {renderDegreesForResults(p.degrees).join(" – ")}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
