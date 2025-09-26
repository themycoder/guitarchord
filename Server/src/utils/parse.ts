// src/utils/parse.ts

/**
 * selected string syntax:
 * - Các "cột" (AND) ngăn bởi dấu ';'
 * - Trong mỗi cột, các lựa chọn (OR) ngăn bởi '|'
 * Ví dụ: "I|iim7;V7"  => (I OR iim7) AND (V7)
 */
export const parseSelected = (selected?: string): string[][] => {
  if (!selected) return [];
  return selected
    .split(";")
    .map((group) =>
      group
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean)
    )
    .filter((arr) => arr.length > 0);
};

/** kiểm tra 1 progression (array degrees/chords) có khớp điều kiện AND/OR */
export const matchANDOR = (tokens: string[], groups: string[][]): boolean => {
  if (groups.length === 0) return true;
  const set = new Set(tokens.map((x) => x.trim()));
  return groups.every((group) => group.some((choice) => set.has(choice)));
};
