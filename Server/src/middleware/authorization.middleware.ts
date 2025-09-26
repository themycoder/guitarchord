import { NextFunction, Response } from "express";
import { RequestCustom } from "../types/app.type";

export const authorizeRoles = (...roles: string[]) => {
  return (req: RequestCustom, res: Response, next: NextFunction) => {
    if (!roles.includes((req.user as any)?.role)) {
      res.status(403).json({ message: "Bạn không có quyền truy cập" });
      return;
    }

    next();
  };
};

export const authorizeAttribute = (
  req: RequestCustom,
  res: Response,
  next: NextFunction
) => {
  if ((req.user as any).age < 18) {
    res
      .status(403)
      .json({ message: "Bạn chưa đủ tuổi để truy cập nội dung này" });
    return;
  }

  next();
};
