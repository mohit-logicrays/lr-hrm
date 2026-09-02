import { Router } from "express";
import * as policyController from "./policy.controller";
import { authenticate } from "../../middleware/auth";
import { requireRoles } from "../../middleware/rbac";

const router = Router();

router.use(authenticate);

router.get("/", policyController.listPolicies);
router.get("/:id", policyController.getPolicy);
router.post("/:id/acknowledge", policyController.acknowledgePolicy);

// HR / Superadmin / Admin Only Endpoints
router.post(
  "/",
  requireRoles("SUPERADMIN", "HR_ADMIN", "ADMIN", "superadmin", "hr_admin", "admin"),
  policyController.createPolicy
);

router.patch(
  "/:id",
  requireRoles("SUPERADMIN", "HR_ADMIN", "ADMIN", "superadmin", "hr_admin", "admin"),
  policyController.updatePolicy
);

router.delete(
  "/:id",
  requireRoles("SUPERADMIN", "HR_ADMIN", "ADMIN", "superadmin", "hr_admin", "admin"),
  policyController.deletePolicy
);

export default router;
