import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { uploadMiddleware, handleSingleUpload } from "./upload.controller";

const router = Router();

router.use(authenticate);

router.post("/", uploadMiddleware.single("file"), handleSingleUpload);

export default router;
