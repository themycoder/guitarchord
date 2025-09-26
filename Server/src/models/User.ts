// models/User.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  googleId?: string; // optional: chỉ có nếu login bằng Google
  username?: string; // optional: chỉ có nếu đăng ký thường
  email: string;
  password?: string; // optional: Google thì không có password
  firstName?: string;
  lastName?: string;
  role: string;
  age: number;
}

const userSchema = new Schema<IUser>({
  googleId: { type: String, unique: true, sparse: true }, // unique nhưng sparse để có thể null
  username: { type: String, unique: true, sparse: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // optional nếu dùng Google
  firstName: { type: String },
  lastName: { type: String },
  role: { type: String, default: "user" },
  age: { type: Number, default: 18 },
});

export const User = mongoose.model<IUser>("User", userSchema);
