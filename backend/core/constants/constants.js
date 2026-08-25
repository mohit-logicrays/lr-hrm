/**
 * Central constants — non-enum app-wide configuration values.
 */

export const COOKIE = Object.freeze({
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  OPTIONS: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  },
});

export const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
});

export const BCRYPT_ROUNDS = 10;

export const REFRESH_TOKEN_TTL_DAYS = 7;
