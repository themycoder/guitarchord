import { Request, Response, NextFunction } from "express";
import Chord from "../models/Chord.model";

export const getChords = async (req: Request, res: Response) => {
  const chords = await Chord.find();
  res.json(chords);
};

export const getChordByName = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const chord = await Chord.findOne({ name: req.params.name });
    if (!chord) {
      res.status(404).send("Not found");
      return;
    }
    res.json(chord);
  } catch (err) {
    next(err);
  }
};

export const createChord = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const chord = new Chord(req.body);
    await chord.save();
    res.status(201).json(chord);
  } catch (err) {
    next(err);
  }
};

export const updateChord = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const updatedChord = await Chord.findOneAndUpdate(
      { name: req.params.name },
      req.body,
      { new: true }
    );

    if (!updatedChord) {
      res.status(404).send("Not found");
      return;
    }

    res.json(updatedChord);
  } catch (err) {
    next(err);
  }
};

export const deleteChord = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const deletedChord = await Chord.findOneAndDelete({
      name: req.params.name,
    });

    if (!deletedChord) {
      res.status(404).send("Not found");
      return;
    }

    res.json({ message: "Chord deleted successfully" });
  } catch (err) {
    next(err);
  }
};
