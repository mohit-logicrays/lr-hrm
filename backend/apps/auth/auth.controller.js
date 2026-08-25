import * as authService from "./auth.service.js";
import { getUserPermissions } from "../users/user.service.js";
import { COOKIE } from "../../core/constants/constants.js";
import {
  signAccessToken,
  signRefreshToken,
} from "../../core/utils/jwt.js";
import {
  sendSuccess,
} from "../../core/responses/apiResponse.js";

function msToNumber(value) {
  if (/^\d+$/.test(value)) return Number(value);
  const match = value.match(/^(\d+)([smhd])$/);
  if (!match) return 60 * 60 * 1000;
  const [, num, unit] = match;
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return Number(num) * multipliers[unit];
}

function setAuthCookies(res, user) {
  const forSigning = { _id: user.id, role: user.role };
  res.cookie(COOKIE.ACCESS_TOKEN, signAccessToken(forSigning), {
    ...COOKIE.OPTIONS,
    maxAge: msToNumber(process.env.JWT_ACCESS_EXPIRES_IN || "15m"),
  });
  res.cookie(COOKIE.REFRESH_TOKEN, signRefreshToken(forSigning), {
    ...COOKIE.OPTIONS,
    maxAge: msToNumber(process.env.JWT_REFRESH_EXPIRES_IN || "7d"),
  });
}

export async function login(req, res) {
  const { user, accessToken } = await authService.login(req.body);
  setAuthCookies(res, user);
  return sendSuccess(res, { message: "Login successful", data: user });
}

export async function logout(req, res) {
  // Blacklist the refresh token so it can never be reused + clear cookies
  await authService.logout(req.cookies?.[COOKIE.REFRESH_TOKEN]);
  res.clearCookie(COOKIE.ACCESS_TOKEN, { ...COOKIE.OPTIONS });
  res.clearCookie(COOKIE.REFRESH_TOKEN, { ...COOKIE.OPTIONS });
  return sendSuccess(res, { message: "Logged out successfully" });
}

export async function refresh(req, res) {
  const { user } = await authService.refresh(
    req.cookies?.[COOKIE.REFRESH_TOKEN]
  );
  setAuthCookies(res, user);
  return sendSuccess(res, { message: "Session refreshed", data: user });
}

export async function me(req, res) {
  const permissions = await getUserPermissions(req.user);
  return sendSuccess(res, {
    message: "Authenticated user",
    data: { user: req.user.toProfile(), permissions },
  });
}
