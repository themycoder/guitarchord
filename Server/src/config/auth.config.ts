import dotenv from "dotenv";

dotenv.config();

export const authConfig = {
  secretKey: process.env.JWT_SECRET || "your_secret_key",
};
