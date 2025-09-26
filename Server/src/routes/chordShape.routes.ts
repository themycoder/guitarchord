import express from "express";
import chordShapeController from "../controllers/chordShape.controller";

const router = express.Router();

router.post("/", chordShapeController.create);
router.get("/:chord_id", chordShapeController.getByChordId);
router.get("/detail/:id", chordShapeController.getById); // NEW

// Update
router.put("/:id", chordShapeController.update); // NEW: replace/overwrite style
router.patch("/:id", chordShapeController.update); // NEW: partial update

// Delete
router.delete("/:id", chordShapeController.delete);

export default router;
