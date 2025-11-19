import { Request, Response } from "express";
import {
  QuestionModel,
  QuizAttemptModel,
  Question,
  QuizAttempt,
  AttemptQuestion,
  Difficulty,
} from "../models/quizz.model";

/* ============== Utils (TS-safe, tránh lỗi) ============== */
function toStringArray(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.map((item) => String(item));
  }
  if (typeof input === "string") {
    return input
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function shuffleArray<T>(source: T[]): T[] {
  const copy = source.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

function safeMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

function isDifficulty(x: string): x is Difficulty {
  return x === "easy" || x === "medium" || x === "hard";
}

/* ============== API 1: Tạo đề (Attempt) ============== */
// POST /api/quiz/attempts
// body: { tags?:string[]|string, difficulty?:"all"|"easy"|"medium"|"hard", count?:number }
export async function createAttempt(req: Request, res: Response) {
  try {
    const tagsFilter = Array.isArray(req.body?.tags)
      ? (req.body.tags as string[])
      : toStringArray(req.body?.tags);

    const difficultyRaw = String(req.body?.difficulty ?? "all").toLowerCase();
    const requestedCount = Number(req.body?.count ?? 10);
    const count = Math.max(
      1,
      Math.min(50, Number.isFinite(requestedCount) ? requestedCount : 10)
    );
    const userId = (req as any).userId ?? null;

    const mongoFilter: Record<string, unknown> = {};
    if (tagsFilter.length > 0) {
      mongoFilter.tags = { $in: tagsFilter };
    }
    if (isDifficulty(difficultyRaw)) {
      mongoFilter.difficulty = difficultyRaw;
    }

    let questionPool = (await QuestionModel.find(
      mongoFilter
    ).lean()) as Question[];

    if (!questionPool || questionPool.length === 0) {
      res.status(400).json({ error: "NO_QUESTIONS_MATCH_FILTER" });
      return;
    }

    questionPool = shuffleArray(questionPool).slice(0, count);

    const snapshot: AttemptQuestion[] = questionPool.map((q) => ({
      id: q.id,
      type: q.type,
      difficulty: q.difficulty,
      tags: q.tags,
      prompt: q.prompt,
      options: q.options,
      explanation: q.explanation,
    }));

    const storedDifficulty: Difficulty | "all" = isDifficulty(difficultyRaw)
      ? difficultyRaw
      : "all";

    const attemptDoc = await QuizAttemptModel.create({
      userId,
      tags: tagsFilter,
      difficulty: storedDifficulty,
      count,
      questions: snapshot,
      total: snapshot.length,
      state: "created",
    } as Partial<QuizAttempt>);

    res.status(201).json({
      attemptId: attemptDoc._id,
      total: attemptDoc.total,
      items: snapshot,
      filter: { tags: tagsFilter, difficulty: storedDifficulty, count },
    });
    return;
  } catch (error: unknown) {
    const detail = safeMessage(error);
    res.status(500).json({ error: "CREATE_ATTEMPT_FAILED", detail });
    return;
  }
}

/* ============== API 2: Lấy attempt ============== */
// GET /api/quiz/attempts/:id
export async function getAttempt(req: Request, res: Response) {
  try {
    const attemptId = req.params.id;
    const attempt = (await QuizAttemptModel.findById(attemptId).lean()) as
      | (QuizAttempt & { _id: any })
      | null;

    if (!attempt) {
      res.status(404).json({ error: "ATTEMPT_NOT_FOUND" });
      return;
    }

    res.json({
      attemptId: attempt._id,
      state: attempt.state,
      total: attempt.total,
      score: attempt.score,
      questions: attempt.questions,
      answers: attempt.answers,
      meta: {
        tags: attempt.tags,
        difficulty: attempt.difficulty,
        createdAt: attempt.createdAt,
      },
    });
    return;
  } catch (error: unknown) {
    const detail = safeMessage(error);
    res.status(500).json({ error: "GET_ATTEMPT_FAILED", detail });
    return;
  }
}

/* ============== API 3: Nộp bài ============== */
// POST /api/quiz/attempts/:id/submit
// body: { answers: [{ id: string, value: number | number[] | null }] }
type SubmitBody = {
  answers?: Array<{ id: string; value: number | number[] | null }>;
};

export async function submitAttempt(
  req: Request<{ id: string }, any, SubmitBody>,
  res: Response
) {
  try {
    const attemptId = req.params.id;
    const attempt = await QuizAttemptModel.findById(attemptId);

    if (!attempt) {
      res.status(404).json({ error: "ATTEMPT_NOT_FOUND" });
      return;
    }

    if (attempt.state === "submitted") {
      res.status(400).json({ error: "ALREADY_SUBMITTED" });
      return;
    }

    const submittedAnswers = Array.isArray(req.body?.answers)
      ? req.body.answers!
      : [];

    const answerMap = new Map<string, number | number[] | null>(
      submittedAnswers.map((item) => [item.id, item.value])
    );

    const neededQuestionIds = attempt.questions.map((q) => q.id);

    const questionDocs = (await QuestionModel.find({
      id: { $in: neededQuestionIds },
    }).lean()) as Question[];

    const truthById = new Map<string, Question>(
      questionDocs.map((doc) => [doc.id, doc])
    );

    let score = 0;

    const checkDetails = attempt.questions.map((snap) => {
      const pickedValue = answerMap.has(snap.id)
        ? answerMap.get(snap.id)!
        : null;
      const ground = truthById.get(snap.id);

      if (!ground) {
        return {
          qid: snap.id,
          correct: false,
          picked: pickedValue,
          reason: "QUESTION_NOT_FOUND" as const,
        };
      }

      let isCorrect = false;

      if (ground.type === "mc") {
        isCorrect = pickedValue === (ground.answer as number);
      } else {
        const want = JSON.stringify(
          ((ground.answer as number[]) || []).slice().sort()
        );
        const got = JSON.stringify(
          (Array.isArray(pickedValue) ? pickedValue : []).slice().sort()
        );
        isCorrect = want === got;
      }

      if (isCorrect) {
        score += 1;
      }

      return { qid: snap.id, correct: isCorrect, picked: pickedValue };
    });

    attempt.answers = checkDetails.map((d) => ({
      qid: d.qid,
      picked: d.picked,
      correct: d.correct,
    }));

    attempt.score = score;
    attempt.state = "submitted";
    await attempt.save();

    res.json({
      attemptId: attempt._id,
      total: attempt.total,
      score: attempt.score,
      state: attempt.state,
      detail: checkDetails.map((d) => {
        const snap = attempt.questions.find((q) => q.id === d.qid);
        const explanation = snap && snap.explanation ? snap.explanation : "";
        return {
          qid: d.qid,
          correct: d.correct,
          picked: d.picked,
          explanation,
        };
      }),
    });
    return;
  } catch (error: unknown) {
    const detail = safeMessage(error);
    res.status(500).json({ error: "SUBMIT_ATTEMPT_FAILED", detail });
    return;
  }
}
// GET /api/quiz/bank?hideAnswer=1
export async function listBank(req: Request, res: Response) {
  try {
    const hideAnswer = String(req.query?.hideAnswer || "");
    const qs = await QuestionModel.find().lean();

    if (hideAnswer === "1") {
      res.json({
        count: qs.length,
        questions: qs.map(({ answer, ...rest }) => rest),
      });
      return;
    }

    res.json({
      count: qs.length,
      questions: qs,
    });
    return;
  } catch (error) {
    res.status(500).json({
      error: "LIST_BANK_FAILED",
      detail: error instanceof Error ? error.message : String(error),
    });
    return;
  }
}

// POST /api/quiz/bank  (upsert theo id)
export async function upsertQuestion(req: Request, res: Response) {
  try {
    const payload = req.body || {};
    if (!payload.id) {
      res.status(400).json({ error: "MISSING_ID" });
      return;
    }

    const exists = await QuestionModel.findOne({ id: payload.id });
    if (exists) {
      const updated = await QuestionModel.findOneAndUpdate(
        { id: payload.id },
        payload,
        { new: true }
      );

      res.json(updated);
      return;
    }

    const created = await QuestionModel.create(payload);
    res.status(201).json(created);
    return;
  } catch (error) {
    res.status(500).json({
      error: "UPSERT_QUESTION_FAILED",
      detail: error instanceof Error ? error.message : String(error),
    });
    return;
  }
}

// DELETE /api/quiz/bank/:id
export async function deleteQuestion(req: Request, res: Response) {
  try {
    const id = req.params?.id;
    if (!id) {
      res.status(400).json({ error: "MISSING_ID" });
      return;
    }

    await QuestionModel.deleteOne({ id });
    res.json({ ok: true });
    return;
  } catch (error) {
    res.status(500).json({
      error: "DELETE_QUESTION_FAILED",
      detail: error instanceof Error ? error.message : String(error),
    });
    return;
  }
}