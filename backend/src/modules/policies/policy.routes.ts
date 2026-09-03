import { Router } from "express";
import * as policyController from "./policy.controller";
import { authenticate } from "../../middleware/auth";
import { requireRoles } from "../../middleware/rbac";

const router = Router();

router.use(authenticate);

router.get("/", policyController.listPolicies);
router.get("/:id", policyController.getPolicy);
router.get("/:id/acknowledgments", policyController.getPolicyAcknowledgments);
router.post("/:id/acknowledge", policyController.acknowledgePolicy);

// HR / Superadmin / Admin Only Endpoints
router.post(
  "/",
  requireRoles("SUPERADMIN", "HR_ADMIN", "ADMIN", "HR", "superadmin", "hr_admin", "admin", "hr"),
  policyController.createPolicy
);

router.patch(
  "/:id",
  requireRoles("SUPERADMIN", "HR_ADMIN", "ADMIN", "HR", "superadmin", "hr_admin", "admin", "hr"),
  policyController.updatePolicy
);

// Only Superadmin can Delete Policies
router.delete(
  "/:id",
  requireRoles("SUPERADMIN", "superadmin"),
  policyController.deletePolicy
);

export default router;
