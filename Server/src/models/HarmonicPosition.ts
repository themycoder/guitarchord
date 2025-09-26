import mongoose, { Schema, Document } from "mongoose";

export interface IHarmonicPosition extends Document {
  string_name: string; // E, A, D, G, B, e
  string_note: string; // E2, A2...
  fret: number;
  harmonic_note: string; // Kết quả vang ra
  frequency: number;
  overtone_order: number;
  strength: "strong" | "medium" | "weak";
  comment?: string;
}

const HarmonicPositionSchema = new Schema<IHarmonicPosition>({
  string_name: { type: String, required: true },
  string_note: { type: String, required: true },
  fret: { type: Number, required: true },
  harmonic_note: { type: String, required: true },
  frequency: { type: Number, required: true },
  overtone_order: { type: Number, required: true },
  strength: {
    type: String,
    enum: ["strong", "medium", "weak"],
    default: "medium",
  },
  comment: String,
});

export default mongoose.model<IHarmonicPosition>(
  "HarmonicPosition",
  HarmonicPositionSchema
);
