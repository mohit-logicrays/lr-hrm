import { Router } from "express";
import * as projectController from "./project.controller";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { PERMISSIONS } from "../permissions/permissions.constants";

const router = Router();

router.use(authenticate);

// Projects
router.get("/", requirePermission(PERMISSIONS.PROJECT_READ), projectController.listProjects);
router.post("/", requirePermission(PERMISSIONS.PROJECT_CREATE), projectController.createProject);
router.get("/:id", requirePermission(PERMISSIONS.PROJECT_READ), projectController.getProject);
router.patch("/:id", requirePermission(PERMISSIONS.PROJECT_UPDATE), projectController.updateProject);
router.put("/:id", requirePermission(PERMISSIONS.PROJECT_UPDATE), projectController.updateProject);
router.delete("/:id", requirePermission(PERMISSIONS.PROJECT_DELETE), projectController.deleteProject);

// Members
router.post("/:id/members", requirePermission(PERMISSIONS.PROJECT_MANAGE_MEMBERS), projectController.addMember);
router.delete("/:id/members/:userId", requirePermission(PERMISSIONS.PROJECT_MANAGE_MEMBERS), projectController.removeMember);

// Tasks
router.get("/:id/tasks", requirePermission(PERMISSIONS.PROJECT_READ), projectController.listTasks);
router.post("/:id/tasks", requirePermission(PERMISSIONS.PROJECT_UPDATE), projectController.createTask);
router.patch("/tasks/:taskId/status", requirePermission(PERMISSIONS.PROJECT_READ), projectController.updateTaskStatus);
router.put("/tasks/:taskId", requirePermission(PERMISSIONS.PROJECT_UPDATE), projectController.updateTask);
router.patch("/tasks/:taskId", requirePermission(PERMISSIONS.PROJECT_UPDATE), projectController.updateTask);
router.delete("/tasks/:taskId", requirePermission(PERMISSIONS.PROJECT_UPDATE), projectController.deleteTask);

// Milestones
router.post("/:id/milestones", requirePermission(PERMISSIONS.PROJECT_UPDATE), projectController.createMilestone);
router.patch("/milestones/:milestoneId", requirePermission(PERMISSIONS.PROJECT_UPDATE), projectController.updateMilestone);

// Comments
router.get("/tasks/:taskId/comments", requirePermission(PERMISSIONS.PROJECT_READ), projectController.getTaskComments);
router.post("/tasks/:taskId/comments", requirePermission(PERMISSIONS.PROJECT_READ), projectController.addComment);

export default router;
