import { loadMeta, MetaMap } from "./loader";
import { loadItemFactors, loadUserFactors, FactorsMap } from "./model_store";

export interface RecommendParams {
  userId?: string | null;
  goals?: string[];
  known?: string[];
  seen?: string[];
  mastered?: Record<string, number>;
  k?: number;
  maxLevel?: number;
}
export interface RecommendItem {
  id: string;
  title: string;
  topic: string;
  level: number;
  score: number;
}

/* ---- math utils ---- */
function hash32(str: string): number {
  let h = 2166136261 >>> 0;
  for (const ch of String(str)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function vecFromTags(tags: string[] = [], dim = 64): number[] {
  const v = new Array(dim).fill(0);
  for (const t of tags) v[hash32(t.toLowerCase()) % dim] += 1;
  return v;
}
function dot(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let s = 0;
  for (let i = 0; i < n; i++) s += a[i] * b[i];
  return s;
}
function norm(a: number[]): number {
  return Math.sqrt(dot(a, a));
}
function cosine(a: number[], b: number[]): number {
  const na = norm(a),
    nb = norm(b);
  return na && nb ? dot(a, b) / (na * nb) : 0;
}
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/* ---- global state ---- */
let META: MetaMap | null = null;
let ITEM_VEC_CB: Record<string, number[]> = {};
let ITEM_VEC_CF: FactorsMap | null = null;
let U_VEC_CF: FactorsMap | null = null;
let DIM = 64;

/* ---- init once at server start ---- */
export async function initReco(): Promise<void> {
  META = await loadMeta();

  // content-based vectors (fallback & cold-start)
  ITEM_VEC_CB = {};
  for (const id of Object.keys(META))
    ITEM_VEC_CB[id] = vecFromTags(META[id].tags || [], DIM);

  // collaborative factors if available
  ITEM_VEC_CF = loadItemFactors(); // { lessonId: [f] } or null
  U_VEC_CF = loadUserFactors(); // { userId:   [f] } or null
  if (ITEM_VEC_CF) {
    const first = Object.values(ITEM_VEC_CF)[0];
    if (Array.isArray(first)) DIM = first.length;
    console.log("Reco: using CF item_factors with dim =", DIM);
  } else {
    console.log("Reco: no CF model found, content-based only.");
  }
}

/* ---- build user profile ---- */
function buildUser(params: RecommendParams) {
  const goals = params.goals || [];
  const seen = params.seen || [];
  const mastered = params.mastered || {};

  return {
    userId: params.userId ?? null,
    goalsSet: new Set(goals.map((x) => String(x).toLowerCase())),
    seenSet: new Set(seen),
    masteredSet: new Set(
      Object.entries(mastered)
        .filter(([_, v]) => v >= 0.8)
        .map(([k]) => k)
    ),
    prefVec: vecFromTags(goals, DIM),
    maxLevel: typeof params.maxLevel === "number" ? params.maxLevel : 1,
  };
}

/* ---- scoring hybrid ---- */
function scoreHybrid(u: ReturnType<typeof buildUser>, itemId: string): number {
  if (!META) return -1e9;
  const m = META[itemId];
  if (!m) return -1e9;

  const content = cosine(u.prefVec, ITEM_VEC_CB[itemId] || []);
  let s = sigmoid(content); // normalized base

  if (
    U_VEC_CF &&
    ITEM_VEC_CF &&
    u.userId &&
    U_VEC_CF[u.userId] &&
    ITEM_VEC_CF[itemId]
  ) {
    const cf = dot(U_VEC_CF[u.userId], ITEM_VEC_CF[itemId]);
    s = 0.7 * sigmoid(cf) + 0.3 * s;
  }

  if (u.goalsSet.has(m.topic)) s += 0.15;

  const gap = (m.level ?? 0) - (u.maxLevel ?? 1);
  if (gap > 1) s -= 0.5 * gap;

  if (u.seenSet.has(itemId)) s -= 0.05;

  return s;
}

/* ---- public APIs ---- */
export function recommendNext(params: RecommendParams): RecommendItem[] {
  if (!META) throw new Error("Recommender not initialized");
  const { known = [], k = 5 } = params;
  const u = buildUser(params);
  const knownSet = new Set(known);
  const out: { id: string; s: number }[] = [];

  for (const id of Object.keys(META)) {
    if (knownSet.has(id) || u.masteredSet.has(id)) continue;
    const okPrereq = (META[id].prereqs || []).every((p) =>
      u.masteredSet.has(p)
    );
    if (!okPrereq) continue;
    out.push({ id, s: scoreHybrid(u, id) });
  }

  return out
    .sort((a, b) => b.s - a.s)
    .slice(0, k)
    .map(({ id, s }) => ({
      id,
      title: META![id].title,
      topic: META![id].topic,
      level: META![id].level,
      score: +s.toFixed(3),
    }));
}

export function suggestQuizFor(
  items: string[] = [],
  history: Record<string, { tries?: number; correct?: number }> = {}
) {
  if (!META) throw new Error("Recommender not initialized");
  const pool: { id: string; difficulty?: number; tags?: string[] }[] = [];
  for (const id of items) {
    const qs = META[id]?.quiz_pool || [];
    for (const q of qs) {
      const h = history[q.id] || { tries: 0, correct: 0 };
      if ((h.tries ?? 0) >= 3 && (h.correct ?? 0) >= 2) continue;
      pool.push(q);
    }
  }
  pool.sort((a, b) => (a.difficulty ?? 2) - (b.difficulty ?? 2));
  return pool.slice(0, 8);
}

export function metaFor(id: string) {
  return META?.[id] || null;
}
