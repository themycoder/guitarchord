import { Document } from "mongoose";

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: "user" | "admin";
  correctPassword(
    candidatePassword: string,
    userPassword: string
  ): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserInput {
  username: string;
  email: string;
  password: string;
  passwordConfirm: string;
  role?: "user" | "admin";
}
