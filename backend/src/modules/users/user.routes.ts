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

// ---- Admin user management ----
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
router.delete(
  "/:id",
  requirePermission(PERMISSIONS.USER_DELETE),
  userController.deleteUser
);

export default router;
