// config/auth.config.ts
import dotenv from "dotenv";
dotenv.config();

/**
 * authConfig giữ nguyên export để không vỡ import cũ:
 *   import { authConfig } from "../config/auth.config";
 */
export const authConfig = {
  // luôn là string; trim để tránh lỗi do khoảng trắng trong .env
  secretKey: (process.env.JWT_SECRET ?? "").trim() || "dev_secret_change_me",
} as const;

// (tuỳ chọn) cảnh báo khi chạy production mà thiếu secret
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  // eslint-disable-next-line no-console
  console.warn("[auth.config] JWT_SECRET is missing in production!");
}
