// src/models/Progression.ts
import { Schema, model, Document } from "mongoose";

export interface IProgression extends Document {
  title: string;
  tags: string[];
  scaleType: "major";
  degrees: string[]; // ví dụ: ["I", "IV", "V", "I"]
  description?: string;
  difficulty?: "easy" | "medium" | "hard";
  createdAt: Date;
  updatedAt: Date;
}

const ProgressionSchema = new Schema<IProgression>(
  {
    title: { type: String, required: true, trim: true },
    tags: { type: [String], default: [] },
    scaleType: { type: String, enum: ["major"], default: "major" },
    degrees: { type: [String], required: true }, // lưu ở degree để đổi key linh hoạt
    description: { type: String },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
  },
  { timestamps: true }
);

export const Progression = model<IProgression>(
  "Progression",
  ProgressionSchema
);
