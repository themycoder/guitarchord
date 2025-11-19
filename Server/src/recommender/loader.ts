import fs from "fs";
import path from "path";
import Lesson, { ILesson, IQuizItem } from "../models/Lesson";

export interface MetaItem {
  title: string;
  topic: string;
  level: number;
  prereqs: string[];
  tags: string[];
  quiz_pool: IQuizItem[];
}
export type MetaMap = Record<string, MetaItem>;

export async function loadMeta(): Promise<MetaMap> {
  try {
    const lessons = await Lesson.find({}, { _id:1, title:1, topic:1, level:1, prereqs:1, tags:1, quiz_pool:1 }).lean();
    if (lessons?.length) {
      const m: MetaMap = {};
      for (const L of lessons as ILesson[]) {
        const id = String((L as any)._id);
        m[id] = {
          title: L.title,
          topic: L.topic,
          level: L.level ?? 0,
          prereqs: (L.prereqs || []).map(String),
          tags: L.tags || [],
          quiz_pool: L.quiz_pool || []
        };
      }
      return m;
    }
  } catch (e: any) {
    console.warn("META: load from Mongo failed, fallback to JSON. Reason:", e.message);
  }
  const p = path.join(process.cwd(), "backend", "src", "recommender", "items_meta.json");
  const raw = fs.readFileSync(p, "utf-8");
  return JSON.parse(raw) as MetaMap;
}
