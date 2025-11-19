import { Router } from "express";
import { authenticateToken } from "../middleware/authentication.middleware";
import { logEvent } from "../controllers/learn.controller";

const r = Router();

// FE đang gọi POST /api/events -> map trực tiếp ở đây
r.post("/events", authenticateToken, logEvent);

export default r;
