// controllers/auth.controller.ts
import { Request, Response, NextFunction } from "express";
import passport from "passport";
import { User } from "../models/User";
import { Session } from "../models/Session";
import { hashPassword, comparePassword } from "../utils/password.util";
import {
  signAccessToken,
  signRefreshToken,
  verifyToken,
} from "../utils/jwt.util";

const REFRESH_TTL_DAYS = 30;

function buildJWTSubject(user: any) {
  return {
    sub: String(user._id),
    role: user.role,
    displayName:
      user.displayName ||
      user.username ||
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.email,
  };
}

/* ----------------- Local Register ----------------- */
export const register = async (req: Request, res: Response) => {
  const { username, email, password, role, age } = req.body;

  if (!username || !email || !password) {
    res.status(400).json({ message: "Thiếu thông tin" });
    return;
  }

  const existed = await User.findOne({
    $or: [{ email: String(email).toLowerCase() }, { username }],
  });
  if (existed) {
    res.status(409).json({ message: "Email/Username đã tồn tại" });
    return;
  }

  const hashed = await hashPassword(password);
  const user = await User.create({
    username,
    email: String(email).toLowerCase(),
    password: hashed,
    role: role || "user",
    age,
    profile: { level: "beginner", skills: [], goals: [] },
  });

  const payload = buildJWTSubject(user);
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await Session.create({
    userId: String(user._id),
    refreshToken,
    userAgent: req.headers["user-agent"],
    ip: req.ip,
    expiresAt: new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 3600 * 1000),
  });

  res.json({
    message: "Đăng ký thành công",
    accessToken,
    refreshToken,
    user: payload,
  });
  return;
};

/* ----------------- Local Login ----------------- */
export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) {
    res.status(404).json({ message: "Không tìm thấy user" });
    return;
  }
  if (!user.password) {
    res
      .status(400)
      .json({ message: "Tài khoản này chỉ hỗ trợ đăng nhập Google" });
    return;
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    res.status(401).json({ message: "Sai mật khẩu" });
    return;
  }

  user.lastLoginAt = new Date();
  await user.save();

  const payload = buildJWTSubject(user);
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await Session.create({
    userId: String(user._id),
    refreshToken,
    userAgent: req.headers["user-agent"],
    ip: req.ip,
    expiresAt: new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 3600 * 1000),
  });

  res.json({
    message: "Đăng nhập thành công",
    accessToken,
    refreshToken,
    user: payload,
  });
  return;
};

/* ----------------- Refresh Token ----------------- */
export const refreshTokenHandler = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(403).json({ message: "Thiếu refresh token" });
    return;
  }

  const session = await Session.findOne({ refreshToken });
  if (!session || session.expiresAt < new Date()) {
    res.status(403).json({ message: "Refresh token không hợp lệ/hết hạn" });
    return;
  }

  try {
    const payload: any = verifyToken(refreshToken);

    const newAccess = signAccessToken({
      sub: payload.sub,
      role: payload.role,
      displayName: payload.displayName,
    });
    const newRefresh = signRefreshToken({
      sub: payload.sub,
      role: payload.role,
      displayName: payload.displayName,
    });

    session.refreshToken = newRefresh;
    session.expiresAt = new Date(
      Date.now() + REFRESH_TTL_DAYS * 24 * 3600 * 1000
    );
    await session.save();

    res.json({ accessToken: newAccess, refreshToken: newRefresh });
    return;
  } catch {
    res.status(403).json({ message: "Refresh token không hợp lệ" });
    return;
  }
};

/* ----------------- Logout ----------------- */
export const logout = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  await Session.deleteOne({ refreshToken });
  res.json({ message: "Đăng xuất thành công" });
  return;
};

/* ----------------- Protected / Admin / User routes ----------------- */
export const protectedRoute = (req: any, res: Response) => {
  // có thể bổ sung check blacklist nếu em dùng blackList khác
  res.json({ message: "Access granted to protected route", user: req.user });
  return;
};

export const adminRoute = (req: any, res: Response) => {
  res.json({ message: "Đây là api dành cho admin", user: req.user });
  return;
};

export const userRoute = (req: any, res: Response) => {
  res.json({ message: "Đây là api dành cho user", user: req.user });
  return;
};

/* ----------------- Google OAuth ----------------- */
export const googleAuth = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })(req, res, next);
};

export const googleCallback = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate(
    "google",
    { session: false },
    async (err: any, user: any) => {
      if (err || !user) {
        res.redirect(`${process.env.FRONTEND_URL}/login?error=google`);
        return;
      }

      const payload = {
        sub: String(user._id),
        role: user.role,
        displayName: user.displayName || user.email,
      };

      const accessToken = signAccessToken(payload);
      const refreshToken = signRefreshToken(payload);

      await Session.create({
        userId: String(user._id),
        refreshToken,
        userAgent: req.headers["user-agent"],
        ip: req.ip,
        expiresAt: new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 3600 * 1000),
      });

      const redirectUrl = `${
        process.env.FRONTEND_URL
      }/oauth/callback?token=${encodeURIComponent(
        accessToken
      )}&refresh=${encodeURIComponent(refreshToken)}`;
      res.redirect(302, redirectUrl);
      return;
    }
  )(req, res, next);
};
