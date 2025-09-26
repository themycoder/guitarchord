// src/controllers/progression.controller.ts
import { Request, Response } from "express";
import { Progression } from "../models/Progression";
import { Variant } from "../models/Variant";
import { ok, created, badRequest, notFound, serverError } from "../utils/http";
import { parseSelected, matchANDOR } from "../utils/parse";
import { degreesToChords } from "../utils/music";

export const createProgression = async (req: Request, res: Response) => {
  try {
    const { title, tags, scaleType, degrees, description, difficulty } =
      req.body;
    if (!title || !Array.isArray(degrees) || degrees.length === 0) {
      return badRequest(res, "title và degrees (array) là bắt buộc");
    }
    const doc = await Progression.create({
      title,
      tags: tags || [],
      scaleType: scaleType || "major",
      degrees,
      description,
      difficulty: difficulty || "medium",
    });
    return created(res, doc);
  } catch (err) {
    return serverError(res, err);
  }
};

export const getProgressions = async (req: Request, res: Response) => {
  try {
    const {
      page = "1",
      limit = "20",
      search = "",
      tags,
      selected,
      mode = "degree",
      key,
    } = req.query as Record<string, string>;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const cond: any = {};
    if (search) cond.title = { $regex: search, $options: "i" };
    if (tags)
      cond.tags = {
        $all: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };

    const [items, total] = await Promise.all([
      Progression.find(cond)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Progression.countDocuments(cond),
    ]);

    // Lọc theo selected (AND/OR) theo degrees hoặc chords
    const groups = parseSelected(selected);
    let filtered = items;
    if (groups.length > 0) {
      filtered = items.filter((p) => {
        const tokens =
          mode === "chord" && key ? degreesToChords(key, p.degrees) : p.degrees;
        return matchANDOR(tokens, groups);
      });
    }

    return ok(res, filtered, { page: pageNum, limit: limitNum, total });
  } catch (err) {
    return serverError(res, err);
  }
};

export const getProgressionById = async (req: Request, res: Response) => {
  try {
    const doc = await Progression.findById(req.params.id).lean();
    if (!doc) return notFound(res, "Progression không tồn tại");
    return ok(res, doc);
  } catch (err) {
    return serverError(res, err);
  }
};

export const updateProgression = async (req: Request, res: Response) => {
  try {
    const { title, tags, scaleType, degrees, description, difficulty } =
      req.body;
    const doc = await Progression.findByIdAndUpdate(
      req.params.id,
      { title, tags, scaleType, degrees, description, difficulty },
      { new: true }
    );
    if (!doc) return notFound(res, "Progression không tồn tại");
    return ok(res, doc);
  } catch (err) {
    return serverError(res, err);
  }
};

export const deleteProgression = async (req: Request, res: Response) => {
  try {
    const doc = await Progression.findByIdAndDelete(req.params.id);
    if (!doc) return notFound(res, "Progression không tồn tại");
    // xoá luôn variants liên quan
    await Variant.deleteMany({ progression: doc._id });
    return ok(res, { _id: doc._id, deleted: true });
  } catch (err) {
    return serverError(res, err);
  }
};

/** Lấy variants của 1 progression (nếu chưa có và có key => auto-gen từ degrees) */
// KHÁC biệt chính: bỏ .lean() ở find, push thẳng document, cuối hàm .map(v => v.toObject())

export const getVariantsOfProgression = async (req: Request, res: Response) => {
  try {
    const { key } = req.query as Record<string, string>;
    const prog = await Progression.findById(req.params.id).lean(); // cái này lean OK
    if (!prog) return notFound(res, "Progression không tồn tại");

    // ❌ BỎ .lean() ở đây để tránh mismatch type
    let variants = await Variant.find({ progression: prog._id }).sort({ index: 1 });

    if (key && !variants.some(v => v.key === key)) {
      const chords = degreesToChords(key, prog.degrees);
      const index = (variants[variants.length - 1]?.index || 0) + 1;
      const created = await Variant.create({
        progression: prog._id,
        index,
        key,
        chords,
      });
      variants = [...variants, created];
    }

    // Trả về object sạch kiểu đồng nhất
    return ok(res, variants.map(v => v.toObject()));
  } catch (err) {
    return serverError(res, err);
  }
};

