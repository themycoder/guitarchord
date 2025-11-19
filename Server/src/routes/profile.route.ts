// routes/profile.route.ts
import { Router } from "express";
import { authenticateToken } from "../middleware/authentication.middleware";
import { authorizeRoles } from "../middleware/authorization.middleware";
import {
  getMyProfile,
  putMyProfile,
  patchMyProfile,
  patchMyPracticePreference,
  incrementMyProgress,
  incrementMyStats,
  getMyOnboarding, // ✅ NEW
  patchMyOnboarding, // ✅ NEW
  adminGetProfileById,
  adminPatchProfileById,
} from "../controllers/profile.controller";

const r = Router();

/** ===== Self service (user tự thao tác) ===== */
// Đọc hồ sơ chính mình
r.get("/me", authenticateToken, getMyProfile);

// Cập nhật hồ sơ (PUT/PATCH đều hỗ trợ)
r.put("/me", authenticateToken, putMyProfile);
r.patch("/me", authenticateToken, patchMyProfile);

// Onboarding (lưu câu trả lời, levelHint… vào profile.onboarding)
r.get("/onboarding", authenticateToken, getMyOnboarding); // ✅ NEW
r.patch("/onboarding", authenticateToken, patchMyOnboarding); // ✅ NEW

// Các cập nhật vi mô
r.patch("/preferences", authenticateToken, patchMyPracticePreference);
r.patch("/progress", authenticateToken, incrementMyProgress);
r.patch("/stats", authenticateToken, incrementMyStats);

/** ===== Admin ===== */
r.get(
  "/admin/:id",
  authenticateToken,
  authorizeRoles("admin"),
  adminGetProfileById
);
r.patch(
  "/admin/:id",
  authenticateToken,
  authorizeRoles("admin"),
  adminPatchProfileById
);

export default r;
