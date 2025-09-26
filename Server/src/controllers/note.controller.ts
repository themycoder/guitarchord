import { Request, Response } from "express";
import { GuitarNote } from "../models/GuitarNote.model";

interface FormattedNote {
  fret: number;
  stringNumber: number; // Thêm vào
  note: string;
  isSharp: boolean;
  // Có thể thêm các trường khác nếu cần
}

export const createNote = async (req: Request, res: Response) => {
  try {
    const { stringTuning, fret, stringNumber, note, isSharp } = req.body;
    const newNote = new GuitarNote({
      stringTuning,
      fret,
      stringNumber,
      note,
      isSharp,
    });
    await newNote.save();
    res.status(201).json(newNote);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getNotesByTuning = async (req: Request, res: Response) => {
  try {
    const notes = await GuitarNote.find({
      stringTuning: req.params.tuningId,
    })
      .sort({ stringNumber: 1, fret: 1 })
      .lean();

    const formattedNotes: Record<number, FormattedNote[]> = {};

    notes.forEach((note) => {
      if (!formattedNotes[note.stringNumber]) {
        formattedNotes[note.stringNumber] = [];
      }
      formattedNotes[note.stringNumber].push({
        fret: note.fret,
        stringNumber: note.stringNumber, // Thêm vào
        note: note.note,
        isSharp: note.isSharp,
        // Có thể thêm các trường khác nếu cần
      });
    });

    res.json(formattedNotes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
