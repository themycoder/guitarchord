import mongoose, { Schema, Document } from "mongoose";

interface Position {
  string: number;
  fret: number;
  finger?: number;
}

interface Shape {
  version_name: string;
  positions: Position[];
  diagram?: string;
}

export interface IChord extends Document {
  name: string;
  description?: string; // Make optional
  difficulty: "easy" | "medium" | "hard";
  notes: string[];
  categories: string[];
  suitable_for: string[];
  progressions: string[];
  shapes: Shape[];
  contributed_by?: string;
  created_at: Date;
  // Thêm trường aliases cho các tên hợp âm khác nhau
  aliases?: string[];
  // Thêm trường để tối ưu tìm kiếm
  normalized_notes?: string[];
}

const PositionSchema = new Schema({
  string: { type: Number, required: true },
  fret: { type: Number, required: true },
  finger: { type: Number },
});

const ShapeSchema = new Schema({
  version_name: { type: String, required: true },
  positions: { type: [PositionSchema], required: true },
  diagram: { type: String },
});

const ChordSchema: Schema = new Schema<IChord>({
  name: { type: String, required: true, index: true },
  description: String,
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    required: true,
    index: true, // Thêm index cho trường thường dùng để sort
  },
  notes: { type: [String], required: true, index: true },
  categories: { type: [String], index: true },
  suitable_for: { type: [String] },
  progressions: { type: [String] },
  shapes: { type: [ShapeSchema], required: true },
  contributed_by: String,
  created_at: { type: Date, default: Date.now },
  aliases: { type: [String] },
  normalized_notes: { type: [String], index: true }, // Chuẩn hóa nốt nhạc (vd: C# thành Db)
});

// Thêm index cho các trường thường dùng để tìm kiếm
ChordSchema.index({ notes: 1, difficulty: 1 });

export default mongoose.model<IChord>("Chord", ChordSchema);
