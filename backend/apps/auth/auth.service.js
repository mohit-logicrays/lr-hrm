import User from "../users/user.model.js";
import RefreshToken from "./token.model.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
} from "../../core/utils/jwt.js";
import { COOKIE } from "../../core/constants/constants.js";
import { UnauthorizedException } from "../../core/exceptions/appExceptions.js";

export async function login({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    throw new UnauthorizedException("Invalid email or password");
  }
  if (!user.isActive) {
    throw new UnauthorizedException(
      "Your account has been deactivated. Contact your administrator."
    );
  }

  // Persist refresh token (hashed) so it can be blacklisted on logout
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await RefreshToken.create({
    tokenHash: hashToken(refreshToken),
    user: user._id,
  });

  return { user: toSafeUser(user), accessToken, refreshToken };
}

export async function logout(refreshToken) {
  if (refreshToken) {
    await RefreshToken.blacklist(hashToken(refreshToken));
  }
}

/**
 * Rotate refresh token: old one is blacklisted, a fresh pair is issued.
 * Revoked/blacklisted tokens are rejected — replay is impossible.
 */
export async function refresh(refreshToken) {
  if (!refreshToken) {
    throw new UnauthorizedException("No refresh token. Please login again.");
  }

  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    throw new UnauthorizedException("Invalid or expired session. Please login again.");
  }

  const tokenHash = hashToken(refreshToken);
  if (await RefreshToken.isBlacklisted(tokenHash)) {
    throw new UnauthorizedException("Session revoked. Please login again.");
  }

  const user = await User.findById(payload.id);
  if (!user || !user.isActive) {
    throw new UnauthorizedException("Account inactive or not found");
  }

  // Rotate: blacklist old refresh token, issue a fresh pair
  await RefreshToken.blacklist(tokenHash);
  const accessToken = signAccessToken(user);
  const newRefreshToken = signRefreshToken(user);
  await RefreshToken.create({
    tokenHash: hashToken(newRefreshToken),
    user: user._id,
  });

  return { user: toSafeUser(user), accessToken, refreshToken: newRefreshToken };
}

function toSafeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  };
}
