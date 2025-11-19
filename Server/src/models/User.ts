import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  googleId?: string;
  username?: string;
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatarUrl?: string;
  role: "user" | "admin";
  age?: number;

  // Hồ sơ học cho recommender / cá nhân hóa
  profile?: {
    level?: "beginner" | "intermediate" | "advanced";
    skills?: string[]; // kỹ năng đã có
    goals?: string[]; // mục tiêu học
    preferredStyles?: string[]; // phong cách yêu thích
    practicePreference?: {
      sessionMinutes?: number; // thời lượng buổi tập
      daysPerWeek?: number; // tần suất
    };
    progress?: {
      completedLessons?: number;
      totalLessons?: number;
      lastActive?: Date;
    };
    stats?: {
      quizzesDone?: number;
      avgAccuracy?: number;
      totalPracticeTime?: number; // phút
    };

    // 👇 Thêm khối này để lưu thông tin ML Onboarding
    onboarding?: {
      completed?: boolean; // đã hoàn tất onboarding?
      levelHint?: number; // gợi ý level 1..3
      answers?: any; // object các câu user đã trả lời
      completedAt?: Date; // thời điểm hoàn tất
    };
  };

  // Nhật ký hoạt động đơn giản để ML đọc (tuỳ chọn)
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PracticePrefSchema = new Schema(
  {
    sessionMinutes: { type: Number, default: 20 },
    daysPerWeek: { type: Number, default: 3 },
  },
  { _id: false }
);

const ProgressSchema = new Schema(
  {
    completedLessons: { type: Number, default: 0 },
    totalLessons: { type: Number, default: 0 },
    lastActive: { type: Date },
  },
  { _id: false }
);

const StatsSchema = new Schema(
  {
    quizzesDone: { type: Number, default: 0 },
    avgAccuracy: { type: Number, default: 0 },
    totalPracticeTime: { type: Number, default: 0 },
  },
  { _id: false }
);

// 👇 Subschema cho ML onboarding
const OnboardingSchema = new Schema(
  {
    completed: { type: Boolean, default: false },
    levelHint: { type: Number, default: 1 }, // 1..3
    answers: { type: Schema.Types.Mixed, default: {} }, // lưu thẳng object answer
    completedAt: { type: Date },
  },
  { _id: false }
);

const ProfileSchema = new Schema(
  {
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    skills: { type: [String], default: [] },
    goals: { type: [String], default: [] },
    preferredStyles: { type: [String], default: [] },
    practicePreference: { type: PracticePrefSchema, default: {} },
    progress: { type: ProgressSchema, default: {} },
    stats: { type: StatsSchema, default: {} },

    // 👇 gắn vào profile
    onboarding: { type: OnboardingSchema, default: {} },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    googleId: { type: String, unique: true, sparse: true },
    username: { type: String, unique: true, sparse: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },

    firstName: String,
    lastName: String,
    displayName: String,
    avatarUrl: String,

    role: { type: String, default: "user", enum: ["user", "admin"] },
    age: { type: Number, default: 18 },

    profile: { type: ProfileSchema, default: {} },
    lastLoginAt: Date,
  },
  { timestamps: true }
);

// === Indexes ===
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 }, { sparse: true });
userSchema.index({ username: 1 }, { sparse: true });
userSchema.index({ role: 1 });
userSchema.index({ "profile.skills": 1 });
userSchema.index({ "profile.goals": 1 });
userSchema.index({ "profile.preferredStyles": 1 });
// 👇 Index hữu ích cho luồng onboarding
userSchema.index({ "profile.onboarding.completed": 1 });
userSchema.index({ "profile.onboarding.levelHint": 1 });

export const User = mongoose.model<IUser>("User", userSchema);
