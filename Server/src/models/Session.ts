// models/Session.ts
import { Schema, model, Document } from "mongoose";

export interface ISession extends Document {
  userId: string;
  refreshToken: string;
  userAgent?: string;
  ip?: string;
  expiresAt: Date;
  createdAt: Date;
}

const schema = new Schema<ISession>(
  {
    userId: { type: String, index: true },
    refreshToken: { type: String, unique: true },
    userAgent: String,
    ip: String,
    expiresAt: { type: Date, index: true },
  },
  { timestamps: true }
);

export const Session = model<ISession>("Session", schema);
