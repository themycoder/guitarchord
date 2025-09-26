import { Request, Response } from "express";
import { GuitarString } from "../models/GuitarString.model";

export const createTuning = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, tuning, description } = req.body;
    const newTuning = new GuitarString({ name, tuning, description });
    await newTuning.save();
    res.status(201).json(newTuning);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getAllTunings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tunings = await GuitarString.find();
    res.json(tunings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getTuningById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tuning = await GuitarString.findById(req.params.id);
    if (!tuning) {
      res.status(404).json({ error: "Tuning not found" });
      return;
    }
    res.json(tuning);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getDefaultTuning = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tuning = await GuitarString.findOne({ name: "Standard" });
    if (!tuning) {
      res.status(404).json({ error: "Default tuning not found" });
      return;
    }
    res.json(tuning);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
