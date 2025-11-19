// src/routes/lesson.routes.ts
import { Router, Response, Request, NextFunction } from "express";
import Lesson from "../models/Lesson";
import { RequestCustom } from "../types/app.type";
import { authenticateToken } from "../middleware/authentication.middleware";

const router = Router();

/* ============ Helpers ============ */
function toInt(v: any, def: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function normalizeSort(sort?: string): string {
  // chấp nhận: "createdAt" | "-createdAt,title" | "level,-title"
  if (!sort || !String(sort).trim()) {
    return "-createdAt";
  }
  return String(sort)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((p) => (p.startsWith("-") ? `-${p.slice(1)}` : p))
    .join(" ");
}

function pickFields(fields?: string) {
  // ví dụ: "title,topic,level,summary"
  if (!fields || !String(fields).trim()) {
    return undefined;
  }
  const allow = String(fields)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ");
  return allow;
}

function slugify(s?: string) {
  if (!s) {
    return undefined;
  }
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function requireAdmin(req: RequestCustom, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (req.user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}

/* ============ CREATE ============ */
/** POST /api/lesson  (admin) */
router.post(
  "/",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const {
        title,
        topic,
        level,
        slug,
        prereqs = [],
        tags = [],
        quiz_pool = [],
        summary,
        blocks = [],
        markdown,
        resources = [],
        exercises = [],
        coverImage,
        videoUrls = [],
      } = (req.body || {}) as any;

      if (!title || !topic) {
        res.status(400).json({ error: "Missing title/topic" });
        return;
      }

      const data: any = {
        title: String(title).trim(),
        topic: String(topic).trim(),
        level: toInt(level, 1), // model đã min:1 max:4
        slug: slugify(slug) || slugify(title),
        prereqs,
        tags,
        quiz_pool,
        summary,
        blocks,
        markdown,
        resources,
        exercises,
        coverImage,
        videoUrls,
      };

      const lesson = new Lesson(data);
      await lesson.save();

      res.status(201).json({ message: "Lesson created", lesson });
      return;
    } catch (e: any) {
      // Duplicate slug -> 409
      if (e?.code === 11000) {
        res.status(409).json({ error: "Slug already exists" });
        return;
      }
      res.status(500).json({ error: e.message || "Failed to create lesson" });
      return;
    }
  }
);

/* ============ LIST ============ */
/** GET /api/lesson?topic=&level=&minLevel=&maxLevel=&tag=&q=&page=&limit=&sort=&fields= */
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      topic,
      level,
      minLevel,
      maxLevel,
      tag,
      q,
      page = "1",
      limit = "20",
      sort = "-createdAt",
      fields,
    } = req.query as Record<string, string>;

    const filter: any = {};

    if (topic) {
      filter.topic = topic;
    }

    if (level && !Number.isNaN(Number(level))) {
      filter.level = Number(level);
    } else {
      const minL = toInt(minLevel, NaN);
      const maxL = toInt(maxLevel, NaN);
      if (Number.isFinite(minL) || Number.isFinite(maxL)) {
        filter.level = {};
        if (Number.isFinite(minL)) {
          filter.level.$gte = minL;
        }
        if (Number.isFinite(maxL)) {
          filter.level.$lte = maxL;
        }
      }
    }

    if (tag && String(tag).trim()) {
      filter.tags = { $in: [tag] };
    }

    // Search: fallback regex (text index cũng hỗ trợ nếu đã tạo trong model)
    if (q && q.trim()) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { tags: { $in: [new RegExp(q, "i")] } },
        { summary: { $regex: q, $options: "i" } },
      ];
    }

    const pg = Math.max(1, toInt(page, 1));
    const lim = Math.max(1, Math.min(100, toInt(limit, 20)));
    const sortStr = normalizeSort(sort);
    const proj = pickFields(fields);

    const [items, total] = await Promise.all([
      Lesson.find(filter, proj)
        .sort(sortStr)
        .skip((pg - 1) * lim)
        .limit(lim)
        .lean(),
      Lesson.countDocuments(filter),
    ]);

    res.json({
      items,
      page: pg,
      limit: lim,
      total,
      hasNext: pg * lim < total,
    });
    return;
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Failed to load lessons" });
    return;
  }
});

/* ============ GET BY SLUG ============ */
/** GET /api/lesson/slug/:slug (đặt trước /:id) */
router.get("/slug/:slug", async (req: Request, res: Response) => {
  try {
    const doc = await Lesson.findOne({ slug: req.params.slug }).lean();
    if (!doc) {
      res.status(404).json({ error: "Lesson not found" });
      return;
    }
    res.json(doc);
    return;
  } catch (e: any) {
    res
      .status(500)
      .json({ error: e.message || "Failed to get lesson by slug" });
    return;
  }
});

/* ============ GET BY ID ============ */
/** GET /api/lesson/:id */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const doc = await Lesson.findById(req.params.id).lean();
    if (!doc) {
      res.status(404).json({ error: "Lesson not found" });
      return;
    }
    res.json(doc);
    return;
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Failed to get lesson" });
    return;
  }
});

/* ============ UPDATE ============ */
/** PUT /api/lesson/:id (admin) */
router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const payload = { ...(req.body || {}) };

      if (typeof (payload as any).slug === "string") {
        (payload as any).slug = slugify((payload as any).slug);
      }
      if (
        !(payload as any).slug &&
        typeof (payload as any).title === "string" &&
        (payload as any).title.trim()
      ) {
        (payload as any).slug = slugify((payload as any).title);
      }
      delete (payload as any)._id;

      const updated = await Lesson.findByIdAndUpdate(req.params.id, payload, {
        new: true,
        runValidators: true,
      }).lean();

      if (!updated) {
        res.status(404).json({ error: "Lesson not found" });
        return;
      }

      res.json({ message: "Lesson updated", lesson: updated });
      return;
    } catch (e: any) {
      if (e?.code === 11000) {
        res.status(409).json({ error: "Slug already exists" });
        return;
      }
      res.status(500).json({ error: e.message || "Failed to update lesson" });
      return;
    }
  }
);

/* ============ DELETE ============ */
/** DELETE /api/lesson/:id (admin) */
router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const deleted = await Lesson.findByIdAndDelete(req.params.id);

      if (!deleted) {
        res.status(404).json({ error: "Lesson not found" });
        return;
      }

      res.json({ message: "Lesson deleted" });
      return;
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Failed to delete lesson" });
      return;
    }
  }
);

export default router;
