import { Router } from "express";
import * as holidayController from "./holiday.controller";
import { authenticate } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { PERMISSIONS } from "../permissions/permissions.constants";

const router = Router();

router.use(authenticate);

router.get("/", requirePermission(PERMISSIONS.HOLIDAY_READ), holidayController.listHolidays);
router.post(
  "/",
  requirePermission(PERMISSIONS.HOLIDAY_MANAGE),
  holidayController.createHoliday
);
router.patch(
  "/:id",
  requirePermission(PERMISSIONS.HOLIDAY_MANAGE),
  holidayController.updateHoliday
);
router.delete(
  "/:id",
  requirePermission(PERMISSIONS.HOLIDAY_MANAGE),
  holidayController.deleteHoliday
);

export default router;
