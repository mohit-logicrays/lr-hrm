import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoutes from "./apps/auth/auth.routes.js";
import userRoutes from "./apps/users/user.routes.js";
// Register all models
import "./apps/permissions/permissionGroup.model.js";
import "./apps/permissions/modelPermission.model.js";
import { seedSuperuser } from "./core/utils/seedSuperuser.js";
import {
  notFoundHandler,
  errorHandler,
} from "./core/middlewares/errorHandler.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/success", (req, res) => {
  res.json({
    success: true,
    message: "HRM server is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// 404 for unmatched routes, then centralized error handling
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB");
    await seedSuperuser();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
