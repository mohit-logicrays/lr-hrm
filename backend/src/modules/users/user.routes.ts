import { Router } from "express";
import * as userController from "./user.controller";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { PERMISSIONS } from "../permissions/permissions.constants";

const router = Router();

router.use(authenticate);

// ---- Self profile (must be before /:id) ----
router.get("/me/profile", userController.getProfile);
router.put("/me/profile", userController.updateProfile);
router.post("/me/change-password", userController.changePassword);

// ---- Draft Management ----
router.post(
  "/draft",
  requirePermission(PERMISSIONS.USER_CREATE),
  userController.saveDraft
);
router.put(
  "/draft/:draftId",
  requirePermission(PERMISSIONS.USER_CREATE),
  userController.saveDraft
);
router.get(
  "/draft/:draftId",
  requirePermission(PERMISSIONS.USER_CREATE),
  userController.getDraft
);
router.delete(
  "/draft/:draftId",
  requirePermission(PERMISSIONS.USER_CREATE),
  userController.deleteDraft
);

// ---- Final 6-Step Creation ----
router.post(
  "/full",
  requirePermission(PERMISSIONS.USER_CREATE),
  userController.createFullUser
);

// ---- Admin User Management ----
router.get(
  "/",
  requirePermission(PERMISSIONS.USER_READ),
  userController.listUsers
);
router.get(
  "/:id",
  requirePermission(PERMISSIONS.USER_READ),
  userController.getUser
);
router.post(
  "/",
  requirePermission(PERMISSIONS.USER_CREATE),
  userController.createUser
);
router.patch(
  "/:id",
  requirePermission(PERMISSIONS.USER_UPDATE),
  userController.updateUser
);
router.put(
  "/:id",
  requirePermission(PERMISSIONS.USER_UPDATE),
  userController.updateUser
);
router.patch(
  "/:id/status",
  requirePermission(PERMISSIONS.USER_UPDATE),
  userController.updateStatus
);
router.post(
  "/:id/reset-password",
  requirePermission(PERMISSIONS.USER_UPDATE),
  userController.resetPassword
);
router.delete(
  "/:id",
  requirePermission(PERMISSIONS.USER_DELETE),
  userController.deleteUser
);

export default router;
