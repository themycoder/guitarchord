import mongoose, { Document, Schema, Types } from "mongoose";

export interface ILearningState extends Document {
  userId: Types.ObjectId;
  // các field AI dùng — đều tùy chọn để không “khóa cứng” schema cũ
  mastery?: Record<string, number>; // { [lessonId]: 0..1 }
  known?: string[]; // lessonIds user tự khai "đã biết"
  seen?: string[]; // lessonIds đã xem
  // có thể lưu thêm goals riêng nếu muốn override profile.goals
  goalsOverride?: string[];
  updatedAt: Date;
  createdAt: Date;
}

const LearningStateSchema = new Schema<ILearningState>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    mastery: { type: Schema.Types.Mixed, default: {} },
    known: { type: [String], default: [] },
    seen: { type: [String], default: [] },
    goalsOverride: { type: [String], default: [] },
  },
  { timestamps: true }
);

// tra cứu nhanh theo user
LearningStateSchema.index({ userId: 1 }, { unique: true });

export default mongoose.model<ILearningState>(
  "LearningState",
  LearningStateSchema
);
