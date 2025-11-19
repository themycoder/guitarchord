import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { authConfig } from "../config/auth.config";
import { RequestCustom } from "../types/app.type";
import { User } from "../models/User"; // kiểm tra đúng path nhé

type JwtPayloadNew = {
  sub?: string; // ưu tiên OIDC
  _id?: string; // một số hệ thống dùng _id
  id?: string; // fallback khác
  role?: string;
  displayName?: string;
  username?: string;
  email?: string;
  age?: number;
  iat?: number;
  exp?: number;
};

export const authenticateToken = async (
  req: RequestCustom,
  res: Response,
  next: NextFunction
) => {
  try {
    const raw = req.headers.authorization || "";
    const token = raw.startsWith("Bearer ") ? raw.slice(7) : "";

    if (!token) {
      res.status(401).json({ message: "Bạn chưa đăng nhập" });
      return;
    }

    let payload: JwtPayloadNew;
    try {
      payload = jwt.verify(token, authConfig.secretKey) as JwtPayloadNew;
    } catch (err: any) {
      if (err?.name === "TokenExpiredError") {
        res.status(401).json({ message: "Phiên đăng nhập đã hết hạn" });
        return;
      }
      res.status(403).json({ message: "Token không hợp lệ" });
      return;
    }

    // ⚠️ CHỈ THÊM DÒNG NÀY: lấy id từ token (sub | _id | id)
    let id =
      payload.sub || (payload as any)._id || (payload as any).id || undefined;

    let role = payload.role;
    let displayName =
      payload.displayName ||
      (payload as any).displayName ||
      (payload as any).username ||
      (payload as any).email;

    // Giữ nguyên fallback DB nếu thiếu id/role
    if (!role || !id) {
      const user = await User.findById(
        payload.sub || (payload as any)._id || (payload as any).id
      )
        .select("_id role age displayName email username")
        .lean();

      if (!user) {
        res.status(401).json({ message: "Token không hợp lệ" });
        return;
      }

      id = String(user._id);
      role = user.role;
      displayName =
        displayName || user.displayName || user.username || user.email;
      (payload as any).age ??= (user as any).age;
    }

    // set req.user với id lấy từ token (hoặc DB fallback)
    req.user = {
      id: id!,
      role: role || "user",
      displayName,
      username: payload.username,
      age: (payload as any).age,
      raw: payload,
    };
    req.token = token;

    next();
  } catch (e) {
    res.status(401).json({ message: "Xác thực thất bại" });
    return;
  }
};
