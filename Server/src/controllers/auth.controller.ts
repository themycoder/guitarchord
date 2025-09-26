// auth.controller.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import passport from "passport";
import { authConfig } from "../config/auth.config";
import { hashPassword, comparePassword } from "../utils/password.util";
import { User } from "../models/User";

const refreshTokens: string[] = [];
const backListTokens: string[] = [];

// Đăng ký tài khoản thường
export const register = async (req: Request, res: Response) => {
  const { username, email, password, role, age } = req.body;

  if (!username || !email || !password) {
    res.status(400).json({ message: "Vui lòng nhập đủ thông tin" });
    return;
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(409).json({ message: "Email đã tồn tại" });
    return;
  }

  const hashedPassword = await hashPassword(password);
  const newUser = new User({
    username,
    email,
    password: hashedPassword,
    role,
    age,
  });
  await newUser.save();

  res.json({
    message: "Đăng ký thành công",
    user: { username, email, role, age },
  });
};

// Đăng nhập tài khoản thường
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
      .json({ message: "Tài khoản này không hỗ trợ đăng nhập bằng mật khẩu" });
    return;
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    res.status(401).json({ message: "Sai mật khẩu" });
    return;
  }
const displayName =
  user.username ||
  [user.firstName, user.lastName].filter(Boolean).join(" ") ||
  user.email;

  const payload = { username: user.username, role: user.role, age: user.age };
  const token = jwt.sign(payload, authConfig.secretKey, { expiresIn: "1h" });
  const refreshToken = jwt.sign(payload, authConfig.secretKey);

  refreshTokens.push(refreshToken);
  res.json({ message: "Đăng nhập thành công", token, refreshToken });
};

// Refresh token
export const refreshTokenHandler = (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken || !refreshTokens.includes(refreshToken)) {
    res.status(403).json({ message: "Refresh token không hợp lệ" });
    return;
  }

  jwt.verify(
    refreshToken,
    authConfig.secretKey,
    (error: jwt.VerifyErrors | null, payload: any) => {
      if (error) {
        res.status(403).json({ message: "Refresh token không hợp lệ", error });
        return;
      }

      const token = jwt.sign(payload as object, authConfig.secretKey, {
        expiresIn: "1h",
      });
      res.json({ token });
    }
  );
};

// Đăng xuất
export const logout = (req: any, res: Response) => {
  const { refreshToken } = req.body;
  let message = "Đăng xuất không thành công";

  const index = refreshTokens.indexOf(refreshToken);
  if (index !== -1) {
    refreshTokens.splice(index, 1);
    backListTokens.push(req.token);
    message = "Đăng xuất thành công";
  }

  res.json({ message });
};

// Route cần xác thực
export const protectedRoute = (req: any, res: any) => {
  if (backListTokens.includes(req.token)) {
    return res.status(401).json({ message: "Token is blacklisted" });
  }

  res.json({ message: "Access granted to protected route" });
};

// Route cho admin
export const adminRoute = (req: any, res: any) => {
  res.json({ message: "Đây là api dành cho admin", user: req?.user });
};

// Route cho user
export const userRoute = (req: any, res: any) => {
  res.json({ message: "Đây là api dành cho user", user: req?.user });
};

// --------------------- Google OAuth ----------------------

// Bắt đầu quá trình đăng nhập Google
export const googleAuth = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("google", { scope: ["profile", "email"] })(
    req,
    res,
    next
  );
};

// Xử lý callback từ Google
export const googleCallback = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate(
    "google",
    { failureRedirect: "/" },
    async (err: any, profileUser: any) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Xác thực Google thất bại", error: err });
      }

      if (!profileUser) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy người dùng Google" });
      }

      try {
        // Kiểm tra xem người dùng đã tồn tại chưa
        let user = await User.findOne({ googleId: profileUser.googleId });

        // Nếu chưa có thì tạo mới
        if (!user) {
          user = new User({
            googleId: profileUser.googleId,
            email: profileUser.email,
            firstName: profileUser.firstName,
            lastName: profileUser.lastName,
            role: "user",
            age: 18, // default
          });
          await user.save();
        }
const displayName =
  user.username ||
  [user.firstName, user.lastName].filter(Boolean).join(" ") ||
  user.email;

        const payload = {
          username: user.username,
          role: user.role,
          age: user.age,
        };
        const token = jwt.sign(payload, authConfig.secretKey, {
          expiresIn: "1h",
        });
        const refreshToken = jwt.sign(payload, authConfig.secretKey);

        refreshTokens.push(refreshToken);

        const redirectUrl = `${
          process.env.FRONTEND_URL
        }/?token=${encodeURIComponent(token)}&refresh=${encodeURIComponent(
          refreshToken
        )}`;
        return res.redirect(302, redirectUrl);
      } catch (e) {
        return res
          .status(500)
          .json({ message: "Lỗi xử lý user Google", error: e });
      }
    }
  )(req, res, next);
};

