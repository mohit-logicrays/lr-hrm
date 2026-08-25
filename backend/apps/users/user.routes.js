import { Router } from "express";
import * as userController from "./user.controller.js";
import {
  validate,
  createUserSchema,
  adminUpdateUserSchema,
  updateProfileSchema,
} from "./user.validation.js";
import {
  authenticate,
  authorize,
  roles,
} from "../../core/middlewares/authMiddleware.js";
import asyncHandler from "../../core/middlewares/asyncHandler.js";
import { getPaginationParams } from "../../core/responses/apiResponse.js";
import {
  MODEL_NAME,
  PERMISSION_ACTION,
  USER_MANAGEMENT_ROLES,
  ROLE,
} from "../../core/enums/enums.js";

const router = Router();
const ah = asyncHandler;

router.use(authenticate);

// Self-service profile (any logged-in user)
router.put(
  "/me/profile",
  validate(updateProfileSchema),
  ah(userController.updateProfile)
);

// User management module — centralized permission-gated CRUD with pagination
router.get(
  "/",
  authorize(MODEL_NAME.USER, PERMISSION_ACTION.READ),
  getPaginationParams,
  ah(userController.listUsers)
);
router.get(
  "/:id",
  authorize(MODEL_NAME.USER, PERMISSION_ACTION.READ),
  ah(userController.getUser)
);
router.post(
  "/",
  roles(...USER_MANAGEMENT_ROLES),
  validate(createUserSchema),
  authorize(MODEL_NAME.USER, PERMISSION_ACTION.CREATE),
  ah(userController.createUser)
);
router.put(
  "/:id",
  roles(...USER_MANAGEMENT_ROLES),
  validate(adminUpdateUserSchema),
  authorize(MODEL_NAME.USER, PERMISSION_ACTION.UPDATE),
  ah(userController.adminUpdateUser)
);
router.delete(
  "/:id",
  roles(ROLE.SUPERUSER),
  authorize(MODEL_NAME.USER, PERMISSION_ACTION.DELETE),
  ah(userController.deleteUser)
);

export default router;
