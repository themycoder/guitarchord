import axios from "axios";
import { MongoClient } from "mongodb";
import type { RequestHandler } from "express";
import Lesson from "../models/Lesson";

// ===== .env =====
const ML_BASE = process.env.ML_BASE || "http://localhost:8000";
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const MONGO_DB = process.env.MONGO_DB || "chorddb";

/** GET /api/ml/questions */
export const getQuestions: RequestHandler = async (_req, res) => {
  try {
    const { data } = await axios.get(`${ML_BASE}/questions`);
    res.json(data);
  } catch (err) {
    console.error("❌ getQuestions error:", err);
    res.status(500).json({ error: "Failed to get questions" });
  }
};

/** POST /api/ml/save-answers  { answers } -> { ok, goals } */
export const saveAnswers: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?._id;
    const { answers } = req.body || {};
    if (!userId) {
      res.status(401).json({ error: "Unauthenticated" });
      return;
    }
    const { data } = await axios.post(`${ML_BASE}/save-answers`, {
      userId,
      answers,
    });
    res.json(data);
  } catch (err) {
    console.error("❌ saveAnswers error:", err);
    res.status(500).json({ error: "Failed to save answers" });
  }
};

/** GET /api/ml/onboarding-status -> { completed, version } */
export const onboardingStatus: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?._id;
    if (!userId) {
      res.json({ completed: false, version: 1 });
      return;
    }

    const client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db(MONGO_DB);

    const st = await db
      .collection("learning_states")
      .findOne(
        { userId },
        { projection: { _id: 0, levelHint: 1, answers: 1 } }
      );

    await client.close();
    res.json({ completed: !!st, version: 1 });
  } catch (err) {
    console.error("❌ onboardingStatus error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/** POST /api/ml/recommend { k?, maxLevel? } -> trả full lesson theo thứ tự gợi ý */
export const recommendLessons: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?._id;
    if (!userId) {
      res.status(401).json({ error: "Unauthenticated" });
      return;
    }

    const { k = 10, maxLevel } = req.body || {};
    const { data } = await axios.post(`${ML_BASE}/recommend`, {
      userId,
      k,
      maxLevel,
    });

    const items: Array<{ id: string; score: number }> = data.items || [];
    const ids = items.map((it) => it.id);
    const docs = await Lesson.find({ _id: { $in: ids } }).lean();

    const byId: Record<string, any> = {};
    for (const d of docs) byId[d._id.toString()] = d;

    const result = items
      .map((it) => {
        const full = byId[it.id];
        if (!full) return null;
        return { score: it.score, ...full };
      })
      .filter(Boolean);

    res.json({ items: result });
  } catch (err) {
    console.error("❌ recommendLessons error:", err);
    res.status(500).json({ error: "Failed to get recommendations" });
  }
};

/** POST /api/ml/train (ADMIN) */
export const adminTrain: RequestHandler = async (_req, res) => {
  try {
    const { data } = await axios.post(`${ML_BASE}/train`, {
      mongo_uri:
        process.env.MONGO_URI?.replace(/\/[^/]+$/, "") ||
        "mongodb://localhost:27017",
      db_name: process.env.MONGO_URI?.split("/").pop() || "chorddb",
      use_lsa: true,
    });
    res.json(data);
  } catch (err) {
    console.error("❌ adminTrain error:", err);
    res.status(500).json({ error: "Failed to train model" });
  }
};
