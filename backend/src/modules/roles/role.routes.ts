import { Router } from "express";
import * as roleController from "./role.controller";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { PERMISSIONS } from "../permissions/permissions.constants";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  requirePermission(PERMISSIONS.ROLE_READ),
  roleController.listRoles
);
router.get(
  "/permissions",
  requirePermission(PERMISSIONS.PERMISSION_READ),
  roleController.listPermissions
);

export default router;
