// controllers/profile.controller.ts
import { Request, Response } from "express";
import { User } from "../models/User";

/** ---- Helpers ---- */
function getAuthUserId(req: Request): string | null {
  const u: any = (req as any).user || {};
  // hỗ trợ nhiều kiểu payload: sub/userId/id/_id
  return u?.sub || u?.userId || u?.id || u?._id || null;
}

/** Chỉ trả dữ liệu an toàn ra ngoài */
function toPublicUser(u: any) {
  if (!u) return null;
  const {
    _id,
    username,
    email,
    firstName,
    lastName,
    displayName,
    avatarUrl,
    role,
    age,
    profile,
    lastLoginAt,
    createdAt,
    updatedAt,
  } = u;
  return {
    _id,
    username,
    email,
    firstName,
    lastName,
    displayName,
    avatarUrl,
    role,
    age,
    profile, // gồm cả profile.onboarding nếu có
    lastLoginAt,
    createdAt,
    updatedAt,
  };
}

/** sanitize một object theo whitelist keys (để gán vào $set nguyên cụm) */
function pick(obj: any, keys: string[]) {
  const out: Record<string, any> = {};
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(obj || {}, k)) {
      out[k] = obj[k];
    }
  }
  return out;
}

/** Xây update ops: $set (giá trị != null) và $unset (giá trị === null) */
function buildUpdateOps(body: any) {
  const allowedTop = [
    "firstName",
    "lastName",
    "displayName",
    "avatarUrl",
    "age",
  ];
  const allowedProfile = [
    "level",
    "skills",
    "goals",
    "preferredStyles",
    "practicePreference",
    "progress",
    "stats",
    "onboarding", // ✅ NEW: cho phép update profile.onboarding
  ];

  // các khóa con cho onboarding
  const allowedOnboarding = [
    "completed",
    "levelHint",
    "answers",
    "completedAt",
  ];

  const $set: Record<string, any> = {};
  const $unset: Record<string, any> = {};

  if (body && typeof body === "object") {
    for (const k of allowedTop) {
      if (Object.prototype.hasOwnProperty.call(body, k)) {
        if (body[k] === null) $unset[k] = "";
        else $set[k] = body[k];
      }
    }
    if (body.profile && typeof body.profile === "object") {
      for (const k of allowedProfile) {
        if (Object.prototype.hasOwnProperty.call(body.profile, k)) {
          const v = body.profile[k];
          const path = `profile.${k}`;

          // nếu là onboarding thì chỉ nhận các field được phép
          if (k === "onboarding" && v && typeof v === "object") {
            const safe = pick(v, allowedOnboarding);
            // nếu client cố ý null -> unset toàn bộ onboarding
            if (v === null) {
              $unset[path] = "";
            } else {
              // merge nguyên cụm các field cho phép
              $set[path] = safe;
            }
            continue;
          }

          if (v === null) $unset[path] = "";
          else $set[path] = v;
        }
      }
    }
  }

  const update: any = {};
  if (Object.keys($set).length) update.$set = $set;
  if (Object.keys($unset).length) update.$unset = $unset;
  return update;
}

/** ================== Controllers ================== */

/** GET /api/profile/me */
export const getMyProfile = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({ user: toPublicUser(user) });
    return;
  } catch (e: any) {
    res
      .status(500)
      .json({ message: "Get my profile failed", error: e.message });
    return;
  }
};

/** PUT /api/profile/me — full update */
export const putMyProfile = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const update = buildUpdateOps(req.body);
    if (!Object.keys(update).length) {
      res.status(400).json({ message: "No valid fields to update" });
      return;
    }

    const updated = await User.findByIdAndUpdate(userId, update, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({ user: toPublicUser(updated) });
    return;
  } catch (e: any) {
    res
      .status(500)
      .json({ message: "Put my profile failed", error: e.message });
    return;
  }
};

/** PATCH /api/profile/me — partial update */
export const patchMyProfile = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const update = buildUpdateOps(req.body);
    if (!Object.keys(update).length) {
      res.status(400).json({ message: "No valid fields to update" });
      return;
    }

    const updated = await User.findByIdAndUpdate(userId, update, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({ user: toPublicUser(updated) });
    return;
  } catch (e: any) {
    res
      .status(500)
      .json({ message: "Patch my profile failed", error: e.message });
    return;
  }
};

/** PATCH /api/profile/preferences */
export const patchMyPracticePreference = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { sessionMinutes, daysPerWeek } = req.body || {};
    const setObj: any = {};
    if (typeof sessionMinutes === "number") {
      setObj["profile.practicePreference.sessionMinutes"] = sessionMinutes;
    }
    if (typeof daysPerWeek === "number") {
      setObj["profile.practicePreference.daysPerWeek"] = daysPerWeek;
    }

    if (!Object.keys(setObj).length) {
      res.status(400).json({ message: "No valid fields to update" });
      return;
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: setObj },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({ user: toPublicUser(updated) });
    return;
  } catch (e: any) {
    res.status(500).json({
      message: "Patch practice preference failed",
      error: e.message,
    });
    return;
  }
};

/** PATCH /api/profile/progress */
export const incrementMyProgress = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const {
      completedLessons = 0,
      totalLessons = 0,
      lastActive = new Date(),
    } = req.body || {};

    const updateOps: any = { $set: {} };
    if (typeof completedLessons === "number" && completedLessons !== 0) {
      updateOps.$inc = {
        ...(updateOps.$inc || {}),
        "profile.progress.completedLessons": completedLessons,
      };
    }
    if (typeof totalLessons === "number" && totalLessons !== 0) {
      updateOps.$inc = {
        ...(updateOps.$inc || {}),
        "profile.progress.totalLessons": totalLessons,
      };
    }
    updateOps.$set["profile.progress.lastActive"] = new Date(lastActive);

    const updated = await User.findByIdAndUpdate(userId, updateOps, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({ user: toPublicUser(updated) });
    return;
  } catch (e: any) {
    res
      .status(500)
      .json({ message: "Increment progress failed", error: e.message });
    return;
  }
};

/** PATCH /api/profile/stats */
export const incrementMyStats = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const {
      quizzesDone = 0,
      totalPracticeTime = 0,
      avgAccuracy,
    } = req.body || {};

    const update: any = {};
    if (
      (typeof quizzesDone === "number" && quizzesDone !== 0) ||
      (typeof totalPracticeTime === "number" && totalPracticeTime !== 0)
    ) {
      update.$inc = {};
      if (typeof quizzesDone === "number" && quizzesDone !== 0) {
        update.$inc["profile.stats.quizzesDone"] = quizzesDone;
      }
      if (typeof totalPracticeTime === "number" && totalPracticeTime !== 0) {
        update.$inc["profile.stats.totalPracticeTime"] = totalPracticeTime;
      }
    }
    if (typeof avgAccuracy === "number") {
      update.$set = {
        ...(update.$set || {}),
        "profile.stats.avgAccuracy": avgAccuracy,
      };
    }

    if (!Object.keys(update).length) {
      res.status(400).json({ message: "No valid fields to update" });
      return;
    }

    const updated = await User.findByIdAndUpdate(userId, update, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({ user: toPublicUser(updated) });
    return;
  } catch (e: any) {
    res
      .status(500)
      .json({ message: "Increment stats failed", error: e.message });
    return;
  }
};

/** ===== Onboarding helpers (NEW) ===== */

/** GET /api/profile/onboarding */
export const getMyOnboarding = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const user = await User.findById(userId, {
      "profile.onboarding": 1,
    }).lean();

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.status(200).json({
      onboarding: user.profile?.onboarding || {
        completed: false,
        levelHint: 1,
        answers: {},
      },
    });
  } catch (e: any) {
    res
      .status(500)
      .json({ message: "Get onboarding failed", error: e.message });
  }
};

/** PATCH /api/profile/onboarding */
export const patchMyOnboarding = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { completed, levelHint, answers, completedAt } = req.body || {};
    const setObj: any = {};
    if (typeof completed === "boolean")
      setObj["profile.onboarding.completed"] = completed;
    if (typeof levelHint === "number")
      setObj["profile.onboarding.levelHint"] = levelHint;
    if (answers && typeof answers === "object")
      setObj["profile.onboarding.answers"] = answers;
    if (completedAt)
      setObj["profile.onboarding.completedAt"] = new Date(completedAt);
    if (!Object.keys(setObj).length) {
      res.status(400).json({ message: "No valid fields to update" });
      return;
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: setObj },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.status(200).json({ user: toPublicUser(updated) });
  } catch (e: any) {
    res
      .status(500)
      .json({ message: "Patch onboarding failed", error: e.message });
  }
};

/** ===== Admin ===== */

/** GET /api/profile/admin/:id */
export const adminGetProfileById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).lean();
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({ user: toPublicUser(user) });
    return;
  } catch (e: any) {
    res
      .status(500)
      .json({ message: "Admin get profile failed", error: e.message });
    return;
  }
};

/** PATCH /api/profile/admin/:id */
export const adminPatchProfileById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const update = buildUpdateOps(req.body);
    if (!Object.keys(update).length) {
      res.status(400).json({ message: "No valid fields to update" });
      return;
    }

    const updated = await User.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({ user: toPublicUser(updated) });
    return;
  } catch (e: any) {
    res
      .status(500)
      .json({ message: "Admin patch profile failed", error: e.message });
    return;
  }
};
