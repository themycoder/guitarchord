import { Request, Response, NextFunction } from "express";
import { findChords } from "../services/search.service";
import { normalizeNotes } from "../utils/noteNormalizer";
import Chord from "../models/Chord.model";

export const suggestChords = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Xử lý input
    const rawNotes = req.query.notes?.toString() || "";
    const normalizedNotes = normalizeNotes(rawNotes);

    // 2. Validate input
    if (normalizedNotes.length === 0) {
      const errorResponse = {
        success: false,
        message: "Vui lòng cung cấp ít nhất 1 nốt nhạc",
      };
      res.status(400).json(errorResponse);
      return;
    }

    // 3. Tìm kiếm theo thứ tự ưu tiên
    const response = await findChords(normalizedNotes);
    res.json(response);
  } catch (err) {
    next(err);
  }
};

export const searchChordsByName = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const searchTerm = req.query.q?.toString() || "";
    const page = parseInt(req.query.page?.toString() || "1");
    const limit = parseInt(req.query.limit?.toString() || "10");

    if (!searchTerm) {
      res.status(400).json({
        success: false,
        message: "Vui lòng nhập từ khóa tìm kiếm",
      });
      return;
    }

    const regex = new RegExp(searchTerm, "i");
    const skip = (page - 1) * limit;

    const [chords, total] = await Promise.all([
      Chord.find({ name: regex }).skip(skip).limit(limit).sort({ name: 1 }),
      Chord.countDocuments({ name: regex }),
    ]);

    res.json({
      success: true,
      data: {
        chords,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};
