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
  requireRoles("SUPERADMIN", "HR_ADMIN", "ADMIN", "HR", "superadmin", "hr_admin", "admin", "hr"),
  announcementController.createAnnouncement
);

router.patch(
  "/:id",
  requireRoles("SUPERADMIN", "HR_ADMIN", "ADMIN", "HR", "superadmin", "hr_admin", "admin", "hr"),
  announcementController.updateAnnouncement
);

// Only Superadmin can Delete Announcements
router.delete(
  "/:id",
  requireRoles("SUPERADMIN", "superadmin"),
  announcementController.deleteAnnouncement
);

export default router;
