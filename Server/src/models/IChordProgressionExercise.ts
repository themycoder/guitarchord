import { Schema, model, Document } from "mongoose";

export interface IChordProgressionExercise extends Document {
  key: string;
  scaleType: "major" | "minor";
  chords: string[];
  createdAt: Date;
  updatedAt: Date;
  authorId?: string;
  description?: string;
  difficulty?: "easy" | "medium" | "hard";
  tags?: string[];
}

const ChordProgressionExerciseSchema = new Schema<IChordProgressionExercise>(
  {
    key: { type: String, required: true },
    scaleType: { type: String, enum: ["major", "minor"], required: true },
    chords: [{ type: String, required: true }],
    authorId: { type: String },
    description: { type: String },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
    },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

export default model<IChordProgressionExercise>(
  "ChordProgressionExercise",
  ChordProgressionExerciseSchema
);
