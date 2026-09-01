import dotenv from "dotenv";

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5000", 10),

  databaseUrl: process.env.DATABASE_URL || "",

  jwt: {
    secret: process.env.JWT_SECRET || "dev_access_secret_change_me",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "dev_refresh_secret_change_me",
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    cookieName: "access_token",
    refreshCookieName: "refresh_token",
  },

  superuser: {
    email: process.env.SUPERUSER_EMAIL || "admin@logicrays.com",
    password: process.env.SUPERUSER_PASSWORD || "LogicRays@2026",
  },

  defaultPassword: process.env.DEFAULT_USER_PASSWORD || "LogicRays@2026",

  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
} as const;
