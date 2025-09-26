import express from "express";
import {
  getChords,
  getChordByName,
  createChord,
  updateChord,
  deleteChord,
} from "../controllers/chord.controller";
import {
  suggestChords,
  searchChordsByName,
} from "../controllers/search.controller";
import { getAllChordsForLibrary } from "../controllers/library.controller";

const router = express.Router();

// Search routes
router.get("/suggest", suggestChords);
router.get("/search", searchChordsByName);

// Library route
router.get("/library", getAllChordsForLibrary);

// Basic CRUD routes
router.get("/", getChords);
router.get("/:name", getChordByName);
router.post("/", createChord);
router.put("/:name", updateChord);
router.delete("/:name", deleteChord);

export default router;
