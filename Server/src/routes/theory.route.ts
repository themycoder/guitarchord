// routes/theory.route.ts
import { Router } from "express";
import { authenticateToken } from "../middleware/authentication.middleware";
import { authorizeRoles } from "../middleware/authorization.middleware";
import {
  listTheories,
  getTheoryById,
  createTheory,
  updateTheory,
  patchTheory,
  deleteTheory,
  bulkUpsertTheories,
  listTags,
  listSkills,
} from "../controllers/Theory.controller";

const r = Router();

// Public reads
r.get("/", listTheories);
r.get("/meta/tags", listTags);
r.get("/meta/skills", listSkills);
r.get("/:id", getTheoryById);

// Admin writes
r.post("/", authenticateToken, authorizeRoles("admin"), createTheory);
r.post("/bulk", authenticateToken, authorizeRoles("admin"), bulkUpsertTheories);
r.put("/:id", authenticateToken, authorizeRoles("admin"), updateTheory);
r.patch("/:id", authenticateToken, authorizeRoles("admin"), patchTheory);
r.delete("/:id", authenticateToken, authorizeRoles("admin"), deleteTheory);

export default r;
