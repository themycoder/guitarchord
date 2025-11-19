// src/routes/events.routes.ts
import { Router } from "express";
import { authenticateToken } from "../middleware/authentication.middleware";
const r = Router();

r.post("/", authenticateToken, async (req, res) => {
  const db = (req as any).db; // nếu dùng mongoose thuần: mongoose.connection.db
  const {
    lessonId,
    lessonSlug,
    type = "view",
    progress = 0,
    score = 1,
  } = req.body;
  const userId = (req as any).user.id;

  await db.collection("events").insertOne({
    userId,
    lessonId,
    lessonSlug,
    type,
    progress,
    score,
    createdAt: new Date(),
  });
  res.json({ ok: true });
});

export default r;
