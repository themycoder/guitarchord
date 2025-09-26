// src/routes/matrix.routes.ts
import { Router } from "express";
import { getMatrixMeta } from "../controllers/matrix.controller";

const router = Router();

router.get("/meta", getMatrixMeta);

export default router;
