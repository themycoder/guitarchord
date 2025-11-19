import mongoose, { Schema, Document, Types } from "mongoose";

export interface IQuiz extends Document {
  lessonId: Types.ObjectId | string;
  quizId: string; // ID logic cho FE (ví dụ: "Q-GUITAR-INTRO-1")
  type: "single" | "multi" | "truefalse" | "text";
  question: string;
  options?: string[]; // với single/multi/truefalse
  correctIndex?: number; // single/truefalse
  correctIndices?: number[]; // multi
  answerText?: string; // text
  difficulty?: number;
  tags?: string[];
  explanation?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuizSchema = new Schema<IQuiz>(
  {
    lessonId: { type: Schema.Types.Mixed, required: true },
    quizId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ["single", "multi", "truefalse", "text"],
      required: true,
    },
    question: { type: String, required: true },
    options: { type: [String], default: [] },
    correctIndex: { type: Number },
    correctIndices: { type: [Number], default: [] },
    answerText: { type: String },
    difficulty: { type: Number, default: 1 },
    tags: { type: [String], default: [] },
    explanation: { type: String },
  },
  { timestamps: true, versionKey: false }
);

QuizSchema.index({ lessonId: 1 });
QuizSchema.index({ tags: 1 });

export default mongoose.model<IQuiz>("Quiz", QuizSchema);
