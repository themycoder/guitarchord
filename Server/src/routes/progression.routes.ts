// src/routes/progression.routes.ts
import { Router } from "express";
import {
  createProgression,
  getProgressions,
  getProgressionById,
  updateProgression,
  deleteProgression,
  getVariantsOfProgression,
} from "../controllers/progression.controller";

const router = Router();

router.post("/", createProgression);
router.get("/", getProgressions);
router.get("/:id", getProgressionById);
router.put("/:id", updateProgression);
router.delete("/:id", deleteProgression);

// variants của 1 progression
router.get("/:id/variants", getVariantsOfProgression);

export default router;
