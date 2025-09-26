// controllers/chordShape.controller.ts
import { Request, Response } from "express";
import { chordShapeService } from "../services/chordShape.service";

class ChordShapeController {
  async create(req: Request, res: Response) {
    try {
      const shape = await chordShapeService.create(req.body);

      res.status(201).json(shape);
      return;
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
      return;
    }
  }

  async getByChordId(req: Request, res: Response) {
    try {
      const shapes = await chordShapeService.getByChordId(req.params.chord_id);

      res.json(shapes);
      return;
    } catch {
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const shape = await chordShapeService.getById(req.params.id);

      if (!shape) {
        res.status(404).json({ error: "Shape not found" });
        return;
      }

      res.json(shape);
      return;
    } catch {
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
  }

  async update(req: Request, res: Response) {
    try {
      const updated = await chordShapeService.update(req.params.id, req.body);

      if (!updated) {
        res.status(404).json({ error: "Shape not found" });
        return;
      }

      res.json(updated);
      return;
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
      return;
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await chordShapeService.delete(req.params.id);

      res.status(204).send();
      return;
    } catch {
      res.status(404).json({ error: "Shape not found" });
      return;
    }
  }
}

export default new ChordShapeController();
