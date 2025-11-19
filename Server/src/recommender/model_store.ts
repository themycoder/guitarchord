import fs from "fs";
import path from "path";

function loadJsonIfExists<T = any>(relPath: string): T | null {
  const p = path.join(process.cwd(), "backend", "src", "recommender", relPath);
  if (!fs.existsSync(p)) return null;
  try {
    const raw = fs.readFileSync(p, "utf-8");
    const data = JSON.parse(raw) as T;
    const first = (data && typeof data === "object") ? Object.values(data as any)[0] : undefined;
    if (first === undefined) return null;
    return data;
  } catch {
    return null;
  }
}

export type FactorsMap = Record<string, number[]>;

export function loadItemFactors(): FactorsMap | null {
  return loadJsonIfExists<FactorsMap>("item_factors.json");
}

export function loadUserFactors(): FactorsMap | null {
  return loadJsonIfExists<FactorsMap>("user_factors.json");
}
