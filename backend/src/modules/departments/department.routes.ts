import { Router } from "express";
import * as departmentController from "./department.controller";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { PERMISSIONS } from "../permissions/permissions.constants";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  requirePermission(PERMISSIONS.DEPARTMENT_READ),
  departmentController.listDepartments
);
router.get(
  "/:id",
  requirePermission(PERMISSIONS.DEPARTMENT_READ),
  departmentController.getDepartment
);
router.post(
  "/",
  requirePermission(PERMISSIONS.DEPARTMENT_CREATE),
  departmentController.createDepartment
);
router.patch(
  "/:id",
  requirePermission(PERMISSIONS.DEPARTMENT_UPDATE),
  departmentController.updateDepartment
);
router.delete(
  "/:id",
  requirePermission(PERMISSIONS.DEPARTMENT_DELETE),
  departmentController.deleteDepartment
);

export default router;
