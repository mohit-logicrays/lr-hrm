import { Router } from "express";
import * as leaveController from "./leave.controller";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { PERMISSIONS } from "../permissions/permissions.constants";

const router = Router();

router.use(authenticate);

// ---------- Leave Types ----------
router.get(
  "/types",
  requirePermission(PERMISSIONS.LEAVE_TYPE_READ),
  leaveController.listLeaveTypes
);
router.post(
  "/types",
  requirePermission(PERMISSIONS.LEAVE_TYPE_MANAGE),
  leaveController.createLeaveType
);
router.patch(
  "/types/:id",
  requirePermission(PERMISSIONS.LEAVE_TYPE_MANAGE),
  leaveController.updateLeaveType
);
router.delete(
  "/types/:id",
  requirePermission(PERMISSIONS.LEAVE_TYPE_MANAGE),
  leaveController.deleteLeaveType
);

// ---------- Leave Requests ----------
router.get(
  "/requests/my",
  requirePermission(PERMISSIONS.LEAVE_REQUEST_READ_OWN),
  leaveController.myLeaveRequests
);
router.get(
  "/requests",
  requirePermission(PERMISSIONS.LEAVE_REQUEST_READ_ALL, PERMISSIONS.LEAVE_REQUEST_READ_OWN),
  leaveController.listLeaveRequests
);
router.post(
  "/requests",
  requirePermission(PERMISSIONS.LEAVE_REQUEST_CREATE),
  leaveController.createLeaveRequest
);
router.patch(
  "/requests/:id",
  requirePermission(PERMISSIONS.LEAVE_REQUEST_APPROVE),
  leaveController.updateLeaveRequest
);
router.post(
  "/requests/:id/approve",
  requirePermission(PERMISSIONS.LEAVE_REQUEST_APPROVE),
  leaveController.approveLeaveRequest
);
router.get(
  "/requests/:id/logs",
  requirePermission(PERMISSIONS.LEAVE_REQUEST_READ_ALL, PERMISSIONS.LEAVE_REQUEST_READ_OWN),
  leaveController.getLeaveApprovalLogs
);
router.post(
  "/requests/:id/cancel",
  requirePermission(PERMISSIONS.LEAVE_REQUEST_CREATE),
  leaveController.cancelLeaveRequest
);

// ---------- Balances ----------
router.get(
  "/balance",
  requirePermission(PERMISSIONS.LEAVE_BALANCE_READ),
  leaveController.getMyBalance
);
router.get(
  "/balance/:userId",
  requirePermission(PERMISSIONS.LEAVE_BALANCE_READ),
  leaveController.getUserBalance
);
router.post(
  "/allocate",
  requirePermission(PERMISSIONS.LEAVE_BALANCE_MANAGE),
  leaveController.allocateLeave
);
router.patch(
  "/balances/:id",
  requirePermission(PERMISSIONS.LEAVE_BALANCE_MANAGE),
  leaveController.updateBalance
);

export default router;
