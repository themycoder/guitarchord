import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";

export interface AuthedUser {
  id: string; // ← đảm bảo có id để dùng req.user.id
  role: "user" | "admin" | string;
  displayName?: string;
  username?: string;
  age?: number;
  raw?: any;
}

/**
 * Kiểu user trong req:
 * - Vừa tương thích JwtPayload (iat, exp, v.v.)
 * - Vừa có các field tiện dùng (id, sub, _id, role...)
 * => Đảm bảo req.user?.id không còn báo lỗi TS.
 */
export type JwtUser = JwtPayload & {
  id?: string;
  sub?: string;
  _id?: string;
  role?: string;
  displayName?: string;
  username?: string;
  age?: number;
  raw?: any;
};

export interface RequestCustom extends Request {
  user?: JwtUser; // ← thay vì JwtPayload | string
  token?: string;
}
