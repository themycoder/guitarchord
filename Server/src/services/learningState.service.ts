import { Types } from "mongoose";
import LearningState, { ILearningState } from "../models/LearningState";
import { User } from "../models/User"; // dùng để fallback goals từ profile

export async function getOrCreateLearningState(
  userId: string
): Promise<ILearningState> {
  const _id = new Types.ObjectId(userId);
  let s = await LearningState.findOne({ userId: _id });
  if (!s) {
    s = await LearningState.create({
      userId: _id,
      mastery: {},
      known: [],
      seen: [],
    });
  }
  return s;
}

export async function getGoalsForReco(userId: string): Promise<string[]> {
  const _id = new Types.ObjectId(userId);
  // 1) ưu tiên goalsOverride trong LearningState
  const st = await LearningState.findOne({ userId: _id }).lean();
  if (st?.goalsOverride && st.goalsOverride.length) return st.goalsOverride;

  // 2) fallback từ User.profile.goals (không sửa User)
  const u = await User.findById(_id).lean();
  const goals = (u as any)?.profile?.goals || [];
  return goals;
}

export async function updateMastery(
  userId: string,
  lessonId: string,
  value: number
) {
  const s = await getOrCreateLearningState(userId);
  const next = { ...(s.mastery || {}) };
  next[lessonId] = Math.max(next[lessonId] || 0, value);
  s.mastery = next;
  // thấy xong thì bỏ khỏi seen
  s.seen = (s.seen || []).filter((id) => id !== lessonId);
  await s.save();
  return s;
}

export async function appendSeen(userId: string, lessonId: string) {
  const s = await getOrCreateLearningState(userId);
  const set = new Set(s.seen || []);
  set.add(lessonId);
  s.seen = Array.from(set);
  await s.save();
}

export async function getLearningStateSnapshot(userId: string) {
  const s = await getOrCreateLearningState(userId);
  return {
    mastered: s.mastery || {},
    known: s.known || [],
    seen: s.seen || [],
  };
}

export function evaluateLevel({
  mastery,
  avgAccuracy,
  completedLessons,
}: {
  mastery: Record<string, number>;
  avgAccuracy: number;
  completedLessons: number;
}) {
  const avgMastery =
    Object.values(mastery).length > 0
      ? Object.values(mastery).reduce((a, b) => a + b, 0) /
        Object.values(mastery).length
      : 0;

  // Quy tắc cơ bản (em có thể tinh chỉnh)
  if (avgMastery >= 0.9 && avgAccuracy >= 0.9 && completedLessons >= 20)
    return "master";
  if (avgMastery >= 0.75 && avgAccuracy >= 0.8 && completedLessons >= 10)
    return "advanced";
  if (avgMastery >= 0.5 && avgAccuracy >= 0.7 && completedLessons >= 5)
    return "intermediate";
  return "beginner";
}

export async function setLearningRank(
  userId: string,
  rank: "beginner" | "intermediate" | "advanced" | "master"
) {
  const s = await getOrCreateLearningState(userId);
  (s as any).levelOverride = rank; // field này optional
  await s.save();
}