import { Router } from "express";
import * as requestController from "./request.controller";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { PERMISSIONS } from "../permissions/permissions.constants";

const router = Router();

router.use(authenticate);

router.get(
  "/analytics",
  requirePermission(PERMISSIONS.REQUEST_LOG_READ),
  requestController.getAnalytics
);
router.get(
  "/",
  requirePermission(PERMISSIONS.REQUEST_LOG_READ),
  requestController.listRequests
);
router.get(
  "/:id",
  requirePermission(PERMISSIONS.REQUEST_LOG_READ),
  requestController.getRequest
);

export default router;
