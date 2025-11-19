import { Router } from "express";
import { authenticateToken } from "../middleware/authentication.middleware";
// Controllers (đều là RequestHandler)
import {
  getQuestions,
  saveAnswers,
  onboardingStatus,
  recommendLessons,
  adminTrain,
} from "../controllers/ml.controller";

const r = Router();

// FE dùng:
r.get("/questions", authenticateToken, getQuestions);
r.get("/onboarding-status", authenticateToken, onboardingStatus);
r.post("/save-answers", authenticateToken, saveAnswers);
r.post("/recommend", authenticateToken, recommendLessons);

// Admin dùng:
r.post("/train", authenticateToken, adminTrain);

export default r;
