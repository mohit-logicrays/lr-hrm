import { Router } from "express";
import * as authController from "./auth.controller.js";
import { loginSchema, validate } from "./auth.validation.js";
import { authenticate } from "../../core/middlewares/authMiddleware.js";
import asyncHandler from "../../core/middlewares/asyncHandler.js";

const router = Router();
const ah = asyncHandler;

router.post("/login", validate(loginSchema), ah(authController.login));
router.post("/refresh", ah(authController.refresh));
router.get("/me", authenticate, ah(authController.me));
// Logout requires a valid session; blacklists the refresh token + clears cookies
router.post("/logout", authenticate, ah(authController.logout));

export default router;
