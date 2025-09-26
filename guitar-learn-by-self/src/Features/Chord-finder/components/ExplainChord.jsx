import React, { useMemo, useEffect } from "react";

/**
 * ExplainChord – Phân tích & hiển thị tên hợp âm từ danh sách nốt
 *
 * Props:
 *  - notes: Array<string | {note: "A"|"B"|..., isSharp?: boolean, stringNumber?: number}>
 *           (có thể kèm octave nhưng không bắt buộc)
 *  - bassAsRoot: boolean  (ưu tiên lấy nốt ở dây trầm nhất làm root)
 *  - rootOverride: string (nếu có -> ép root theo giá trị này, ví dụ "C#" | "Db" | "A")
 *  - renderFancy: boolean (hiển thị dạng có sup/sub + (add/tension))
 *  - onAnalyzed: (res) => void  // res = { root, symbol, plain, parts }
 *  - className: string          // thêm class ngoài cùng
 */

const NOTE_TO_PC = {
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
};
const PC_TO_NAME = [
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
const mod = (n, m) => ((n % m) + m) % m;
const cx = (...a) => a.filter(Boolean).join(" ");

/* Chuẩn hóa tên nốt về dạng string có # nếu isSharp=true */
function normalizeNoteToken(x) {
  if (typeof x === "string") return x;
  if (x && typeof x === "object" && x.note) {
    return x.isSharp ? `${x.note}#` : x.note;
  }
  return null;
}

function normNames(arr = []) {
  return arr
    .map(normalizeNoteToken)
    .filter(Boolean)
    .filter((n) => NOTE_TO_PC[n] !== undefined);
}

/* Lấy tên nốt bass (dựa vào stringNumber: dây số lớn hơn = trầm hơn) */
function pickBassName(notes = []) {
  const objs = notes.filter(
    (x) =>
      x && typeof x === "object" && x.note && typeof x.stringNumber === "number"
  );
  if (!objs.length) return null;
  const bass = objs.reduce((a, b) => (a.stringNumber > b.stringNumber ? a : b));
  return bass.isSharp ? `${bass.note}#` : bass.note;
}

/* Đổi quãng (tính theo bán âm) sang tên nốt từ root */
function noteFromInterval(root, semi) {
  const abs = (NOTE_TO_PC[root] + semi) % 12;
  return PC_TO_NAME[abs];
}

/**
 * analyzeGivenRoot(rootName, noteNames)
 * - rootName: "C" | "C#" | "Db" | ...
 * - noteNames: ["C","D#","G"...] (đã chuẩn hóa)
 *
 * Trả về:
 *  {
 *    root,                     // "C"
 *    symbol,                   // "Cmaj7 (9, 13)" hoặc "Am7", ...
 *    plain,                    // "Cmaj7", "Am7", ... (KHÔNG có phần (add / tensions))
 *    parts: {
 *      root, sup, sub, tail,   // sup: ext (7/maj7/6/...), sub: m / aug / "" / ...
 *      specialHalfDim,         // true nếu là m7♭5
 *      pcs: Set<number>        // tập các interval tồn tại (tính từ root)
 *    }
 *  }
 */
function analyzeGivenRoot(rootName, noteNames) {
  const r = NOTE_TO_PC[rootName];
  const pcs = new Set(noteNames.map((n) => mod(NOTE_TO_PC[n] - r, 12)));

  const H = (x) => pcs.has(x);
  const h1 = H(1),
    h2 = H(2),
    hm3 = H(3),
    hM3 = H(4),
    h4 = H(5);
  const hb5 = H(6),
    h5 = H(7),
    hS5 = H(8),
    h6 = H(9),
    hb7 = H(10),
    hM7 = H(11);

  const hasThird = hM3 || hm3;
  const hasAny5 = h5 || hb5 || hS5;

  // sus: không có 3rd + có họ 5th
  const sus2Active = !hasThird && h2 && hasAny5;
  const sus4Active = !hasThird && h4 && hasAny5;
  const bothSus = sus2Active && sus4Active;

  // quality (chất cơ bản)
  let quality = "";
  if (hasThird && h5 && hM3) quality = "";
  else if (hasThird && h5 && hm3) quality = "m";
  else if (hm3 && hb5) quality = "dim";
  else if (hM3 && hS5) quality = "+";
  else if (bothSus) quality = "sus4"; // ưu tiên sus4, sus2 -> add9
  else if (sus2Active) quality = "sus2";
  else if (sus4Active) quality = "sus4";
  else if (h5 && !hasThird) quality = "5";
  else if (h6 && !hasThird) quality = "add6";

  // extension cơ bản (sup)
  let ext = "";
  if (hb7) ext = "7";
  else if (hM7) ext = "maj7";
  else if (h6 && hasThird) ext = "6";
  else if (quality === "5") ext = "5";

  // half-diminished m7♭5
  if (quality === "dim" && hb7) quality = "m7♭5";

  // tensions vs additions
  const tensions = [];
  const additions = [];
  const pushNat = (lab, addLab) => {
    if (hasThird) {
      if (ext && ext !== "5") tensions.push(lab);
      else additions.push(addLab);
    }
  };
  const pushAlt = (lab, addLab) => {
    if (hasThird) {
      if (ext && ext !== "5") tensions.push(lab);
      else additions.push(addLab);
    }
  };

  if (h2 && !sus2Active) pushNat("9", "add9");
  if (h4 && !sus4Active) pushNat("11", "add11");
  if (h6 && hasThird && ext !== "6") pushNat("13", "add13");
  if (h1) pushAlt("♭9", "add♭9"); // 1 semitone = ♭9
  if (hb5) pushAlt("♯11", "add♯11"); // ♯11 ~ ♭5 về mặt enharmonic
  if (hS5) pushAlt("♭13", "add♭13"); // ♭13 ~ ♯5

  if (bothSus && !additions.includes("add9")) additions.push("add9");

  let altered =
    ext && ext !== "5"
      ? tensions.filter((t) => ["♭9", "♯9", "♯11", "♭13"].includes(t))
      : [];
  let natural =
    ext && ext !== "5"
      ? tensions.filter((t) => ["9", "11", "13"].includes(t))
      : [];

  // Quy tắc rút gọn maj7 -> maj9/maj11/maj13 (nếu có)
  if (ext === "maj7" && hasThird) {
    if (natural.includes("13")) {
      if (natural.includes("11")) {
        ext = "maj11";
        natural = ["13"];
      } else {
        ext = "maj13";
        natural = [];
      }
    } else if (natural.includes("11")) {
      ext = "maj11";
      natural = [];
    } else if (natural.includes("9")) {
      ext = "maj9";
      natural = [];
    }
  }

  // maj + sus -> giữ sus (chất chính) để tránh mâu thuẫn hiển thị
  if (ext?.startsWith?.("maj") && (sus2Active || sus4Active)) {
    quality = sus2Active ? "sus2" : "sus4";
  }

  // maj + 6 => gộp thành 13
  if (ext?.startsWith?.("maj") && h6) {
    ext = "maj13";
    natural = natural.filter((x) => x !== "13");
  }

  // maj + 4 (thật) => 11 (nếu không phải sus4)
  if (
    ext?.startsWith?.("maj") &&
    h4 &&
    hasThird &&
    !natural.includes("11") &&
    !sus4Active
  ) {
    natural.push("11");
  }

  const parts = {
    root: rootName,
    sup: ext,
    sub:
      quality === "+"
        ? "aug"
        : ["", "5", "m7♭5"].includes(quality)
        ? ""
        : quality,
    tail: ext && ext !== "5" ? [...natural, ...altered] : additions,
    specialHalfDim: quality === "m7♭5",
    pcs,
  };

  // plain: không có phần (add/tensions)
  let plain = rootName;
  if (quality && !["5", "m7♭5", "+"].includes(quality)) plain += quality;
  if (quality === "+") plain += "aug";
  if (ext && ext !== "5") plain += ext;
  if (quality === "m7♭5") plain = rootName + "m7♭5";
  // symbol: có (add/tensions) nếu có
  let symbol = plain;
  if (parts.tail.length) symbol += " (" + parts.tail.join(", ") + ")";

  return { root: rootName, symbol, plain, parts };
}

/* Thử với nhiều root ứng viên -> chọn điểm số tốt nhất */
function analyzeWithAutoRoot(noteNames) {
  let best = null;
  const pcs = [...new Set(noteNames.map((n) => NOTE_TO_PC[n]))];
  const candidates = pcs.length ? pcs : [...Array(12).keys()];
  for (const pc of candidates) {
    const res = analyzeGivenRoot(PC_TO_NAME[pc], noteNames);
    const p = res.parts.pcs;
    // scoring: có 3rd + 5th + sup => điểm cao; hạn chế ngoặc (tail) cũng cộng điểm
    const score =
      (p.has(3) || p.has(4) ? 4 : 0) +
      (p.has(7) || p.has(6) || p.has(8) ? 3 : 0) +
      (res.parts.sup ? 2 : 0) +
      (!res.symbol.includes("(") ? 1 : 0);
    if (!best || score > best.score) best = { score, res };
  }
  return best?.res || null;
}

/* UI nhỏ gọn */
const Chip = ({ children, className = "" }) => (
  <span
    className={cx(
      "inline-block min-w-12 text-center px-3 py-1 rounded-lg font-semibold",
      className
    )}
  >
    {children}
  </span>
);

const Slot = ({ label }) => (
  <span className="inline-block min-w-12 text-center px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-600 border-dashed text-slate-400 dark:text-slate-500">
    {label}
  </span>
);

const Row = ({ label, children }) => (
  <div className="grid grid-cols-[140px_1fr] gap-3 items-start">
    <div className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
      {label}
    </div>
    <div className="flex flex-wrap gap-2">{children}</div>
  </div>
);

/* Dòng hiển thị fancy: Root + sup/sub + (tensions) */
const FancyInline = ({ parts }) => {
  const { root, sup, sub, tail, specialHalfDim } = parts || {};
  return (
    <span className="inline-flex flex-wrap items-end gap-x-1 gap-y-0.5 text-2xl font-black text-slate-900 dark:text-slate-100">
      <span className="leading-none">{root}</span>
      {sup ? <sup className="text-base leading-none">{sup}</sup> : null}
      {specialHalfDim ? (
        <>
          <sup className="text-base leading-none">7</sup>
          <sub className="text-base leading-none">m♭5</sub>
        </>
      ) : sub ? (
        <sub className="text-base leading-none">{sub}</sub>
      ) : null}
      {tail && tail.length > 0 ? (
        <span className="text-lg">
          (
          {tail.map((t, i) => (
            <span key={t + i}>
              <sup className="text-sm">{t.replace("add", "")}</sup>
              {i < tail.length - 1 ? ", " : ""}
            </span>
          ))}
          )
        </span>
      ) : null}
    </span>
  );
};

export default function ExplainChord({
  notes,
  bassAsRoot = false,
  rootOverride,
  renderFancy = true,
  onAnalyzed,
  className = "",
}) {
  const names = useMemo(() => normNames(notes), [notes]);
  const bassName = useMemo(
    () => (bassAsRoot ? pickBassName(notes) : null),
    [notes, bassAsRoot]
  );

  const analyzed = useMemo(() => {
    if (!names.length) return null;
    const forcedRoot = rootOverride || bassName;
    if (forcedRoot && NOTE_TO_PC[forcedRoot] !== undefined) {
      return analyzeGivenRoot(forcedRoot, names);
    }
    return analyzeWithAutoRoot(names);
  }, [names, rootOverride, bassName]);

  useEffect(() => {
    if (onAnalyzed) onAnalyzed(analyzed);
  }, [analyzed, onAnalyzed]);

  const hasA = (semi) => analyzed?.parts?.pcs?.has(semi);
  const show = (semi, label, activeCls, toNote = true) => {
    if (hasA && hasA(semi)) {
      const note =
        toNote && analyzed ? noteFromInterval(analyzed.root, semi) : "";
      return (
        <Chip className={activeCls}>{note ? `${label}:${note}` : label}</Chip>
      );
    }
    return <Slot label={label} />;
  };

  return (
    <div
      className={cx(
        "p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60",
        className
      )}
    >
      <div className="text-sm text-indigo-700 dark:text-indigo-300 font-semibold mb-1">
        Tên hợp âm
      </div>
      <div className="text-2xl font-extrabold text-indigo-900 dark:text-indigo-200">
        {analyzed ? analyzed.symbol : "—"}
      </div>
      {renderFancy && analyzed && (
        <div className="mt-1">
          <FancyInline parts={analyzed.parts} />
        </div>
      )}

      {/* Bảng trạng thái cố định */}
      <div className="mt-4 space-y-2">
        <Row label="Extensions">
          {show(
            1,
            "♭9",
            "bg-purple-900/50 text-purple-100 border border-purple-500"
          )}
          {show(
            2,
            "9",
            "bg-emerald-800/40 text-emerald-100 border border-emerald-500"
          )}
          {show(
            5,
            "11",
            "bg-emerald-800/40 text-emerald-100 border border-emerald-500"
          )}
          {show(
            6,
            "♯11",
            "bg-purple-900/50 text-purple-100 border border-purple-500"
          )}
          {show(
            8,
            "♭13",
            "bg-purple-900/50 text-purple-100 border border-purple-500"
          )}
          {show(
            9,
            "13",
            "bg-emerald-800/40 text-emerald-100 border border-emerald-500"
          )}
        </Row>

        <Row label="7th / 6th">
          {show(10, "7", "bg-amber-800/60 text-white border border-amber-500")}
          {show(
            11,
            "maj7",
            "bg-amber-800/60 text-white border border-amber-500"
          )}
          {/* 6 chỉ hiện khi có 3rd (không phải add6) */}
          {analyzed?.parts?.pcs?.has(9) &&
          (analyzed.parts.pcs.has(4) || analyzed.parts.pcs.has(3)) ? (
            show(9, "6", "bg-amber-800/60 text-white border border-amber-500")
          ) : (
            <Slot label="6" />
          )}
        </Row>

        <Row label="Triad / sus">
          {/* sus2/sus4 chỉ khi không có 3rd + có họ 5th */}
          {!analyzed ||
          (!analyzed.parts.pcs.has(3) &&
            !analyzed.parts.pcs.has(4) &&
            (analyzed.parts.pcs.has(7) ||
              analyzed.parts.pcs.has(6) ||
              analyzed.parts.pcs.has(8))) ? (
            show(
              2,
              "sus2",
              "bg-amber-700/60 text-white border border-amber-500"
            )
          ) : (
            <Slot label="sus2" />
          )}
          {show(3, "m3", "bg-amber-700/60 text-white border border-amber-500")}
          {show(4, "3", "bg-amber-700/60 text-white border border-amber-500")}
          {!analyzed ||
          (!analyzed.parts.pcs.has(3) &&
            !analyzed.parts.pcs.has(4) &&
            (analyzed.parts.pcs.has(7) ||
              analyzed.parts.pcs.has(6) ||
              analyzed.parts.pcs.has(8))) ? (
            show(
              5,
              "sus4",
              "bg-amber-700/60 text-white border border-amber-500"
            )
          ) : (
            <Slot label="sus4" />
          )}
          {show(6, "♭5", "bg-amber-700/60 text-white border border-amber-500")}
          {show(7, "5", "bg-amber-700/60 text-white border border-amber-500")}
          {show(8, "♯5", "bg-amber-700/60 text-white border border-amber-500")}
        </Row>

        <Row label="Root">
          {analyzed ? (
            <Chip className="bg-emerald-700 text-white border border-emerald-500">
              {analyzed.root}
            </Chip>
          ) : (
            <Slot label="Root" />
          )}
        </Row>
      </div>
    </div>
  );
}
