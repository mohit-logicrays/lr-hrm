import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  getPreferences,
  updatePreferences,
  pushSubscribe,
} from "./notification.controller";

const router = Router();

router.use(authenticate);

router.get("/", listNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/read-all", markAllAsRead);
router.delete("/clear-all", clearAllNotifications);
router.patch("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

router.get("/preferences", getPreferences);
router.put("/preferences", updatePreferences);
router.post("/push-subscribe", pushSubscribe);

export default router;
