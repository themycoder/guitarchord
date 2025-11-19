// utils/jwt.util.ts
import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
import { authConfig } from "../config/auth.config";

function getSecret(): Secret {
  const s = (authConfig.secretKey ?? "").trim();
  if (!s) throw new Error("JWT secretKey is not defined");
  return s as Secret;
}

// LẤY KIỂU expiresIn TỪ SignOptions ("number | StringValue | undefined")
type Expires = SignOptions["expiresIn"];

export function signAccessToken(
  payload: string | Buffer | object,
  expiresIn: Expires = "7d" as Expires // ép kiểu default cho chắc
): string {
  const secret = getSecret();
  const options: SignOptions = { expiresIn: expiresIn as Expires };
  return jwt.sign(payload, secret, options);
}

export function signRefreshToken(payload: string | Buffer | object): string {
  const secret = getSecret();
  return jwt.sign(payload, secret);
}

export function verifyToken(token: string): JwtPayload | string {
  const secret = getSecret();
  return jwt.verify(token, secret);
}
