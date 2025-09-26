// models/GuitarNote.ts
import { Document, model, Schema, Types } from "mongoose";

export interface IGuitarNote extends Document {
  stringTuning: Types.ObjectId;
  fret: number;
  stringNumber: number;
  note: string;
  isSharp: boolean;
  createdAt: Date;
}

const GuitarNoteSchema = new Schema<IGuitarNote>({
  stringTuning: {
    type: Schema.Types.ObjectId,
    ref: "GuitarString",
    required: true,
  },
  fret: {
    type: Number,
    required: true,
    min: 0,
    max: 24,
  },
  stringNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 6,
  },
  note: {
    type: String,
    required: true,
  },
  isSharp: {
    type: Boolean,
    default: false, // Quan trọng: thêm giá trị mặc định
    required: true,
    select: true, 
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Tạo index để tìm kiếm nhanh
GuitarNoteSchema.index(
  { stringTuning: 1, fret: 1, stringNumber: 1 },
  { unique: true }
);

export const GuitarNote = model<IGuitarNote>("GuitarNote", GuitarNoteSchema);
