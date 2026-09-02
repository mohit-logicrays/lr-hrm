import { Router } from "express";
import * as requestController from "./request.controller";
import { authenticate } from "../../middleware/auth";
import { requireRoles } from "../../middleware/rbac";

const router = Router();

router.use(authenticate);
// Enforce Superadmin-only access for request monitoring and log inspection
router.use(requireRoles("SUPERADMIN", "superadmin"));

router.get("/analytics", requestController.getAnalytics);
router.get("/", requestController.listRequests);
router.get("/:id", requestController.getRequest);

export default router;
