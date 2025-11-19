import { Schema, model, models, Document, Model } from "mongoose";

/** Question */
export type QuestionType = "mc" | "multi";
export type Difficulty = "easy" | "medium" | "hard";

export interface Question extends Document {
  id: string; // business id
  type: QuestionType; // "mc" (1 đáp án) | "multi" (nhiều đáp án)
  difficulty: Difficulty;
  tags: string[];
  prompt: string;
  options: string[];
  answer: number | number[]; // đáp án thật (server side)
  explanation?: string;
}

const QuestionSchema = new Schema<Question>(
  {
    id: { type: String, required: true, unique: true, index: true },
    type: { type: String, enum: ["mc", "multi"], required: true },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },
    tags: { type: [String], default: [] },
    prompt: { type: String, required: true },
    options: { type: [String], required: true },
    answer: { type: Schema.Types.Mixed, required: true },
    explanation: { type: String },
  },
  { timestamps: true }
);

export const QuestionModel: Model<Question> =
  (models.Question as Model<Question>) ||
  model<Question>("Question", QuestionSchema);

/** QuizAttempt (snapshot đề + kết quả) */
export interface AttemptQuestion {
  id: string;
  type: QuestionType;
  difficulty: Difficulty;
  tags: string[];
  prompt: string;
  options: string[];
  explanation?: string;
}

export interface AttemptAnswer {
  qid: string;
  picked: number | number[] | null;
  correct: boolean;
}

export interface QuizAttempt extends Document {
  userId?: string | null;
  tags: string[];
  difficulty: Difficulty | "all";
  count: number;

  questions: AttemptQuestion[]; // snapshot — không chứa answer
  answers: AttemptAnswer[];
  score: number;
  total: number;

  state: "created" | "submitted";
  createdAt: Date;
  updatedAt: Date;
}

const AttemptQuestionSchema = new Schema<AttemptQuestion>(
  {
    id: String,
    type: { type: String, enum: ["mc", "multi"] },
    difficulty: { type: String, enum: ["easy", "medium", "hard"] },
    tags: [String],
    prompt: String,
    options: [String],
    explanation: String,
  },
  { _id: false }
);

const AttemptAnswerSchema = new Schema<AttemptAnswer>(
  {
    qid: { type: String, required: true },
    picked: { type: Schema.Types.Mixed, default: null },
    correct: { type: Boolean, default: false },
  },
  { _id: false }
);

const AttemptSchema = new Schema<QuizAttempt>(
  {
    userId: { type: String },
    tags: { type: [String], default: [] },
    difficulty: { type: String, default: "all" },
    count: { type: Number, default: 10 },

    questions: { type: [AttemptQuestionSchema], default: [] },
    answers: { type: [AttemptAnswerSchema], default: [] },
    score: { type: Number, default: 0 },
    total: { type: Number, default: 0 },

    state: { type: String, enum: ["created", "submitted"], default: "created" },
  },
  { timestamps: true }
);

export const QuizAttemptModel: Model<QuizAttempt> =
  (models.QuizAttempt as Model<QuizAttempt>) ||
  model<QuizAttempt>("QuizAttempt", AttemptSchema);
