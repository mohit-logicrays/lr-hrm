import jwt from "jsonwebtoken";
import crypto from "crypto";
import { COOKIE } from "../constants/constants.js";

const isProd = process.env.NODE_ENV === "production";

export function signAccessToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m" }
  );
}

export function signRefreshToken(user) {
  return jwt.sign(
    { id: user._id.toString(), type: "refresh" },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
  );
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token) {
  try {
    return jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );
  } catch {
    return null;
  }
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function setAuthCookies(res, user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  res.cookie(COOKIE.ACCESS_TOKEN, accessToken, {
    ...COOKIE.OPTIONS,
    maxAge: msToNumber(process.env.JWT_ACCESS_EXPIRES_IN || "15m"),
  });
  res.cookie(COOKIE.REFRESH_TOKEN, refreshToken, {
    ...COOKIE.OPTIONS,
    maxAge: msToNumber(process.env.JWT_REFRESH_EXPIRES_IN || "7d"),
  });

  return { accessToken, refreshToken };
}

export function clearAuthCookies(res) {
  res.clearCookie(COOKIE.ACCESS_TOKEN, { ...COOKIE.OPTIONS });
  res.clearCookie(COOKIE.REFRESH_TOKEN, { ...COOKIE.OPTIONS });
}

function msToNumber(value) {
  if (/^\d+$/.test(value)) return Number(value);
  const match = value.match(/^(\d+)([smhd])$/);
  if (!match) return 60 * 60 * 1000;
  const [, num, unit] = match;
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return Number(num) * multipliers[unit];
}
