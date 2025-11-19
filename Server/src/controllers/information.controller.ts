import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { TheoryArticle } from "../models/information.model";

/** Helpers */
const isObjectId = (s: string) => mongoose.Types.ObjectId.isValid(s);
const getByIdOrSlug = (idOrSlug: string) =>
  isObjectId(idOrSlug)
    ? TheoryArticle.findById(idOrSlug)
    : TheoryArticle.findOne({ slug: idOrSlug });

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 80);
}

/** Create */
export async function createArticle(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = req.body || {};
    if (!body.slug && body.title) body.slug = slugify(body.title);

    const doc = await TheoryArticle.create(body);
    res.status(201).json({ data: doc });
    return;
  } catch (err) {
    next(err);
  }
}

/** List with pagination + filters */
export async function listArticles(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = clamp(
      parseInt(String(req.query.page || "1"), 10) || 1,
      1,
      1e9
    );
    const limit = clamp(
      parseInt(String(req.query.limit || "20"), 10) || 20,
      1,
      100
    );

    const q = (req.query.q as string) || "";
    const status = (req.query.status as string) || "";
    const tag = (req.query.tag as string) || "";
    const sortParam = (req.query.sort as string) || "newest";

    const sortMap: Record<string, any> = {
      newest: "-createdAt",
      updated: "-updatedAt",
      title: "title",
      "-title": "-title",
    };
    const sort = sortMap[sortParam] ?? sortParam;

    const filter: any = {};
    if (status) filter.status = { $in: status.split(",").map((s) => s.trim()) };
    if (tag) filter.tags = tag;
    if (q) {
      const rx = new RegExp(q, "i");
      filter.$or = [{ title: rx }, { excerpt: rx }, { slug: rx }];
    }

    const [items, total] = await Promise.all([
      TheoryArticle.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      TheoryArticle.countDocuments(filter),
    ]);

    res.json({
      data: items,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
    return;
  } catch (err) {
    next(err);
  }
}

/** Get one by :idOrSlug */
export async function getArticle(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { idOrSlug } = req.params;
    const doc = await getByIdOrSlug(idOrSlug);
    if (!doc) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({ data: doc });
    return;
  } catch (err) {
    next(err);
  }
}

/** Update (PATCH) by :idOrSlug */
export async function updateArticle(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { idOrSlug } = req.params;
    const autoSlug = String(req.query.autoSlug || "false") === "true";

    const doc = await getByIdOrSlug(idOrSlug);
    if (!doc) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const payload = req.body || {};
    if (autoSlug && payload.title && !payload.slug) {
      payload.slug = slugify(payload.title);
    }

    Object.assign(doc, payload);
    await doc.save();

    res.json({ data: doc });
    return;
  } catch (err) {
    next(err);
  }
}

/** Delete by :idOrSlug (soft by default, hard if ?hard=true) */
export async function deleteArticle(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { idOrSlug } = req.params;
    const hard = String(req.query.hard || "false") === "true";

    const doc = await getByIdOrSlug(idOrSlug);
    if (!doc) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    if (hard) {
      await doc.deleteOne();
      res.status(204).end();
      return;
    }

    doc.status = "archived";
    await doc.save();
    res.json({ data: doc, softDeleted: true });
    return;
  } catch (err) {
    next(err);
  }
}

/** Publish/Unpublish */
export async function publishArticle(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { idOrSlug } = req.params;
    const doc = await getByIdOrSlug(idOrSlug);
    if (!doc) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    doc.status = "published";
    await doc.save();
    res.json({ data: doc });
    return;
  } catch (err) {
    next(err);
  }
}

export async function unpublishArticle(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { idOrSlug } = req.params;
    const doc = await getByIdOrSlug(idOrSlug);
    if (!doc) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    doc.status = "draft";
    await doc.save();
    res.json({ data: doc });
    return;
  } catch (err) {
    next(err);
  }
}
