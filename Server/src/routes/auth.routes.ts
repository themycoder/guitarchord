// routes/auth.routes.ts
import express from "express";
import { authenticateToken } from "../middleware/authentication.middleware";
import {
  authorizeAttribute,
  authorizeRoles,
} from "../middleware/authorization.middleware";
import {
  register,
  login,
  logout,
  refreshTokenHandler,
  protectedRoute,
  adminRoute,
  userRoute,
  googleAuth,
  googleCallback,
} from "../controllers/auth.controller";

const router = express.Router();

// ----------- Auth thường -----------
router.post("/register", register);
router.post("/login", login);

router.post("/token", refreshTokenHandler);
router.post("/logout", authenticateToken, logout);

// ----------- Auth Google -----------
router.get("/auth/google", googleAuth);
router.get("/auth/google/callback", googleCallback);

// ----------- Các route protected -----------
router.post(
  "/user",
  authenticateToken,
  authorizeRoles("user", "admin"),
  authorizeAttribute,
  userRoute
);

router.post("/admin", authenticateToken, authorizeRoles("admin"), adminRoute);
router.get("/protected", authenticateToken, protectedRoute);

export default router;
