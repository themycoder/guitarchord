import express from "express";
import {
  createTuning,
  getAllTunings,
  getTuningById,
  getDefaultTuning,
} from "../controllers/string.controller";

const router = express.Router();

router.post("/", createTuning);
router.get("/", getAllTunings);
router.get("/default", getDefaultTuning);
router.get("/:id", getTuningById);

export default router;
