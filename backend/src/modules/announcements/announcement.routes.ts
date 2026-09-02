import { Router } from "express";
import * as announcementController from "./announcement.controller";
import { authenticate } from "../../middleware/auth";
import { requireRoles } from "../../middleware/rbac";

const router = Router();

router.use(authenticate);

router.get("/", announcementController.listAnnouncements);
router.get("/:id", announcementController.getAnnouncement);

// HR / Superadmin / Admin Only Endpoints
router.post(
  "/",
  requireRoles("SUPERADMIN", "HR_ADMIN", "ADMIN", "superadmin", "hr_admin", "admin"),
  announcementController.createAnnouncement
);

router.patch(
  "/:id",
  requireRoles("SUPERADMIN", "HR_ADMIN", "ADMIN", "superadmin", "hr_admin", "admin"),
  announcementController.updateAnnouncement
);

router.delete(
  "/:id",
  requireRoles("SUPERADMIN", "HR_ADMIN", "ADMIN", "superadmin", "hr_admin", "admin"),
  announcementController.deleteAnnouncement
);

export default router;
