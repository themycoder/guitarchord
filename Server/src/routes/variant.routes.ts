// src/routes/variant.routes.ts
import { Router } from "express";
import {
  createVariant,
  getVariant,
  updateVariant,
  deleteVariant,
} from "../controllers/variant.controller";

const router = Router();

router.post("/", createVariant);
router.get("/:id", getVariant);
router.put("/:id", updateVariant);
router.delete("/:id", deleteVariant);

export default router;
