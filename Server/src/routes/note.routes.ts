// routes/noteRoutes.ts
import express from "express";
import { createNote, getNotesByTuning } from "../controllers/note.controller";

const router = express.Router();

router.post("/", createNote);
router.get("/:tuningId", getNotesByTuning);

export default router;
