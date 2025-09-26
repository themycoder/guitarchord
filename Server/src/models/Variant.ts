// src/models/Variant.ts
import { Schema, model, Document, Types } from "mongoose";

export interface IVariant extends Document {
  progression: Types.ObjectId;
  index: number; // 1,2,3...
  key: string; // "C", "G", ...
  chords: string[]; // ["C","F","G","C"]
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VariantSchema = new Schema<IVariant>(
  {
    progression: {
      type: Schema.Types.ObjectId,
      ref: "Progression",
      required: true,
      index: true,
    },
    index: { type: Number, required: true },
    key: { type: String, required: true },
    chords: { type: [String], required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

VariantSchema.index({ progression: 1, key: 1, index: 1 }, { unique: true });

export const Variant = model<IVariant>("Variant", VariantSchema);
