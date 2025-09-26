import { Request, Response } from "express";
import Scale from "../models/Scale.model";
import { IScale } from "../models/Scale.model";

type ErrorWithMessage = { message: string };

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as Record<string, unknown>).message === "string"
  );
}

function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
  if (isErrorWithMessage(maybeError)) return maybeError;
  try {
    return new Error(JSON.stringify(maybeError));
  } catch {
    return new Error(String(maybeError));
  }
}

export const createScale = async (req: Request, res: Response) => {
  try {
    const scaleData: IScale = req.body;
    const newScale = new Scale(scaleData);
    await newScale.save();
    res.status(201).json({ success: true, data: newScale });
  } catch (error) {
    const errorWithMessage = toErrorWithMessage(error);
    res.status(500).json({
      success: false,
      message: errorWithMessage.message,
    });
  }
};

export const getScales = async (req: Request, res: Response) => {
  try {
    const scales = await Scale.find().sort({ scale: 1 });
    res.json({ success: true, data: scales });
  } catch (error) {
    const errorWithMessage = toErrorWithMessage(error);
    res.status(500).json({
      success: false,
      message: errorWithMessage.message,
    });
  }
};

export const getScaleById = async (req: Request, res: Response) => {
  try {
    const scale = await Scale.findById(req.params.id);
    if (!scale) {
      res.status(404).json({ success: false, message: "Scale not found" });
      return;
    }
    res.json({ success: true, data: scale });
  } catch (error) {
    const errorWithMessage = toErrorWithMessage(error);
    res.status(500).json({
      success: false,
      message: errorWithMessage.message,
    });
  }
};

export const updateScale = async (req: Request, res: Response) => {
  try {
    const updatedScale = await Scale.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedScale) {
      res.status(404).json({ success: false, message: "Scale not found" });
      return;
    }
    res.json({ success: true, data: updatedScale });
  } catch (error) {
    const errorWithMessage = toErrorWithMessage(error);
    res.status(500).json({
      success: false,
      message: errorWithMessage.message,
    });
  }
};

export const deleteScale = async (req: Request, res: Response) => {
  try {
    const deletedScale = await Scale.findByIdAndDelete(req.params.id);
    if (!deletedScale) {
      res.status(404).json({ success: false, message: "Scale not found" });
      return;
    }
    res.json({ success: true, message: "Scale deleted successfully" });
  } catch (error) {
    const errorWithMessage = toErrorWithMessage(error);
    res.status(500).json({
      success: false,
      message: errorWithMessage.message,
    });
  }
};

export const searchScales = async (req: Request, res: Response) => {
  try {
    const { q, scale: scaleName, note, box } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const query: any = {};

    if (q) {
      query.$or = [
        { scale: { $regex: q as string, $options: "i" } },
        { notes: { $regex: q as string, $options: "i" } },
      ];
    }

    if (scaleName) {
      query.scale = { $regex: scaleName as string, $options: "i" };
    }

    if (note) {
      query.notes = note as string;
    }

    if (box) {
      query["positions_by_box.box"] = parseInt(box as string);
    }

    const [scales, total] = await Promise.all([
      Scale.find(query).skip(skip).limit(limit).sort({ scale: 1 }),
      Scale.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        scales,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    const errorWithMessage = toErrorWithMessage(error);
    res.status(500).json({
      success: false,
      message: errorWithMessage.message,
    });
  }
};

export const getScalesByBox = async (req: Request, res: Response) => {
  try {
    const boxNumber = parseInt(req.params.box);
    const scales = await Scale.find({
      "positions_by_box.box": boxNumber,
    }).sort({ scale: 1 });

    res.json({ success: true, data: scales });
  } catch (error) {
    const errorWithMessage = toErrorWithMessage(error);
    res.status(500).json({
      success: false,
      message: errorWithMessage.message,
    });
  }
};

export const getPositionsByBox = async (req: Request, res: Response) => {
  try {
    const scale = await Scale.findById(req.params.id);
    if (!scale) {
      res.status(404).json({ success: false, message: "Scale not found" });
      return;
    }

    const boxNumber = parseInt(req.params.box);
    const boxData = scale.positions_by_box.find((box) => box.box === boxNumber);

    if (!boxData) {
      res.status(404).json({
        success: false,
        message: `Box ${boxNumber} not found for this scale`,
      });
      return;
    }

    res.json({
      success: true,
      data: {
        scale: scale.scale,
        box: boxData.box,
        positions: boxData.positions,
      },
    });
  } catch (error) {
    const errorWithMessage = toErrorWithMessage(error);
    res.status(500).json({
      success: false,
      message: errorWithMessage.message,
    });
  }
};
