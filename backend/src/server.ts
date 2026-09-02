import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { config } from "./config";
import { prisma } from "./config/prisma";
import { requestLogger } from "./middleware/requestLogger";
import {
  notFoundHandler,
  errorHandler,
} from "./middleware/errorHandler";

import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/users/user.routes";
import roleRoutes from "./modules/roles/role.routes";
import departmentRoutes from "./modules/departments/department.routes";
import teamRoutes from "./modules/teams/team.routes";
import projectRoutes from "./modules/projects/project.routes";
import timeRoutes from "./modules/time/time.routes";
import leaveRoutes from "./modules/leave/leave.routes";
import holidayRoutes from "./modules/holidays/holiday.routes";
import requestRoutes from "./modules/requests/request.routes";

import uploadRoutes from "./modules/upload/upload.routes";
import path from "path";

const app = express();

app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Request logging (sanitized, async)
app.use(requestLogger);

app.get("/success", (_req, res) => {
  res.json({
    success: true,
    message: "HRM server is running",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/upload", uploadRoutes);
app.use("/api/v1/roles", roleRoutes);
app.use("/api/v1/departments", departmentRoutes);
app.use("/api/v1/teams", teamRoutes);
app.use("/api/v1/projects", projectRoutes);
app.use("/api/v1/time", timeRoutes);
app.use("/api/v1/leave", leaveRoutes);
app.use("/api/v1/holidays", holidayRoutes);
app.use("/api/v1/requests", requestRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function start(): Promise<void> {
  try {
    await prisma.$connect();
    app.listen(config.port, () => {
      // eslint-disable-next-line no-console
      console.log(`Server running on port ${config.port}`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to connect to database:", err);
    process.exit(1);
  }
}

start();
