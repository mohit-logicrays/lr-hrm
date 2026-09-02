import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { applyWFH, listMyWFH, listApprovals, approveWFH, rejectWFH, cancelWFH, getWFHLogs } from "./wfh.controller";

const router = Router();
router.use(authenticate);

router.post("/", applyWFH);
router.get("/my", listMyWFH);
router.get("/approvals", listApprovals);
router.post("/:id/approve", approveWFH);
router.post("/:id/reject", rejectWFH);
router.post("/:id/cancel", cancelWFH);
router.get("/:id/logs", getWFHLogs);

export default router;
