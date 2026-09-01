import { Router } from "express";
import * as timeController from "./time.controller";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { PERMISSIONS } from "../permissions/permissions.constants";

const router = Router();

router.use(authenticate);

router.get(
  "/my",
  requirePermission(PERMISSIONS.TIME_LOG_READ_OWN),
  timeController.myTimeLogs
);
router.get(
  "/",
  requirePermission(PERMISSIONS.TIME_LOG_READ_ALL, PERMISSIONS.TIME_LOG_READ_OWN),
  timeController.listTimeLogs
);
router.post(
  "/",
  requirePermission(PERMISSIONS.TIME_LOG_CREATE),
  timeController.createTimeLog
);
router.get(
  "/:id",
  requirePermission(PERMISSIONS.TIME_LOG_READ_ALL, PERMISSIONS.TIME_LOG_READ_OWN),
  timeController.getTimeLog
);
router.patch(
  "/:id",
  requirePermission(PERMISSIONS.TIME_LOG_CREATE, PERMISSIONS.TIME_LOG_MANAGE),
  timeController.updateTimeLog
);
router.post(
  "/:id/approve",
  requirePermission(PERMISSIONS.TIME_LOG_APPROVE),
  timeController.approveTimeLog
);
router.delete(
  "/:id",
  requirePermission(PERMISSIONS.TIME_LOG_READ_OWN, PERMISSIONS.TIME_LOG_MANAGE),
  timeController.deleteTimeLog
);

export default router;
