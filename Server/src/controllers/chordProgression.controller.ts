import { Request, Response } from "express";
import ChordProgressionExercise, { IChordProgressionExercise } from "../models/IChordProgressionExercise";

interface ProgressionWithWeight {
  id: string;
  name: string;
  chords: string[];
  weight: number;
}

export const createProgression = async (req: Request, res: Response) => {
  try {
    const { key, scaleType, chords, description, difficulty, tags } = req.body;

    // Validate input
    if (!key || !scaleType || !chords || chords.length === 0) {
       res.status(400).json({
        success: false,
        message: "Key, scaleType và chords là bắt buộc",
      });
      return;
    }

    const newProgression = new ChordProgressionExercise({
      key,
      scaleType,
      chords,
      description: description || `Progression ${chords.join("-")}`,
      difficulty: difficulty || "easy",
      tags: tags || [],
    });

    const savedProgression = await newProgression.save();

    res.status(201).json({
      success: true,
      data: savedProgression,
    });
  } catch (error) {
    console.error("Lỗi khi tạo progression:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo progression mới",
    });
  }
};
// Lấy progressions theo hợp âm đã chọn
export const getProgressionsByChord = async (req: Request, res: Response) => {
  try {
    const { key, chord } = req.query;

    // Validate input
    if (!key || !chord) {
       res.status(400).json({
        success: false,
        message: "Thiếu tham số key hoặc chord",
      });
      return;
    }

    // 1. Tìm tất cả progression chứa hợp âm
    const progressions = await ChordProgressionExercise.find({
      key,
      chords: chord as string,
    });

    // 2. Tính toán weight và xử lý dữ liệu
    const processedProgressions: ProgressionWithWeight[] = progressions.map(
      (prog) => {
        const weight = calculateProgressionWeight(prog);

        return {
          id: (prog._id as any).toString(),
          name: prog.description || generateProgressionName(prog.chords),
          chords: prog.chords,
          weight,
        };
      }
    );

    // 3. Lấy danh sách hợp âm liên quan
    const relatedChords = getRelatedChords(
      processedProgressions,
      chord as string
    );

    res.status(200).json({
      success: true,
      data: {
        progressions: processedProgressions.sort((a, b) => b.weight - a.weight),
        relatedChords,
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy progressions:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

// Lấy các progression phổ biến
export const getCommonProgressions = async (req: Request, res: Response) => {
  try {
    const { key } = req.query;

    const commonProgressions = await ChordProgressionExercise.find({
      key,
      $or: [{ tags: "common" }, { difficulty: "easy" }],
    }).limit(10);

    res.status(200).json({
      success: true,
      data: commonProgressions.map((prog) => ({
        id: prog._id,
        name: prog.description || generateProgressionName(prog.chords),
        chords: prog.chords,
      })),
    });
  } catch (error) {
    console.error("Lỗi khi lấy common progressions:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

// ===== Hàm hỗ trợ =====
function calculateProgressionWeight(prog: IChordProgressionExercise): number {
  let weight = 0.7; // Base weight

  if (prog.chords.length <= 3) weight += 0.15;
  if (prog.difficulty === "easy") weight += 0.1;
  if (!prog.tags || prog.tags.length < 2) weight -= 0.05;

  return Math.min(Math.max(weight, 0.1), 0.99);
}

function generateProgressionName(chords: string[]): string {
  return `Progression ${chords.join("-")}`;
}

function getRelatedChords(
  progressions: ProgressionWithWeight[],
  currentChord: string
): string[] {
  const related = new Set<string>();
  progressions.forEach((prog) => {
    prog.chords.forEach((c) => {
      if (c !== currentChord) related.add(c);
    });
  });
  return Array.from(related);
}
