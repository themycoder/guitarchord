import mongoose, { Schema, Document } from "mongoose";

export interface IInstructionalContent extends Document {
  title: string;
  type: "chord" | "harmonic" | "scale" | "technique" | "exercise";
  content: string;
  tags: string[];
  related_items?: {
    chord_id?: string;
    scale_id?: string;
    harmonic_id?: string;
  };
  media_links?: {
    video?: string;
    image?: string;
    audio?: string;
  };
  difficulty: "beginner" | "intermediate" | "advanced";
  author?: string;
  created_at: Date;
}

const InstructionalContentSchema: Schema = new Schema<IInstructionalContent>({
  title: { type: String, required: true },
  type: {
    type: String,
    enum: ["chord", "harmonic", "scale", "technique", "exercise"],
    required: true,
  },
  content: { type: String, required: true },
  tags: [{ type: String }],
  related_items: {
    chord_id: { type: Schema.Types.ObjectId, ref: "Chord" },
    scale_id: { type: Schema.Types.ObjectId, ref: "Scale" },
    harmonic_id: { type: Schema.Types.ObjectId, ref: "HarmonicTonalNote" },
  },
  media_links: {
    video: String,
    image: String,
    audio: String,
  },
  difficulty: {
    type: String,
    enum: ["beginner", "intermediate", "advanced"],
    default: "beginner",
  },
  author: String,
  created_at: { type: Date, default: Date.now },
});

export default mongoose.model<IInstructionalContent>(
  "InstructionalContent",
  InstructionalContentSchema
);
