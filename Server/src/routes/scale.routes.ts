import express from "express";
import {
  createScale,
  getScales,
  getScaleById,
  updateScale,
  deleteScale,
  searchScales,
} from "../controllers/scale.controller";

const router = express.Router();

// Scale CRUD routes
router.post("/", createScale);
router.get("/", getScales);
router.get("/:id", getScaleById);
router.put("/:id", updateScale);
router.delete("/:id", deleteScale);

// Search routes
router.get("/search", searchScales);

export default router;
