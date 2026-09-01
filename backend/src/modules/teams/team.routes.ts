import { Router } from "express";
import * as teamController from "./team.controller";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { PERMISSIONS } from "../permissions/permissions.constants";

const router = Router();

router.use(authenticate);

router.get("/", requirePermission(PERMISSIONS.TEAM_READ), teamController.listTeams);
router.post("/", requirePermission(PERMISSIONS.TEAM_CREATE), teamController.createTeam);
router.post(
  "/members",
  requirePermission(PERMISSIONS.TEAM_MANAGE_MEMBERS),
  teamController.addMember
);
router.get("/:id", requirePermission(PERMISSIONS.TEAM_READ), teamController.getTeam);
router.patch("/:id", requirePermission(PERMISSIONS.TEAM_UPDATE), teamController.updateTeam);
router.delete("/:id", requirePermission(PERMISSIONS.TEAM_DELETE), teamController.deleteTeam);
router.patch(
  "/:teamId/members/:userId",
  requirePermission(PERMISSIONS.TEAM_MANAGE_LEADS),
  teamController.updateMember
);
router.delete(
  "/:teamId/members/:userId",
  requirePermission(PERMISSIONS.TEAM_MANAGE_MEMBERS),
  teamController.removeMember
);

export default router;
