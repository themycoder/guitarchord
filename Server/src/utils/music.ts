// src/utils/music.ts

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
const MAJOR_SCALE_STEPS = [0, 2, 4, 5, 7, 9, 11]; // I ii iii IV V vi vii°
const DEGREE_TO_QUALITY = ["", "m", "m", "", "", "m", "dim"]; // triad quality trong major

export type ScaleType = "major";

export const KEYS_MAJOR = [
  "C",
  "G",
  "D",
  "A",
  "E",
  "B",
  "F#",
  "Db",
  "Ab",
  "Eb",
  "Bb",
  "F",
];

const preferFlats = (key: string): boolean =>
  ["F", "Bb", "Eb", "Ab", "Db"].includes(key);

export const degreeToChord = (
  key: string,
  degree: string,
  scale: ScaleType = "major"
): string => {
  // degree chấp nhận: "I", "ii", "iii", "IV", "V", "vi", "vii°" (có thể kèm 7: "V7", "ii7"...)
  const useFlats = preferFlats(key);
  const cycle = useFlats ? NOTE_CYCLE_FLATS : NOTE_CYCLE_SHARPS;

  const rootIndex = cycle.indexOf(key);
  if (rootIndex < 0) throw new Error(`Unsupported key: ${key}`);

  const base = degree.replace(/7|°/g, ""); // lấy I/ii/iii...
  const idxMap: Record<string, number> = {
    I: 0,
    II: 1,
    III: 2,
    IV: 3,
    V: 4,
    VI: 5,
    VII: 6,
  };
  const degIdx = idxMap[base.toUpperCase()];
  if (degIdx === undefined) return degree; // fallback

  const semitone = (rootIndex + MAJOR_SCALE_STEPS[degIdx]) % 12;
  const rootName = cycle[semitone];

  // chất triad
  const triadQuality = DEGREE_TO_QUALITY[degIdx];
  // thưởng: nếu viết thường (ii, iii, vi) => minor
  const isLower = base[0] === base[0].toLowerCase();
  const qual = isLower ? "m" : triadQuality === "dim" ? "dim" : "";

  // thêm ° hoặc 7 nếu có
  const hasDim = /°/.test(degree) || triadQuality === "dim";
  const has7 = /7/.test(degree);
  const dimStr = hasDim ? (qual === "m" ? "m7b5" : "dim") : qual;

  // Kết hợp kết quả
  if (hasDim && has7) return `${rootName}${dimStr}`; // ví dụ: Bm7b5
  if (has7) return `${rootName}${qual}7`.replace("m7", "m7"); // ii7 -> Dm7
  if (dimStr === "dim") return `${rootName}dim`;
  if (dimStr) return `${rootName}${dimStr}`;
  return `${rootName}`;
};

/** Map cả tiến trình degrees -> chords theo key */
export const degreesToChords = (key: string, degrees: string[]): string[] =>
  degrees.map((d) => degreeToChord(key, d));
