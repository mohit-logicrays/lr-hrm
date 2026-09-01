import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { Response } from "express";
import { config } from "../config";

export interface AccessTokenPayload {
  sub: string;
  role: string;
  isSpecialRole: boolean;
  specialRoleName?: string | null;
  type: "access";
}

export interface RefreshTokenPayload {
  sub: string;
  type: "refresh";
}

export function signAccessToken(payload: {
  sub: string;
  role: string;
  isSpecialRole: boolean;
  specialRoleName?: string | null;
}): string {
  const opts: SignOptions = { expiresIn: config.jwt.accessExpiresIn as SignOptions["expiresIn"] };
  return jwt.sign(
    {
      sub: payload.sub,
      role: payload.role,
      isSpecialRole: payload.isSpecialRole,
      specialRoleName: payload.specialRoleName ?? null,
      type: "access",
    },
    config.jwt.secret,
    opts
  );
}

export function signRefreshToken(sub: string): string {
  const opts: SignOptions = { expiresIn: config.jwt.refreshExpiresIn as SignOptions["expiresIn"] };
  return jwt.sign({ sub, type: "refresh" }, config.jwt.refreshSecret, opts);
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, config.jwt.secret) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, config.jwt.refreshSecret) as RefreshTokenPayload;
}

function isProd(): boolean {
  return config.env === "production";
}

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string
): void {
  res.cookie(config.jwt.cookieName, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd(),
    path: "/",
    maxAge: 15 * 60 * 1000,
  });
  res.cookie(config.jwt.refreshCookieName, refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd(),
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(config.jwt.cookieName, { path: "/" });
  res.clearCookie(config.jwt.refreshCookieName, { path: "/" });
}
