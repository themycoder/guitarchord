import { Router, Request, Response } from "express";
import Quiz from "../models/quiz.model";

const router = Router();

/** CREATE: POST /api/quiz */
router.post("/", async (req: Request, res: Response) => {
  try {
    const qz = new Quiz(req.body);
    await qz.save();
    res.status(201).json({ message: "Quiz created", quiz: qz });
    return;
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Failed to create quiz" });
    return;
  }
});

/** BULK CREATE: POST /api/quiz/bulk  body: { lessonId, items: [...] } */
router.post("/bulk", async (req: Request, res: Response) => {
  try {
    const { lessonId, items = [] } = req.body || {};
    if (!lessonId || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "Missing lessonId or items" });
      return;
    }
    const docs = items.map((it: any) => ({ ...it, lessonId }));
    await Quiz.insertMany(docs);
    res.status(201).json({ message: "Quizzes created", count: docs.length });
    return;
  } catch (e: any) {
    res
      .status(500)
      .json({ error: e.message || "Failed to bulk insert quizzes" });
    return;
  }
});

/** LIST: GET /api/quiz?lessonId=&quizId=&q=&page=&limit= */
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      lessonId,
      quizId,
      q,
      page = "1",
      limit = "50",
    } = req.query as Record<string, string>;
    const filter: any = {};
    if (lessonId) filter.lessonId = lessonId;
    if (quizId) filter.quizId = quizId;
    if (q && q.trim()) {
      filter.$or = [
        { quizId: { $regex: q, $options: "i" } },
        { question: { $regex: q, $options: "i" } },
        { tags: { $in: [new RegExp(q, "i")] } },
      ];
    }

    const pg = Math.max(1, Number(page) || 1);
    const lim = Math.max(1, Math.min(100, Number(limit) || 50));

    const [items, total] = await Promise.all([
      Quiz.find(filter)
        .sort("-createdAt")
        .skip((pg - 1) * lim)
        .limit(lim)
        .lean(),
      Quiz.countDocuments(filter),
    ]);

    res.json({ items, page: pg, limit: lim, total, hasNext: pg * lim < total });
    return;
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Failed to load quizzes" });
    return;
  }
});

/** GET ONE: GET /api/quiz/:id */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const doc = await Quiz.findById(req.params.id).lean();
    if (!doc) {
      res.status(404).json({ error: "Quiz not found" });
      return;
    }
    res.json(doc);
    return;
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Failed to get quiz" });
    return;
  }
});

/** UPDATE: PUT /api/quiz/:id */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const payload = { ...(req.body || {}) };
    delete (payload as any)._id;

    const updated = await Quiz.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) {
      res.status(404).json({ error: "Quiz not found" });
      return;
    }
    res.json({ message: "Quiz updated", quiz: updated });
    return;
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Failed to update quiz" });
    return;
  }
});

/** DELETE: DELETE /api/quiz/:id */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const deleted = await Quiz.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Quiz not found" });
      return;
    }
    res.json({ message: "Quiz deleted" });
    return;
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Failed to delete quiz" });
    return;
  }
});

/** CHECK: POST /api/quiz/check  body: { lessonId, answers: [{ qid, choiceIndex?, choiceIndices?, text? }] } */
router.post("/check", async (req: Request, res: Response) => {
  try {
    const { lessonId, answers = [] } = req.body || {};
    if (!lessonId) {
      res.status(400).json({ error: "Missing lessonId" });
      return;
    }
    const ids = answers.map((a: any) => a.qid);
    const map = new Map<string, any>();
    if (ids.length > 0) {
      const qs = await Quiz.find({ lessonId, quizId: { $in: ids } }).lean();
      for (const q of qs) map.set(q.quizId, q);
    }

    let correct = 0;
    const results: Array<{ qid: string; correct: boolean }> = [];

    for (const a of answers) {
      const q = map.get(a.qid);
      if (!q) {
        results.push({ qid: a.qid, correct: false });
        continue;
      }
      let ok = false;
      if (q.type === "single" || q.type === "truefalse") {
        ok = Number(a.choiceIndex) === Number(q.correctIndex);
      } else if (q.type === "multi") {
        const expect = new Set<number>(q.correctIndices || []);
        const got = new Set<number>(
          Array.isArray(a.choiceIndices) ? a.choiceIndices : []
        );
        ok = expect.size === got.size && [...expect].every((x) => got.has(x));
      } else if (q.type === "text") {
        const exp = (q.answerText || "").trim().toLowerCase();
        const got = (a.text || "").trim().toLowerCase();
        ok = !!exp && got === exp;
      }
      if (ok) correct += 1;
      results.push({ qid: a.qid, correct: ok });
    }

    const passRate = answers.length ? correct / answers.length : 0;

    res.json({
      passRate: Number(passRate.toFixed(2)),
      results,
      normalized: results.map((r) => ({ qid: r.qid, correct: r.correct })),
    });
    return;
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Failed to check quiz" });
    return;
  }
});

export default router;
