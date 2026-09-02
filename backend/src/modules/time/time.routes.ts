import { Router } from "express";
import * as timeController from "./time.controller";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { PERMISSIONS } from "../permissions/permissions.constants";

const router = Router();

router.use(authenticate);

// User Own Endpoints
router.get(
  "/my",
  requirePermission(PERMISSIONS.TIME_LOG_READ_OWN),
  timeController.myTimeLogs
);

router.get(
  "/summary",
  requirePermission(PERMISSIONS.TIME_LOG_READ_OWN),
  timeController.mySummary
);

router.post(
  "/submit-week",
  requirePermission(PERMISSIONS.TIME_LOG_CREATE),
  timeController.submitWeek
);

// Reports Endpoint
router.get(
  "/reports",
  requirePermission(PERMISSIONS.TIME_LOG_READ_ALL, PERMISSIONS.TIME_LOG_MANAGE),
  timeController.getTimeReports
);

// Bulk Approve Endpoint
router.post(
  "/bulk-approve",
  requirePermission(PERMISSIONS.TIME_LOG_APPROVE, PERMISSIONS.TIME_LOG_MANAGE),
  timeController.bulkApproveTimeLogs
);

// General Endpoints
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
  requirePermission(PERMISSIONS.TIME_LOG_APPROVE, PERMISSIONS.TIME_LOG_MANAGE),
  timeController.approveTimeLog
);

router.delete(
  "/:id",
  requirePermission(PERMISSIONS.TIME_LOG_READ_OWN, PERMISSIONS.TIME_LOG_MANAGE),
  timeController.deleteTimeLog
);

export default router;
