import { Router } from "express";
import * as profileController from "./profile.controller";
import { authenticate } from "../../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/", profileController.getProfile);
router.put("/basic", profileController.updateBasic);
router.put("/address", profileController.updateAddress);
router.put("/emergency", profileController.updateEmergency);
router.put("/picture", profileController.updatePicture);
router.put("/password", profileController.changePassword);

export default router;
