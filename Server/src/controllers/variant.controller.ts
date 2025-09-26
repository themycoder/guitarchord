// src/controllers/variant.controller.ts
import { Request, Response } from "express";
import { Variant } from "../models/Variant";
import { Progression } from "../models/Progression";
import { ok, created, badRequest, notFound, serverError } from "../utils/http";

export const createVariant = async (req: Request, res: Response) => {
  try {
    const { progressionId, index, key, chords, notes } = req.body;
    if (
      !progressionId ||
      !index ||
      !key ||
      !Array.isArray(chords) ||
      chords.length === 0
    ) {
      return badRequest(
        res,
        "progressionId, index, key, chords (array) là bắt buộc"
      );
    }
    const prog = await Progression.findById(progressionId);
    if (!prog) return notFound(res, "Progression không tồn tại");

    const v = await Variant.create({
      progression: progressionId,
      index,
      key,
      chords,
      notes,
    });
    return created(res, v);
  } catch (err) {
    return serverError(res, err);
  }
};

export const getVariant = async (req: Request, res: Response) => {
  try {
    const v = await Variant.findById(req.params.id).lean();
    if (!v) return notFound(res, "Variant không tồn tại");
    return ok(res, v);
  } catch (err) {
    return serverError(res, err);
  }
};

export const updateVariant = async (req: Request, res: Response) => {
  try {
    const { index, key, chords, notes } = req.body;
    const v = await Variant.findByIdAndUpdate(
      req.params.id,
      { index, key, chords, notes },
      { new: true }
    );
    if (!v) return notFound(res, "Variant không tồn tại");
    return ok(res, v);
  } catch (err) {
    return serverError(res, err);
  }
};

export const deleteVariant = async (req: Request, res: Response) => {
  try {
    const v = await Variant.findByIdAndDelete(req.params.id);
    if (!v) return notFound(res, "Variant không tồn tại");
    return ok(res, { _id: v._id, deleted: true });
  } catch (err) {
    return serverError(res, err);
  }
};
