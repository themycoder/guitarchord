import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { authConfig } from "../config/auth.config";
import { RequestCustom } from "../types/app.type";

export const authenticateToken = (
  req: RequestCustom,
  res: Response,
  next: NextFunction
): void => {
  // Chỉ định rõ return type là void
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Bạn chưa đăng nhập" });
    return; // Không return response, chỉ return thông thường
  }

  jwt.verify(token, authConfig.secretKey, (error, payload) => {
    if (error) {
      res.status(403).json({ message: "Token không hợp lệ" });
      return;
    }

    req.user = payload;
    req.token = token;
    next();
  });
};
