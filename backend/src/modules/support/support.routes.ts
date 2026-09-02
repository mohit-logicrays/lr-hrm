import { Router } from "express";
import * as supportController from "./support.controller";
import { authenticate } from "../../middleware/auth";
import { requireRoles } from "../../middleware/rbac";

const router = Router();

router.use(authenticate);

router.get("/", supportController.listTickets);
router.post("/", supportController.createTicket);
router.get("/:id", supportController.getTicket);
router.patch("/:id", supportController.updateTicket);
router.post("/:id/comments", supportController.addTicketComment);

// Admin Only Delete Endpoint
router.delete(
  "/:id",
  requireRoles("SUPERADMIN", "HR_ADMIN", "ADMIN", "superadmin", "hr_admin", "admin"),
  supportController.deleteTicket
);

export default router;
