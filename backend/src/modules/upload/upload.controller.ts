import fs from "fs";
import path from "path";
import multer from "multer";
import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import { AppError } from "../../utils/AppError";
import { config } from "../../config";

const uploadRootDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadRootDir)) {
  fs.mkdirSync(uploadRootDir, { recursive: true });
}

// Allowed, normalized top-level folders. Anything else falls back to "documents".
const ALLOWED_FOLDERS = new Set([
  "avatars",
  "experience-letters",
  "relieving-letters",
  "policies",
  "documents",
]);

/**
 * Put uploads into a subfolder so the tree stays organized:
 *   uploads/<folder>/<safe-basename>_<timestamp>_<rand><ext>
 * The client sends a `folder` FormData field; unknown values sanitize to a
 * safe slug and fall back under the `documents` bucket.
 */
function resolveFolder(folder?: string): string {
  if (!folder) return "documents";
  const slug = folder
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  if (!slug) return "documents";
  return ALLOWED_FOLDERS.has(slug) ? slug : "documents";
}

// Storage Engine — resolves the destination per-request from `body.folder` or `query.folder`.
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const folder = resolveFolder((req.body?.folder as string) || (req.query?.folder as string));
    const dir = path.join(uploadRootDir, folder);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const basename = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "file";
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e6)}`;
    cb(null, `${basename}_${uniqueSuffix}${ext}`);
  },
});

// File filter (images, pdfs, docs)
const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(400, "Invalid file type. Only JPEG, PNG, WEBP, PDF, and Word docs are allowed."));
  }
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

export const handleSingleUpload = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError(400, "No file uploaded");
  }

  const folder = resolveFolder((req.body?.folder as string) || (req.query?.folder as string));
  const relativePath = `/uploads/${folder}/${req.file.filename}`;
  const absoluteUrl = `${config.apiUrl}${relativePath}`;
  ApiResponse.success(res, 200, "File uploaded successfully", {
    url: absoluteUrl,
    relativePath,
    filename: req.file.filename,
    folder,
    originalName: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
  });
});
