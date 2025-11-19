// models/Theory.model.ts
import { Schema, model, Document } from "mongoose";

/** Kiểu block cơ bản, linh hoạt props */
export interface IBlock {
  type: string;
  props?: Record<string, any>;
}

export interface ITheory extends Document {
  theory_id: string; // định danh để map sang ML
  title: string;
  tags: string[];
  skills: string[];
  level: "beginner" | "intermediate" | "advanced";
  difficulty: number; // 1..5
  summary?: string; // mô tả ngắn (giữ để tương thích)
  excerpt?: string; // tóm tắt hiển thị FE
  cover?: string; // ảnh cover (URL)
  contentUrl?: string;

  status: "draft" | "published" | "archived";
  contentBlocks?: {
    blocks: IBlock[];
  };

  // meta khác có thể bổ sung sau
}

const BlockSchema = new Schema<IBlock>(
  {
    type: { type: String, required: true },
    props: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const schema = new Schema<ITheory>(
  {
    theory_id: { type: String, unique: true, required: true, index: true },
    title: { type: String, required: true },

    tags: { type: [String], default: [] },
    skills: { type: [String], default: [] },

    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    difficulty: { type: Number, default: 1, min: 1, max: 5 },

    summary: String, // legacy
    excerpt: { type: String }, // dùng cho UI
    cover: { type: String }, // dùng cho UI
    contentUrl: String,

    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },

    contentBlocks: {
      blocks: { type: [BlockSchema], default: [] },
    },
  },
  { timestamps: true }
);

schema.index({ title: "text", summary: "text" });
schema.index({ tags: 1 });
schema.index({ skills: 1 });
schema.index({ level: 1, difficulty: 1 });
schema.index({ status: 1 });
export default model<ITheory>("Theory", schema);
