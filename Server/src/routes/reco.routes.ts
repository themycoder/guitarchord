import { Router, Response, Request } from "express";
import { User } from "../models/User";
import LearningState from "../models/LearningState";
import { recommendNext, suggestQuizFor } from "../recommender/reco";
import {
  getGoalsForReco,
  getLearningStateSnapshot,
} from "../services/learningState.service";

// lấy userId từ JWT
import { authenticateToken } from "../middleware/authentication.middleware";
import { RequestCustom } from "../types/app.type";

const router = Router();

/* ===== Helpers: map rank → số level ===== */
type FullRank = "beginner" | "intermediate" | "advanced" | "master";
type UserLevel = "beginner" | "intermediate" | "advanced" | undefined;

function fullRankToNum(rank?: FullRank): number {
  switch (rank) {
    case "master":
      return 4;
    case "advanced":
      return 3;
    case "intermediate":
      return 2;
    case "beginner":
      return 1;
    default:
      return 1;
  }
}
function userLevelToNum(level?: UserLevel): number {
  switch (level) {
    case "advanced":
      return 3;
    case "intermediate":
      return 2;
    case "beginner":
    default:
      return 1;
  }
}

/** GET /api/reco/next?k=5
 * userId: ưu tiên JWT (req.user.id), fallback query.userId
 * Tự động suy ra maxLevel từ LearningState.levelOverride hoặc User.profile.level
 */
router.get(
  "/next",
  authenticateToken,
  async (req: RequestCustom, res: Response) => {
    try {
      const q = req.query as Record<string, string>;
      const tokenUserId = req.user?.id;
      const userId = tokenUserId || q.userId;
      const k = Number(q.k ?? "5") || 5;

      if (!userId) {
        res.status(400).json({ error: "Missing userId" });
        return;
      }

      const user = await User.findById(userId).lean();
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const goals = await getGoalsForReco(userId);
      const state = await getLearningStateSnapshot(userId);

      const rawMax = (req.query as any).maxLevel;
      let maxLevelNum: number;

      if (
        rawMax !== undefined &&
        rawMax !== null &&
        String(rawMax).trim() !== ""
      ) {
        const n = Number(rawMax);
        maxLevelNum = Number.isFinite(n) ? Math.max(1, Math.min(4, n)) : 1;
      } else {
        const ls = await LearningState.findOne({ userId }).lean();
        const override = (ls as any)?.levelOverride as FullRank | undefined;

        if (override) {
          maxLevelNum = fullRankToNum(override);
        } else {
          const lvl = (user as any)?.profile?.level as UserLevel | undefined;
          maxLevelNum = userLevelToNum(lvl);
        }
      }

      const recs = recommendNext({
        userId: String(user._id),
        goals,
        known: state.known,
        seen: state.seen,
        mastered: state.mastered,
        k,
        maxLevel: maxLevelNum,
      });

      res.json(recs);
    } catch (e) {
      console.error("GET /reco/next", e);
      res.status(500).json({ error: "Internal error" });
    }
  }
);

/** POST /api/reco/quiz
 * Body: { items:[lessonId], history:{ [qid]: {tries, correct} } }
 */
router.post("/quiz", async (req: Request, res: Response) => {
  try {
    const { items = [], history = {} } = (req.body || {}) as any;
    const qs = suggestQuizFor(items, history);
    res.json(qs);
  } catch (e) {
    console.error("POST /reco/quiz", e);
    res.status(500).json({ error: "Internal error" });
  }
});

export default router;
