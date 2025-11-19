import type { RequestHandler } from "express";
import Event from "../models/Event";

/** POST /api/events -> log event học tập */
export const logEvent: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?._id;
    if (!userId) {
      res.status(401).json({ error: "Unauthenticated" });
      return;
    }

    const { lessonId, type, progress, score, ...rest } = req.body || {};
    if (!type) {
      res.status(400).json({ error: "type is required" });
      return;
    }

    // ✅ ép kiểu rõ ràng cho document
    const doc = (await Event.create({
      userId,
      lessonId,
      type,
      progress,
      score,
      meta: rest?.meta || rest,
    })) as any;

    res.status(201).json({ ok: true, id: String(doc._id) }); // ✅ ép sang string
  } catch (e) {
    console.error("❌ logEvent error:", e);
    res.status(500).json({ error: "Failed to log event" });
  }
};
