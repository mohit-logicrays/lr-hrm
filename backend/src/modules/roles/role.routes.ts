import { Router } from "express";
import * as roleController from "./role.controller";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { PERMISSIONS } from "../permissions/permissions.constants";

const router = Router();

router.use(authenticate);

router.get(
  "/permissions",
  requirePermission(PERMISSIONS.PERMISSION_READ),
  roleController.listPermissions
);
router.get(
  "/",
  requirePermission(PERMISSIONS.ROLE_READ),
  roleController.listRoles
);
router.get(
  "/:id",
  requirePermission(PERMISSIONS.ROLE_READ),
  roleController.getRole
);
router.post(
  "/",
  requirePermission(PERMISSIONS.ROLE_MANAGE),
  roleController.createRole
);
router.patch(
  "/:id",
  requirePermission(PERMISSIONS.ROLE_MANAGE),
  roleController.updateRole
);
router.delete(
  "/:id",
  requirePermission(PERMISSIONS.ROLE_MANAGE),
  roleController.deleteRole
);
router.put(
  "/:id/permissions",
  requirePermission(PERMISSIONS.PERMISSION_MANAGE),
  roleController.setRolePermissions
);

export default router;