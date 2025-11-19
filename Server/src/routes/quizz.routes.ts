import { Router } from "express";
import {
  createAttempt,
  getAttempt,
  submitAttempt,
  listBank,
  upsertQuestion,
  deleteQuestion,
} from "../controllers/quiz.controller";

const router = Router();

// ===== Admin Question Bank =====
router.get("/bank", listBank);
router.post("/bank", upsertQuestion);
router.delete("/bank/:id", deleteQuestion);

// ===== Quiz Attempts (tối thiểu) =====
router.post("/attempts", createAttempt);
router.get("/attempts/:id", getAttempt);
router.post("/attempts/:id/submit", submitAttempt);

export default router;
