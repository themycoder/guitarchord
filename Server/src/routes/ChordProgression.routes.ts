import express from "express";
import {
  getProgressionsByChord,
  getCommonProgressions,
  createProgression,
} from "../controllers/chordProgression.controller";

const router = express.Router();
router.post("/", createProgression);
// @route   GET api/chords/progressions
// @desc    Lấy các progression theo hợp âm
// @access  Public
router.get("/", getProgressionsByChord);

// @route   GET api/chords/common-progressions
// @desc    Lấy các progression phổ biến
// @access  Public
router.get("/common", getCommonProgressions);

export default router;
