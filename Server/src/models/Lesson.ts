// src/models/Lesson.ts
import mongoose, { Document, Schema } from "mongoose";

/* ====== Quiz metadata (tham chiếu đến ngân hàng quiz) ====== */
export interface IQuizItem {
  id: string; // quizId (không phải _id Mongo)
  difficulty?: number; // 1..5
  tags?: string[]; // dùng để suy luận weakTags / gợi ý quiz
}

/* ====== Blocks nội dung linh hoạt ====== */
export type BlockType =
  | "heading"
  | "paragraph"
  | "list"
  | "image"
  | "code"
  | "callout"
  | "table"
  | "divider"
  | "video";

export interface IContentBlock {
  id?: string; // tiện cho FE keyed list
  type: BlockType;
  text?: string; // paragraph / heading / callout / code
  level?: number; // heading level (1..3)
  ordered?: boolean; // list
  items?: string[]; // list items
  src?: string; // image/video url
  alt?: string; // image alt
  caption?: string; // image caption / callout caption
  language?: string; // code lang
  rows?: string[][]; // table [["C","E","G"],["Am","C","E"]]
  meta?: Record<string, any>; // mở rộng tuỳ ý
}

/* ====== Nguồn tham khảo / tài nguyên phụ ====== */
export interface IResourceLink {
  label: string;
  url: string;
  kind?: "video" | "doc" | "sheet" | "audio" | "tab";
}

/* ====== Bài tập đính kèm (không chấm tự động) ====== */
export interface IExercise {
  title: string;
  objective?: string;
  instructions?: string;
  tips?: string[];
  estimatedMinutes?: number;
}

/* ====== Lesson ====== */
export interface ILesson extends Document {
  slug?: string; // unique
  title: string;
  topic:
    | "chord"
    | "technique"
    | "theory"
    | "ear"
    | "rhythm"
    | "practice"
    | string;
  level: number; // 1..4 (1=beginner, 4=master tương đối)
  prereqs: string[]; // mảng id/slug tuỳ em feed vào reco
  tags: string[];
  quiz_pool: IQuizItem[];

  // Nội dung học
  summary?: string;
  blocks?: IContentBlock[];
  markdown?: string;
  resources?: IResourceLink[];
  exercises?: IExercise[];
  coverImage?: string;
  videoUrls?: string[];

  createdAt: Date;
  updatedAt: Date;
}

const QuizItemSchema = new Schema<IQuizItem>(
  {
    id: { type: String, required: true },
    difficulty: { type: Number, min: 1, max: 5 },
    tags: { type: [String], default: [] },
  },
  { _id: false }
);

const ContentBlockSchema = new Schema<IContentBlock>(
  {
    id: String,
    type: { type: String, required: true }, // "heading" | "paragraph" | ...
    text: String,
    level: { type: Number, min: 1, max: 3 },
    ordered: Boolean,
    items: [String],
    src: String,
    alt: String,
    caption: String,
    language: String,
    rows: [[String]],
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const ResourceLinkSchema = new Schema<IResourceLink>(
  {
    label: { type: String, required: true },
    url: { type: String, required: true },
    kind: {
      type: String,
      enum: ["video", "doc", "sheet", "audio", "tab"],
      default: undefined,
    },
  },
  { _id: false }
);

const ExerciseSchema = new Schema<IExercise>(
  {
    title: { type: String, required: true },
    objective: String,
    instructions: String,
    tips: { type: [String], default: [] },
    estimatedMinutes: { type: Number, min: 1 },
  },
  { _id: false }
);

const LessonSchema = new Schema<ILesson>(
  {
    slug: { type: String, unique: true, sparse: true, trim: true },
    title: { type: String, required: true, trim: true },
    topic: { type: String, required: true, trim: true },
    // ✅ Đồng bộ reco & UI: 1..4
    level: {
      type: Number,
      default: 1,
      min: [1, "level phải >= 1"],
      max: [4, "level phải <= 4"],
    },
    prereqs: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    quiz_pool: { type: [QuizItemSchema], default: [] },

    summary: String,
    blocks: { type: [ContentBlockSchema], default: [] },
    markdown: String,
    resources: { type: [ResourceLinkSchema], default: [] },
    exercises: { type: [ExerciseSchema], default: [] },
    coverImage: String,
    videoUrls: { type: [String], default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id?.toString();
        delete ret._id;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

/* ===== Indexes ===== */
// tìm theo slug
LessonSchema.index({ slug: 1 }, { unique: true, sparse: true });
// lọc đề xuất theo topic + level
LessonSchema.index({ topic: 1, level: 1 });
// filter nhanh theo tag
LessonSchema.index({ tags: 1 });
// full-text đơn giản cho title/summary/tags (nếu cần search sau này)
LessonSchema.index({ title: "text", summary: "text", tags: 1 });

export default mongoose.model<ILesson>("Lesson", LessonSchema);
