import { Request, Response, NextFunction } from "express";
import Chord from "../models/Chord.model";

export const getAllChordsForLibrary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Lấy toàn bộ hợp âm từ database, sắp xếp theo tên
    const chords = await Chord.find().sort({ name: 1 });

    res.json({
      success: true,
      chords: chords,
    });
  } catch (err) {
    next(err);
  }
};
