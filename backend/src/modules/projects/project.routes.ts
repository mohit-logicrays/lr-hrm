import { Router } from "express";
import * as projectController from "./project.controller";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { PERMISSIONS } from "../permissions/permissions.constants";

const router = Router();

router.use(authenticate);

router.get("/", requirePermission(PERMISSIONS.PROJECT_READ), projectController.listProjects);
router.post(
  "/",
  requirePermission(PERMISSIONS.PROJECT_CREATE),
  projectController.createProject
);
router.post(
  "/members",
  requirePermission(PERMISSIONS.PROJECT_MANAGE_MEMBERS),
  projectController.addMember
);
router.get("/:id", requirePermission(PERMISSIONS.PROJECT_READ), projectController.getProject);
router.patch(
  "/:id",
  requirePermission(PERMISSIONS.PROJECT_UPDATE),
  projectController.updateProject
);
router.delete(
  "/:id",
  requirePermission(PERMISSIONS.PROJECT_DELETE),
  projectController.deleteProject
);
router.patch(
  "/:projectId/members/:userId",
  requirePermission(PERMISSIONS.PROJECT_MANAGE_MEMBERS),
  projectController.updateMember
);
router.delete(
  "/:projectId/members/:userId",
  requirePermission(PERMISSIONS.PROJECT_MANAGE_MEMBERS),
  projectController.removeMember
);

export default router;
