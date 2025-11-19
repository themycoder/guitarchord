import mongoose, { Schema, Document } from "mongoose";

export interface IEvent extends Document {
  userId: string; // bắt từ req.user
  lessonId?: string; // bài học liên quan
  type: string; // view | complete | navigate | check | submit | ...
  progress?: number; // 0..1
  score?: number; // tuỳ em dùng
  meta?: Record<string, any>; // mở rộng tuỳ ý
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    userId: { type: String, required: true, index: true },
    lessonId: { type: String },
    type: { type: String, required: true, index: true },
    progress: { type: Number, min: 0, max: 1 },
    score: { type: Number },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, versionKey: false }
);

EventSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IEvent>("Event", EventSchema);
