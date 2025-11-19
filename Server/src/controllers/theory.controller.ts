// controllers/theory.controller.ts
import { Request, Response } from "express";
import Theory from "../models/Theory.model";

/** GET /api/theory
 *  Query: q, tags, skills, level, diff_min, diff_max, status, page, limit, sort
 *  Trả về: { total, page, limit, data: [...] }
 */
export const listTheories = async (req: Request, res: Response) => {
  try {
    const {
      q,
      tags,
      skills,
      level,
      diff_min,
      diff_max,
      status,
      page = "1",
      limit = "20",
      sort = "-createdAt",
    } = req.query as Record<string, string | undefined>;

    const filter: any = {};
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { summary: { $regex: q, $options: "i" } },
        { excerpt: { $regex: q, $options: "i" } },
        { tags: { $in: [new RegExp(q, "i")] } },
        { skills: { $in: [new RegExp(q, "i")] } },
      ];
    }
    if (level) filter.level = level;
    if (status && status !== "all") filter.status = status;

    if (tags) {
      const arr = tags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (arr.length) filter.tags = { $all: arr };
    }
    if (skills) {
      const arr = skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (arr.length) filter.skills = { $all: arr };
    }

    const gte = diff_min ? Number(diff_min) : undefined;
    const lte = diff_max ? Number(diff_max) : undefined;
    if (gte || lte) {
      filter.difficulty = {
        ...(gte ? { $gte: gte } : {}),
        ...(lte ? { $lte: lte } : {}),
      };
    }

    // map sort alias nếu FE gửi "newest" / "oldest"
    const sortMap: Record<string, string> = {
      newest: "-createdAt",
      oldest: "createdAt",
      updated: "-updatedAt",
    };
    const sortExpr = sortMap[sort || ""] || sort;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));

    const [total, docs] = await Promise.all([
      Theory.countDocuments(filter),
      Theory.find(filter)
        .sort(sortExpr)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
    ]);

    res.json({
      total,
      page: pageNum,
      limit: limitNum,
      data: docs, // <-- để khớp Admin UI
    });
  } catch (e: any) {
    res.status(500).json({ message: "List theories failed", error: e.message });
  }
};

/** GET /api/theory/:id  (id = theory_id) */
export const getTheoryById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const doc = await Theory.findOne({ theory_id: id }).lean();
    if (!doc) {
      res.status(404).json({ message: "Không tìm thấy bài theory" });
      return;
    }
    res.json(doc);
  } catch (e: any) {
    res.status(500).json({ message: "Get theory failed", error: e.message });
  }
};

/** POST /api/theory  (admin)
 *  Body: { theory_id, title, tags?, skills?, level?, difficulty?, summary?, excerpt?, cover?, contentUrl?, status?, contentBlocks? }
 */
export const createTheory = async (req: Request, res: Response) => {
  try {
    const {
      theory_id,
      title,
      tags,
      skills,
      level,
      difficulty,
      summary,
      excerpt,
      cover,
      contentUrl,
      status,
      contentBlocks,
    } = req.body || {};
    if (!theory_id || !title) {
      res.status(400).json({ message: "Thiếu theory_id hoặc title" });
      return;
    }

    const existed = await Theory.findOne({ theory_id });
    if (existed) {
      res.status(409).json({ message: "theory_id đã tồn tại" });
      return;
    }

    const payload: any = {
      theory_id,
      title,
      tags: tags || [],
      skills: skills || [],
      level: level || "beginner",
      difficulty: difficulty ?? 1,
      summary,
      excerpt,
      cover,
      contentUrl,
      status: status || "draft",
      contentBlocks: {
        blocks: Array.isArray(contentBlocks?.blocks)
          ? contentBlocks.blocks
          : [],
      },
    };

    const doc = await Theory.create(payload);
    res.status(201).json(doc);
  } catch (e: any) {
    res.status(500).json({ message: "Create theory failed", error: e.message });
  }
};

/** PUT /api/theory/:id  (admin) — update toàn phần */
export const updateTheory = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const body = req.body || {};

    // bảo vệ cấu trúc contentBlocks
    const payload: any = { ...body };
    if (body.contentBlocks) {
      payload.contentBlocks = {
        blocks: Array.isArray(body.contentBlocks.blocks)
          ? body.contentBlocks.blocks
          : [],
      };
    }

    const updated = await Theory.findOneAndUpdate(
      { theory_id: id },
      { $set: payload },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      res.status(404).json({ message: "Không tìm thấy bài theory" });
      return;
    }
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ message: "Update theory failed", error: e.message });
  }
};

/** PATCH /api/theory/:id  (admin) — update một phần */
export const patchTheory = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const body = req.body || {};
    const payload: any = { ...body };
    if (body.contentBlocks) {
      payload.contentBlocks = {
        blocks: Array.isArray(body.contentBlocks.blocks)
          ? body.contentBlocks.blocks
          : [],
      };
    }
    const updated = await Theory.findOneAndUpdate(
      { theory_id: id },
      { $set: payload },
      { new: true, runValidators: true }
    ).lean();
    if (!updated) {
      res.status(404).json({ message: "Không tìm thấy bài theory" });
      return;
    }
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ message: "Patch theory failed", error: e.message });
  }
};

/** DELETE /api/theory/:id  (admin) */
export const deleteTheory = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const result = await Theory.deleteOne({ theory_id: id });
    if (!result.deletedCount) {
      res.status(404).json({ message: "Không tìm thấy bài theory" });
      return;
    }
    res.json({ message: "Đã xoá" });
  } catch (e: any) {
    res.status(500).json({ message: "Delete theory failed", error: e.message });
  }
};

/** POST /api/theory/bulk  (admin) — import/upsert danh sách */
export const bulkUpsertTheories = async (req: Request, res: Response) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [];
    if (!items.length) {
      res.status(400).json({ message: "Body phải là mảng items" });
      return;
    }

    const ops = items.map((it) => ({
      updateOne: {
        filter: { theory_id: it.theory_id },
        update: {
          $set: {
            ...it,
            status: it.status || "draft",
            contentBlocks: {
              blocks: Array.isArray(it?.contentBlocks?.blocks)
                ? it.contentBlocks.blocks
                : [],
            },
          },
        },
        upsert: true,
      },
    }));

    const result = await Theory.bulkWrite(ops, { ordered: false });
    res.json({ ok: true, result });
  } catch (e: any) {
    res.status(500).json({ message: "Bulk upsert failed", error: e.message });
  }
};

/** GET /api/theory/meta/tags — distinct tags */
export const listTags = async (_req: Request, res: Response) => {
  try {
    const tags = await Theory.distinct("tags");
    res.json({ tags });
  } catch (e: any) {
    res.status(500).json({ message: "List tags failed", error: e.message });
  }
};

/** GET /api/theory/meta/skills — distinct skills */
export const listSkills = async (_req: Request, res: Response) => {
  try {
    const skills = await Theory.distinct("skills");
    res.json({ skills });
  } catch (e: any) {
    res.status(500).json({ message: "List skills failed", error: e.message });
  }
};
